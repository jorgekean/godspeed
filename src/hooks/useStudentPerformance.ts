import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';

export function useStudentPerformance(studentId: string, termId: string) {
    const [performances, setPerformances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const calculateAllSubjects = useCallback(async () => {
        if (!studentId || !termId) return;
        setIsLoading(true);

        try {
            const student = await db.students.get(studentId);
            if (!student) return;

            const section = await db.sections.get(student.sectionId);
            if (!section) return;

            // Get all subjects for the student's grade level
            // section.gradeLevel is a string like "Grade 9", while Subject.gradeLevel is a number. 
            // We need to extract the number or update the comparison.
            const gradeLevelNum = parseInt(section.gradeLevel.replace(/\D/g, ''));
            const allSubjects = await db.subjects.where({ gradeLevel: gradeLevelNum }).toArray();

            const results = await Promise.all(allSubjects.map(async (subject) => {
                // Fetch exams for THIS subject and THIS period
                // Note: Exam.subject is currently a string (title), we might need to match by title or add subjectId to Exam.
                // For now, let's assume subject.title matches Exam.subject.
                const exams = await db.exams
                    .where({ subject: subject.title, periodId: termId })
                    .toArray();

                const examIds = exams.map(e => e.id);
                const scanResults = await db.scanResults
                    .where('examId')
                    .anyOf(examIds)
                    .and(r => r.studentId === studentId)
                    .toArray();

                // Use our Math Logic
                // Note: Exam currently doesn't have 'category' or 'maxScore'. 
                // We'll stub these or use defaults for now to satisfy types.
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
    }, [studentId, termId]);

    useEffect(() => { calculateAllSubjects(); }, [calculateAllSubjects]);

    return { performances, isLoading, refresh: calculateAllSubjects };
}