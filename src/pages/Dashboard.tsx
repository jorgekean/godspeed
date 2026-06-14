import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Period } from '../services/db';
import { Plus, ChevronRight, FileText, X, HelpCircle, Printer, Edit3, BarChart3, ChevronDown } from 'lucide-react';
import { OMRTemplateGenerator } from '../components/omr/OMRTemplate';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    // 1. Fetch Periods
    const userEmail = currentUser?.email as string;
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted && p.createdBy === userEmail).sortBy('startDate'), [userEmail]);
    const sections = useLiveQuery(() => db.sections.filter(s => !s.isDeleted && s.createdBy === userEmail).toArray(), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels.filter(g => !g.isDeleted && g.createdBy === userEmail).toArray(), [userEmail]);
    const storedSubjects = useLiveQuery(() => db.subjects.filter(s => !s.isDeleted && s.createdBy === userEmail).toArray(), [userEmail]);
    const allUserExams = useLiveQuery(() => db.exams.filter(e => !e.isDeleted && e.createdBy === userEmail).toArray(), [userEmail]);
    
    // 2. State for Filter
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

    // ... (bestPeriodId logic)

    // Aggregate unique active grade levels from Sections, Registry, and Exams
    const activeGradeLevels = useMemo(() => {
        const grades = new Set<string>();
        
        // From Registry
        if (storedGradeLevels) storedGradeLevels.forEach(g => grades.add(g.title));
        // From Sections
        if (sections) sections.forEach(s => grades.add(s.gradeLevel));
        // From Exams
        if (allUserExams) allUserExams.forEach(e => grades.add(e.gradeLevel));

        return Array.from(grades).filter(Boolean).sort();
    }, [sections, storedGradeLevels, allUserExams]);

    // Aggregate unique active subjects from Registry and Exams
    const activeSubjects = useMemo(() => {
        const subjects = new Set<string>();

        // From Registry
        if (storedSubjects) storedSubjects.forEach(s => subjects.add(s.title));
        // From Exams
        if (allUserExams) allUserExams.forEach(e => subjects.add(e.subject));

        return Array.from(subjects).filter(Boolean).sort();
    }, [allUserExams, storedSubjects]);

    // 5. Reactive Exam Fetching with Filter and Status
    const exams = useLiveQuery(
        async () => {
            let results = [];
            if (selectedPeriod !== 'all') {
                results = await db.exams.where('periodId').equals(selectedPeriod).filter(e => !e.isDeleted && e.createdBy === userEmail).toArray();
            } else {
                results = await db.exams.filter(e => !e.isDeleted && e.createdBy === userEmail).toArray();
            }

            if (selectedGrade !== 'all') {
                results = results.filter(e => e.gradeLevel === selectedGrade);
            }
            
            if (selectedSubject !== 'all') {
                results = results.filter(e => e.subject === selectedSubject);
            }

            // JOIN DATA FOR STATUS
            // 1. Get all active sections for mapping
            const userSections = await db.sections.where('createdBy').equals(userEmail).filter(s => !s.isDeleted).toArray();
            const sectionIdToGrade = new Map(userSections.map(s => [s.id, s.gradeLevel]));
            
            // 2. Count active students per grade level
            const userStudents = await db.students.where('createdBy').equals(userEmail).filter(s => !s.isDeleted).toArray();
            const studentsPerGrade = new Map<string, number>();
            userStudents.forEach(s => {
                const grade = sectionIdToGrade.get(s.sectionId);
                if (grade) {
                    studentsPerGrade.set(grade, (studentsPerGrade.get(grade) || 0) + 1);
                }
            });

            // 3. Count scan results per exam
            const userScans = await db.scanResults.where('createdBy').equals(userEmail).filter(sr => !sr.isDeleted).toArray();
            const scansPerExam = new Map<string, number>();
            userScans.forEach(sr => {
                scansPerExam.set(sr.examId, (scansPerExam.get(sr.examId) || 0) + 1);
            });

            // 4. Enrich results
            const enriched = results.map(exam => {
                const scannedCount = scansPerExam.get(exam.id) || 0;
                const totalExpected = studentsPerGrade.get(exam.gradeLevel) || 0;
                
                let status: 'not_graded' | 'partially_graded' | 'graded' = 'not_graded';
                if (scannedCount > 0) {
                    if (totalExpected > 0 && scannedCount >= totalExpected) {
                        status = 'graded';
                    } else {
                        status = 'partially_graded';
                    }
                }

                return { ...exam, scannedCount, totalExpected, status };
            });

            return enriched.reverse(); // Newest first
        },
        [selectedPeriod, selectedGrade, selectedSubject, userEmail]
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

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'graded':
                return { label: 'Graded', classes: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' };
            case 'partially_graded':
                return { label: 'Partially Graded', classes: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' };
            default:
                return { label: 'Not Graded', classes: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' };
        }
    };

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
                    {/* Filters Row ... */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                            <FileText className="w-3 h-3" />
                            {activePeriodName} • {exams?.length || 0} Exams
                        </h3>

                        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2">
                            {/* Period Dropdown (Row 1 on mobile) */}
                            <div className="relative group w-full md:w-48 md:order-3">
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

                            {/* Grade and Subject Dropdowns (Row 2 on mobile) ... */}
                            <div className="flex flex-row gap-2 w-full md:w-auto md:order-1">
                                {/* Grade Dropdown */}
                                <div className="relative group flex-1 md:flex-none md:w-36">
                                    <select
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                        className="w-full bg-slate-200/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer pr-10"
                                    >
                                        <option value="all">🎓 All Grades</option>
                                        {activeGradeLevels.map(grade => (
                                            <option key={grade} value={grade}>{grade}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                
                                {/* Subject Dropdown */}
                                <div className="relative group flex-1 md:flex-none md:w-40">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full bg-slate-200/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer pr-10"
                                    >
                                        <option value="all">📚 All Subjects</option>
                                        {activeSubjects.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Exam List */}
                    {exams?.length === 0 && (
                        <div className="text-center py-16 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No exams found matching your filters.</p>
                            <button onClick={() => navigate('/create')} className="mt-4 text-xs font-bold text-violet-600 uppercase tracking-wider hover:underline">Create your first exam</button>
                        </div>
                    )}

                    {exams?.map((exam) => {
                        const status = getStatusConfig(exam.status);
                        return (
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
                                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{exam.title}</h3>
                                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-x-1">
                                            <span>{exam.gradeLevel}</span>
                                            <span className="opacity-30">•</span>
                                            <span>{exam.subject}</span>
                                            <span className="opacity-30">•</span>
                                            <span>{exam.itemCount} Items</span>
                                            <span className="opacity-30">•</span>
                                            {exam.status === 'graded' ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Graded</span>
                                            ) : (
                                                <span className={`${exam.scannedCount > 0 ? 'text-violet-600 dark:text-violet-400' : ''} font-bold`}>
                                                    {exam.scannedCount} Scanned
                                                </span>
                                            )}
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
                        );
                    })}
                </div>

            </main>
        </div>
    );
}