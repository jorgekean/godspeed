import { useState, useEffect, useCallback } from 'react';
import { db, type Subject } from '../services/db';

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await db.subjects.toArray();
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return {
        subjects,
        isLoading,
        refresh: fetchSubjects,
        getById: async (id: string) => db.subjects.get(id),
        create: async (data: any) => db.subjects.add(data),
        update: async (id: string, data: any) => db.subjects.update(id, data),
        remove: async (id: string) => db.subjects.delete(id)
    };
}