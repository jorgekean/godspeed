import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db, DEMO_USER_ID } from '../services/db';
import { RapidKeyEditor } from '../components/omr/RapidKeyEditor';
import { useAuth } from '../contexts/AuthContext';

// Standardized lists for dropdowns to keep data clean
const GRADE_LEVELS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const SUBJECTS = ["Math", "Science", "English", "Filipino", "Araling Panlipunan", "MAPEH", "TLE", "Values Education", "Other"];

export default function CreateExam() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // States
    const [title, setTitle] = useState('');
    const [gradeLevel, setGradeLevel] = useState(''); // NEW
    const [subject, setSubject] = useState('');       // NEW
    const [answerKey, setAnswerKey] = useState('');

    const handleSave = async () => {
        if (!isReady) return;

        // BUG FIX: Strip out any accidental commas or spaces before saving
        const cleanAnswerKey = answerKey.replace(/[\s,]/g, '').toUpperCase();

        await db.exams.add({
            id: crypto.randomUUID(),
            title: title.trim(),
            gradeLevel: gradeLevel,
            subject: subject,
            createdBy: currentUser?.email || DEMO_USER_ID, // Use actual user ID if available
            itemCount: cleanAnswerKey.length,
            answerKey: cleanAnswerKey,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        });

        navigate('/dashboard');
    };

    // Ready only if ALL fields are filled
    const isReady = title.trim().length > 0 && gradeLevel !== '' && subject !== '' && answerKey.length > 0;

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans">
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
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

                    {/* NEW: Grid for Grade Level and Subject Dropdowns */}
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