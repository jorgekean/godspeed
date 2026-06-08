import { useState, useEffect, useCallback } from 'react';
import { db, type AcademicTerm, DEMO_USER_ID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useTerms() {
    const { currentUser } = useAuth();
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTerms = useCallback(async () => {
        setIsLoading(true);
        try {
            const userEmail = currentUser?.email || DEMO_USER_ID;
            const data = await db.terms.filter(t => t.createdBy === userEmail).toArray();
            setTerms(data);
        } catch (error) {
            console.error("Failed to fetch academic terms", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    return {
        terms,
        isLoading,
        refresh: fetchTerms,
        // Exposing service methods
        create: async (data: any) => db.terms.add({
            ...data,
            createdBy: currentUser?.email || DEMO_USER_ID
        }),
        update: async (id: string, data: any) => db.terms.update(id, data),
        remove: async (id: string) => db.terms.delete(id),
        getById: async (id: string) => db.terms.get(id)
    };
}