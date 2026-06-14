import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Tag, ChevronDown, ChevronUp, X, CalendarDays, Check } from 'lucide-react';
import { db } from '../services/db';
import { AnswerKeyManager } from '../components/omr/AnswerKeyManager';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';

export default function CreateExam() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    const userEmail = currentUser?.email!;
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted && p.createdBy === userEmail).sortBy('startDate'), [userEmail]);
    const storedSubjects = useLiveQuery(() => db.subjects
        .filter(s => s.createdBy === userEmail && !s.isDeleted)
        .sortBy('title'), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels
        .filter(g => g.createdBy === userEmail && !g.isDeleted)
        .sortBy('title'), [userEmail]);
    
    const activeSubjects = storedSubjects || [];
    const activeGradeLevels = storedGradeLevels || [];

    // States
    const [title, setTitle] = useState('');
    const [gradeLevel, setGradeLevel] = useState(''); 
    const [subject, setSubject] = useState('');       
    const [periodId, setPeriodId] = useState('');
    const [answerKey, setAnswerKey] = useState(' '.repeat(20));

    // Custom entry states
    const [customGrade, setCustomGrade] = useState('');
    const [customSubject, setCustomSubject] = useState('');

    // Period Creation Modal State
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState('');
    const [newPeriodStart, setNewPeriodStart] = useState('');
    const [newPeriodEnd, setNewPeriodEnd] = useState('');

    // Competency States
    const [competencyList, setCompetencyList] = useState<string[]>([]);
    const [competencyMap, setCompetencyMap] = useState<Record<string, string>>({});

    // Helper: Robust selection logic
    const bestPeriodId = useMemo(() => {
        if (!periods || periods.length === 0) return '';
        const now = Date.now();
        const ongoing = periods.find(p => now >= p.startDate && now <= p.endDate);
        if (ongoing) return ongoing.id;
        const upcoming = [...periods].filter(p => p.startDate > now).sort((a, b) => a.startDate - b.startDate);
        if (upcoming.length > 0) return upcoming[0].id;
        const past = [...periods].filter(p => p.endDate < now).sort((a, b) => b.endDate - a.endDate);
        if (past.length > 0) return past[0].id;
        return periods[0].id;
    }, [periods]);

    // Commit custom Grade Level
    const handleCommitGrade = async () => {
        if (!customGrade.trim()) return;
        const newTitle = customGrade.trim();
        const existing = activeGradeLevels.find(g => g.title.toLowerCase() === newTitle.toLowerCase());
        if (existing) {
            setGradeLevel(existing.title);
        } else {
            const id = crypto.randomUUID();
            await db.gradeLevels.add({
                id, title: newTitle, sortOrder: 0,
                createdBy: userEmail, updatedAt: Date.now(), isSynced: false, isDeleted: false
            });
            setGradeLevel(newTitle);
        }
        setCustomGrade('');
    };

    // Commit custom Subject
    const handleCommitSubject = async () => {
        if (!customSubject.trim()) return;
        const newTitle = customSubject.trim();
        const existing = activeSubjects.find(s => s.title.toLowerCase() === newTitle.toLowerCase());
        if (existing) {
            setSubject(existing.title);
        } else {
            const id = crypto.randomUUID();
            await db.subjects.add({
                id, title: newTitle, sortOrder: 0,
                createdBy: userEmail, updatedAt: Date.now(), isSynced: false, isDeleted: false
            });
            setSubject(newTitle);
        }
        setCustomSubject('');
    };

    const handleCreatePeriod = async () => {
        if (!newPeriodName.trim() || !newPeriodStart || !newPeriodEnd) return;
        const id = crypto.randomUUID();
        await db.periods.add({
            id, name: newPeriodName.trim(),
            startDate: new Date(newPeriodStart).getTime(),
            endDate: new Date(newPeriodEnd).getTime(),
            createdBy: userEmail, createdAt: Date.now(), updatedAt: Date.now(), isSynced: false, isDeleted: false
        });
        setPeriodId(id);
        setIsPeriodModalOpen(false);
        setNewPeriodName(''); setNewPeriodStart(''); setNewPeriodEnd('');
    };

    const handleSave = async () => {
        if (!isReady) return;

        let finalGradeLevel = gradeLevel;
        let finalSubject = subject;

        if (gradeLevel === 'CUSTOM' && customGrade.trim()) {
            const newTitle = customGrade.trim();
            await db.gradeLevels.add({
                id: crypto.randomUUID(), title: newTitle, sortOrder: 0,
                createdBy: userEmail, updatedAt: Date.now(), isSynced: false, isDeleted: false
            });
            finalGradeLevel = newTitle;
        }

        if (subject === 'CUSTOM' && customSubject.trim()) {
            const newTitle = customSubject.trim();
            await db.subjects.add({
                id: crypto.randomUUID(), title: newTitle, sortOrder: 0,
                createdBy: userEmail, updatedAt: Date.now(), isSynced: false, isDeleted: false
            });
            finalSubject = newTitle;
        }

        const cleanAnswerKey = answerKey.replace(/[\s,]/g, '').toUpperCase();

        await db.exams.add({
            id: crypto.randomUUID(),
            title: title.trim(),
            periodId: periodId,
            gradeLevel: finalGradeLevel,
            subject: finalSubject,
            createdBy: currentUser?.email!, 
            itemCount: cleanAnswerKey.length,
            answerKey: cleanAnswerKey,
            competencyMap: competencyMap,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        });

        navigate('/');
    };

    useEffect(() => {
        if (periods && periods.length > 0 && !periodId) {
            setPeriodId(bestPeriodId);
        }
    }, [periods, bestPeriodId, periodId]);

    const isReady = title.trim().length > 0 && 
                    (gradeLevel !== '' && (gradeLevel !== 'CUSTOM' || customGrade.trim() !== '')) && 
                    (subject !== '' && (subject !== 'CUSTOM' || customSubject.trim() !== '')) && 
                    periodId !== '' && 
                    answerKey.replace(/ /g, '').length > 0;

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

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Exam Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Pop Quiz (Chapter 3)"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grade Level</label>
                            {gradeLevel === 'CUSTOM' ? (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={customGrade}
                                            onChange={(e) => setCustomGrade(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommitGrade()}
                                            placeholder="Type level..."
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-violet-500 rounded-2xl pl-5 pr-12 py-4 text-slate-900 dark:text-white focus:outline-none shadow-sm font-bold"
                                            autoFocus
                                        />
                                        <button onClick={() => { setGradeLevel(''); setCustomGrade(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={handleCommitGrade} disabled={!customGrade.trim()} className="p-4 bg-violet-600 text-white rounded-2xl shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"><Check className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <select
                                        value={gradeLevel}
                                        onChange={(e) => setGradeLevel(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none cursor-pointer font-bold"
                                    >
                                        <option value="" disabled>Select Grade Level</option>
                                        {activeGradeLevels.map(g => <option key={g.id} value={g.title}>{g.title}</option>)}
                                        <option value="CUSTOM" className="text-violet-600 font-bold">+ Add New Grade Level...</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                            {subject === 'CUSTOM' ? (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={customSubject}
                                            onChange={(e) => setCustomSubject(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCommitSubject()}
                                            placeholder="Type subject..."
                                            className="w-full bg-white dark:bg-slate-900 border-2 border-violet-500 rounded-2xl pl-5 pr-12 py-4 text-slate-900 dark:text-white focus:outline-none shadow-sm font-bold"
                                            autoFocus
                                        />
                                        <button onClick={() => { setSubject(''); setCustomSubject(''); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                    </div>
                                    <button onClick={handleCommitSubject} disabled={!customSubject.trim()} className="p-4 bg-violet-600 text-white rounded-2xl shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"><Check className="w-5 h-5" /></button>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none cursor-pointer font-bold"
                                    >
                                        <option value="" disabled>Select Subject</option>
                                        {activeSubjects.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                                        <option value="CUSTOM" className="text-violet-600 font-bold">+ Add New Subject...</option>
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grading Period</label>
                        <div className="relative group">
                            <select
                                value={periodId}
                                onChange={(e) => {
                                    if (e.target.value === 'CUSTOM') { setIsPeriodModalOpen(true); } else { setPeriodId(e.target.value); }
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none cursor-pointer font-bold"
                            >
                                <option value="" disabled>Select Period</option>
                                {periods?.map(period => {
                                    const now = Date.now();
                                    const isCurrent = now >= period.startDate && now <= period.endDate;
                                    return <option key={period.id} value={period.id}>{period.name} {isCurrent ? '(Ongoing)' : ''}</option>;
                                })}
                                <option value="CUSTOM" className="text-violet-600 font-bold">+ Add New Period...</option>
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
                        </div>
                    </div>
                </div>

                <AnswerKeyManager
                    answerKey={answerKey}
                    setAnswerKey={setAnswerKey}
                    competencyMap={competencyMap}
                    setCompetencyMap={setCompetencyMap}
                    competencyList={competencyList}
                    setCompetencyList={setCompetencyList}
                />

                <button
                    onClick={handleSave}
                    disabled={!isReady}
                    className={`mt-4 flex items-center justify-center gap-2 p-5 rounded-2xl transition-all shadow-lg active:scale-95 font-bold ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                    <Save className="w-5 h-5" />
                    <span className="font-medium text-lg">Create Exam</span>
                </button>
            </main>

            {/* Period Modal remains same */}
            {isPeriodModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl"><CalendarDays className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Academic Term</h2>
                            </div>
                            <button onClick={() => { setIsPeriodModalOpen(false); setPeriodId(''); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Period Name</label>
                                <input type="text" value={newPeriodName} onChange={(e) => setNewPeriodName(e.target.value)} placeholder="e.g. 1st Quarter" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Start Date</label>
                                    <input type="date" value={newPeriodStart} onChange={(e) => setNewPeriodStart(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">End Date</label>
                                    <input type="date" value={newPeriodEnd} onChange={(e) => setNewPeriodEnd(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white focus:outline-none" />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button onClick={() => { setIsPeriodModalOpen(false); setPeriodId(''); }} className="flex-1 py-4 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">Cancel</button>
                            <button onClick={handleCreatePeriod} disabled={!newPeriodName.trim() || !newPeriodStart || !newPeriodEnd} className="flex-1 py-4 font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all">Create Period</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
