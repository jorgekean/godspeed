import Dexie, { type Table } from 'dexie';

// ------------------------------------------------------------------------
// DUMMY USER ID FOR DEMO RECORDS (Replace with actual Auth ID later)
// ------------------------------------------------------------------------
export const DEMO_USER_ID = "local-demo-user-12345";

// 1. The Group 
export interface Section {
    id: string;
    gradeLevel: string;  // e.g., "Grade 9"
    sectionName: string; // e.g., "Rizal"
    createdAt: number;
    createdBy: string;   // <-- NEW: For cloud sync filtering
}

// 2. The Student 
export interface Student {
    id: string;
    sectionId: string;
    fullName: string;
    studentNo?: string;
    createdBy: string;   // <-- NEW
}

// 3. The Exam (Now scalable across multiple sections!)
export interface Exam {
    id: string;
    gradeLevel: string;  // e.g., "Grade 9" (Matches Section.gradeLevel)
    subject: string;     // e.g., "Science"
    title: string;       // e.g., "Midterm Exam"
    itemCount: number;
    answerKey: string;
    createdAt: number;
    createdBy: string;   // <-- NEW
}

// 4. The Grades
export interface ScanResult {
    id: string;
    examId: string;
    studentId: string;
    score: number;
    total: number;
    answers: Record<string, string>;
    scannedAt: number;
    createdBy: string;   // <-- NEW
}

export class GodspeedDatabase extends Dexie {
    sections!: Table<Section>;
    students!: Table<Student>;
    exams!: Table<Exam>;
    scanResults!: Table<ScanResult>;

    constructor() {
        super('GodspeedGraderDBV2');

        // Schema versioning (Bumped to version 4 for the createdBy additions)
        this.version(1).stores({
            sections: 'id, gradeLevel, sectionName, [gradeLevel+sectionName], createdAt, createdBy',
            students: 'id, sectionId, fullName, studentNo, createdBy',
            exams: 'id, gradeLevel, subject, createdAt, createdBy',
            scanResults: 'id, examId, studentId, [examId+studentId], scannedAt, createdBy'
        });

        // ==========================================
        // 3. Initial Data Population (Runs only once!)
        // ==========================================
        this.on('populate', async () => {
            console.log("Populating database with initial demo records...");
            const now = Date.now();

            // Pre-generate UUIDs for sections so we can link students to them
            const rizalId = crypto.randomUUID();
            const bonifacioId = crypto.randomUUID();
            const mabiniId = crypto.randomUUID();

            // Insert Sections
            await this.sections.bulkAdd([
                { id: rizalId, gradeLevel: "Grade 9", sectionName: "Rizal", createdAt: now, createdBy: DEMO_USER_ID },
                { id: bonifacioId, gradeLevel: "Grade 9", sectionName: "Bonifacio", createdAt: now, createdBy: DEMO_USER_ID },
                { id: mabiniId, gradeLevel: "Grade 10", sectionName: "Mabini", createdAt: now, createdBy: DEMO_USER_ID }
            ]);

            // ==========================================
            // AUTO-GENERATE 30 STUDENTS FOR RIZAL
            // ==========================================
            const firstNames = ["Juan", "Maria", "Jose", "Ana", "Pedro", "Luisa", "Carlos", "Carmen", "Manuel", "Teresa", "Miguel", "Isabel", "Rafael", "Elena", "Fernando", "Rosa", "Ricardo", "Clara", "Eduardo", "Sofia", "Antonio", "Celia", "Francisco", "Lucia", "Jorge", "Beatriz", "Roberto", "Sylvia", "Luis", "Gloria"];
            const lastNames = ["Dela Cruz", "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Tomas", "Aquino", "Ramos", "Castro", "Rivera", "Gonzales", "Lopez", "Perez", "Rodriguez", "Gomez", "Fernandez", "Dominguez", "Mercado", "Navarro", "Guzman", "Sison", "Villanueva", "Velasco", "Sy", "Lim", "Tan"];

            const rizalStudents = Array.from({ length: 30 }).map((_, index) => {
                return {
                    id: crypto.randomUUID(),
                    sectionId: rizalId,
                    fullName: `${lastNames[index]}, ${firstNames[index]}`,
                    studentNo: `2026-${(index + 1).toString().padStart(4, '0')}`, // Generates 2026-0001 to 2026-0030
                    createdBy: DEMO_USER_ID
                };
            });

            // Insert the 30 Rizal Students + A few other students for other sections
            await this.students.bulkAdd([
                ...rizalStudents,

                // Grade 9 - Bonifacio Students
                { id: crypto.randomUUID(), sectionId: bonifacioId, fullName: "Magbanua, Teresa", studentNo: "2026-0031", createdBy: DEMO_USER_ID },
                { id: crypto.randomUUID(), sectionId: bonifacioId, fullName: "Silang, Gabriela", studentNo: "2026-0032", createdBy: DEMO_USER_ID },

                // Grade 10 - Mabini Students
                { id: crypto.randomUUID(), sectionId: mabiniId, fullName: "Luna, Antonio", studentNo: "2026-0033", createdBy: DEMO_USER_ID },
                { id: crypto.randomUUID(), sectionId: mabiniId, fullName: "Jacinto, Emilio", studentNo: "2026-0034", createdBy: DEMO_USER_ID }
            ]);

            // Insert Exams
            await this.exams.bulkAdd([
                {
                    id: crypto.randomUUID(),
                    gradeLevel: "Grade 9",
                    subject: "Science",
                    title: "DEMO - Midterm Exam",
                    itemCount: 20,
                    answerKey: "ABCDABCDABCDABCDABCD",
                    createdAt: now,
                    createdBy: DEMO_USER_ID
                },
                {
                    id: crypto.randomUUID(),
                    gradeLevel: "Grade 9",
                    subject: "Math",
                    title: "DEMO - Quiz 1 - Algebra",
                    itemCount: 10,
                    answerKey: "AABBCCDDAA",
                    createdAt: now - 86400000, // Yesterday
                    createdBy: DEMO_USER_ID
                },
                {
                    id: crypto.randomUUID(),
                    gradeLevel: "Grade 9",
                    subject: "English",
                    title: "DEMO - Final Exam",
                    itemCount: 50,
                    answerKey: "AAAAAAAAAABBBBBBBBBBCCCCCCCCCDDDDDDDDDAAAAAAAAAAAA",
                    createdAt: now,
                    createdBy: DEMO_USER_ID
                }
            ]);
        });
    }
}

export const db = new GodspeedDatabase();