import axios from 'axios';
import { db, type Section, type Student, type Exam, type ScanResult, type Period } from './db';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://godspeedgrader-api.com/api';

export interface SyncBatch {
    sections: Section[];
    students: Student[];
    exams: Exam[];
    scanResults: ScanResult[];
    periods: Period[];
}

export interface SyncResponse {
    sections: Section[];
    students: Student[];
    exams: Exam[];
    scanResults: ScanResult[];
    periods: Period[];
    serverTimestamp: number;
}

const LAST_SYNC_KEY = 'godspeed_last_sync_timestamp';

export const syncService = {
    getLastSyncTimestamp(): number {
        const val = localStorage.getItem(LAST_SYNC_KEY);
        return val ? parseInt(val, 10) : 0;
    },

    setLastSyncTimestamp(timestamp: number) {
        localStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
    },

    async pushChanges(token: string): Promise<void> {
        const headers = { Authorization: `Bearer ${token}` };

        // Phase 1: Push Unsynced Changes
        const unsyncedSections = await db.sections.filter(s => s.isSynced === false).toArray();
        const unsyncedStudents = await db.students.filter(s => s.isSynced === false).toArray();
        const unsyncedExams = await db.exams.filter(e => e.isSynced === false).toArray();
        const unsyncedScanResults = await db.scanResults.filter(sr => sr.isSynced === false).toArray();
        const unsyncedPeriods = await db.periods.filter(p => p.isSynced === false).toArray();

        if (
            unsyncedSections.length === 0 &&
            unsyncedStudents.length === 0 &&
            unsyncedExams.length === 0 &&
            unsyncedScanResults.length === 0 &&
            unsyncedPeriods.length === 0
        ) {
            return;
        }

        const batch: SyncBatch = {
            sections: unsyncedSections,
            students: unsyncedStudents,
            exams: unsyncedExams,
            scanResults: unsyncedScanResults,
            periods: unsyncedPeriods
        };

        await axios.post(`${API_BASE_URL}/sync`, batch, { headers });

        // Mark as synced locally
        const ids = {
            sections: unsyncedSections.map(s => s.id),
            students: unsyncedStudents.map(s => s.id),
            exams: unsyncedExams.map(e => e.id),
            scanResults: unsyncedScanResults.map(sr => sr.id),
            periods: unsyncedPeriods.map(p => p.id)
        };

        await db.transaction('rw', [db.sections, db.students, db.exams, db.scanResults, db.periods], async () => {
            for (const id of ids.sections) {
                await db.sections.update(id, { isSynced: true });
            }

            for (const id of ids.students) {
                await db.students.update(id, { isSynced: true });
            }

            for (const id of ids.exams) {
                await db.exams.update(id, { isSynced: true });
            }

            for (const id of ids.scanResults) {
                await db.scanResults.update(id, { isSynced: true });
            }

            for (const id of ids.periods) {
                await db.periods.update(id, { isSynced: true });
            }
        });
    },

    async pullChanges(token: string): Promise<number> {
        const headers = { Authorization: `Bearer ${token}` };
        const since = this.getLastSyncTimestamp();

        const response = await axios.get(`${API_BASE_URL}/sync?since=${since}`, { headers });
        const payload = response.data.data || response.data;

        const sections: Section[] = payload.sections || [];
        const students: Student[] = payload.students || [];
        const exams: Exam[] = payload.exams || [];
        const scanResults: ScanResult[] = payload.scanResults || [];
        const periods: Period[] = payload.periods || [];
        const serverTimestamp: number = payload.serverTimestamp || Date.now();

        await db.transaction('rw', [db.sections, db.students, db.exams, db.scanResults, db.periods], async () => {
            const merge = async (table: any, items: any[]) => {
                if (!items || !Array.isArray(items)) return;

                for (const item of items) {
                    const local = await table.get(item.id);
                    // Only update if it doesn't exist locally or if it's already synced (to avoid overwriting unsynced local changes)
                    if (!local || local.isSynced) {
                        await table.put({ ...item, isSynced: true });
                    }
                }
            };

            await merge(db.sections, sections);
            await merge(db.students, students);
            await merge(db.exams, exams);
            await merge(db.scanResults, scanResults);
            await merge(db.periods, periods);
        });

        return serverTimestamp;
    },

    async syncData(token: string): Promise<void> {
        try {
            await this.pushChanges(token);
            const serverTimestamp = await this.pullChanges(token);
            this.setLastSyncTimestamp(serverTimestamp);
        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        }
    }
};