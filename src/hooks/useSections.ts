import { useState, useEffect, useCallback } from 'react';
import { db, type Section, DEMO_USER_ID } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export function useSections() {
    const { currentUser } = useAuth();
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        try {
            const userEmail = currentUser?.email || DEMO_USER_ID;
            const data = await db.sections.filter(s => s.createdBy === userEmail).toArray();
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch Sections", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    return {
        sections,
        isLoading,
        refresh: fetchSections,
        // Exposing service methods
        create: async (data: any) => db.sections.add({
            ...data,
            createdBy: currentUser?.email || DEMO_USER_ID
        }),
        update: async (id: string, data: any) => db.sections.update(id, data),
        remove: async (id: string) => db.sections.delete(id),
        getById: async (id: string) => db.sections.get(id)
    };
}