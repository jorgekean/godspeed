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
                        href="https://www.facebook.com/godspeedgrader"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                        title="Follow us on Facebook"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                    </a>

                    {/* Reddit Link */}
                    <a
                        href="https://www.reddit.com/r/GodspeedGrader/s/qbldJCdwXz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all"
                        title="Follow us on Reddit"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22 11.516c0-1.229-.999-2.228-2.228-2.228-.654 0-1.242.28-1.658.726-1.611-1.056-3.79-1.714-6.195-1.782l1.281-3.993 3.42.726c.012 1.073.888 1.936 1.967 1.936 1.086 0 1.968-.882 1.968-1.968S19.673 3 18.587 3c-.767 0-1.433.435-1.761 1.071l-3.805-.808c-.144-.03-.292.042-.348.175l-1.433 4.466c-2.463.036-4.695.702-6.335 1.782-.416-.446-1.004-.726-1.658-.726-1.229 0-2.228.999-2.228 2.228 0 .817.439 1.536 1.104 1.921-.024.216-.036.436-.036.657 0 3.86 4.793 6.993 10.697 6.993 5.903 0 10.696-3.133 10.696-6.993 0-.221-.012-.441-.036-.657.665-.385 1.104-1.104 1.104-1.921zm-14.739 1.542c0-.853.693-1.546 1.546-1.546.853 0 1.546.693 1.546 1.546 0 .853-.693 1.546-1.546 1.546-.853 0-1.546-.693-1.546-1.546zm8.625 4.542c-1.189 1.189-3.232 1.258-4.148 1.258s-2.96-.069-4.148-1.258c-.183-.183-.183-.48 0-.663.183-.183.48-.183.663 0 1.001 1.001 2.585 1.018 3.485 1.018s2.485-.018 3.485-1.018c.183-.183.48-.183.663 0 .183.183.183.48 0 .663zm-1.079-2.996c-.853 0-1.546-.693-1.546-1.546 0-.853.693-1.546 1.546-1.546.853 0 1.546.693 1.546 1.546 0 .853-.693 1.546-1.546 1.546z" />
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
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2-1.74 2.89 2.89 0 0 1 2.89-2.89 2.88 2.88 0 0 1 1.54.45V8.1a6.32 6.32 0 0 0-1.54-.19 6.34 6.34 0 0 0 0 12.68 6.34 6.34 0 0 0 6.34-6.34V8.15a8.26 8.26 0 0 0 4.77 1.52V6.22a4.84 4.84 0 0 1-1.58.47z" />
                        </svg>
                    </a>

                </div>
            </main>
        </div>
    );
}