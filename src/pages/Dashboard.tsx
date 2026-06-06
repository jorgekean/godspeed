import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Period } from '../services/db';
import { Plus, ChevronRight, FileText, X, HelpCircle, Printer, Edit3, BarChart3, ChevronDown } from 'lucide-react';
import { OMRTemplateGenerator } from '../components/omr/OMRTemplate';

export default function Dashboard() {
    const navigate = useNavigate();
    
    // 1. Fetch Periods
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted).sortBy('startDate'));
    
    // 2. State for Filter
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

    // 3. Helper: Robust selection logic
    const bestPeriodId = useMemo(() => {
        if (!periods || periods.length === 0) return 'all';
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

        return 'all';
    }, [periods]);

    // 4. Auto-set filter to best period on load
    useEffect(() => {
        if (periods && periods.length > 0 && selectedPeriod === 'all') {
            setSelectedPeriod(bestPeriodId);
        }
    }, [periods, bestPeriodId, selectedPeriod]);

    // 5. Reactive Exam Fetching with Filter
    const exams = useLiveQuery(
        () => {
            if (selectedPeriod !== 'all') {
                return db.exams.where('periodId').equals(selectedPeriod).filter(e => !e.isDeleted).reverse().toArray();
            }
            return db.exams.filter(e => !e.isDeleted).reverse().sortBy('createdAt');
        },
        [selectedPeriod]
    );

    // 6. Lazy load from localStorage
    const [showTemplates, setShowTemplates] = useState(() => {
        const saved = localStorage.getItem('godspeed_dashboard_templates');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('godspeed_dashboard_templates', JSON.stringify(showTemplates));
    }, [showTemplates]);

    const activePeriodName = selectedPeriod === 'all' ? 'All Periods' : periods?.find(p => p.id === selectedPeriod)?.name;

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">

                {/* PRIMARY ACTIONS */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/create')}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Exam</span>
                    </button>

                    <button
                        onClick={() => navigate('/help')}
                        className="px-6 flex items-center justify-center rounded-2xl border bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-500 shadow-sm hover:text-violet-600 active:scale-95 transition-all"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub Actions (Templates) */}
                <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border active:scale-95 transition-all text-xs font-bold uppercase tracking-wider ${showTemplates ? 'bg-slate-200 dark:bg-slate-800 border-transparent text-slate-900 dark:text-white' : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-500 shadow-sm hover:text-violet-600'}`}
                >
                    <Printer className="w-4 h-4" />
                    {showTemplates ? 'Hide Bubble Sheet Templates' : 'Print Bubble Sheet Templates'}
                </button>

                {/* Templates Dropdown Card */}
                {showTemplates && (
                    <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[24px] shadow-sm border border-slate-200/50 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-200 z-10 overflow-hidden">
                        <button
                            onClick={() => setShowTemplates(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <OMRTemplateGenerator />
                    </div>
                )}

                <div className="h-2" /> {/* Spacing */}

                {/* EXAM LIST SECTION WITH INTEGRATED FILTER */}
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText className="w-3 h-3" />
                            {activePeriodName} • {exams?.length || 0} Exams
                        </h3>

                        {/* Period Dropdown */}
                        <div className="relative group w-full md:w-64">
                            <select
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                className="w-full bg-slate-200/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer pr-10"
                            >
                                <option value="all">📁 All Periods</option>
                                {periods?.map(p => {
                                    const now = Date.now();
                                    const isCurrent = now >= p.startDate && now <= p.endDate;
                                    return (
                                        <option key={p.id} value={p.id}>
                                            {isCurrent ? '⭐ ' : '📅 '} {p.name} {isCurrent ? '(Current)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                                <ChevronDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Exam List */}
                    {exams?.length === 0 && (
                        <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No exams found for this period.</p>
                            <button onClick={() => navigate('/create')} className="mt-4 text-xs font-bold text-violet-600 uppercase tracking-wider hover:underline">Create your first exam</button>
                        </div>
                    )}

                    {exams?.map((exam) => (
                        <div
                            key={exam.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group hover:ring-2 hover:ring-violet-500/10 transition-all"
                        >
                            <button
                                onClick={() => navigate(`/scan/${exam.id}`)}
                                className="flex-1 flex items-center gap-4 text-left active:scale-95 transition-transform"
                            >
                                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-xl group-hover:bg-violet-100 transition-colors">
                                    <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">{exam.title}</h3>
                                    <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                        {exam.gradeLevel} • {exam.subject} • {exam.itemCount} Items
                                    </p>
                                </div>
                            </button>

                            <div className="flex items-center gap-1 ml-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/edit/${exam.id}`);
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                    title="Edit Exam"
                                >
                                    <Edit3 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/exams/${exam.id}/results`);
                                    }}
                                    className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                    title="View Results"
                                >
                                    <BarChart3 className="w-5 h-5" />
                                </button>
                                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 ml-1" />
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}