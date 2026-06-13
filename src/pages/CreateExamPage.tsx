import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../services/db';
import { RapidKeyEditor } from '../components/omr/RapidKeyEditor';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';

// Standardized lists for dropdowns to keep data clean
const GRADE_LEVELS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SUBJECTS = ["Math", "Science", "English", "Filipino", "Araling Panlipunan", "MAPEH", "TLE", "Values Education", "Other"];

export default function CreateExam() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted).sortBy('startDate'));

    // States
    const [title, setTitle] = useState('');
    const [gradeLevel, setGradeLevel] = useState(''); 
    const [subject, setSubject] = useState('');       
    const [periodId, setPeriodId] = useState('');
    const [answerKey, setAnswerKey] = useState('');

    // Helper: Robust selection logic (shared with Dashboard)
    const bestPeriodId = useMemo(() => {
        if (!periods || periods.length === 0) return '';
        const now = Date.now();

        // 1. Try to find the ongoing one
        const ongoing = periods.find(p => now >= p.startDate && now <= p.endDate);
        if (ongoing) return ongoing.id;

        // 2. Try to find the NEXT closest upcoming period
        const upcoming = [...periods]
            .filter(p => p.startDate > now)
            .sort((a, b) => a.startDate - b.startDate);
        if (upcoming.length > 0) return upcoming[0].id;

        // 3. Fallback to the most RECENT past period
        const past = [...periods]
            .filter(p => p.endDate < now)
            .sort((a, b) => b.endDate - a.endDate);
        if (past.length > 0) return past[0].id;

        return periods[0].id;
    }, [periods]);

    // Default to best period based on date logic
    useEffect(() => {
        if (periods && periods.length > 0 && !periodId) {
            setPeriodId(bestPeriodId);
        }
    }, [periods, bestPeriodId, periodId]);

    const handleSave = async () => {
        if (!isReady) return;

        // BUG FIX: Strip out any accidental commas or spaces before saving
        const cleanAnswerKey = answerKey.replace(/[\s,]/g, '').toUpperCase();

        await db.exams.add({
            id: crypto.randomUUID(),
            title: title.trim(),
            periodId: periodId,
            gradeLevel: gradeLevel,
            subject: subject,
            createdBy: currentUser?.email!, 
            itemCount: cleanAnswerKey.length,
            answerKey: cleanAnswerKey,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        });

        navigate('/');
    };

    // Ready only if ALL fields are filled
    const isReady = title.trim().length > 0 && gradeLevel !== '' && subject !== '' && periodId !== '' && answerKey.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans">
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Create Exam</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

                {/* Main Details Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Exam Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Pop Quiz (Chapter 3)"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm"
                        />
                    </div>

                    {/* Grid for Grade Level and Subject Dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grade Level</label>
                            <select
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none"
                            >
                                <option value="" disabled>Select Grade Level</option>
                                {GRADE_LEVELS.map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none"
                            >
                                <option value="" disabled>Select Subject</option>
                                {SUBJECTS.map(subj => (
                                    <option key={subj} value={subj}>{subj}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Period Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grading Period</label>
                        <select
                            value={periodId}
                            onChange={(e) => setPeriodId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none"
                        >
                            <option value="" disabled>Select Period</option>
                            {periods?.map(period => {
                                const now = Date.now();
                                const isCurrent = now >= period.startDate && now <= period.endDate;
                                return (
                                    <option key={period.id} value={period.id}>
                                        {period.name} {isCurrent ? '(Ongoing)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {periods?.length === 0 && (
                            <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">No periods found. Please create one in Manage &gt; Periods.</p>
                        )}
                    </div>
                </div>

                {/* Answer Key Editor */}
                <RapidKeyEditor
                    answerKey={answerKey}
                    setAnswerKey={setAnswerKey}
                    onClose={() => navigate('/')}
                />

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!isReady}
                    className={`mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                    <Save className="w-5 h-5" />
                    <span className="font-medium">Save Exam ({answerKey.replace(/[\s,]/g, '').length} Items)</span>
                </button>

            </main>
        </div>
    );
}