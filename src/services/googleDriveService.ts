import type { BackupData } from './backupService';

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: any) => void;
                        error_callback?: (error: any) => void;
                    }) => {
                        requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
                    };
                };
            };
        };
    }
}

const STORAGE_KEY_CLIENT_ID = 'godspeed_gdrive_client_id';
const STORAGE_KEY_LAST_BACKUP = 'godspeed_last_gdrive_backup';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export interface DriveBackupFile {
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    webViewLink?: string;
}

export const googleDriveService = {
    /**
     * Get configured Google Client ID from localStorage or env
     */
    getClientId(): string {
        return (
            localStorage.getItem(STORAGE_KEY_CLIENT_ID) ||
            import.meta.env.VITE_GOOGLE_CLIENT_ID ||
            ''
        ).trim();
    },

    /**
     * Save custom Google Client ID
     */
    setClientId(clientId: string) {
        if (!clientId) {
            localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
        } else {
            localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
        }
    },

    /**
     * Check if a Google Client ID is configured
     */
    isConfigured(): boolean {
        return Boolean(this.getClientId());
    },

    /**
     * Get timestamp of last successful Google Drive backup
     */
    getLastBackupTime(): number {
        const val = localStorage.getItem(STORAGE_KEY_LAST_BACKUP);
        return val ? parseInt(val, 10) : 0;
    },

    setLastBackupTime(timestamp: number) {
        localStorage.setItem(STORAGE_KEY_LAST_BACKUP, timestamp.toString());
    },

    /**
     * Dynamically loads the Google Identity Services script
     */
    async loadGsiScript(): Promise<void> {
        if (window.google?.accounts?.oauth2) return;

        return new Promise((resolve, reject) => {
            const existingScript = document.getElementById('google-gsi-client');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')));
                return;
            }

            const script = document.createElement('script');
            script.id = 'google-gsi-client';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Identity Services. Check your internet connection.'));
            document.head.appendChild(script);
        });
    },

    /**
     * Requests an OAuth 2.0 access token for Google Drive scope
     */
    async requestAccessToken(prompt: string = ''): Promise<string> {
        const clientId = this.getClientId();
        if (!clientId) {
            throw new Error('Google OAuth Client ID is not configured. Please enter your Client ID in Settings.');
        }

        if (!navigator.onLine) {
            throw new Error('No internet connection. Please connect to the internet to authorize Google Drive.');
        }

        await this.loadGsiScript();

        return new Promise((resolve, reject) => {
            try {
                const tokenClient = window.google!.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: (response: any) => {
                        if (response.error) {
                            reject(new Error(response.error_description || response.error || 'Google authorization failed.'));
                        } else if (response.access_token) {
                            resolve(response.access_token);
                        } else {
                            reject(new Error('No access token returned from Google.'));
                        }
                    },
                    error_callback: (err: any) => {
                        reject(new Error(err.message || 'Google OAuth error occurred.'));
                    }
                });

                tokenClient.requestAccessToken({ prompt });
            } catch (err: any) {
                reject(new Error(err.message || 'Could not initialize Google Identity Client.'));
            }
        });
    },

    /**
     * Uploads the backup JSON directly to the user's Google Drive via Drive v3 REST API
     */
    async uploadBackup(backupData: BackupData, accessToken?: string): Promise<DriveBackupFile> {
        const token = accessToken || (await this.requestAccessToken());
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const fileName = `godspeed-grader-backup-${timestamp}.json`;

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            description: `Godspeed Grader Database Backup (${backupData.summary.examsCount} exams, ${backupData.summary.scanResultsCount} scans)`
        };

        const fileContent = JSON.stringify(backupData, null, 2);
        const boundary = '-------GodspeedGraderBoundary' + Math.random().toString(36).substring(2);
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const multipartBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            fileContent +
            closeDelimiter;

        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Google Drive upload failed with status ${response.status}`);
        }

        const uploadedFile = await response.json();
        this.setLastBackupTime(Date.now());

        return uploadedFile as DriveBackupFile;
    },

    /**
     * Lists existing Godspeed Grader backup files in user's Google Drive
     */
    async listBackups(accessToken?: string): Promise<DriveBackupFile[]> {
        const token = accessToken || (await this.requestAccessToken());

        const query = encodeURIComponent("name contains 'godspeed-grader-backup' and trashed = false");
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=20`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Failed to fetch backups from Google Drive (${response.status})`);
        }

        const data = await response.json();
        return (data.files || []) as DriveBackupFile[];
    },

    /**
     * Downloads a backup JSON file from Google Drive
     */
    async downloadBackup(fileId: string, accessToken?: string): Promise<BackupData> {
        const token = accessToken || (await this.requestAccessToken());

        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download backup file from Google Drive (${response.status})`);
        }

        const data = await response.json();
        if (!data || !data.data) {
            throw new Error('Downloaded file is not a valid Godspeed Grader backup.');
        }

        return data as BackupData;
    }
};

