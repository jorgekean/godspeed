import { useRef, useState, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle, RefreshCw, HelpCircle, Zap } from 'lucide-react';

interface OMRScannerProps {
    correctAnswers?: string[];
    onScanComplete?: (score: number, rawAnswers: string[], examCode?: string, studentNo?: string) => void;
    enabled?: boolean;
    allStudentsGraded?: boolean;
    onViewResults?: () => void;
}

export interface OMRScannerRef {
    updateLastResult: (data: { 
        score: number, 
        total: number, 
        studentName?: string, 
        examTitle?: string,
        correctAnswers?: string 
    }) => void;
    reset: () => void;
}

export const OMRScanner = forwardRef<OMRScannerRef, OMRScannerProps>(
    ({ correctAnswers, onScanComplete, enabled = true, allStudentsGraded = false, onViewResults }, ref) => {
    const webcamRef = useRef<Webcam>(null);
    const workerRef = useRef<Worker | null>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isWorkerReady, setIsWorkerReady] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isWorkerBusy, setIsWorkerBusy] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const [reviewQueue, setReviewQueue] = useState<string[]>([]);
    const [pendingAnswers, setPendingAnswers] = useState<Record<string, string>>({});
    const [detectedExamCode, setDetectedExamCode] = useState<string | undefined>();
    const [detectedStudentNo, setDetectedStudentNo] = useState<string | undefined>();

    // --- AUTO-CAPTURE STATE ---
    const [isAutoMode, setIsAutoMode] = useState(true);
    const [scanBuffer, setScanBuffer] = useState<any[]>([]);
    const [lastError, setLastError] = useState<string | null>(null);
    const [showHelpPrompt, setShowHelpPrompt] = useState(false);
    const [lastSuccess, setLastSuccess] = useState<{ 
        studentNo: string, 
        score: number, 
        total: number, 
        answers?: Record<string, string>,
        studentName?: string,
        examTitle?: string,
        correctAnswers?: string
    } | null>(null);
    const [scanSessionId, setScanSessionId] = useState(0); 
    const autoScanTimeoutRef = useRef<any>(null);

    const [showDetails, setShowDetails] = useState(false);

    // --- EXPOSE METHODS VIA REF ---
    useImperativeHandle(ref, () => ({
        updateLastResult: (data) => {
            setLastSuccess(prev => prev ? { ...prev, ...data } : null);
        },
        reset: () => {
            resetAutoScan();
        }
    }));

    // --- CAMERA HANDLERS ---
    const handleUserMedia = useCallback(() => {
        setIsCameraReady(true);
    }, []);

    const handleCameraError = useCallback((err: any) => {
        console.error("Webcam Error:", err);
        setError("Could not access camera. Please check permissions.");
    }, []);

    // --- AUDIO FEEDBACK ---
    const playSuccessBeep = useCallback(() => {
        try {
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            const audioCtx = new AudioContextClass();
            const playNote = (freq: number, startTime: number, duration: number) => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, startTime);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            const now = audioCtx.currentTime;
            playNote(880, now, 0.1);
            playNote(1046, now + 0.12, 0.1);
        } catch (e) {
            console.warn("Audio feedback failed:", e);
        }
    }, []);

    const finalizeGrading = useCallback((finalAnswers: Record<string, string>, examCode?: string, studentNo?: string) => {
        const totalItems = (correctAnswers && correctAnswers.length > 0) ? correctAnswers.length : 20;
        let score = 0;
        if (correctAnswers && correctAnswers.length > 0) {
            Object.keys(finalAnswers).forEach(q => {
                const questionIndex = parseInt(q, 10) - 1;
                if (questionIndex < totalItems && finalAnswers[q] === correctAnswers[questionIndex]) {
                    score++;
                }
            });
        }
        const rawAnswersArray: string[] = [];
        for (let i = 1; i <= totalItems; i++) {
            rawAnswersArray.push(finalAnswers[i.toString()] || "BLANK");
        }
        
        setLastSuccess({ studentNo: studentNo || '?', score: score, total: totalItems, answers: finalAnswers });
        playSuccessBeep();
        setIsPaused(true);
        setIsProcessing(false);

        if (onScanComplete) {
            onScanComplete(score, rawAnswersArray, examCode, studentNo);
        }
    }, [correctAnswers, onScanComplete, playSuccessBeep]);

    const resetAutoScan = useCallback(() => {
        setScanSessionId(prev => prev + 1);
        setScanBuffer([]);
        setShowHelpPrompt(false);
        setLastSuccess(null);
        setScanResult(null);
        setIsPaused(false);
        setIsProcessing(false);
        if (autoScanTimeoutRef.current) clearTimeout(autoScanTimeoutRef.current);
        
        autoScanTimeoutRef.current = setTimeout(() => {
            setShowHelpPrompt(true);
        }, 10000);
    }, []);

    const handleRescan = useCallback(() => {
        setScanSessionId(prev => prev + 1);
        setIsPaused(false);
        setIsProcessing(false);
        setLastSuccess(null);
        setScanResult(null);
        setScanBuffer([]);
        if (autoScanTimeoutRef.current) clearTimeout(autoScanTimeoutRef.current);
        autoScanTimeoutRef.current = setTimeout(() => {
            setShowHelpPrompt(true);
        }, 10000);
    }, []);

    // Initial worker setup
    useEffect(() => {
        const baseUrl = import.meta.env.BASE_URL;
        const workerPath = `${baseUrl}omr.worker.js`;
        workerRef.current = new Worker(workerPath);
        
        const pingInterval = setInterval(() => {
            if (!isWorkerReady) workerRef.current?.postMessage({ action: 'PING', sessionId: -1 });
        }, 1000);

        return () => {
            clearInterval(pingInterval);
            workerRef.current?.terminate();
        };
    }, []);

    // --- EFFECT: MONITOR SCAN BUFFER ---
    useEffect(() => {
        if (isAutoMode && scanBuffer.length >= 3) {
            const finalResult = scanBuffer[scanBuffer.length - 1];
            const extractedAnswers = finalResult.answers;
            const needsReview = Object.keys(extractedAnswers).filter(q => extractedAnswers[q] === "REVIEW");

            if (needsReview.length > 0) {
                setPendingAnswers(extractedAnswers);
                setDetectedExamCode(finalResult.examCode);
                setDetectedStudentNo(finalResult.studentNo);
                setReviewQueue(needsReview);
                setIsProcessing(false);
            } else {
                finalizeGrading(extractedAnswers, finalResult.examCode, finalResult.studentNo);
            }
            
            setScanBuffer([]);
            if (autoScanTimeoutRef.current) clearTimeout(autoScanTimeoutRef.current);
        }
    }, [scanBuffer, isAutoMode, finalizeGrading]);

    // Worker Message Listener
    useEffect(() => {
        if (!workerRef.current) return;

        workerRef.current.onmessage = (e) => {
            const { success, error, answers, examCode, studentNo, sessionId, status } = e.data;
            
            if (status !== 'READY') {
                setIsWorkerBusy(false);
            }

            if (sessionId !== -1 && sessionId !== scanSessionId) return;

            if (isPaused) {
                setIsProcessing(false);
                return;
            }

            if (status === 'READY') {
                setIsWorkerReady(true);
            } else if (error) {
                setLastError(error);
                setIsProcessing(false);
            } else if (success) {
                setLastError(null);
                const currentResult = { answers, examCode, studentNo };

                if (isAutoMode) {
                    setScanBuffer(prev => {
                        if (prev.length === 0) setLastSuccess(null);
                        const last = prev[prev.length - 1];
                        const isMatch = last && 
                            last.examCode === currentResult.examCode && 
                            last.studentNo === currentResult.studentNo &&
                            JSON.stringify(last.answers) === JSON.stringify(currentResult.answers);

                        return isMatch ? [...prev, currentResult] : [currentResult];
                    });
                } else {
                    const extractedAnswers = answers;
                    const needsReview = Object.keys(extractedAnswers).filter(q => extractedAnswers[q] === "REVIEW");
                    if (needsReview.length > 0) {
                        setPendingAnswers(extractedAnswers);
                        setDetectedExamCode(examCode);
                        setDetectedStudentNo(studentNo);
                        setReviewQueue(needsReview);
                    } else {
                        finalizeGrading(extractedAnswers, examCode, studentNo);
                    }
                }
                setIsProcessing(false);
            }
        };
    }, [isWorkerReady, isAutoMode, scanSessionId, isPaused, finalizeGrading]);

    const handleReviewDecision = (decision: string) => {
        const currentQ = reviewQueue[0];
        const updatedAnswers = { ...pendingAnswers, [currentQ]: decision };
        setPendingAnswers(updatedAnswers);
        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);
        if (newQueue.length === 0) {
            finalizeGrading(updatedAnswers, detectedExamCode, detectedStudentNo);
        }
    };

    const captureAndScan = useCallback(() => {
        if (!webcamRef.current || isProcessing || !enabled || isPaused || isWorkerBusy) return;
        const videoElement = webcamRef.current.video;
        if (!videoElement || videoElement.readyState !== 4) return;

        setIsProcessing(true);
        setIsWorkerBusy(true);
        setError(null);

        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = offscreenCanvasRef.current;
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const physicalSheetType = (correctAnswers && correctAnswers.length > 20) ? '50' : '20';
            
            workerRef.current?.postMessage({ 
                imageData, 
                examType: physicalSheetType,
                sessionId: scanSessionId 
            }, [imageData.data.buffer]);
        } else {
            setIsWorkerBusy(false);
            setIsProcessing(false);
        }
    }, [webcamRef, correctAnswers, isProcessing, enabled, isPaused, scanSessionId, isWorkerBusy]);

    useEffect(() => {
        if (!isAutoMode || !isWorkerReady || scanResult || reviewQueue.length > 0 || !enabled || isPaused || !isCameraReady) return;
        const interval = setInterval(() => {
            if (!isProcessing) {
                captureAndScan();
            }
        }, 300);
        return () => clearInterval(interval);
    }, [isAutoMode, isWorkerReady, isProcessing, captureAndScan, scanResult, reviewQueue, enabled, isPaused, isCameraReady]);

    useEffect(() => {
        return () => {
            if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
                const stream = webcamRef.current.video.srcObject as MediaStream;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    if (!isWorkerReady) {
        return <div className="p-10 text-center font-bold text-slate-500 flex flex-col items-center justify-center h-full bg-black min-h-[400px]">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            Initializing CV Engine...
        </div>;
    }

    return (
        <div className="flex flex-col h-full bg-black relative min-h-[400px]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center z-10 shadow-md">
                <h2 className="font-bold tracking-wide text-sm">Godspeed Scanner</h2>
                <button 
                    onClick={() => {
                        setIsAutoMode(!isAutoMode);
                        resetAutoScan();
                    }}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isAutoMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                >
                    {isAutoMode ? 'Auto-Capture' : 'Manual Mode'}
                </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                
                                <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} onUserMedia={handleUserMedia} onUserMediaError={handleCameraError} className="absolute inset-0 w-full h-full object-cover" />

                {/* Loading State Overlay */}
                {!isCameraReady && (
                    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
                         <Camera className="w-12 h-12 text-slate-700 animate-pulse mb-4" />
                         <p className="text-slate-500 font-bold">Waking up camera...</p>
                    </div>
                )}

                {/* Overlays */}
                {reviewQueue.length > 0 ? (
                    <div className="bg-amber-50 p-6 rounded-3xl text-center max-w-sm w-full mx-4 absolute z-50 shadow-2xl border-4 border-amber-200">
                        <HelpCircle className="w-14 h-14 text-amber-500 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Ambiguous Answer</h3>
                        <p className="text-slate-600 mb-6">Check item <span className="font-black text-xl text-indigo-600">Question {reviewQueue[0]}</span></p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {['A', 'B', 'C', 'D'].map(letter => (
                                <button key={letter} onClick={() => handleReviewDecision(letter)} className="py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold text-2xl hover:border-indigo-500 hover:text-indigo-600 active:bg-indigo-50 transition-all shadow-sm">{letter}</button>
                            ))}
                        </div>
                        <button onClick={() => handleReviewDecision("BLANK")} className="w-full py-4 bg-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-300 transition-colors">Mark Blank</button>
                    </div>
                ) : (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                        <div className="w-full max-w-xs sm:max-w-sm aspect-[1/1.4] border-4 border-dashed border-blue-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                            {isAutoMode && scanBuffer.length > 0 && !lastSuccess && (
                                <div className="absolute inset-0 bg-blue-500/10 flex flex-col items-center justify-center rounded-xl animate-pulse">
                                    <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border-2 border-blue-500">
                                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                                        <span className="text-blue-600 font-black text-xs uppercase tracking-tighter">Validating {scanBuffer.length}/3</span>
                                    </div>
                                </div>
                            )}
                            {lastSuccess && !showDetails && (
                                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 pointer-events-auto bg-black/40 backdrop-blur-[2px]">
                                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden border-2 border-green-500 animate-in zoom-in-95 duration-300">
                                        <div className="bg-green-500 p-4 flex flex-col items-center">
                                            <div className="bg-white/20 p-2 rounded-full mb-2"><CheckCircle className="w-8 h-8 text-white" /></div>
                                            <h4 className="text-white font-black text-xl leading-none">Result Saved</h4>
                                        </div>
                                        <div className="p-6 text-center">
                                            {lastSuccess.examTitle && (
                                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-md text-[9px] font-black uppercase tracking-widest mb-2">
                                                    <Zap className="w-2.5 h-2.5 fill-current" /> {lastSuccess.examTitle}
                                                </div>
                                            )}
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                                {lastSuccess.studentName || `Student No: ${lastSuccess.studentNo}`}
                                            </p>
                                            <div className="text-4xl font-black text-slate-900 mb-6">{lastSuccess.score} <span className="text-lg text-slate-400">/ {lastSuccess.total}</span></div>
                                            <div className="flex flex-col gap-2">
                                                {allStudentsGraded ? (
                                                    <button onClick={onViewResults} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-md active:scale-95">
                                                        View Results →
                                                    </button>
                                                ) : (
                                                    <button onClick={resetAutoScan} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95">
                                                        Next Paper →
                                                    </button>
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={() => setShowDetails(true)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Details</button>
                                                    <button onClick={handleRescan} className="flex-1 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">Rescan</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* DETAILS OVERLAY */}
                            {lastSuccess && showDetails && (
                                <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto pointer-events-auto flex flex-col items-center rounded-2xl animate-in fade-in duration-200">
                                    <div className="w-full flex justify-between items-center mt-2 mb-4 sticky top-0 bg-slate-950/90 py-2 z-10">
                                        <h3 className="text-white font-bold tracking-tight">Answers</h3>
                                        <button onClick={() => setShowDetails(false)} className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">Back</button>
                                    </div>
                                    <div className="w-full grid grid-cols-2 gap-2 pb-12">
                                        {Array.from({ length: lastSuccess.total }).map((_, i) => {
                                            const qNum = (i + 1).toString();
                                            const studentAns = lastSuccess.answers ? lastSuccess.answers[qNum] : '-';
                                            
                                            // Priority: 1. Injected correct answers (global mode), 2. Prop correct answers (exam mode)
                                            let correctAns = '-';
                                            if (lastSuccess.correctAnswers) {
                                                correctAns = lastSuccess.correctAnswers[i] || '-';
                                            } else if (correctAnswers && correctAnswers.length > 0) {
                                                correctAns = correctAnswers[i] || '-';
                                            }

                                            const isCorrect = studentAns === correctAns;
                                            return (
                                                <div key={qNum} className={`p-2 rounded-xl border flex flex-col items-center justify-center ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                                    <span className="text-slate-400 text-[9px] font-bold mb-0.5 uppercase">Q{qNum}</span>
                                                    <div className="flex gap-1 items-center">
                                                        <span className={`text-lg font-black ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{studentAns === "BLANK" ? "—" : studentAns}</span>
                                                        {!isCorrect && correctAns !== '-' && (
                                                            <>
                                                                <span className="text-slate-500 text-xs">→</span>
                                                                <span className="text-green-400 text-lg font-black">{correctAns}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!lastSuccess && (
                                <p className="text-white text-center font-bold mt-12 bg-blue-600/90 backdrop-blur-sm mx-8 py-2 rounded-full shadow-lg text-sm">Align all 4 corners</p>
                            )}

                            {showHelpPrompt && (
                                <div className="absolute bottom-12 left-6 right-6 bg-amber-500 text-white p-4 rounded-2xl flex flex-col gap-2 items-center text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-auto">
                                    <AlertTriangle className="w-8 h-8" />
                                    <p className="font-bold leading-tight">Having trouble?</p>
                                    <p className="text-xs opacity-90">Ensure the paper is flat, well-lit, and all 4 corners are visible.</p>
                                    <button onClick={(e) => { e.stopPropagation(); resetAutoScan(); }} className="mt-2 bg-white text-amber-600 px-4 py-1.5 rounded-lg text-xs font-black uppercase shadow-md active:scale-95 transition-transform">Retry</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {lastError && !showHelpPrompt && (
                    <div className="absolute top-6 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white p-3 rounded-xl flex gap-3 items-center font-medium z-50 shadow-xl border border-red-400">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p className="text-xs leading-tight">{lastError}</p>
                    </div>
                )}
            </div>

            {isCameraReady && !scanResult && reviewQueue.length === 0 && !isAutoMode && (
                <div className="p-6 bg-slate-900 pb-safe z-10 flex flex-col items-center justify-center">
                    <button onClick={captureAndScan} disabled={isProcessing} className="w-20 h-20 rounded-full border-4 border-slate-500 p-1 active:scale-95 transition-transform">
                        <div className={`w-full h-full rounded-full flex items-center justify-center transition-colors ${isProcessing ? 'bg-slate-700' : 'bg-white'}`}>{isProcessing ? <RefreshCw className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-slate-900" />}</div>
                    </button>
                </div>
            )}
        </div>
    );
});

OMRScanner.displayName = 'OMRScanner';
