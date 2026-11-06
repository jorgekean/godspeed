import { db, type Section, type Student, type Period, type Exam, type ScanResult, type Subject, type GradeLevel } from './db';

export interface BackupData {
    version: number;
    appName: string;
    exportedAt: string;
    userProfile?: {
        name?: string;
        email?: string;
        school?: string;
    };
    data: {
        sections: Section[];
        students: Student[];
        periods: Period[];
        exams: Exam[];
        scanResults: ScanResult[];
        subjects: Subject[];
        gradeLevels: GradeLevel[];
    };
    summary: {
        sectionsCount: number;
        studentsCount: number;
        periodsCount: number;
        examsCount: number;
        scanResultsCount: number;
        subjectsCount: number;
        gradeLevelsCount: number;
    };
}

export const backupService = {
    /**
     * Gathers all data from IndexedDB into a structured backup object
     */
    async generateBackup(userProfile?: { name?: string; email?: string; school?: string }): Promise<BackupData> {
        const [
            sections,
            students,
            periods,
            exams,
            scanResults,
            subjects,
            gradeLevels
        ] = await Promise.all([
            db.sections.toArray(),
            db.students.toArray(),
            db.periods.toArray(),
            db.exams.toArray(),
            db.scanResults.toArray(),
            db.subjects.toArray(),
            db.gradeLevels.toArray()
        ]);

        return {
            version: 2,
            appName: 'Godspeed Grader',
            exportedAt: new Date().toISOString(),
            userProfile,
            data: {
                sections,
                students,
                periods,
                exams,
                scanResults,
                subjects,
                gradeLevels
            },
            summary: {
                sectionsCount: sections.length,
                studentsCount: students.length,
                periodsCount: periods.length,
                examsCount: exams.length,
                scanResultsCount: scanResults.length,
                subjectsCount: subjects.length,
                gradeLevelsCount: gradeLevels.length
            }
        };
    },

    /**
     * Downloads the backup as a local JSON file
     */
    downloadBackupFile(backupData: BackupData) {
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
        const fileName = `godspeed-grader-backup-${timestamp}.json`;

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    },

    /**
     * Reads a user-selected File and parses it as BackupData
     */
    async parseBackupFile(file: File): Promise<BackupData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const json = JSON.parse(text);
                    if (!json.data || typeof json.data !== 'object') {
                        throw new Error('Invalid backup file: missing database payload.');
                    }
                    resolve(json as BackupData);
                } catch (err: any) {
                    reject(new Error(err.message || 'Failed to parse JSON backup file.'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsText(file);
        });
    },

    /**
     * Restores data into IndexedDB (Dexie)
     * mode = 'replace': clears current tables first
     * mode = 'merge': upserts records by ID
     */
    async restoreBackup(backupData: BackupData, mode: 'replace' | 'merge' = 'replace'): Promise<Record<string, number>> {
        const { data } = backupData;
        if (!data) {
            throw new Error('Backup file contains no data.');
        }

        const counts: Record<string, number> = {
            sections: 0,
            students: 0,
            periods: 0,
            exams: 0,
            scanResults: 0,
            subjects: 0,
            gradeLevels: 0
        };

        await db.transaction('rw', [
            db.sections,
            db.students,
            db.periods,
            db.exams,
            db.scanResults,
            db.subjects,
            db.gradeLevels
        ], async () => {
            if (mode === 'replace') {
                await Promise.all([
                    db.sections.clear(),
                    db.students.clear(),
                    db.periods.clear(),
                    db.exams.clear(),
                    db.scanResults.clear(),
                    db.subjects.clear(),
                    db.gradeLevels.clear()
                ]);
            }

            if (data.sections?.length) {
                await db.sections.bulkPut(data.sections);
                counts.sections = data.sections.length;
            }
            if (data.students?.length) {
                await db.students.bulkPut(data.students);
                counts.students = data.students.length;
            }
            if (data.periods?.length) {
                await db.periods.bulkPut(data.periods);
                counts.periods = data.periods.length;
            }
            if (data.exams?.length) {
                await db.exams.bulkPut(data.exams);
                counts.exams = data.exams.length;
            }
            if (data.scanResults?.length) {
                await db.scanResults.bulkPut(data.scanResults);
                counts.scanResults = data.scanResults.length;
            }
            if (data.subjects?.length) {
                await db.subjects.bulkPut(data.subjects);
                counts.subjects = data.subjects.length;
            }
            if (data.gradeLevels?.length) {
                await db.gradeLevels.bulkPut(data.gradeLevels);
                counts.gradeLevels = data.gradeLevels.length;
            }
        });

        return counts;
    },

    /**
     * Get summary counts of all current local data
     */
    async getLocalStats() {
        const [
            sectionsCount,
            studentsCount,
            periodsCount,
            examsCount,
            scanResultsCount,
            subjectsCount,
            gradeLevelsCount
        ] = await Promise.all([
            db.sections.count(),
            db.students.count(),
            db.periods.count(),
            db.exams.count(),
            db.scanResults.count(),
            db.subjects.count(),
            db.gradeLevels.count()
        ]);

        return {
            sectionsCount,
            studentsCount,
            periodsCount,
            examsCount,
            scanResultsCount,
            subjectsCount,
            gradeLevelsCount,
            totalRecords: sectionsCount + studentsCount + periodsCount + examsCount + scanResultsCount + subjectsCount + gradeLevelsCount
        };
    },

    /**
     * Clear all local workspace data
     */
    async clearAllData() {
        await db.transaction('rw', [
            db.sections,
            db.students,
            db.periods,
            db.exams,
            db.scanResults,
            db.subjects,
            db.gradeLevels
        ], async () => {
            await Promise.all([
                db.sections.clear(),
                db.students.clear(),
                db.periods.clear(),
                db.exams.clear(),
                db.scanResults.clear(),
                db.subjects.clear(),
                db.gradeLevels.clear()
            ]);
        });
    }
};

