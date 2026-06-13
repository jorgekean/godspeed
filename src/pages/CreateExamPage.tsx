import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
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

    // Competency States
    const [competencyList, setCompetencyList] = useState<string[]>([]);
    const [newCompName, setNewCompName] = useState('');
    const [competencyMap, setCompetencyMap] = useState<Record<string, string>>({});
    const [rangeStart, setRangeStart] = useState<number>(1);
    const [rangeEnd, setRangeEnd] = useState<number>(1);
    const [selectedCompForRange, setSelectedCompForRange] = useState('');
    const [showCompetencies, setShowCompetencies] = useState(false);

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
            competencyMap: competencyMap,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        });

        navigate('/');
    };

    // Default to best period based on date logic
    useEffect(() => {
        if (periods && periods.length > 0 && !periodId) {
            setPeriodId(bestPeriodId);
        }
    }, [periods, bestPeriodId, periodId]);

    const cleanKeyLength = answerKey.replace(/[\s,]/g, '').length;

    // NEW: Sync rangeEnd with key length
    useEffect(() => {
        if (cleanKeyLength > 0 && rangeEnd === 1) {
            setRangeEnd(cleanKeyLength);
        }
    }, [cleanKeyLength]);

    const handleAddCompetency = () => {
        if (!newCompName.trim()) return;
        if (competencyList.includes(newCompName.trim())) return;
        setCompetencyList([...competencyList, newCompName.trim()]);
        if (!selectedCompForRange) setSelectedCompForRange(newCompName.trim());
        setNewCompName('');
    };

    const handleApplyRange = () => {
        if (!selectedCompForRange) return;
        const newMap = { ...competencyMap };
        const start = Math.max(1, rangeStart);
        const end = Math.min(answerKey.replace(/[\s,]/g, '').length, rangeEnd);

        for (let i = start; i <= end; i++) {
            newMap[i.toString()] = selectedCompForRange;
        }
        setCompetencyMap(newMap);
    };

    const handleRemoveCompetency = (comp: string) => {
        setCompetencyList(competencyList.filter(c => c !== comp));
        const newMap = { ...competencyMap };
        Object.keys(newMap).forEach(key => {
            if (newMap[key] === comp) delete newMap[key];
        });
        setCompetencyMap(newMap);
        if (selectedCompForRange === comp) setSelectedCompForRange(competencyList[0] || '');
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

                {/* NEW: Learning Competencies Mapping */}
                {cleanKeyLength > 0 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                        <button
                            onClick={() => setShowCompetencies(!showCompetencies)}
                            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Tag className="w-5 h-5 text-violet-500" />
                                <div className="text-left">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Learning Competencies</h3>
                                    <p className="text-xs text-slate-500">Map questions to specific topics (Optional)</p>
                                </div>
                            </div>
                            {showCompetencies ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                        </button>

                        {showCompetencies && (
                            <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                {/* 1. Add Competency */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. Define Competencies</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCompName}
                                            onChange={(e) => setNewCompName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCompetency()}
                                            placeholder="e.g. Fraction Addition"
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-violet-500/50 transition-all"
                                        />
                                        <button
                                            onClick={handleAddCompetency}
                                            className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {competencyList.map(comp => (
                                            <span key={comp} className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg text-xs font-bold border border-violet-100 dark:border-violet-500/20">
                                                {comp}
                                                <button onClick={() => handleRemoveCompetency(comp)} className="hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Range Mapping */}
                                {competencyList.length > 0 && (
                                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-white/5">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">2. Assign to Items</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 ml-1">Target Competency</label>
                                                <select
                                                    value={selectedCompForRange}
                                                    onChange={(e) => setSelectedCompForRange(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                                >
                                                    {competencyList.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 ml-1">Item Range (1-{cleanKeyLength})</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={rangeStart}
                                                        onChange={(e) => setRangeStart(parseInt(e.target.value))}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm"
                                                    />
                                                    <span className="text-slate-400">to</span>
                                                    <input
                                                        type="number"
                                                        value={rangeEnd}
                                                        onChange={(e) => setRangeEnd(parseInt(e.target.value))}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleApplyRange}
                                            className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Apply Mapping
                                        </button>
                                    </div>
                                )}

                                {/* 3. Mapping Preview */}
                                {Object.keys(competencyMap).length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">3. Assignment Preview</label>
                                            <span className="text-[10px] font-bold text-violet-500">{Object.keys(competencyMap).length} items mapped</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto pr-2 space-y-1 scrollbar-hide">
                                            {Array.from({ length: cleanKeyLength }).map((_, i) => {
                                                const qNum = (i + 1).toString();
                                                const comp = competencyMap[qNum];
                                                return (
                                                    <div key={qNum} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/30 text-[11px] border border-slate-100 dark:border-transparent">
                                                        <span className="font-bold text-slate-500 w-8">Q{qNum}</span>
                                                        <span className={comp ? 'text-violet-600 dark:text-violet-400 font-bold truncate flex-1 text-right' : 'text-slate-300 italic'}>
                                                            {comp || 'Not assigned'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!isReady}
                    className={`mt-4 flex items-center justify-center gap-2 p-4 rounded-2xl transition-all shadow-lg active:scale-95 ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                    <Save className="w-5 h-5" />
                    <span className="font-medium">Save Exam ({cleanKeyLength} Items)</span>
                </button>

            </main>
        </div>
    );
}