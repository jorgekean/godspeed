import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

/**
 * Converts a Blob to a base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = dataUrl.split(',')[1] || '';
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export interface ExportFileOptions {
    blob: Blob;
    filename: string;
    mimeType?: string;
    dialogTitle?: string;
}

/**
 * Universally exports/downloads a file.
 * - On iOS / Android (Capacitor): writes to cache and triggers the native iOS Share Sheet ("Save to Files", AirDrop, Open In, etc.)
 * - On Web / Desktop: triggers standard browser download
 */
export async function exportFile({
    blob,
    filename,
    mimeType = 'application/octet-stream',
    dialogTitle
}: ExportFileOptions): Promise<void> {
    try {
        if (Capacitor.isNativePlatform()) {
            const base64Data = await blobToBase64(blob);

            // Write file to device cache directory
            const savedFile = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Cache
            });

            // Open iOS native Share sheet so the user can Save to Files, AirDrop, or Open In
            await Share.share({
                title: dialogTitle || filename,
                url: savedFile.uri,
                dialogTitle: dialogTitle || 'Export File'
            });
        } else {
            // Web browser fallback
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
    } catch (err: any) {
        // User cancelling share sheet on iOS throws an error; ignore cancellation
        if (err?.message?.includes('cancelled') || err?.message?.includes('canceled') || err?.message?.includes('User did not share')) {
            return;
        }
        console.error('File export failed:', err);
        toast.error(`Export failed: ${err.message || 'Unknown error'}`);
        throw err;
    }
}
