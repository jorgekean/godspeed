import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useStudentPerformance(studentId: string, termId: string) {
    const { currentUser } = useAuth();
    const [performances, setPerformances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const calculateAllSubjects = useCallback(async () => {
        if (!studentId || !termId) return;
        setIsLoading(true);

        try {
            const userEmail = currentUser?.email!;
            const student = await db.students.get(studentId);
            if (!student || student.createdBy !== userEmail) return;

            const section = await db.sections.get(student.sectionId);
            if (!section || section.createdBy !== userEmail) return;

            // Get all subjects for the student's grade level
            const gradeLevelNum = parseInt(section.gradeLevel.replace(/\D/g, ''));
            const allSubjects = await db.subjects
                .where({ gradeLevel: gradeLevelNum })
                .filter(s => s.createdBy === userEmail)
                .toArray();

            const results = await Promise.all(allSubjects.map(async (subject) => {
                // Fetch exams for THIS subject and THIS period
                const exams = await db.exams
                    .where({ subject: subject.title, periodId: termId })
                    .filter(e => e.createdBy === userEmail)
                    .toArray();

                const examIds = exams.map(e => e.id);
                const scanResults = await db.scanResults
                    .where('examId')
                    .anyOf(examIds)
                    .filter(r => r.studentId === studentId && r.createdBy === userEmail)
                    .toArray();

                // Use our Math Logic
                const getCatScore = (cat: 'WW' | 'PT' | 'QA', weight: number) => {
                    const catExams = exams.filter((e: any) => e.category === cat);
                    const totalMax = catExams.reduce((sum, e: any) => sum + (e.maxScore || e.itemCount), 0);
                    const totalRaw = scanResults
                        .filter(r => catExams.find(e => e.id === r.examId))
                        .reduce((sum, r) => sum + r.score, 0);

                    return totalMax > 0 ? (totalRaw / totalMax) * weight * 100 : 0;
                };

                const ww = getCatScore('WW', subject.wwWeight);
                const pt = getCatScore('PT', subject.ptWeight);
                const qa = getCatScore('QA', subject.qaWeight);
                const final = ww + pt + qa;

                return {
                    subject,
                    scores: { ww, pt, qa },
                    finalGrade: final
                };
            }));

            setPerformances(results);
        } finally {
            setIsLoading(false);
        }
    }, [studentId, termId, currentUser]);

    useEffect(() => { calculateAllSubjects(); }, [calculateAllSubjects]);

    return { performances, isLoading, refresh: calculateAllSubjects };
}