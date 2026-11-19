import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Period } from '../services/db';
import { 
    Plus, 
    ChevronRight, 
    FileText, 
    Edit3, 
    BarChart3, 
    ChevronDown, 
    Camera, 
    Play, 
    Sparkles, 
    Trash2, 
    X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userEmail = currentUser?.email as string;

    // 1. Fetch Periods, Sections, Registry, and Exams
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted && p.createdBy === userEmail).sortBy('createdAt'), [userEmail]);
    const sortedPeriods = periods ? [...periods].reverse() : [];
    const sections = useLiveQuery(() => db.sections.filter(s => !s.isDeleted && s.createdBy === userEmail).toArray(), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels.filter(g => !g.isDeleted && g.createdBy === userEmail).toArray(), [userEmail]);
    const storedSubjects = useLiveQuery(() => db.subjects.filter(s => !s.isDeleted && s.createdBy === userEmail).toArray(), [userEmail]);
    const allUserExams = useLiveQuery(() => db.exams.filter(e => !e.isDeleted && e.createdBy === userEmail).toArray(), [userEmail]);

    // Overall user stats
    const totalExamsCount = allUserExams?.length || 0;
    const totalScansCount = useLiveQuery(
        () => db.scanResults.where('createdBy').equals(userEmail).filter(sr => !sr.isDeleted).count(),
        [userEmail]
    ) || 0;

    // Check if demo exam exists
    const hasDemoData = useMemo(() => {
        return allUserExams?.some(e => e.title.includes('Sample Math Quiz'));
    }, [allUserExams]);

    // 2. State for Filter
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');

    // Onboarding UI state
    const [isTutorialBannerDismissed, setIsTutorialBannerDismissed] = useState<boolean>(() => {
        return localStorage.getItem('godspeed_hide_tutorial_banner') === 'true';
    });

    // Aggregate unique active grade levels
    const activeGradeLevels = useMemo(() => {
        const grades = new Set<string>();
        if (storedGradeLevels) storedGradeLevels.forEach(g => grades.add(g.title));
        if (sections) sections.forEach(s => grades.add(s.gradeLevel));
        if (allUserExams) allUserExams.forEach(e => grades.add(e.gradeLevel));
        return Array.from(grades).filter(Boolean).sort();
    }, [sections, storedGradeLevels, allUserExams]);

    // Aggregate unique active subjects
    const activeSubjects = useMemo(() => {
        const subjects = new Set<string>();
        if (storedSubjects) storedSubjects.forEach(s => subjects.add(s.title));
        if (allUserExams) allUserExams.forEach(e => subjects.add(e.subject));
        return Array.from(subjects).filter(Boolean).sort();
    }, [allUserExams, storedSubjects]);

    // 5. Reactive Exam Fetching with Filter and Status
    const exams = useLiveQuery(
        async () => {
            let results = [];
            if (selectedPeriod === 'none') {
                results = await db.exams.filter(e => !e.isDeleted && e.createdBy === userEmail && (!e.periodId || e.periodId === '')).toArray();
            } else if (selectedPeriod !== 'all') {
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
            const userSections = await db.sections.where('createdBy').equals(userEmail).filter(s => !s.isDeleted).toArray();
            const sectionIdToGrade = new Map(userSections.map(s => [s.id, s.gradeLevel]));

            const userStudents = await db.students.where('createdBy').equals(userEmail).filter(s => !s.isDeleted).toArray();
            const studentsPerGrade = new Map<string, number>();
            userStudents.forEach(s => {
                const grade = sectionIdToGrade.get(s.sectionId);
                if (grade) {
                    studentsPerGrade.set(grade, (studentsPerGrade.get(grade) || 0) + 1);
                }
            });

            const userScans = await db.scanResults.where('createdBy').equals(userEmail).filter(sr => !sr.isDeleted).toArray();
            const scansPerExam = new Map<string, number>();
            userScans.forEach(sr => {
                scansPerExam.set(sr.examId, (scansPerExam.get(sr.examId) || 0) + 1);
            });

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

            return enriched.sort((a, b) => b.createdAt - a.createdAt);
        },
        [selectedPeriod, selectedGrade, selectedSubject, userEmail]
    );

    const activePeriodName = selectedPeriod === 'all' ? 'All Terms / Folders' : (selectedPeriod === 'none' ? 'No Term / Folder' : periods?.find(p => p.id === selectedPeriod)?.name);

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

    // 1-Click Sample Demo Exam Creator
    const handleLoadDemoExam = async () => {
        try {
            // 1. Ensure a demo section exists
            let demoSection = await db.sections.where('createdBy').equals(userEmail).filter(s => !s.isDeleted && s.sectionName === 'Demo Section').first();
            if (!demoSection) {
                const sectionId = crypto.randomUUID();
                await db.sections.add({
                    id: sectionId,
                    gradeLevel: 'Grade 10',
                    sectionName: 'Demo Section',
                    createdAt: Date.now(),
                    createdBy: userEmail,
                    updatedAt: Date.now(),
                    isSynced: false,
                    isDeleted: false
                });

                // Add 3 sample students
                await db.students.bulkAdd([
                    {
                        id: crypto.randomUUID(),
                        sectionId: sectionId,
                        studentNo: '20260001',
                        fullName: 'Dela Cruz, Juan',
                        createdBy: userEmail,
                        updatedAt: Date.now(),
                        isSynced: false,
                        isDeleted: false
                    },
                    {
                        id: crypto.randomUUID(),
                        sectionId: sectionId,
                        studentNo: '20260002',
                        fullName: 'Santos, Maria',
                        createdBy: userEmail,
                        updatedAt: Date.now(),
                        isSynced: false,
                        isDeleted: false
                    },
                    {
                        id: crypto.randomUUID(),
                        sectionId: sectionId,
                        studentNo: '20260003',
                        fullName: 'Rizal, Jose',
                        createdBy: userEmail,
                        updatedAt: Date.now(),
                        isSynced: false,
                        isDeleted: false
                    }
                ]);
            }

            // 2. Create the Demo Exam
            const demoExamId = crypto.randomUUID();
            await db.exams.add({
                id: demoExamId,
                title: 'Sample Math Quiz (10 Items)',
                gradeLevel: 'Grade 10',
                subject: 'General Math',
                examCode: '0001',
                itemCount: 10,
                answerKey: 'ABCDABCDAB',
                defaultPointsPerItem: 1,
                itemPoints: Array(10).fill(1),
                maxScore: 10,
                createdAt: Date.now(),
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });

            toast.success('Sample Demo Exam loaded! Tap the exam card below to try scanning.');
        } catch (err) {
            console.error('Error loading demo exam:', err);
            toast.error('Failed to create demo exam.');
        }
    };

    // Clear Demo Data Handler
    const handleClearDemoData = async () => {
        if (window.confirm('Are you sure you want to remove the sample demo exam and demo students?')) {
            try {
                // Delete demo exams
                const demoExams = await db.exams.where('createdBy').equals(userEmail).filter(e => !e.isDeleted && e.title.includes('Sample Math Quiz')).toArray();
                for (const e of demoExams) {
                    await db.exams.update(e.id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
                }

                // Delete demo section & students
                const demoSections = await db.sections.where('createdBy').equals(userEmail).filter(s => !s.isDeleted && s.sectionName === 'Demo Section').toArray();
                for (const s of demoSections) {
                    await db.sections.update(s.id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
                    const demoStudents = await db.students.where('sectionId').equals(s.id).toArray();
                    for (const st of demoStudents) {
                        await db.students.update(st.id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
                    }
                }

                toast.success('Demo data cleared! Your dashboard is fresh.');
            } catch (err) {
                console.error('Error clearing demo data:', err);
                toast.error('Failed to clear demo data.');
            }
        }
    };

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-4">

                {/* ========================================== */}
                {/* VIDEO TUTORIAL BANNER */}
                {/* ========================================== */}
                {!isTutorialBannerDismissed && (
                    <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white rounded-2xl p-3.5 px-4 shadow-md shadow-violet-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                        <button
                            onClick={() => navigate('/tutorial')}
                            className="flex items-center gap-3 text-left flex-1 group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                            </div>
                            <div>
                                <p className="text-xs sm:text-sm font-bold leading-tight flex items-center gap-1.5">
                                    <span>New to GodSpeed Grader? Watch 1-minute visual guide</span>
                                    <ChevronRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
                                </p>
                                <p className="text-[10px] text-white/80 mt-0.5 font-medium">
                                    See how to setup, print bubble sheets, and grade with camera in 5 quick steps
                                </p>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem('godspeed_hide_tutorial_banner', 'true');
                                setIsTutorialBannerDismissed(true);
                            }}
                            className="p-1 text-white/60 hover:text-white transition-colors"
                            title="Dismiss tutorial banner"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* PRIMARY ACTIONS */}
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/create')}
                        className="flex-1 flex items-center justify-center gap-2 p-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create New Exam</span>
                    </button>
                </div>

                {/* ========================================== */}
                {/* 3-STEP VISUAL WORKFLOW ROADMAP (LABEL ONLY) */}
                {/* ========================================== */}
                {(totalExamsCount === 0 || hasDemoData) && (
                    <div className="bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">How GodSpeed Works</span>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                                    3 Steps
                                </span>
                            </div>
                            {hasDemoData && (
                                <button
                                    onClick={handleClearDemoData}
                                    className="text-[11px] font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-500/10 transition-colors"
                                    title="Remove demo exam and sample students"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear Demo Data</span>
                                </button>
                            )}
                        </div>

                        {/* 3 Steps - Clean Labels Only, No Action Clutter */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                    1
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Create Exam & Key</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Set questions & tap answer key (A, B, C, D)</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                    2
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Print Bubble Sheets</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Generate free sheets under the Sheets tab</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                    3
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Camera Grade in 1s</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Align 4 corner squares; scores automatically</p>
                                </div>
                            </div>
                        </div>

                        {/* First Time Clear Buttons: Start Fresh OR Try Demo */}
                        {totalExamsCount === 0 && (
                            <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center gap-2.5">
                                <button
                                    onClick={() => navigate('/create')}
                                    className="w-full sm:flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Create Your First Exam</span>
                                </button>
                                <button
                                    onClick={handleLoadDemoExam}
                                    className="w-full sm:flex-1 py-2.5 px-4 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>Start with Demo Exam & Data</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* EXAM LIST SECTION WITH INTEGRATED FILTER */}
                <div className="flex flex-col gap-3">
                    {/* Filters Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 mb-1">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 whitespace-nowrap">
                            <FileText className="w-3 h-3" />
                            {activePeriodName} • {exams?.length || 0} Exams
                        </h3>

                        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2">
                            {/* Period Dropdown */}
                            <div className="relative group w-full md:w-48 md:order-3">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className="w-full bg-slate-200/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer pr-10"
                                >
                                    <option value="all">📁 All Terms / Folders</option>
                                    <option value="none">📁 No Term / Folder</option>
                                    {sortedPeriods.map(p => (
                                        <option key={p.id} value={p.id}>
                                            📁 {p.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Grade and Subject Dropdowns */}
                            <div className="flex flex-row gap-2 w-full md:w-auto md:order-1">
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

                    {/* ONBOARDING GUIDE BANNER: When user has exams but 0 scans */}
                    {exams && exams.length > 0 && totalScansCount === 0 && (
                        <div className="flex items-center gap-3.5 p-4 bg-violet-50 dark:bg-violet-500/10 border border-violet-200/80 dark:border-violet-500/20 rounded-2xl text-violet-900 dark:text-violet-200 text-xs sm:text-sm animate-in fade-in duration-300 shadow-sm">
                            <div className="relative flex items-center justify-center shrink-0">
                                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-xl bg-violet-400 opacity-40"></span>
                                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center relative shadow-sm">
                                    <Camera className="w-4.5 h-4.5" />
                                </div>
                            </div>
                            <div className="flex-1 leading-snug">
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-violet-950 dark:text-white">Ready to grade?</span>
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-violet-200/80 dark:bg-violet-400/20 text-violet-800 dark:text-violet-300">Tap below</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                                    Tap on your exam below to start scanning bubble sheets with your camera.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {exams?.length === 0 && (
                        <div className="text-center py-12 px-4 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">No exams found matching your filters</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mt-1 leading-relaxed">
                                    Create a new exam or select "All Terms / Folders" to view exams.
                                </p>
                            </div>
                            <div className="pt-1">
                                <button
                                    onClick={() => navigate('/create')}
                                    className="text-xs font-bold text-violet-600 hover:underline uppercase tracking-wider"
                                >
                                    + Create Exam
                                </button>
                            </div>
                        </div>
                    )}

                    {/* EXAM LIST */}
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
                                        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-x-1.5">
                                            <span>{exam.gradeLevel}</span>
                                            <span className="opacity-30">•</span>
                                            <span>{exam.subject}</span>
                                            <span className="opacity-30">•</span>
                                            <span>{exam.itemCount} Items{exam.maxScore && exam.maxScore !== exam.itemCount ? ` (${exam.maxScore} pts)` : ''}</span>
                                            <span className="opacity-30">•</span>
                                            {exam.status === 'graded' ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Graded</span>
                                            ) : (
                                                <span className={`${(exam.scannedCount || 0) > 0 ? 'text-violet-600 dark:text-violet-400' : ''} font-bold`}>
                                                    {exam.scannedCount || 0} Scanned
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </button>

                                    <div className="flex items-center gap-1 ml-3 sm:ml-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/edit/${exam.id}`);
                                            }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                            title="Edit Exam"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/exams/${exam.id}/results`);
                                            }}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all"
                                            title="View Results"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                        );
                    })}
                </div>

            </main>
        </div>
    );
}