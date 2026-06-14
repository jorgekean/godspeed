import Dexie, { type Table } from 'dexie';

// 1. The Group 
export interface Section {
    id: string;
    gradeLevel: string;  // e.g., "Grade 9"
    sectionName: string; // e.g., "Rizal"
    createdAt: number;
    createdBy: string;
    updatedAt: number;    // NEW: For sync
    isSynced: boolean;    // NEW: For sync
    isDeleted: boolean;   // NEW: For sync
}

// 5. The Grading Period (NEW)
export interface Period {
    id: string;
    name: string;      // e.g., "1st Quarter", "2nd Quarter"
    startDate: number; // NEW
    endDate: number;   // NEW
    createdAt: number;
    createdBy: string;
    updatedAt: number;
    isSynced: boolean;
    isDeleted: boolean;
}

// 2. The Student 
export interface Student {
    id: string;
    sectionId: string;
    fullName: string;
    studentNo?: string;
    createdBy: string;
    updatedAt: number;    // NEW: For sync
    isSynced: boolean;    // NEW: For sync
    isDeleted: boolean;   // NEW: For sync
}

// 3. The Exam (Now scalable across multiple sections!)
export interface Exam {
    id: string;
    periodId?: string;   // NEW: Link to grading period
    gradeLevel: string;  // e.g., "Grade 9" (Matches Section.gradeLevel)
    subject: string;     // e.g., "Science"
    title: string;       // e.g., "Midterm Exam"
    examCode?: string;    // NEW: 4-digit OMR code
    category?: 'WW' | 'PT' | 'QA'; // NEW: For K-12 grading
    maxScore?: number;    // NEW: Overrides itemCount if set
    itemCount: number;
    answerKey: string;
    competencyMap?: Record<string, string>; // Maps "itemNumber" -> "Competency Name"
    createdAt: number;
    createdBy: string;
    updatedAt: number;    // NEW: For sync
    isSynced: boolean;    // NEW: For sync
    isDeleted: boolean;   // NEW: For sync
}

// 6. The Subject Registry (NEW)
export interface Subject {
    id: string;
    title: string;
    sortOrder: number;    // NEW: For preserving order
    createdBy: string;
    updatedAt: number;
    isSynced: boolean;
    isDeleted: boolean;
}

// 7. The Grade Levels Registry (NEW)
export interface GradeLevel {
    id: string;
    title: string;
    sortOrder: number;    // NEW: For preserving order
    createdBy: string;
    updatedAt: number;
    isSynced: boolean;
    isDeleted: boolean;
}

// ALIASES FOR BACKWARD COMPATIBILITY
export type Assessment = Exam;
export type Grade = ScanResult;
export type AcademicTerm = Period;

// 4. The Grades
export interface ScanResult {
    id: string;
    examId: string;
    studentId: string;
    sectionId: string;
    periodId?: string;   // NEW: For redundancy/quick filtering
    score: number;
    total: number;
    answers: Record<string, string>;
    scannedAt: number;
    createdBy: string;
    updatedAt: number;    // NEW: For sync
    isSynced: boolean;    // NEW: For sync
    isDeleted: boolean;   // NEW: For sync
}

export class GodspeedDatabase extends Dexie {
    sections!: Table<Section>;
    students!: Table<Student>;
    periods!: Table<Period>;
    exams!: Table<Exam>;
    scanResults!: Table<ScanResult>;
    subjects!: Table<Subject>;
    gradeLevels!: Table<GradeLevel>;

    // Legacy Aliases
    get assessments() { return this.exams; }
    get grades() { return this.scanResults; }
    get terms() { return this.periods; }

    constructor() {
        super('GodspeedGraderDBV2');

        // Schema versioning
        this.version(12).stores({
            sections: 'id, gradeLevel, sectionName, [gradeLevel+sectionName], createdAt, createdBy, isSynced, updatedAt',
            students: 'id, sectionId, fullName, studentNo, createdBy, isSynced, updatedAt',
            periods: 'id, name, createdBy, isSynced, updatedAt, createdAt, startDate',
            exams: 'id, periodId, gradeLevel, subject, createdAt, createdBy, isSynced, updatedAt',
            scanResults: 'id, examId, studentId, sectionId, periodId, [examId+studentId], scannedAt, createdBy, isSynced, updatedAt',
            subjects: 'id, title, sortOrder, createdBy, isSynced, updatedAt',
            gradeLevels: 'id, title, sortOrder, createdBy, isSynced, updatedAt'
        });

        // Add hooks for sync fields
        const addSyncHooks = (table: Table<any>) => {
            table.hook('creating', (_, obj) => {
                obj.updatedAt = Date.now();
                obj.isSynced = obj.isSynced ?? false;
                obj.isDeleted = obj.isDeleted ?? false;
            });
            table.hook('updating', (mods: any) => {
                const updatedMods: any = { ...mods, updatedAt: Date.now() };
                
                // Only mark as unsynced if the update is not explicitly marking it as synced (e.g. during a pull/push)
                if (mods.isSynced !== true) {
                    updatedMods.isSynced = false;
                }
                
                return updatedMods;
            });
        };

        this.on('ready', () => {
            addSyncHooks(this.sections);
            addSyncHooks(this.students);
            addSyncHooks(this.periods);
            addSyncHooks(this.exams);
            addSyncHooks(this.scanResults);
        });

        // ==========================================
        // 3. Initial Data Population (Runs only once!)
        // ==========================================
        this.on('populate', async () => {
            // No initial seeding required
        });
    }
}

export const db = new GodspeedDatabase();