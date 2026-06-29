import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Tag, ChevronDown, ChevronUp, X, CalendarDays, Check, Info, Folder } from 'lucide-react';
import { db } from '../services/db';
import { AnswerKeyManager } from '../components/omr/AnswerKeyManager';
import { useAuth } from '../contexts/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { getNextExamCode, isExamCodeDuplicate } from '../utils/examUtils';
import { toast } from 'sonner';

export default function CreateExam() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const userEmail = currentUser?.email!;
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted && p.createdBy === userEmail).sortBy('createdAt'), [userEmail]);
    const storedSubjects = useLiveQuery(() => db.subjects
        .filter(s => s.createdBy === userEmail && !s.isDeleted)
        .sortBy('title'), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels
        .filter(g => g.createdBy === userEmail && !g.isDeleted)
        .sortBy('title'), [userEmail]);

    const activeSubjects = storedSubjects || [];
    const activeGradeLevels = storedGradeLevels || [];
    const sortedPeriods = periods ? [...periods].reverse() : [];

    // States
    const [title, setTitle] = useState('');
    const [examCode, setExamCode] = useState('0001');
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');
    const [periodId, setPeriodId] = useState(() => localStorage.getItem('last_used_period_id') || '');
    const [answerKey, setAnswerKey] = useState(' '.repeat(20));

    // Auto-generate exam code
    useEffect(() => {
        const generateCode = async () => {
            const nextCode = await getNextExamCode(userEmail);
            setExamCode(nextCode);
        };
        generateCode();
    }, [userEmail]);

    // Custom entry states
    const [customGrade, setCustomGrade] = useState('');
    const [customSubject, setCustomSubject] = useState('');

    // Period Creation Modal State
    const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
    const [newPeriodName, setNewPeriodName] = useState('');

    // Competency States
    const [competencyList, setCompetencyList] = useState<string[]>([]);
    const [competencyMap, setCompetencyMap] = useState<Record<string, string>>({});

    // Helper: Robust selection logic (newest created)
    const bestPeriodId = useMemo(() => {
        if (!periods || periods.length === 0) return '';
        const sorted = [...periods].sort((a, b) => b.createdAt - a.createdAt);
        return sorted[0].id;
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
        if (!newPeriodName.trim()) return;
        const id = crypto.randomUUID();
        await db.periods.add({
            id, name: newPeriodName.trim(),
            createdBy: userEmail, createdAt: Date.now(), updatedAt: Date.now(), isSynced: false, isDeleted: false
        });
        setPeriodId(id);
        localStorage.setItem('last_used_period_id', id);
        setIsPeriodModalOpen(false);
        setNewPeriodName('');
    };

    const handleSave = async () => {
        if (!isReady) return;

        // Validation: Check for duplicate exam code
        const isDuplicate = await isExamCodeDuplicate(userEmail, examCode);
        if (isDuplicate) {
            toast.error(`Exam Code "${examCode}" is already in use. Please use a unique 4-digit code.`);
            return;
        }

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

        localStorage.setItem('last_used_period_id', periodId);
        await db.exams.add({
            id: crypto.randomUUID(),
            title: title.trim(),
            examCode: examCode,
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
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-3 space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Exam Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Pop Quiz (Chapter 3)"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm font-bold"
                            />
                        </div>
                        <div className="space-y-2 relative group/tooltip">
                            <div className="flex items-center gap-1.5 ml-1">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Exam Code</label>
                                <button type="button" className="focus:outline-none" aria-label="Exam Code Info">
                                    <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
                                </button>
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block w-48 p-2 bg-slate-800 text-xs text-white rounded-lg shadow-lg text-center z-50 pointer-events-none">
                                Students will shade this 4-digit code on their answer sheets.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
                            </div>
                            <input
                                type="text"
                                value={examCode}
                                onChange={(e) => setExamCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                placeholder="0001"
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm font-mono font-bold text-center"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grade/Year Level</label>
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
                                        <option value="" disabled>Select Grade/Year Level</option>
                                        {activeGradeLevels.map(g => <option key={g.id} value={g.title}>{g.title}</option>)}
                                        <option value="CUSTOM" className="text-violet-600 font-bold">+ Add New Grade/Year Level...</option>
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
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grading Folder</label>
                        <div className="relative group">
                            <select
                                value={periodId}
                                onChange={(e) => {
                                    if (e.target.value === 'CUSTOM') { setIsPeriodModalOpen(true); } else { setPeriodId(e.target.value); }
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm appearance-none cursor-pointer font-bold"
                            >
                                <option value="">Select Folder</option>
                                {sortedPeriods.map(period => {
                                    return <option key={period.id} value={period.id}>📁 {period.name}</option>;
                                })}
                                <option value="CUSTOM" className="text-violet-600 font-bold">+ Add New Folder...</option>
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

            {/* Period Modal */}
            {isPeriodModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl"><Folder className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Folder</h2>
                            </div>
                            <button onClick={() => { setIsPeriodModalOpen(false); setPeriodId(''); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Folder Name</label>
                                <input type="text" value={newPeriodName} onChange={(e) => setNewPeriodName(e.target.value)} placeholder="e.g. 1st Quarter, 1st Period, 1st Sem" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all" autoFocus />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button onClick={() => { setIsPeriodModalOpen(false); setPeriodId(''); }} className="flex-1 py-4 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors">Cancel</button>
                            <button onClick={handleCreatePeriod} disabled={!newPeriodName.trim()} className="flex-1 py-4 font-bold bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-500/20 disabled:opacity-50 transition-all">Create Folder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
