import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { googleDriveService, type DriveBackupFile } from '../services/googleDriveService';
import { backupService, type BackupData } from '../services/backupService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export type BackupStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'success';

export interface SyncContextType {
    status: BackupStatus;
    lastSyncTimestamp: number;
    lastBackupTimestamp: number;
    isBackingUp: boolean;
    isRestoring: boolean;
    error: string | null;
    googleClientId: string;
    isGoogleConfigured: boolean;
    isGoogleConnected: boolean;
    disconnectGoogleDrive: () => void;
    setGoogleClientId: (clientId: string) => void;
    triggerBackupToDrive: () => Promise<DriveBackupFile | null>;
    triggerRestoreFromDrive: (fileId: string, mode?: 'replace' | 'merge') => Promise<boolean>;
    listDriveBackups: () => Promise<DriveBackupFile[]>;
    exportLocalBackupFile: () => Promise<void>;
    importLocalBackupFile: (file: File, mode?: 'replace' | 'merge') => Promise<Record<string, number>>;
    // Backward compatibility aliases
    triggerSync: () => Promise<void>;
    triggerPush: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [status, setStatus] = useState<BackupStatus>('idle');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastBackupTimestamp, setLastBackupTimestamp] = useState<number>(() => googleDriveService.getLastBackupTime());
    const [googleClientId, setGoogleClientIdState] = useState<string>(() => googleDriveService.getClientId());
    const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(() => googleDriveService.hasValidToken());

    const isGoogleConfigured = Boolean(googleClientId);

    const setGoogleClientId = useCallback((clientId: string) => {
        googleDriveService.setClientId(clientId);
        setGoogleClientIdState(clientId.trim());
    }, []);

    const disconnectGoogleDrive = useCallback(() => {
        googleDriveService.clearStoredToken();
        setIsGoogleConnected(false);
        toast.info('Disconnected Google Drive account.');
    }, []);

    // Network status listener
    useEffect(() => {
        const handleOnline = () => {
            if (status === 'offline') setStatus('idle');
        };
        const handleOffline = () => {
            setStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) {
            setStatus('offline');
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [status]);

    // Check token validity on mount
    useEffect(() => {
        setIsGoogleConnected(googleDriveService.hasValidToken());
    }, []);

    /**
     * Internal: Executes backup with a known valid token
     */
    const executeBackupWithToken = useCallback(async (token: string): Promise<DriveBackupFile | null> => {
        setIsBackingUp(true);
        setStatus('syncing');
        setError(null);

        try {
            const backupPayload = await backupService.generateBackup({
                name: currentUser?.name,
                email: currentUser?.email,
                school: currentUser?.school
            });

            const uploaded = await googleDriveService.uploadBackup(backupPayload, token);
            const now = Date.now();
            setLastBackupTimestamp(now);
            setIsGoogleConnected(true);
            setStatus('success');
            toast.success('Backed up to Google Drive successfully!', {
                description: uploaded.name
            });
            setTimeout(() => setStatus('idle'), 3000);
            return uploaded;
        } catch (err: any) {
            console.error('Google Drive backup error:', err);
            const msg = err.message || 'Failed to upload backup to Google Drive.';
            setError(msg);
            setStatus('error');
            toast.error(msg);
            if (!googleDriveService.hasValidToken()) {
                setIsGoogleConnected(false);
            }
            return null;
        } finally {
            setIsBackingUp(false);
        }
    }, [currentUser]);

    /**
     * Backup directly to user's Google Drive.
     * Uses cached token if available (ZERO popups).
     * If no token, initiates synchronous GIS authorization directly in the user click event tick.
     */
    const triggerBackupToDrive = useCallback(async (): Promise<DriveBackupFile | null> => {
        if (!navigator.onLine) {
            toast.error('You are offline. Connect to the internet to back up to Google Drive.');
            return null;
        }

        if (!googleDriveService.isConfigured()) {
            setError('Google OAuth Client ID is not configured.');
            return null;
        }

        // 1. Fast path: token is already stored in localStorage (JinTracker pattern)
        const cachedToken = googleDriveService.getStoredToken();
        if (cachedToken) {
            return await executeBackupWithToken(cachedToken);
        }

        // 2. Synchronous user gesture path: opens popup immediately with zero async delays
        return new Promise((resolve) => {
            setIsBackingUp(true);
            setStatus('syncing');
            googleDriveService.requestTokenSynchronously(
                async (token) => {
                    setIsGoogleConnected(true);
                    const uploaded = await executeBackupWithToken(token);
                    resolve(uploaded);
                },
                (err) => {
                    setIsBackingUp(false);
                    setStatus('error');
                    toast.error(err.message || 'Google authorization failed');
                    resolve(null);
                }
            );
        });
    }, [executeBackupWithToken]);

    /**
     * List backups stored in Google Drive
     */
    const listDriveBackups = useCallback(async (): Promise<DriveBackupFile[]> => {
        if (!navigator.onLine) {
            toast.error('Cannot list Drive backups while offline.');
            return [];
        }

        const cachedToken = googleDriveService.getStoredToken();
        if (cachedToken) {
            try {
                const list = await googleDriveService.listBackups(cachedToken);
                setIsGoogleConnected(true);
                return list;
            } catch (err: any) {
                if (!googleDriveService.hasValidToken()) {
                    setIsGoogleConnected(false);
                }
                throw err;
            }
        }

        return new Promise((resolve, reject) => {
            googleDriveService.requestTokenSynchronously(
                async (token) => {
                    setIsGoogleConnected(true);
                    try {
                        const list = await googleDriveService.listBackups(token);
                        resolve(list);
                    } catch (e) {
                        reject(e);
                    }
                },
                (err) => {
                    reject(err);
                }
            );
        });
    }, []);

    /**
     * Restore from Google Drive
     */
    const triggerRestoreFromDrive = useCallback(async (fileId: string, mode: 'replace' | 'merge' = 'replace'): Promise<boolean> => {
        if (!navigator.onLine) {
            toast.error('You are offline. Connect to the internet to download from Google Drive.');
            return false;
        }

        const token = googleDriveService.getStoredToken();
        if (!token) {
            toast.error('Please connect to Google Drive first.');
            return false;
        }

        setIsRestoring(true);
        setStatus('syncing');
        setError(null);

        try {
            const backupData: BackupData = await googleDriveService.downloadBackup(fileId, token);
            await backupService.restoreBackup(backupData, mode);
            setIsGoogleConnected(true);
            setStatus('success');
            toast.success('Workspace restored successfully!');
            setTimeout(() => setStatus('idle'), 3000);
            return true;
        } catch (err: any) {
            console.error('Google Drive restore error:', err);
            const msg = err.message || 'Failed to restore backup from Google Drive.';
            setError(msg);
            setStatus('error');
            toast.error(msg);
            if (!googleDriveService.hasValidToken()) {
                setIsGoogleConnected(false);
            }
            return false;
        } finally {
            setIsRestoring(false);
        }
    }, []);

    /**
     * Local JSON File Export (100% Offline)
     */
    const exportLocalBackupFile = useCallback(async () => {
        try {
            const backupPayload = await backupService.generateBackup({
                name: currentUser?.name,
                email: currentUser?.email,
                school: currentUser?.school
            });
            backupService.downloadBackupFile(backupPayload);
            toast.success('Backup file exported to downloads!');
        } catch (err: any) {
            console.error('Local export error:', err);
            toast.error('Failed to export backup file.');
        }
    }, [currentUser]);

    /**
     * Local JSON File Import (100% Offline)
     */
    const importLocalBackupFile = useCallback(async (file: File, mode: 'replace' | 'merge' = 'replace') => {
        setIsRestoring(true);
        try {
            const backupPayload = await backupService.parseBackupFile(file);
            const counts = await backupService.restoreBackup(backupPayload, mode);
            toast.success('Backup restored successfully!', {
                description: `${counts.exams || 0} exams, ${counts.scanResults || 0} scans restored.`
            });
            return counts;
        } catch (err: any) {
            console.error('Local import error:', err);
            toast.error(err.message || 'Failed to restore from file.');
            throw err;
        } finally {
            setIsRestoring(false);
        }
    }, []);

    // Backward compatible aliases
    const triggerSync = useCallback(async () => {
        await triggerBackupToDrive();
    }, [triggerBackupToDrive]);

    const triggerPush = useCallback(async () => {
        // Pure offline app - no background pushing to remote servers
    }, []);

    return (
        <SyncContext.Provider
            value={{
                status,
                lastSyncTimestamp: lastBackupTimestamp,
                lastBackupTimestamp,
                isBackingUp,
                isRestoring,
                error,
                googleClientId,
                isGoogleConfigured,
                isGoogleConnected,
                disconnectGoogleDrive,
                setGoogleClientId,
                triggerBackupToDrive,
                triggerRestoreFromDrive,
                listDriveBackups,
                exportLocalBackupFile,
                importLocalBackupFile,
                triggerSync,
                triggerPush
            }}
        >
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};

export const useBackup = useSync;
