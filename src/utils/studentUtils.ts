/**
 * Robust comparison function to sort students.
 * - Compares studentNo:
 *   - If both are numeric, sorts numerically.
 *   - Otherwise, sorts using natural alphanumeric sorting.
 * - If one has studentNo and the other doesn't, studentNo comes first.
 * - If neither has studentNo, sorts by fullName.
 */
export const sortStudents = (
    a: { studentNo?: string; fullName?: string },
    b: { studentNo?: string; fullName?: string }
): number => {
    const noA = a.studentNo || '';
    const noB = b.studentNo || '';

    if (noA && noB) {
        const numA = Number(noA);
        const numB = Number(noB);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return noA.localeCompare(noB, undefined, { numeric: true, sensitivity: 'base' });
    }

    if (noA && !noB) return -1;
    if (!noA && noB) return 1;

    return (a.fullName || '').localeCompare(b.fullName || '', undefined, { sensitivity: 'base' });
};
