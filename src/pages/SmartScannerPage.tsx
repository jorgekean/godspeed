import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Camera, X, CheckCircle2, Search, UserCheck, Zap, ArrowLeft, Loader2, Users, RefreshCcw, ListChecks, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { OMRScanner } from '../components/omr/OMRScanner';
import { useAuth } from '../contexts/AuthContext';

type ScanMode = 'setup' | 'scanning' | 'tagging';

export default function SmartScannerPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // ---------------------------------------------------------
    // 1. STATE & DATA FETCHING
    // ---------------------------------------------------------
    const [scanMode, setScanMode] = useState<ScanMode>('setup');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [currentScore, setCurrentScore] = useState<number | null>(null);
    const [currentRawAnswers, setCurrentRawAnswers] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [scannedStudentIds, setScannedStudentIds] = useState<Set<string>>(new Set());
    const scannerRef = React.useRef<any>(null);

    // NEW: Initialize scanned student IDs from DB
    React.useEffect(() => {
        const loadExistingScans = async () => {
            if (!examId) return;
            const existingScans = await db.scanResults.where('examId').equals(examId).toArray();
            setScannedStudentIds(new Set(existingScans.filter(s => !s.isDeleted).map(s => s.studentId)));
        };
        loadExistingScans();
    }, [examId]);

    // NEW: Toggle to show the item analysis grid
    const [showDetails, setShowDetails] = useState(false);

    const userEmail = currentUser?.email!;

    const exam = useLiveQuery(async () => {
        if (!userEmail) return null;
        const e = await db.exams.get(examId as string);
        if (e && e.createdBy === userEmail) return e;
        return null;
    }, [examId, userEmail]);

    const sections = useLiveQuery(() => {
        if (!userEmail) return [];
        return db.sections.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray();
    }, [userEmail]);

    const allStudents = useLiveQuery(() => {
        if (!userEmail) return [];
        return db.students.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray();
    }, [userEmail]);

    const scanResults = useLiveQuery(() => {
        if (!examId) return [];
        return db.scanResults.where('examId').equals(examId).filter(r => !r.isDeleted).toArray();
    }, [examId]);

    const students = useLiveQuery(
        () => selectedSectionId ? db.students.where('sectionId').equals(selectedSectionId).toArray() : [],
        [selectedSectionId]
    );

    // ---------------------------------------------------------
    // 2. TAGGING LOGIC (Bottom Sheet Sorting)
    // ---------------------------------------------------------
    const sortedAndFilteredStudents = useMemo(() => {
        if (!students) return [];
        let filtered = students;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = students.filter(s => s.fullName.toLowerCase().includes(q));
        }
        return filtered.sort((a, b) => {
            const aScanned = scannedStudentIds.has(a.id);
            const bScanned = scannedStudentIds.has(b.id);
            if (aScanned === bScanned) return a.fullName.localeCompare(b.fullName);
            return aScanned ? 1 : -1;
        });
    }, [students, searchQuery, scannedStudentIds]);

    // ---------------------------------------------------------
    // 3. HANDLERS
    // ---------------------------------------------------------

    const handleRescan = useCallback(() => {
        setCurrentScore(null);
        setCurrentRawAnswers([]);
        setShowDetails(false);
        setScanMode('scanning');
        scannerRef.current?.reset();
    }, []);

    const handleTagStudent = useCallback(async (studentId: string, studentName: string, scoreOverride?: number, answersOverride?: string[]) => {
        if (!exam || !currentUser) return;

        const finalScore = scoreOverride !== undefined ? scoreOverride : currentScore;
        const finalAnswers = answersOverride !== undefined ? answersOverride : currentRawAnswers;

        if (finalScore === null) return;

        // 1. Check if a result already exists for this Student + Exam combo
        const existing = await db.scanResults
            .where('[examId+studentId]')
            .equals([exam.id, studentId])
            .first();

        const baseData = {
            examId: exam.id,
            sectionId: selectedSectionId,
            studentId: studentId,
            score: finalScore,
            total: exam.itemCount,
            answers: finalAnswers.reduce((acc, ans, i) => ({ ...acc, [i + 1]: ans }), {}),
            scannedAt: Date.now(),
            createdBy: currentUser.email,
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        };

        if (existing) {
            // 2. Perform a targeted UPDATE on the existing GUID
            await db.scanResults.update(existing.id, baseData);
        } else {
            // 3. Create a NEW record with a fresh GUID
            await db.scanResults.add({
                id: crypto.randomUUID(),
                ...baseData
            });
        }

        // Update the scanner overlay to show GREEN "Saved" state
        scannerRef.current?.updateLastResult({
            isSaved: true,
            studentName: studentName,
            score: finalScore
        });

        // Only show toast here if we were in manual tagging mode (not auto-tagged)
        if (scanMode === 'tagging') {
            toast.success(`${studentName} scored ${finalScore}/${exam.itemCount}. Saved! Go to next paper.`, {
                duration: 3000,
                icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
            });
            handleRescan(); // Reset and lower the sheet
        }

        setScannedStudentIds(prev => new Set(prev).add(studentId));
    }, [exam, selectedSectionId, currentUser, currentScore, currentRawAnswers, scanMode, handleRescan]);

    const handleScanSuccess = useCallback((score: number, rawAnswers: string[], examCode?: string, studentNo?: string) => {
        if (!exam || scanMode === 'tagging') return;

        setCurrentScore(score);
        setCurrentRawAnswers(rawAnswers);
        setShowDetails(false); // Reset details view on new scan

        // --- NEW: Quick Scan logic ---
        if (selectedSectionId === 'anonymous') {
            // No toast needed here, OMRScanner handles the success overlay
            setTimeout(() => setCurrentScore(null), 1500);
            return;
        }

        // --- NEW: Auto-Tagging Logic ---
        if (studentNo && students) {
            // Normalize detected studentNo: Treat '?' (blanks) as '0'
            const normalizedDetected = studentNo.replace(/\?/g, '0');

            // Skip auto-tagging if the detected ID is all zeros (effectively empty)
            if (normalizedDetected === '00000000') {
                setScanMode('tagging');
                setSearchQuery('');
                return;
            }

            // Refined matching: Pad the student's stored ID with leading zeros to 8 digits to match the OMR grid
            const student = students.find(s => {
                if (!s.studentNo) return false;
                const paddedStored = s.studentNo.padStart(8, '0');
                return paddedStored === normalizedDetected;
            });

            if (student) {
                handleTagStudent(student.id, student.fullName, score, rawAnswers);
                return;
            } else {
                // If we detected a non-zero ID but couldn't find a match, show a helpful toast
                const displayId = studentNo.includes('?') ? normalizedDetected : studentNo;
                toast.info(`Student No ${displayId} (Score: ${score}) not found. Please tag manually.`, { duration: 4000 });
            }
        }

        setScanMode('tagging');
        setSearchQuery('');
    }, [exam, scanMode, students, handleTagStudent]);


    // ---------------------------------------------------------
    // LOADING STATES
    // ---------------------------------------------------------
    if (exam === undefined || sections === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }
    if (exam === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
                <p className="text-slate-900 dark:text-white font-bold">Exam not found.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-violet-600 dark:text-violet-400 underline">Go Back</button>
            </div>
        );
    }

    // ---------------------------------------------------------
    // RENDER: SETUP MODE
    // ---------------------------------------------------------
    if (scanMode === 'setup') {
        return (
            <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 p-4 md:p-8 relative">
                <div className="flex items-center justify-between mb-8 max-w-xl mx-auto w-full">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full animate-in zoom-in-95 duration-300 pb-12">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-violet-200 dark:border-violet-500/20">
                            <Camera className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Scanner Setup</h1>
                        <p className="text-slate-500 font-medium">{exam.title}</p>
                    </div>

                    <div className="space-y-4">
                        {/* Quick Scan: Always shown */}
                        <button
                            onClick={() => { setSelectedSectionId('anonymous'); setScanMode('scanning'); }}
                            className="w-full flex items-center p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:shadow-lg transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 bg-amber-100 dark:bg-amber-500/20">
                                <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-bold text-amber-900 dark:text-amber-400">Quick Scan</h4>
                                <p className="text-sm text-amber-800/70 dark:text-amber-400/70">Grade papers immediately without saving.</p>
                            </div>
                        </button>

                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">Select Section ({exam.gradeLevel})</h3>
                            {sections.filter(s => s.gradeLevel === exam.gradeLevel).length > 0 ? (
                                sections.filter(s => s.gradeLevel === exam.gradeLevel).map(section => {
                                    const sectionStudents = allStudents ? allStudents.filter(s => s.sectionId === section.id) : [];
                                    const totalStudents = sectionStudents.length;
                                    const gradedCount = scanResults ? scanResults.filter(r => r.sectionId === section.id).length : 0;
                                    const isCompleted = totalStudents > 0 && gradedCount >= totalStudents;

                                    return (
                                        <div
                                            key={section.id}
                                            className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-violet-400 transition-all shadow-sm"
                                        >
                                            <button
                                                onClick={() => { setSelectedSectionId(section.id); setScanMode('scanning'); }}
                                                className="flex-1 flex items-center text-left focus:outline-none animate-in fade-in duration-300"
                                            >
                                                <div className={`p-2.5 rounded-xl mr-4 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                                    <Users className={`w-5 h-5 ${isCompleted ? 'text-emerald-500' : 'text-slate-550 dark:text-slate-400'}`} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        {section.sectionName}
                                                        {isCompleted && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                                100% Graded
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        {isCompleted ? 'Completed' : `${gradedCount} / ${totalStudents} Graded`}
                                                    </p>
                                                </div>
                                            </button>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setSelectedSectionId(section.id); setScanMode('scanning'); }}
                                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
                                                >
                                                    {gradedCount > 0 ? 'Resume' : 'Grade'}
                                                </button>
                                                {gradedCount > 0 && (
                                                    <button
                                                        onClick={() => navigate(`/exams/${exam.id}/results`)}
                                                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700"
                                                    >
                                                        Results
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No sections found for {exam.gradeLevel}.</p>
                                    <p className="text-xs text-slate-400 mt-1">Please create a matching section in the Sections tab.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------------------------------------------------
    // RENDER: SCANNING / TAGGING MODE
    // ---------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans selection:bg-violet-500/30 pb-8 md:pb-12 relative overflow-hidden">

            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
                    <button onClick={() => setScanMode('setup')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center flex flex-col items-center">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{exam.title}</h1>
                        <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-2 py-0.5 rounded-md mt-1">
                            {sections?.find(s => s.id === selectedSectionId)?.sectionName}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(`/exams/${exam.id}/results`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 shrink-0"
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Results</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 relative">
                <div className={`relative w-full flex flex-col h-[75vh] min-h-[500px] max-h-[720px] bg-black rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/40 dark:shadow-violet-900/10 border-4 md:border-[6px] border-slate-200 dark:border-slate-900 transition-opacity duration-300 ${scanMode === 'tagging' ? 'opacity-40 blur-sm pointer-events-none' : 'opacity-100'}`}>
                    <OMRScanner
                        ref={scannerRef}
                        correctAnswers={exam.answerKey.split('')}
                        onScanComplete={handleScanSuccess}
                        enabled={scanMode === 'scanning'}
                        allStudentsGraded={
                            students && 
                            students.length > 0 && 
                            students.filter(s => scannedStudentIds.has(s.id)).length >= students.length
                        }
                        onViewResults={() => navigate(`/exams/${exam.id}/results`)}
                    />
                </div>
            </main>

            {/* Quick Scan Floating Score */}
            {selectedSectionId === 'anonymous' && currentScore !== null && (
                <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-8 py-4 rounded-3xl font-black text-6xl shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-in zoom-in slide-out-to-top-8 duration-300">
                    {currentScore}/{exam.itemCount}
                </div>
            )}

            {/* ========================================== */}
            {/* THE TAGGING BOTTOM SHEET */}
            {/* ========================================== */}
            <div className={`fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-t border-slate-200/50 dark:border-white/10 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-[100] flex flex-col h-[85vh] md:max-w-md md:mx-auto md:left-1/2 md:-translate-x-1/2 ${scanMode === 'tagging' ? 'translate-y-0' : 'translate-y-full'}`}>

                {/* Header with Score & Actions */}
                <div className="bg-green-50 dark:bg-green-500/10 p-6 rounded-t-[2rem] border-b border-green-100 dark:border-green-500/20 text-center shrink-0 relative">
                    <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2 animate-in zoom-in duration-300 delay-150" />
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white">
                        {currentScore} <span className="text-xl text-slate-400">/ {exam.itemCount}</span>
                    </h2>

                    {/* Action Buttons: View Details & Rescan */}
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <ListChecks className="w-4 h-4" />
                            {showDetails ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                            onClick={handleRescan}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold rounded-full shadow-sm hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Rescan
                        </button>
                    </div>
                </div>

                {/* Conditional Body: Details Grid OR Tagging List */}
                {showDetails ? (
                    // VIEW 1: THE ITEM DETAILS GRID
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50">
                        <div className="grid grid-cols-2 gap-3 pb-8">
                            {currentRawAnswers.map((studentAns, idx) => {
                                const qNum = (idx + 1).toString();
                                const correctAns = exam.answerKey[idx] || '-';
                                const isCorrect = studentAns === correctAns;

                                return (
                                    <div key={qNum} className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center shadow-sm ${isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30 bg-white dark:bg-slate-900'}`}>
                                        <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase mb-1">Item {qNum}</span>
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                                {studentAns === "BLANK" ? "—" : studentAns}
                                            </span>
                                            {!isCorrect && (
                                                <>
                                                    <span className="text-slate-400 text-sm">→</span>
                                                    <span className="text-green-500 text-xl font-black">{correctAns}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    // VIEW 2: THE STUDENT TAGGING LIST (Default)
                    <>
                        <div className="p-4 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Tap student to save..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-8">
                            <div className="space-y-2">
                                {sortedAndFilteredStudents.map(student => {
                                    const isScanned = scannedStudentIds.has(student.id);
                                    return (
                                        <button
                                            key={student.id}
                                            onClick={() => handleTagStudent(student.id, student.fullName)}
                                            disabled={isScanned}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isScanned
                                                ? 'bg-slate-50 dark:bg-slate-800/20 border-transparent opacity-50 cursor-not-allowed'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-violet-500 active:bg-violet-50 dark:active:bg-violet-500/10 shadow-sm hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex flex-col items-start text-left">
                                                <span className={`font-bold ${isScanned ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {student.fullName}
                                                </span>
                                                <span className="text-xs font-medium text-slate-400">
                                                    {student.studentNo || 'No ID'}
                                                </span>
                                            </div>
                                            {isScanned ? (
                                                <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 px-2.5 py-1 rounded-md">Graded</span>
                                            ) : (
                                                <UserCheck className="w-5 h-5 text-slate-300" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}