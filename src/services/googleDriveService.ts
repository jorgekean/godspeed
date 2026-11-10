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
const STORAGE_KEY_TOKEN = 'google_drive_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'google_drive_token_expiry';

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
     * Get currently cached Google OAuth token from localStorage if not expired
     */
    getStoredToken(): string | null {
        const token = localStorage.getItem(STORAGE_KEY_TOKEN);
        const expiryStr = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY);
        if (!token) return null;

        if (expiryStr) {
            const expiry = parseInt(expiryStr, 10);
            if (Date.now() >= expiry) {
                // Token has expired
                this.clearStoredToken();
                return null;
            }
        }
        return token;
    },

    /**
     * Save Google OAuth access token with expiration buffer (JinTracker pattern)
     */
    setStoredToken(token: string, expiresInSeconds: number = 3600) {
        if (!token) {
            this.clearStoredToken();
            return;
        }
        // Save with 2-minute safety buffer before actual expiration
        const bufferSeconds = Math.max(expiresInSeconds - 120, 60);
        const expiryTime = Date.now() + bufferSeconds * 1000;

        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString());
    },

    /**
     * Clear stored Google OAuth token (disconnect)
     */
    clearStoredToken() {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY);
    },

    /**
     * Check whether we have a currently active valid token
     */
    hasValidToken(): boolean {
        return Boolean(this.getStoredToken());
    },

    /**
     * Dynamically loads the Google Identity Services script if not already present
     */
    async loadGsiScript(): Promise<void> {
        if (window.google?.accounts?.oauth2) return;

        return new Promise((resolve, reject) => {
            const existingScript = document.getElementById('google-gsi-client');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')));
                if (window.google?.accounts?.oauth2) {
                    resolve();
                }
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
     * CRITICAL FOR IPHONE / SAFARI / PWA:
     * This MUST be called synchronously inside a user tap/click event handler.
     * Invoking requestAccessToken without prior async delays prevents Safari from blocking the popup.
     */
    requestTokenSynchronously(
        onSuccess: (token: string) => void,
        onError: (err: Error) => void,
        prompt: string = ''
    ) {
        const clientId = this.getClientId();
        if (!clientId) {
            onError(new Error('Google OAuth Client ID is not configured.'));
            return;
        }

        if (!navigator.onLine) {
            onError(new Error('No internet connection. Please connect to the internet.'));
            return;
        }

        if (!window.google?.accounts?.oauth2) {
            onError(new Error('Google Identity Services is still loading. Please tap again in a moment.'));
            return;
        }

        try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: SCOPES,
                callback: (response: any) => {
                    if (response.error) {
                        onError(new Error(response.error_description || response.error || 'Google authorization failed'));
                    } else if (response.access_token) {
                        const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
                        this.setStoredToken(response.access_token, expiresIn);
                        onSuccess(response.access_token);
                    } else {
                        onError(new Error('No access token returned from Google.'));
                    }
                },
                error_callback: (err: any) => {
                    onError(new Error(err?.message || 'Google popup closed or blocked.'));
                }
            });

            // Synchronously request access token on the user's click tick
            tokenClient.requestAccessToken({ prompt });
        } catch (err: any) {
            onError(new Error(err.message || 'Could not launch Google authorization.'));
        }
    },

    /**
     * Uploads the backup JSON directly to the user's Google Drive via Drive v3 REST API
     */
    async uploadBackup(backupData: BackupData, accessToken: string): Promise<DriveBackupFile> {
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
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        if (response.status === 401) {
            this.clearStoredToken();
            throw new Error('Google authorization expired. Please tap Backup again to reconnect.');
        }

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
    async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
        const query = encodeURIComponent("name contains 'godspeed-grader-backup' and trashed = false");
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=20`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (response.status === 401) {
            this.clearStoredToken();
            throw new Error('Google authorization expired. Please tap Restore again to reconnect.');
        }

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
    async downloadBackup(fileId: string, accessToken: string): Promise<BackupData> {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (response.status === 401) {
            this.clearStoredToken();
            throw new Error('Google authorization expired. Please reconnect.');
        }

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
