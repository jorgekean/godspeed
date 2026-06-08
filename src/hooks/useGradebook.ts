import { useState, useEffect, useCallback } from 'react';
import { db, type Student, type Assessment, type Grade } from '../services/db';

export function useGradebook(subjectId: string, sectionId: string, termId: string) {
    const [students, setStudents] = useState<Student[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!subjectId || !sectionId || !termId) return;
        setIsLoading(true);

        try {
            // 1. Fetch Students in the Section
            const studentData = await db.students.where({ sectionId }).toArray();

            // 2. Fetch Assessments for this Subject/Term
            // Note: Exam has 'subject' and 'periodId'. 
            const assessmentData = await db.exams
                .where({ subject: subjectId, periodId: termId })
                .toArray();

            console.log("Fetched Assessments:", assessmentData);
            // 3. Fetch all existing grades for these assessments
            const assessmentIds = assessmentData.map(a => a.id);
            const gradeData = await db.scanResults
                .where('examId')
                .anyOf(assessmentIds)
                .toArray();

            setStudents(studentData);
            setAssessments(assessmentData);
            setGrades(gradeData as any);
        } finally {
            setIsLoading(false);
        }
    }, [subjectId, sectionId, termId]);

    useEffect(() => { loadData(); }, [loadData]);

    const updateGrade = async (studentId: string, assessmentId: string, score: number) => {
        const id = `${studentId}-${assessmentId}`; // Consistent ID for bulkPut
        // ScanResult (Grade) needs more fields like sectionId, createdBy etc. 
        // We'll stub these for now.
        const student = students.find(s => s.id === studentId);
        await db.scanResults.put({ 
            id, 
            studentId, 
            examId: assessmentId, 
            score,
            total: 100, // stub
            answers: {},
            scannedAt: Date.now(),
            sectionId: student?.sectionId || sectionId,
            createdBy: student?.createdBy || 'system',
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        } as any);
        
        // Silently update local state for instant UI feedback
        setGrades(prev => {
            const filtered = prev.filter(g => g.id !== id);
            return [...filtered, { id, studentId, assessmentId, score } as any];
        });
    };

    return { students, assessments, grades, isLoading, updateGrade };
}