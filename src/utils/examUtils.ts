import { db } from '../services/db';

/**
 * Generates the next 4-digit exam code for a user by incrementing the highest existing one.
 * Defaults to "0001" if no exams exist.
 * 
 * @param userEmail - The email of the current user
 * @returns A 4-digit string (e.g., "0005")
 */
export async function getNextExamCode(userEmail: string): Promise<string> {
    const userExams = await db.exams
        .filter(e => e.createdBy === userEmail && !e.isDeleted)
        .toArray();

    if (userExams.length === 0) {
        return '0001';
    }

    const codes = userExams
        .map(e => parseInt(e.examCode || '0', 10))
        .filter(c => !isNaN(c));

    if (codes.length === 0) {
        return '0001';
    }

    const maxCode = Math.max(...codes);
    return (maxCode + 1).toString().padStart(4, '0');
}

/**
 * Checks if an exam code already exists for a user.
 * 
 * @param userEmail - The email of the current user
 * @param examCode - The code to check
 * @param excludeExamId - Optional ID to exclude (useful during editing)
 * @returns True if duplicate exists, false otherwise
 */
export async function isExamCodeDuplicate(
    userEmail: string, 
    examCode: string, 
    excludeExamId?: string
): Promise<boolean> {
    const existing = await db.exams
        .filter(e => 
            e.createdBy === userEmail && 
            e.examCode === examCode && 
            !e.isDeleted &&
            (excludeExamId ? e.id !== excludeExamId : true)
        )
        .first();
    
    return !!existing;
}
