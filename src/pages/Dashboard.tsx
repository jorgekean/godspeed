import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, ChevronRight, FileText, Zap, Printer, X, HelpCircle, Share2, Music2 } from 'lucide-react';
import { OMRTemplateGenerator } from '../components/omr/OMRTemplate';

export default function Dashboard() {
    const navigate = useNavigate();
    const exams = useLiveQuery(() => db.exams.orderBy('createdAt').reverse().toArray());

    // 1. Lazy load from localStorage, defaulting to true (open) if null
    const [showTemplates, setShowTemplates] = useState(() => {
        const saved = localStorage.getItem('godspeed_dashboard_templates');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // 2. Sync to localStorage whenever the state changes
    useEffect(() => {
        localStorage.setItem('godspeed_dashboard_templates', JSON.stringify(showTemplates));
    }, [showTemplates]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans selection:bg-violet-500/30 pb-safe">
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            GodSpeed <span className="font-normal text-slate-400">Grader</span>
                        </h1>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5"> Awaken your camera's potential. Grade exams in a flash.</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                        <Zap className="w-6 h-6 text-white fill-white/20" />
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">

                {/* Action Buttons Row */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/create')}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-violet-600 hover:bg-violet-500 rounded-2xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Create Exam</span>
                    </button>

                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={`px-5 flex items-center justify-center rounded-2xl border active:scale-95 transition-all ${showTemplates ? 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-900 dark:text-white' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 shadow-sm hover:text-violet-600'}`}
                    >
                        <Printer className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => navigate('/help')}
                        className="px-5 flex items-center justify-center rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 shadow-sm hover:text-violet-600 active:scale-95 transition-all"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Templates Dropdown Card */}
                {showTemplates && (
                    <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-200 z-10 mt-2 overflow-hidden">

                        {/* 3. The Close Button (absolute positioned above the generator) */}
                        <button
                            onClick={() => setShowTemplates(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <OMRTemplateGenerator />
                    </div>
                )}

                {/* Exam List */}
                <div className="flex flex-col gap-3 mt-2">
                    {exams?.length === 0 && (
                        <p className="text-center text-slate-500 dark:text-slate-400 mt-8 text-sm">No exams created yet. Tap above to create one.</p>
                    )}

                    {exams?.map((exam) => (
                        <button
                            key={exam.id}
                            onClick={() => navigate(`/scan/${exam.id}`)}
                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 active:scale-95 transition-all group shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl">
                                    <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-0.5">{exam.title}</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400">
                                        {exam.itemCount} Items • {new Date(exam.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" />
                        </button>
                    ))}
                </div>

                {/* Social Links Footer */}
                <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-slate-200/50 dark:border-white/5">

                    {/* Facebook Link */}
                    <a
                        href="https://www.facebook.com/profile.php?id=61590027737593"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                        title="Follow us on Facebook"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                    </a>

                    {/* TikTok Link */}
                    <a
                        href="https://www.tiktok.com/@godspeedgrader"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        title="Follow us on TikTok"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2-1.74 2.89 2.89 0 0 1 2.89-2.89 2.88 2.88 0 0 1 1.54.45V8.1a6.32 6.32 0 0 0-1.54-.19 6.34 6.34 0 0 0 0 12.68 6.34 6.34 0 0 0 6.34-6.34V8.15a8.26 8.26 0 0 0 4.77 1.52V6.22a4.84 4.84 0 0 1-1.58.47z" />
                        </svg>
                    </a>
                </div>
            </main>
        </div>
    );
}