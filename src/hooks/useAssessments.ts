import { useState, useEffect, useCallback } from 'react';
import { db, type Assessment } from '../services/db';

export function useAssessments(subjectId?: string, termId?: string) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            // Note: Exam has 'subject' (string) and 'periodId'. 
            // If subjectId/termId are passed, we filter.
            let query: any = db.assessments;
            
            if (subjectId && termId) {
                // Assuming subjectId is the subject name or code for now
                query = query.where({ subject: subjectId, periodId: termId });
            }
            
            const data = await query.toArray();
            setAssessments(data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [subjectId, termId]);

    useEffect(() => { refresh(); }, [refresh]);

    // Mocking service methods that might be expected
    const mockService = {
        create: async (data: any) => db.assessments.add(data),
        update: async (id: string, data: any) => db.assessments.update(id, data),
        delete: async (id: string) => db.assessments.delete(id)
    };

    return { assessments, isLoading, refresh, ...mockService };
}