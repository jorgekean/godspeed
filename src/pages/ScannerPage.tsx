import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { OMRScanner } from '../components/omr/OMRScanner';

export default function ScannerPage() {
    const { examId } = useParams();
    const navigate = useNavigate();

    // Fetch the specific exam by ID
    const exam = useLiveQuery(() => db.exams.get(Number(examId)), [examId]);

    if (exam === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    if (exam === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
                <p>Exam not found.</p>
                <button onClick={() => navigate('/')} className="mt-4 text-violet-400 underline">Go Home</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans selection:bg-violet-500/30 pb-8 md:pb-12">

            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{exam.title}</h1>
                        <p className="text-[11px] font-medium text-slate-500">{exam.itemCount} Items</p>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-4">

                {/* Scanner Viewport */}
                <div className="relative w-full flex flex-col min-h-[650px] sm:min-h-[700px] bg-black rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/40 dark:shadow-violet-900/10 border-4 md:border-[6px] border-slate-200 dark:border-slate-900">

                    {/* Pass the answerKey array to your scanner component! */}
                    <OMRScanner
                        correctAnswers={exam.answerKey.split('')}
                    // itemCount={exam.itemCount}
                    />

                </div>

                <p className="text-center text-[11px] sm:text-[12px] text-slate-500 font-medium">
                    Processing locally on-device. No data leaves your hardware.
                </p>
            </main>
        </div>
    );
}