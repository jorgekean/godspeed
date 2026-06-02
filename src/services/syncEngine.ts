import axios from 'axios';
import { db, type Section, type Student, type Exam, type ScanResult } from './db';
// REMOVED: import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface SyncBatch {
    sections: Section[];
    students: Student[];
    exams: Exam[];
    scanResults: ScanResult[];
}

export interface SyncResponse {
    sections: Section[];
    students: Student[];
    exams: Exam[];
    scanResults: ScanResult[];
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

    // 1. Pass token directly into pushChanges
    async pushChanges(token: string): Promise<void> {
        const headers = { Authorization: `Bearer ${token}` };

        // Phase 1: Push Unsynced Changes
        const unsyncedSections = await db.sections.filter(s => s.isSynced === false).toArray();
        const unsyncedStudents = await db.students.filter(s => s.isSynced === false).toArray();
        const unsyncedExams = await db.exams.filter(e => e.isSynced === false).toArray();
        const unsyncedScanResults = await db.scanResults.filter(sr => sr.isSynced === false).toArray();

        if (
            unsyncedSections.length === 0 &&
            unsyncedStudents.length === 0 &&
            unsyncedExams.length === 0 &&
            unsyncedScanResults.length === 0
        ) {
            return;
        }

        const batch: SyncBatch = {
            sections: unsyncedSections,
            students: unsyncedStudents,
            exams: unsyncedExams,
            scanResults: unsyncedScanResults
        };

        // Attach headers to axios request
        await axios.post(`${API_BASE_URL}/sync`, batch, { headers });

        // Mark as synced locally
        const ids = {
            sections: unsyncedSections.map(s => s.id),
            students: unsyncedStudents.map(s => s.id),
            exams: unsyncedExams.map(e => e.id),
            scanResults: unsyncedScanResults.map(sr => sr.id)
        };

        await db.transaction('rw', db.sections, db.students, db.exams, db.scanResults, async () => {

            // Explicitly update each record by ID. 
            // This bypasses any .modify() bugs with GUIDs/Booleans.            
            for (const id of ids.sections) {
                const updated = await db.sections.update(id, { isSynced: true });
                if (!updated) console.warn(`Failed to update section: ${id}`);
            }

            for (const id of ids.students) {
                const updated = await db.students.update(id, { isSynced: true });
                if (!updated) console.warn(`Failed to update student: ${id}`);
            }

            for (const id of ids.exams) {
                const updated = await db.exams.update(id, { isSynced: true });
                console.log(updated);
                if (!updated) console.warn(`Failed to update exam: ${id}`);
            }

            for (const id of ids.scanResults) {
                const updated = await db.scanResults.update(id, { isSynced: true });
                if (!updated) console.warn(`Failed to update scanResult: ${id}`);
            }

            console.log(`[Sync Push] Successfully marked records as synced.`);
        });
    },

    // 2. Pass token directly into pullChanges
    async pullChanges(token: string): Promise<number> {
        const headers = { Authorization: `Bearer ${token}` };
        const since = this.getLastSyncTimestamp();

        const response = await axios.get(`${API_BASE_URL}/sync?since=${since}`, { headers });

        // 1. TEMPORARY DEBUG: Look at this in your console to see the exact shape!
        console.log("Raw Server Response:", response.data);

        // 2. Safely extract data. 
        // If Fastify wraps data in `{ success: true, data: { ... } }`, use response.data.data
        // Otherwise, fallback to response.data
        const payload = response.data.data || response.data;

        // 3. Guarantee these are arrays using fallback values
        const sections = payload.sections || [];
        const students = payload.students || [];
        const exams = payload.exams || [];
        const scanResults = payload.scanResults || [];
        const serverTimestamp = payload.serverTimestamp || Date.now();

        await db.transaction('rw', db.sections, db.students, db.exams, db.scanResults, async () => {
            // 4. Make the merge function bulletproof
            const merge = async (table: any, items: any[]) => {
                // SAFETY CHECK: If items is still somehow not an array, exit early
                if (!items || !Array.isArray(items)) return;

                for (const item of items) {
                    const local = await table.get(item.id);
                    if (!local || local.isSynced) {
                        await table.put({ ...item, isSynced: true });
                    }
                }
            };

            await merge(db.sections, sections);
            await merge(db.students, students);
            await merge(db.exams, exams);
            await merge(db.scanResults, scanResults);
        });

        return serverTimestamp;
    },

    // 3. syncData now requires the token, and passes it down
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