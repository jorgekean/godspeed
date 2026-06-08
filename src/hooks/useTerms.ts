import { useState, useEffect, useCallback } from 'react';
import { db, type AcademicTerm } from '../services/db';

export function useTerms() {
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTerms = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await db.terms.toArray();
            setTerms(data);
        } catch (error) {
            console.error("Failed to fetch academic terms", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    return {
        terms,
        isLoading,
        refresh: fetchTerms,
        // Exposing service methods
        create: async (data: any) => db.terms.add(data),
        update: async (id: string, data: any) => db.terms.update(id, data),
        remove: async (id: string) => db.terms.delete(id),
        getById: async (id: string) => db.terms.get(id)
    };
}