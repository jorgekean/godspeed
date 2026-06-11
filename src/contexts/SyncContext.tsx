import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { syncService } from '../services/syncEngine';
// 1. Swap Firebase for your custom Auth Context
import { useAuth } from '../contexts/AuthContext';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncContextType {
    status: SyncStatus;
    lastSyncTimestamp: number;
    triggerSync: () => Promise<void>;
    triggerPush: () => Promise<void>;
    error: string | null;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, token } = useAuth(); // Use your custom auth state
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(syncService.getLastSyncTimestamp());
    const [error, setError] = useState<string | null>(null);

    // 2. Use a ref to track sync progress without triggering re-renders
    const isSyncingRef = useRef(false);

    const triggerSync = useCallback(async () => {
        if (!navigator.onLine) {
            setStatus('offline');
            return;
        }

        // 2. Prevent syncing if there is no token/user logged in
        if (!token || !currentUser || isSyncingRef.current) return;

        isSyncingRef.current = true;
        setStatus('syncing');
        setError(null);

        try {
            // 3. Pass the token and email to your sync service
            await syncService.syncData(token, currentUser.email);

            const newTimestamp = syncService.getLastSyncTimestamp();
            setLastSyncTimestamp(newTimestamp);
            setStatus('idle');
        } catch (err: any) {
            console.error('Sync error:', err);

            let message = 'Sync failed. Please try again.';
            const errorStr = err.message?.toLowerCase() || '';

            if (errorStr.includes('prisma') || errorStr.includes('database') || errorStr.includes('500')) {
                message = 'Our cloud database is currently undergoing maintenance. Please try again later.';
            } else if (errorStr.includes('network') || errorStr.includes('connect')) {
                message = 'Connection lost. Please check your internet and try again.';
            } else if (err.response?.status === 401) {
                message = 'Session expired. Please sign out and sign in again.';
            }

            setError(message);
            setStatus('error');
        } finally {
            isSyncingRef.current = false;
        }
    }, [token]);

    const triggerPush = useCallback(async () => {
        if (!navigator.onLine || !token || !currentUser || isSyncingRef.current) return;

        isSyncingRef.current = true;
        try {
            console.log("Triggering PUSH sync...");
            await syncService.pushChanges(token, currentUser.email);
        } catch (err: any) {
            console.error('Push error:', err);
        } finally {
            isSyncingRef.current = false;
        }
    }, [token]);

    // Handle online/offline status
    useEffect(() => {
        const handleOnline = () => setStatus('idle');
        const handleOffline = () => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (!navigator.onLine) setStatus('offline');

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-sync on auth or every 1 minute (PUSH ONLY)
    useEffect(() => {
        // 4. Trigger an initial sync (PUSH & PULL) if the user logs in
        if (currentUser) {
            triggerSync();
        }

        const interval = setInterval(() => {
            if (currentUser) {
                // Periodic sync is now PUSH ONLY to save costs
                triggerPush();
            }
        }, 1 * 60 * 1000);//

        return () => {
            clearInterval(interval);
        };
    }, [currentUser, triggerSync, triggerPush]); // Safely depends on currentUser now

    return (
        <SyncContext.Provider value={{ status, lastSyncTimestamp, triggerSync, triggerPush, error }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
};