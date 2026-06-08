import { useState, useEffect, useCallback } from 'react';
import { db, type Section } from '../services/db';

export function useSections() {
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await db.sections.toArray();
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch Sections", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    return {
        sections,
        isLoading,
        refresh: fetchSections,
        // Exposing service methods
        create: async (data: any) => db.sections.add(data),
        update: async (id: string, data: any) => db.sections.update(id, data),
        remove: async (id: string) => db.sections.delete(id),
        getById: async (id: string) => db.sections.get(id)
    };
}