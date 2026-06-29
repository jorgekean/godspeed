// public/omr.worker.js
/* eslint-disable no-restricted-globals */

self.importScripts('./opencv.js');

self.onmessage = function (e) {
    const { imageData, action, examType = '20', sessionId } = e.data;
    const cv = self.cv;

    if (action === 'PING') {
        self.postMessage({ status: 'READY', sessionId });
        return;
    }

    if (!cv || !cv.Mat) {
        self.postMessage({ error: "OpenCV engine is not initialized yet.", sessionId });
        return;
    }

    // STRICT MEMORY MANAGEMENT
    let src, gray, blurred, thresh, contours, hierarchy;
    let rectCorners, dstCorners, transformMatrix, warpedGray, warpedThresh;
    let laplacian, mean, stddev;

    try {
        src = cv.matFromImageData(imageData);
        gray = new cv.Mat();

        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // ==========================================
        // 🚀 PHASE 1: BLUR DETECTION
        // ==========================================
        laplacian = new cv.Mat();
        mean = new cv.Mat();
        stddev = new cv.Mat();

        cv.Laplacian(gray, laplacian, cv.CV_64F, 1, 1, 0, cv.BORDER_DEFAULT);
        cv.meanStdDev(laplacian, mean, stddev);

        let stdDevVal = stddev.data64F[0];
        let variance = stdDevVal * stdDevVal;

        laplacian.delete(); mean.delete(); stddev.delete();

        if (variance < 80) {
            throw new Error("Camera is out of focus. Please hold still.");
        }

        // ==========================================
        // 🚀 PHASE 2: FAST 4-CORNER DETECTION
        // ==========================================
        blurred = new cv.Mat();
        thresh = new cv.Mat();

        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        cv.adaptiveThreshold(blurred, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 75, 15);

        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let validSquares = [];

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i);
            let area = cv.contourArea(cnt);
            if (area > 100 && area < 15000) {
                let rect = cv.boundingRect(cnt);
                let aspectRatio = rect.width / rect.height;
                let extent = area / (rect.width * rect.height);
                if (aspectRatio > 0.6 && aspectRatio < 1.4 && extent > 0.6) {
                    validSquares.push({ area, x: rect.x + (rect.width / 2), y: rect.y + (rect.height / 2) });
                }
            }
            cnt.delete();
        }

        validSquares.sort((a, b) => b.area - a.area);
        let markers = validSquares.slice(0, 4);

        if (markers.length < 4) {
            throw new Error("Cannot see all 4 corners. Align the paper inside the box.");
        }

        markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
        let tl = markers[0];
        let br = markers[3];

        let remaining = [markers[1], markers[2]];
        remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
        let bl = remaining[0];
        let tr = remaining[1];

        // ==========================================
        // 🚀 PHASE 3: UNIFIED 800x1000 WARP
        // ==========================================
        const flatWidth = 800;
        const flatHeight = 1000;

        rectCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
        dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [50, 50, 750, 50, 750, 950, 50, 950]);

        transformMatrix = cv.getPerspectiveTransform(rectCorners, dstCorners);
        let dsize = new cv.Size(flatWidth, flatHeight);

        warpedGray = new cv.Mat();
        warpedThresh = new cv.Mat();

        cv.warpPerspective(gray, warpedGray, transformMatrix, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
        cv.adaptiveThreshold(warpedGray, warpedThresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 75, 15);

        // ==========================================
        // 🚀 PHASE 4: DYNAMIC BUBBLE EVALUATION
        // ==========================================

        const CONFIGS = {
            '20': {
                numQuestions: 20,
                colStarts: [520],
                startY: 180, rowHeight: 35, bubbleSpacing: 45, bubbleSize: 30,
                idGrids: [
                    { name: 'examCode', digits: 4, startX: 100, startY: 180 + 18 + 5, spacingX: 24, spacingY: 22, bubbleSize: 18 },
                    { name: 'studentNo', digits: 8, startX: 100, startY: 460 + 18 + 5, spacingX: 24, spacingY: 22, bubbleSize: 18 }
                ],
                blankThreshold: 80,
                confidenceMargin: 40
            },
            '50': {
                numQuestions: 50,
                colStarts: [340, 580],
                startY: 180, rowHeight: 28, bubbleSpacing: 35, bubbleSize: 24,
                idGrids: [
                    { name: 'examCode', digits: 4, startX: 100, startY: 180 + 18 + 5, spacingX: 24, spacingY: 22, bubbleSize: 18 },
                    { name: 'studentNo', digits: 8, startX: 100, startY: 460 + 18 + 5, spacingX: 24, spacingY: 22, bubbleSize: 18 }
                ],
                blankThreshold: 50,
                confidenceMargin: 25
            },
            '100': {
                numQuestions: 100,
                colStarts: [280, 410, 540, 670],
                startY: 180, rowHeight: 28, bubbleSpacing: 24, bubbleSize: 18,
                idGrids: [
                    { name: 'examCode', digits: 4, startX: 70, startY: 198, spacingX: 18, spacingY: 16, bubbleSize: 14 },
                    { name: 'studentNo', digits: 8, startX: 70, startY: 478, spacingX: 18, spacingY: 16, bubbleSize: 14 }
                ],
                blankThreshold: 25,
                confidenceMargin: 15
            }
        };

        // Standard ID Grid Thresholds
        const ID_BLANK_THRESHOLD = 35;

        function evaluateIdGrids(thresh, idGrids) {
            let detected = { examCode: "", studentNo: "" };
            for (const grid of idGrids) {
                // Adjust ID_BLANK_THRESHOLD based on grid size
                const currentBlankThreshold = grid.bubbleSize < 18 ? 15 : ID_BLANK_THRESHOLD;
                let resultString = "";
                for (let d = 0; d < grid.digits; d++) {
                    let digitStats = [];
                    for (let v = 0; v < 10; v++) {
                        let x = grid.startX + (d * grid.spacingX);
                        let y = grid.startY + (v * grid.spacingY);
                        let roiMargin = grid.bubbleSize < 18 ? 1 : 2;
                        let rect = new cv.Rect(x + roiMargin, y + roiMargin, grid.bubbleSize - (roiMargin * 2), grid.bubbleSize - (roiMargin * 2));
                        let bubbleROI = thresh.roi(rect);
                        let filledPixels = cv.countNonZero(bubbleROI);
                        digitStats.push({ val: v, pixels: filledPixels });
                        bubbleROI.delete();
                    }
                    digitStats.sort((a, b) => b.pixels - a.pixels);
                    if (digitStats[0].pixels < currentBlankThreshold) {
                        resultString += "?";
                    } else {
                        resultString += digitStats[0].val.toString();
                    }
                }
                detected[grid.name] = resultString;
            }
            return detected;
        }

        let selectedConfig = CONFIGS[examType] || CONFIGS['20'];
        let detectedIds = { examCode: "", studentNo: "" };

        if (examType === 'auto') {
            // Check for 100-item layout by measuring activity at its unique 1st column (x=280)
            let activity100 = 0;
            for (let i = 0; i < 5; i++) {
                let rect = new cv.Rect(280 + 5, 180 + (i * 28) + 5, 10, 10);
                let roi = warpedThresh.roi(rect);
                activity100 += cv.countNonZero(roi);
                roi.delete();
            }

            // Check for 50-item layout by measuring activity at its unique 1st column (x=340)
            let activity50 = 0;
            for (let i = 0; i < 5; i++) {
                let rect = new cv.Rect(340 + 5, 180 + (i * 28) + 5, 15, 15);
                let roi = warpedThresh.roi(rect);
                activity50 += cv.countNonZero(roi);
                roi.delete();
            }
            
            if (activity100 > 30) {
                selectedConfig = CONFIGS['100'];
            } else if (activity50 > 50) {
                selectedConfig = CONFIGS['50'];
            } else {
                selectedConfig = CONFIGS['20'];
            }
            
            detectedIds = evaluateIdGrids(warpedThresh, selectedConfig.idGrids);
        } else {
            detectedIds = evaluateIdGrids(warpedThresh, selectedConfig.idGrids);
        }

        const choicesMap = ['A', 'B', 'C', 'D'];
        let studentAnswers = {};

        for (let q = 0; q < selectedConfig.numQuestions; q++) {
            let bubbleStats = [];
            let itemsPerCol = selectedConfig.numQuestions === 20 ? 20 : 25;
            let colIdx = Math.floor(q / itemsPerCol);
            let colX = selectedConfig.colStarts[colIdx];
            let rowY = selectedConfig.startY + ((q % itemsPerCol) * selectedConfig.rowHeight);

            for (let c = 0; c < 4; c++) {
                let roiMargin = selectedConfig.numQuestions === 20 ? 6 : 4;
                let x = colX + (c * selectedConfig.bubbleSpacing) + roiMargin;
                let y = rowY + roiMargin;
                let rect = new cv.Rect(x, y, selectedConfig.bubbleSize - (roiMargin * 2), selectedConfig.bubbleSize - (roiMargin * 2));
                let bubbleROI = warpedThresh.roi(rect);
                let filledPixels = cv.countNonZero(bubbleROI);
                bubbleStats.push({ letter: choicesMap[c], pixels: filledPixels });
                bubbleROI.delete();
            }

            bubbleStats.sort((a, b) => b.pixels - a.pixels);

            if (bubbleStats[0].pixels < selectedConfig.blankThreshold) {
                studentAnswers[(q + 1).toString()] = "BLANK";
            } else if ((bubbleStats[0].pixels - bubbleStats[1].pixels) < selectedConfig.confidenceMargin) {
                studentAnswers[(q + 1).toString()] = "REVIEW";
            } else {
                studentAnswers[(q + 1).toString()] = bubbleStats[0].letter;
            }
        }

        self.postMessage({ 
            success: true, 
            answers: studentAnswers, 
            examCode: detectedIds.examCode, 
            studentNo: detectedIds.studentNo,
            sessionId: sessionId 
        });

    } catch (err) {
        self.postMessage({ error: err.message || "An error occurred during processing.", sessionId });
    } finally {
        if (src && !src.isDeleted()) src.delete();
        if (gray && !gray.isDeleted()) gray.delete();
        if (blurred && !blurred.isDeleted()) blurred.delete();
        if (thresh && !thresh.isDeleted()) thresh.delete();
        if (contours && !contours.isDeleted()) contours.delete();
        if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
        if (rectCorners && !rectCorners.isDeleted()) rectCorners.delete();
        if (dstCorners && !dstCorners.isDeleted()) dstCorners.delete();
        if (transformMatrix && !transformMatrix.isDeleted()) transformMatrix.delete();
        if (warpedGray && !warpedGray.isDeleted()) warpedGray.delete();
        if (warpedThresh && !warpedThresh.isDeleted()) warpedThresh.delete();
    }
};