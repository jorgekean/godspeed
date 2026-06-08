import { db, DEMO_USER_ID } from './db';

let isSeeding = false;

export const seedDatabase = async () => {
    if (isSeeding) return; // Prevent concurrent seeding

    // 1. Check if we already have data to prevent duplicates
    const termCount = await db.periods.count();
    const subjectCount = await db.subjects.count();
    const studentCount = await db.students.count();

    if (termCount > 0 && subjectCount > 0 && studentCount > 0) {
        console.log('Database already has data. Skipping seed.');
        return;
    }

    isSeeding = true; // Set the lock

    console.log('Seeding initial data for GRID...');
    const now = Date.now();

    try {
        // 2. Seed Academic Terms (2025-2026)
        const termIds = {
            q1: crypto.randomUUID(),
            q2: crypto.randomUUID(),
            q3: crypto.randomUUID(),
            q4: crypto.randomUUID(),
        };

        await db.periods.bulkAdd([
            {
                id: termIds.q1,
                name: '1st Quarter',
                startDate: new Date('2025-08-01').getTime(),
                endDate: new Date('2025-10-15').getTime(),
                createdAt: now,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: termIds.q2,
                name: '2nd Quarter',
                startDate: new Date('2025-10-20').getTime(),
                endDate: new Date('2025-12-20').getTime(),
                createdAt: now,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: termIds.q3,
                name: '3rd Quarter',
                startDate: new Date('2026-01-05').getTime(),
                endDate: new Date('2026-03-20').getTime(),
                createdAt: now,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: termIds.q4,
                name: '4th Quarter',
                startDate: new Date('2026-03-25').getTime(),
                endDate: new Date('2026-06-05').getTime(),
                createdAt: now,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
        ]);

        // 3. Seed Sections
        const sectionIds = {
            einstein: crypto.randomUUID(),
            newton: crypto.randomUUID(),
            curie: crypto.randomUUID(),
        };

        await db.sections.bulkAdd([
            { id: sectionIds.einstein, gradeLevel: "Grade 7", sectionName: "Einstein", createdAt: now, createdBy: DEMO_USER_ID, updatedAt: now, isSynced: true, isDeleted: false },
            { id: sectionIds.newton, gradeLevel: "Grade 7", sectionName: "Newton", createdAt: now, createdBy: DEMO_USER_ID, updatedAt: now, isSynced: true, isDeleted: false },
            { id: sectionIds.curie, gradeLevel: "Grade 8", sectionName: "Curie", createdAt: now, createdBy: DEMO_USER_ID, updatedAt: now, isSynced: true, isDeleted: false }
        ]);

        // 4. Seed Subjects with standard K-12 Weighting
        await db.subjects.bulkAdd([
            {
                id: crypto.randomUUID(),
                code: 'MATH-7',
                title: 'General Mathematics',
                gradeLevel: 7,
                wwWeight: 0.3, // 30%
                ptWeight: 0.5, // 50%
                qaWeight: 0.2, // 20%
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: crypto.randomUUID(),
                code: 'SCI-7',
                title: 'Integrated Science',
                gradeLevel: 7,
                wwWeight: 0.3,
                ptWeight: 0.5,
                qaWeight: 0.2,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: crypto.randomUUID(),
                code: 'ENG-7',
                title: 'English & Literature',
                gradeLevel: 7,
                wwWeight: 0.3,
                ptWeight: 0.5,
                qaWeight: 0.2,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: crypto.randomUUID(),
                code: 'MAPEH-7',
                title: 'Music, Arts, PE & Health',
                gradeLevel: 7,
                wwWeight: 0.2, // 20% (Performance heavy)
                ptWeight: 0.6, // 60%
                qaWeight: 0.2, // 20%
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
            {
                id: crypto.randomUUID(),
                code: 'TLE-7',
                title: 'Technology & Livelihood Education',
                gradeLevel: 7,
                wwWeight: 0.2,
                ptWeight: 0.6,
                qaWeight: 0.2,
                createdBy: DEMO_USER_ID,
                updatedAt: now,
                isSynced: true,
                isDeleted: false
            },
        ]);

        // 5. Seed Student Roster
        if (studentCount === 0) {
            const testStudents = [
                { name: 'Juan Dela Cruz', section: 'Einstein', lrn: '102938475601', sectionId: sectionIds.einstein },
                { name: 'Maria Clara Santos', section: 'Einstein', lrn: '102938475602', sectionId: sectionIds.einstein },
                { name: 'Jose Rizalito', section: 'Einstein', lrn: '102938475603', sectionId: sectionIds.einstein },
                { name: 'Andres Bonifacio Jr.', section: 'Newton', lrn: '202938475604', sectionId: sectionIds.newton },
                { name: 'Gabriela Silang-Reyes', section: 'Newton', lrn: '202938475605', sectionId: sectionIds.newton },
                { name: 'Melchora Aquino', section: 'Newton', lrn: '202938475606', sectionId: sectionIds.newton },
                { name: 'Emilio Aguinaldo V', section: 'Curie', lrn: '302938475607', sectionId: sectionIds.curie },
                { name: 'Leonor Rivera', section: 'Curie', lrn: '302938475608', sectionId: sectionIds.curie },
                { name: 'Apolinario Mabini', section: 'Curie', lrn: '302938475609', sectionId: sectionIds.curie },
                { name: 'Cory Aquino-Zuzuarregui', section: 'Einstein', lrn: '102938475610', sectionId: sectionIds.einstein },
            ];

            await db.students.bulkAdd(
                testStudents.map((s) => ({
                    id: crypto.randomUUID(),
                    studentNo: s.lrn,
                    fullName: s.name,
                    sectionId: s.sectionId,
                    createdBy: DEMO_USER_ID,
                    updatedAt: now,
                    isSynced: true,
                    isDeleted: false
                }))
            );
        }


        console.log('Seed complete.');
    } finally {
        isSeeding = false; // Release the lock
    }

};