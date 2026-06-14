import { useState, useEffect, useCallback } from 'react';
import { db, type Subject } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useSubjects() {
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const userEmail = currentUser?.email!;
            const data = await db.subjects
                .filter(s => s.createdBy === userEmail && !s.isDeleted)
                .sortBy('sortOrder');
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return {
        subjects,
        isLoading,
        refresh: fetchSubjects,
        getById: async (id: string) => db.subjects.get(id),
        create: async (data: any) => db.subjects.add({
            ...data,
            createdBy: currentUser?.email!
        }),
        update: async (id: string, data: any) => db.subjects.update(id, data),
        remove: async (id: string) => db.subjects.delete(id)
    };
}