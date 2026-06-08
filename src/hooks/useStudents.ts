import { useState, useEffect, useCallback } from 'react';
import { db, type Student, DEMO_USER_ID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useStudents() {
    const { currentUser } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const userEmail = currentUser?.email || DEMO_USER_ID;
            const data = await db.students.filter(s => s.createdBy === userEmail).toArray();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch student roster", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return {
        students,
        isLoading,
        refresh: fetchStudents,
        getById: async (id: string) => db.students.get(id),
        update: async (id: string, data: any) => db.students.update(id, data),
        create: async (data: any) => db.students.add({
            ...data,
            createdBy: currentUser?.email || DEMO_USER_ID
        })
    };
}