import type { BackupData } from './backupService';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

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

const MASTER_BACKUP_FILENAME = 'godspeed-grader-data.json';
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
            (Capacitor.isNativePlatform() ? import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID : '') ||
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
     * Helper to generate a random cryptographically secure string for PKCE
     */
    generateRandomString(length: number): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            result += charset[randomValues[i] % charset.length];
        }
        return result;
    },

    /**
     * Helper to generate a SHA-256 base64url-encoded code challenge for PKCE
     */
    async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const bytes = new Uint8Array(digest);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    },

    /**
     * Native iOS / Android OAuth flow using ASWebAuthenticationSession / Safari via @capacitor/browser + PKCE
     */
    async requestNativeGoogleToken(
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

        try {
            const codeVerifier = this.generateRandomString(64);
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);
            const clientPrefix = clientId.replace('.apps.googleusercontent.com', '');
            const redirectUri = `com.googleusercontent.apps.${clientPrefix}:/oauth2redirect`;

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: 'code',
                scope: SCOPES,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                prompt: prompt || 'select_account'
            }).toString();

            let completed = false;

            const urlListener = await App.addListener('appUrlOpen', async (data) => {
                if (data.url.includes('code=') || data.url.startsWith(`com.googleusercontent.apps.${clientPrefix}:`)) {
                    completed = true;
                    urlListener.remove();
                    await Browser.close().catch(() => {});

                    try {
                        let code: string | null = null;
                        let error: string | null = null;
                        try {
                            const urlObj = new URL(data.url);
                            code = urlObj.searchParams.get('code');
                            error = urlObj.searchParams.get('error');
                        } catch {
                            const queryString = (data.url.split('?')[1] || '').split('#')[0];
                            const searchParams = new URLSearchParams(queryString);
                            code = searchParams.get('code');
                            error = searchParams.get('error');
                        }

                        if (error) {
                            onError(new Error(`Google login error: ${error}`));
                            return;
                        }

                        if (!code) {
                            onError(new Error('Authorization code was not returned by Google.'));
                            return;
                        }

                        // Exchange authorization code for access token via Google token endpoint
                        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                client_id: clientId,
                                code,
                                code_verifier: codeVerifier,
                                grant_type: 'authorization_code',
                                redirect_uri: redirectUri
                            })
                        });

                        const tokenData = await tokenResponse.json();
                        if (tokenData.access_token) {
                            const expiresIn = tokenData.expires_in ? parseInt(tokenData.expires_in, 10) : 3600;
                            this.setStoredToken(tokenData.access_token, expiresIn);
                            onSuccess(tokenData.access_token);
                        } else {
                            const msg = tokenData.error_description || tokenData.error || 'Failed to obtain access token from Google.';
                            onError(new Error(msg));
                        }
                    } catch (e: any) {
                        onError(new Error(e.message || 'Failed to exchange authorization code.'));
                    }
                }
            });

            const browserListener = await Browser.addListener('browserFinished', () => {
                browserListener.remove();
                setTimeout(() => {
                    if (!completed) {
                        urlListener.remove();
                        onError(new Error('Google authorization was cancelled.'));
                    }
                }, 800);
            });

            await Browser.open({ url: authUrl });
        } catch (err: any) {
            onError(new Error(err.message || 'Could not launch Google authorization browser.'));
        }
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
        if (Capacitor.isNativePlatform()) {
            this.requestNativeGoogleToken(onSuccess, onError, prompt);
            return;
        }

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
     * Finds the master backup file in user's Google Drive.
     * Looks for 'godspeed-grader-data.json' first, then falls back to any legacy backup.
     */
    async getMasterBackupFile(accessToken: string): Promise<DriveBackupFile | null> {
        // 1. Look for canonical master file
        const query = encodeURIComponent(`name = '${MASTER_BACKUP_FILENAME}' and trashed = false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=1`;

        try {
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.files && data.files.length > 0) {
                    return data.files[0] as DriveBackupFile;
                }
            }

            // 2. Fallback to latest legacy backup file if exists
            const legacyQuery = encodeURIComponent("name contains 'godspeed-grader-backup' and trashed = false");
            const legacyUrl = `https://www.googleapis.com/drive/v3/files?q=${legacyQuery}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=1`;
            const legacyRes = await fetch(legacyUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (legacyRes.ok) {
                const data = await legacyRes.json();
                if (data.files && data.files.length > 0) {
                    return data.files[0] as DriveBackupFile;
                }
            }
        } catch (e) {
            console.warn('Error checking master backup file:', e);
        }

        return null;
    },

    /**
     * Uploads or updates the single master backup JSON in user's Google Drive via Drive v3 REST API.
     * Uses PATCH to update existing file in-place (preserving version history without clutter),
     * or POST to create it if it doesn't exist yet.
     */
    async uploadOrUpdateMasterBackup(
        backupData: BackupData,
        accessToken: string,
        existingFileId?: string
    ): Promise<DriveBackupFile> {
        const metadata = {
            name: MASTER_BACKUP_FILENAME,
            mimeType: 'application/json',
            description: `Godspeed Grader Database (${backupData.summary.examsCount} exams, ${backupData.summary.scanResultsCount} scans)`
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

        const isUpdate = Boolean(existingFileId);
        const endpoint = isUpdate
            ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,name,createdTime,size,webViewLink`
            : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink`;

        const response = await fetch(endpoint, {
            method: isUpdate ? 'PATCH' : 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        if (response.status === 401) {
            this.clearStoredToken();
            throw new Error('Google authorization expired. Please tap Sync again to reconnect.');
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `Google Drive sync failed with status ${response.status}`);
        }

        const uploadedFile = await response.json();
        this.setLastBackupTime(Date.now());

        return uploadedFile as DriveBackupFile;
    },

    /**
     * Uploads the backup JSON directly to the user's Google Drive via Drive v3 REST API
     */
    async uploadBackup(backupData: BackupData, accessToken: string): Promise<DriveBackupFile> {
        const existing = await this.getMasterBackupFile(accessToken);
        return this.uploadOrUpdateMasterBackup(backupData, accessToken, existing?.id);
    },

    /**
     * Lists existing Godspeed Grader backup files in user's Google Drive
     */
    async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
        const query = encodeURIComponent(`(name = '${MASTER_BACKUP_FILENAME}' or name contains 'godspeed-grader-backup') and trashed = false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

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
