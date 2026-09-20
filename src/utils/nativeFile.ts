/**
 * nativeFile.ts
 *
 * Platform-aware file download/share utility.
 *
 * Strategy:
 *   - On Android (Capacitor native): write to the device cache dir then
 *     open the system Share sheet so the user can save to Downloads,
 *     send via email, etc.
 *   - On web / browser: fall back to the classic <a download> trick.
 */

import { Capacitor } from '@capacitor/core';

/**
 * Download or share a file depending on the current platform.
 *
 * @param blob     The file content as a Blob.
 * @param fileName Suggested file name (e.g. "Report.pdf").
 */
export async function downloadFile(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // ── Native Android path ──────────────────────────────────────────────
    // Lazy-import so the modules are only bundled when Capacitor is present.
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    const base64 = await blobToBase64(blob);

    const writeResult = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });

    await Share.share({
      title: fileName,
      url: writeResult.uri,
      dialogTitle: 'Save or Share File',
    });
  } else {
    // ── Web / browser fallback (existing behaviour) ──────────────────────
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link); // required in Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // FileReader result is "data:<mime>;base64,<data>" – strip the prefix
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
