import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, ChevronRight, FileText, Zap } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();

    // Automatically fetches and updates whenever the DB changes!
    const exams = useLiveQuery(() => db.exams.orderBy('createdAt').reverse().toArray());

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans selection:bg-violet-500/30 pb-safe">
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            GodSpeed <span className="font-normal text-slate-400">Grader</span>
                        </h1>
                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">Select an exam to start grading.</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                        <Zap className="w-6 h-6 text-white fill-white/20" />
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">
                <button
                    onClick={() => navigate('/create')}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-violet-600 hover:bg-violet-500 rounded-2xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5 text-white" />
                    <span className="text-white font-medium">Create New Exam</span>
                </button>

                <div className="flex flex-col gap-3 mt-4">
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
            </main>
        </div>
    );
}