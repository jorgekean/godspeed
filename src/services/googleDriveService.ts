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
const STORAGE_KEY_TOKEN = 'godspeed_gdrive_token';
const STORAGE_KEY_TOKEN_EXPIRY = 'godspeed_gdrive_token_expiry';
const STORAGE_KEY_PENDING_ACTION = 'godspeed_gdrive_pending_action';

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export interface DriveBackupFile {
    id: string;
    name: string;
    createdTime: string;
    size?: string;
    webViewLink?: string;
}

/**
 * Detect if the client is running on Apple iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
}

/**
 * Detect if the client is running as an installed PWA (Standalone WebClip / WebApp)
 */
export function isStandalonePWA(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches
    );
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
     * Save Google OAuth access token with expiration buffer
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
        localStorage.removeItem(STORAGE_KEY_PENDING_ACTION);
    },

    /**
     * Check whether we have a currently active valid token
     */
    hasValidToken(): boolean {
        return Boolean(this.getStoredToken());
    },

    /**
     * Check and process redirect hash on app boot / load.
     * This handles the OAuth 2.0 Implicit redirect flow for iPhone / iOS standalone PWA.
     */
    processRedirectHash(): { token: string | null; pendingAction: string | null } {
        if (typeof window === 'undefined') return { token: null, pendingAction: null };

        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token=')) {
            return { token: null, pendingAction: null };
        }

        try {
            const params = new URLSearchParams(hash.replace(/^#/, ''));
            const accessToken = params.get('access_token');
            const expiresIn = params.get('expires_in');
            const pendingAction = localStorage.getItem(STORAGE_KEY_PENDING_ACTION);
            localStorage.removeItem(STORAGE_KEY_PENDING_ACTION);

            if (accessToken) {
                this.setStoredToken(accessToken, expiresIn ? parseInt(expiresIn, 10) : 3600);
                // Clean the token hash from browser address bar history
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                return { token: accessToken, pendingAction };
            }
        } catch (e) {
            console.error('Failed to parse OAuth redirect hash:', e);
        }

        return { token: null, pendingAction: null };
    },

    /**
     * Bulletproof iOS / PWA Redirect Fallback:
     * When running as an iPhone PWA or if popups are blocked by Safari,
     * navigates the entire window directly to Google OAuth 2.0.
     */
    redirectToGoogleOAuth(pendingAction: string = 'backup') {
        const clientId = this.getClientId();
        if (!clientId) {
            throw new Error('Google OAuth Client ID is not configured.');
        }

        localStorage.setItem(STORAGE_KEY_PENDING_ACTION, pendingAction);

        // Current page URL without hash
        const redirectUri = window.location.origin + window.location.pathname;

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'token');
        authUrl.searchParams.set('scope', SCOPES);
        authUrl.searchParams.set('include_granted_scopes', 'true');
        authUrl.searchParams.set('prompt', 'select_account');

        window.location.assign(authUrl.toString());
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
                // If it already loaded before listener
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
     * Requests an OAuth 2.0 access token for Google Drive scope.
     * 1. Returns stored token if still valid (bypassing popups completely!)
     * 2. If running on iPhone PWA (standalone WebClip), uses OAuth direct redirect
     * 3. In desktop/standard browsers, uses GIS popup with fallback to redirect
     */
    async requestAccessToken(prompt: string = '', pendingAction: string = 'backup'): Promise<string> {
        // 1. Fast path: check valid cached token
        const cachedToken = this.getStoredToken();
        if (cachedToken) {
            return cachedToken;
        }

        const clientId = this.getClientId();
        if (!clientId) {
            throw new Error('Google OAuth Client ID is not configured. Please check your setup in Account settings.');
        }

        if (!navigator.onLine) {
            throw new Error('No internet connection. Please connect to the internet to authorize Google Drive.');
        }

        // 2. iOS Standalone PWA Workaround:
        // In iPhone PWA standalone mode, window.open popups are blocked by iOS WebKit.
        // Redirect directly so the user signs in cleanly and comes right back.
        if (isIOS() && isStandalonePWA()) {
            this.redirectToGoogleOAuth(pendingAction);
            return new Promise(() => {}); // Halts promise while navigating
        }

        // 3. Desktop / Browser Mode: Google Identity Services token client
        await this.loadGsiScript();

        return new Promise((resolve, reject) => {
            try {
                const tokenClient = window.google!.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: (response: any) => {
                        if (response.error) {
                            // If popup was blocked or failed on mobile Safari, fallback to redirect
                            if (response.error === 'popup_failed_to_open' || response.error === 'popup_closed') {
                                this.redirectToGoogleOAuth(pendingAction);
                                return;
                            }
                            reject(new Error(response.error_description || response.error || 'Google authorization failed.'));
                        } else if (response.access_token) {
                            const expiresIn = response.expires_in ? parseInt(response.expires_in, 10) : 3600;
                            this.setStoredToken(response.access_token, expiresIn);
                            resolve(response.access_token);
                        } else {
                            reject(new Error('No access token returned from Google.'));
                        }
                    },
                    error_callback: (err: any) => {
                        // Popup blocked fallback
                        if (err?.type === 'popup_failed_to_open' || isIOS()) {
                            this.redirectToGoogleOAuth(pendingAction);
                            return;
                        }
                        reject(new Error(err.message || 'Google OAuth error occurred.'));
                    }
                });

                tokenClient.requestAccessToken({ prompt });
            } catch (err: any) {
                // If GIS fails to initialize or opens a blocked popup, fallback to redirect
                if (isIOS() || isStandalonePWA()) {
                    this.redirectToGoogleOAuth(pendingAction);
                    return;
                }
                reject(new Error(err.message || 'Could not initialize Google Identity Client.'));
            }
        });
    },

    /**
     * Uploads the backup JSON directly to the user's Google Drive via Drive v3 REST API
     */
    async uploadBackup(backupData: BackupData, accessToken?: string): Promise<DriveBackupFile> {
        let token = accessToken || (await this.requestAccessToken('', 'backup'));
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

        let response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`
            },
            body: multipartBody
        });

        // If token expired (401), clear and retry once
        if (response.status === 401) {
            this.clearStoredToken();
            token = await this.requestAccessToken('select_account', 'backup');
            response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size,webViewLink', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: multipartBody
            });
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
    async listBackups(accessToken?: string): Promise<DriveBackupFile[]> {
        let token = accessToken || (await this.requestAccessToken('', 'restore'));

        const query = encodeURIComponent("name contains 'godspeed-grader-backup' and trashed = false");
        const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size,webViewLink)&orderBy=createdTime desc&pageSize=20`;

        let response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            this.clearStoredToken();
            token = await this.requestAccessToken('select_account', 'restore');
            response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
    async downloadBackup(fileId: string, accessToken?: string): Promise<BackupData> {
        let token = accessToken || (await this.requestAccessToken('', 'restore'));

        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        let response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            this.clearStoredToken();
            token = await this.requestAccessToken('select_account', 'restore');
            response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
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
