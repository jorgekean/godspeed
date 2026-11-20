import fs from 'fs';
import path from 'path';

const iosPublicDir = path.resolve('ios/App/App/public');

// Exclude heavy video binaries from the iOS app bundle.
// Tutorial videos are streamed on-demand from https://godspeedgrader.com/tutorial_assets/
const tutorialAssetsDir = path.join(iosPublicDir, 'tutorial_assets');
if (fs.existsSync(tutorialAssetsDir)) {
    const files = fs.readdirSync(tutorialAssetsDir);
    let removedCount = 0;
    let freedBytes = 0;
    for (const file of files) {
        if (file.endsWith('.mp4') || file.endsWith('.mov') || file.endsWith('.webm')) {
            const filePath = path.join(tutorialAssetsDir, file);
            freedBytes += fs.statSync(filePath).size;
            fs.unlinkSync(filePath);
            removedCount++;
        }
    }
    console.log(`[clean-ios-bundle] Removed ${removedCount} video file(s) from iOS bundle (~${(freedBytes / (1024 * 1024)).toFixed(1)} MB saved)`);
}

// Remove promo folder if copied
const promoDir = path.join(iosPublicDir, 'promo');
if (fs.existsSync(promoDir)) {
    fs.rmSync(promoDir, { recursive: true, force: true });
    console.log('[clean-ios-bundle] Removed promo folder from iOS bundle');
}

const promoHtml = path.join(iosPublicDir, 'promo_video.html');
if (fs.existsSync(promoHtml)) {
    fs.unlinkSync(promoHtml);
}
