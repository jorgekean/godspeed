import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Tag, ChevronDown, ChevronUp, CalendarDays, X, Check, Info } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { AnswerKeyManager } from '../components/omr/AnswerKeyManager';
import { useAuth } from '../contexts/AuthContext';
import { getNextExamCode, isExamCodeDuplicate } from '../utils/examUtils';
import { toast } from 'sonner';
import { useConfirm } from '../contexts/ConfirmContext';

export default function EditExam() {
    const navigate = useNavigate();
    const { examId } = useParams();
    const { currentUser } = useAuth();
    const confirm = useConfirm();

    // Fetch the existing exam
    const userEmail = currentUser?.email!;
    const exam = useLiveQuery(async () => {
        const e = await db.exams.get(examId as string);
        if (e && e.createdBy === userEmail) return e;
        return null;
    }, [examId, userEmail]);

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
    const [examCode, setExamCode] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');
    const [periodId, setPeriodId] = useState('');
    const [answerKey, setAnswerKey] = useState('');

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

    // Populate the form when the exam data loads
    useEffect(() => {
        if (exam) {
            setTitle(exam.title);
            setExamCode(exam.examCode || '0001');
            setGradeLevel(exam.gradeLevel);
            setSubject(exam.subject);
            setPeriodId(exam.periodId || '');
            setAnswerKey(exam.answerKey);

            if (exam.competencyMap) {
                setCompetencyMap(exam.competencyMap);
                const uniqueComps = Array.from(new Set(Object.values(exam.competencyMap)));
                setCompetencyList(uniqueComps);
            }
        }
    }, [exam]);

    // Commit custom Grade Level
    const handleCommitGrade = async () => {
        if (!customGrade.trim()) return;
        const newTitle = customGrade.trim();
        const existing = activeGradeLevels.find(g => g.title.toLowerCase() === newTitle.toLowerCase());
        if (existing) {
            setGradeLevel(existing.title);
        } else {
            await db.gradeLevels.add({
                id: crypto.randomUUID(), title: newTitle, sortOrder: 0,
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
            await db.subjects.add({
                id: crypto.randomUUID(), title: newTitle, sortOrder: 0,
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

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Exam?',
            description: 'Are you sure you want to delete this exam? This action will also hide all associated scan results.',
            confirmText: 'Delete',
            cancelText: 'Keep',
            intent: 'danger'
        });

        if (confirmed && examId) {
            await db.exams.update(examId, {
                isDeleted: true,
                updatedAt: Date.now(),
                isSynced: false
            });
            toast.success('Exam deleted successfully');
            navigate('/');
        }
    };

    const handleUpdate = async () => {
        if (!isReady || !examId) return;

        // Validation: Check for duplicate exam code
        const isDuplicate = await isExamCodeDuplicate(userEmail, examCode, examId);
        if (isDuplicate) {
            toast.error(`Exam Code "${examCode}" is already in use by another exam. Please use a unique code.`);
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

        const cleanAnswerKey = answerKey.replace(/ /g, '').toUpperCase();

        await db.exams.update(examId, {
            title: title.trim(),
            examCode: examCode,
            gradeLevel: finalGradeLevel,
            subject: finalSubject,
            periodId: periodId,
            itemCount: cleanAnswerKey.length,
            answerKey: cleanAnswerKey,
            competencyMap: competencyMap,
            updatedAt: Date.now(),
            isSynced: false
        });

        navigate('/');
    };

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
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Edit Exam</h1>
                    <button
                        onClick={handleDelete}
                        className="p-2 -mr-2 text-red-400 hover:text-red-600 transition-colors rounded-full"
                        title="Delete Exam"
                    >
                        <Trash2 className="w-6 h-6" />
                    </button>
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
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm font-bold"
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
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm font-mono font-bold text-center"
                            />
                        </div>
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
                    onClick={handleUpdate}
                    disabled={!isReady}
                    className={`mt-4 flex items-center justify-center gap-2 p-5 rounded-2xl transition-all shadow-lg active:scale-95 font-bold ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                    <Save className="w-5 h-5" />
                    <span className="font-medium text-lg">Update Exam ({answerKey.replace(/ /g, '').length} Items)</span>
                </button>
            </main>

            {/* Period Modal */}
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
