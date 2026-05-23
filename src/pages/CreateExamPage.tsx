import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { db } from '../services/db';
import { RapidKeyEditor } from '../components/omr/RapidKeyEditor';

export default function CreateExam() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [answerKey, setAnswerKey] = useState('');

    const handleSave = async () => {
        if (!isReady) return;

        await db.exams.add({
            title: title.trim(),
            itemCount: answerKey.length, // The length of the string IS the exam length!
            answerKey,
            createdAt: Date.now()
        });

        navigate('/');
    };

    // Ready as long as there is a title and at least 1 answer
    const isReady = title.trim().length > 0 && answerKey.length > 0;

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

                {/* Pass the updated props */}
                <RapidKeyEditor
                    answerKey={answerKey}
                    setAnswerKey={setAnswerKey}
                    onClose={() => navigate('/')}
                />

                <button
                    onClick={handleSave}
                    disabled={!isReady}
                    className={`mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                    <Save className="w-5 h-5" />
                    <span className="font-medium">Save Exam ({answerKey.length} Items)</span>
                </button>

            </main>
        </div>
    );
}