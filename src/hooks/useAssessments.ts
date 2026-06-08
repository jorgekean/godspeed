import { useState, useEffect, useCallback } from 'react';
import { db, type Assessment, DEMO_USER_ID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useAssessments(subjectId?: string, termId?: string) {
    const { currentUser } = useAuth();
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const userEmail = currentUser?.email || DEMO_USER_ID;
            // Note: Exam has 'subject' (string) and 'periodId'. 
            // If subjectId/termId are passed, we filter.
            let query: any = db.assessments.filter(a => a.createdBy === userEmail);
            
            if (subjectId && termId) {
                // Assuming subjectId is the subject name or code for now
                query = query.filter((a: any) => a.subject === subjectId && a.periodId === termId);
            }
            
            const data = await query.toArray();
            setAssessments(data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [subjectId, termId, currentUser]);

    useEffect(() => { refresh(); }, [refresh]);

    // Mocking service methods that might be expected
    const mockService = {
        create: async (data: any) => db.assessments.add({
            ...data,
            createdBy: currentUser?.email || DEMO_USER_ID
        }),
        update: async (id: string, data: any) => db.assessments.update(id, data),
        delete: async (id: string) => db.assessments.delete(id)
    };

    return { assessments, isLoading, refresh, ...mockService };
}