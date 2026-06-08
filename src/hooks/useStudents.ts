import { useState, useEffect, useCallback } from 'react';
import { db, type Student } from '../services/db';

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await db.students.toArray();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch student roster", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return {
        students,
        isLoading,
        refresh: fetchStudents,
        getById: async (id: string) => db.students.get(id),
        update: async (id: string, data: any) => db.students.update(id, data)
    };
}