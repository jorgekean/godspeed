import Dexie, { type Table } from 'dexie';

export interface Exam {
    id?: number;
    title: string;
    itemCount: number;
    answerKey: string;
    createdAt: number;
}

export class GodspeedDatabase extends Dexie {
    exams!: Table<Exam>;

    constructor() {
        super('GodspeedGraderDB');

        // Schema versioning
        this.version(1).stores({
            // ++id means auto-increment. We also index title and createdAt for fast sorting.
            exams: '++id, title, createdAt'
        });

        this.on('populate', async (transaction) => {
            console.log('Godspeed: Initializing database with Jorge\'s seed data...');
            // Optional: Add a demo exam so the dashboard isn't completely empty on first load
            await transaction.table('exams').add({
                title: 'Demo Exam (Biology)',
                itemCount: 20,
                answerKey: 'AABCCDEDBAAABCCDEDBA',
                createdAt: Date.now()
            });
        });
    }
}

export const db = new GodspeedDatabase();