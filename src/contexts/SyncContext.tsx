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

    /**
     * Backup directly to user's Google Drive
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

        setIsBackingUp(true);
        setStatus('syncing');
        setError(null);

        try {
            const backupPayload = await backupService.generateBackup({
                name: currentUser?.name,
                email: currentUser?.email,
                school: currentUser?.school
            });

            const uploaded = await googleDriveService.uploadBackup(backupPayload);
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
            return null;
        } finally {
            setIsBackingUp(false);
        }
    }, [currentUser]);

    /**
     * Handle OAuth 2.0 Redirect Callback (for iOS / Standalone PWA) on boot
     */
    useEffect(() => {
        const { token, pendingAction } = googleDriveService.processRedirectHash();
        if (token) {
            setIsGoogleConnected(true);
            toast.success('Signed in to Google Drive!');
            if (pendingAction === 'backup') {
                triggerBackupToDrive();
            }
        } else {
            setIsGoogleConnected(googleDriveService.hasValidToken());
        }
    }, [triggerBackupToDrive]);

    /**
     * Restore from Google Drive
     */
    const triggerRestoreFromDrive = useCallback(async (fileId: string, mode: 'replace' | 'merge' = 'replace'): Promise<boolean> => {
        if (!navigator.onLine) {
            toast.error('You are offline. Connect to the internet to download from Google Drive.');
            return false;
        }

        setIsRestoring(true);
        setStatus('syncing');
        setError(null);

        try {
            const backupData: BackupData = await googleDriveService.downloadBackup(fileId);
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
            return false;
        } finally {
            setIsRestoring(false);
        }
    }, []);

    /**
     * List backups stored in Google Drive
     */
    const listDriveBackups = useCallback(async (): Promise<DriveBackupFile[]> => {
        if (!navigator.onLine) {
            toast.error('Cannot list Drive backups while offline.');
            return [];
        }
        try {
            const list = await googleDriveService.listBackups();
            setIsGoogleConnected(true);
            return list;
        } catch (err: any) {
            setIsGoogleConnected(googleDriveService.hasValidToken());
            throw err;
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
