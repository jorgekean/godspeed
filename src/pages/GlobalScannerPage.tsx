import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Camera, CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { OMRScanner, type OMRScannerRef } from '../components/omr/OMRScanner';
import { useAuth } from '../contexts/AuthContext';

export default function GlobalScannerPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userEmail = currentUser?.email!;
    const scannerRef = useRef<OMRScannerRef>(null);

    // ---------------------------------------------------------
    // 1. STATE
    // ---------------------------------------------------------
    const [isSearchingExam, setIsSearchingExam] = useState(false);

    // ---------------------------------------------------------
    // 2. DATA
    // ---------------------------------------------------------
    const allExams = useLiveQuery(() =>
        db.exams.filter(e => e.createdBy === userEmail && !e.isDeleted).toArray()
        , [userEmail]);

    // ---------------------------------------------------------
    // 3. HANDLERS
    // ---------------------------------------------------------

    const handleScanSuccess = useCallback(async (_initialScore: number, rawAnswers: string[], examCode?: string, studentNo?: string) => {
        if (!allExams) return;

        setIsSearchingExam(true);

        try {
            // 1. Find the exam by code
            if (!examCode || examCode.includes('?')) {
                toast.error("Could not read Exam Code. Please ensure it's clearly marked.");
                scannerRef.current?.reset();
                return;
            }

            const matchedExam = allExams.find(e => e.examCode === examCode && !e.isDeleted && e.createdBy === userEmail);

            if (!matchedExam) {
                toast.error(`No exam found with code "${examCode}".`);
                scannerRef.current?.reset();
                return;
            }

            // 2. Find the student if ID is present
            let studentName = undefined;
            let studentId = undefined;
            let sectionId = undefined;

            if (studentNo && !studentNo.includes('?')) {
                const allStudents = await db.students.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray();
                const student = allStudents.find(s => s.studentNo?.padStart(8, '0') === studentNo);
                
                if (student) {
                    studentName = student.fullName;
                    studentId = student.id;
                    sectionId = student.sectionId;
                }
            }

            // 2.5 Recalculate accurate score using the matched exam's key
            let accurateScore = 0;
            const key = matchedExam.answerKey;
            rawAnswers.forEach((ans, i) => {
                if (ans !== "BLANK" && ans === key[i]) {
                    accurateScore++;
                }
            });

            // 3. Save result if student was identified
            if (studentId) {
                const existing = await db.scanResults
                    .where('[examId+studentId]')
                    .equals([matchedExam.id, studentId])
                    .first();

                const baseData = {
                    examId: matchedExam.id,
                    sectionId: sectionId!,
                    studentId: studentId,
                    score: accurateScore,
                    total: matchedExam.itemCount,
                    answers: rawAnswers.reduce((acc, ans, i) => ({ ...acc, [i + 1]: ans }), {}),
                    scannedAt: Date.now(),
                    createdBy: userEmail,
                    updatedAt: Date.now(),
                    isSynced: false,
                    isDeleted: false
                };

                if (existing) {
                    await db.scanResults.update(existing.id, baseData);
                } else {
                    await db.scanResults.add({ id: crypto.randomUUID(), ...baseData });
                }
                
                toast.success(`Scored ${accurateScore}/${matchedExam.itemCount} for ${studentName}`, {
                    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
                });
            } else {
                toast.info(`Scored ${accurateScore}/${matchedExam.itemCount}. Student not identified.`, {
                    description: "Student ID was missing or not found in your records."
                });
            }

            // 4. Update internal scanner results
            scannerRef.current?.updateLastResult({
                score: accurateScore,
                total: matchedExam.itemCount,
                studentName: studentName,
                examTitle: matchedExam.title,
                correctAnswers: matchedExam.answerKey
            });

        } catch (err) {
            console.error("Global Scan Error:", err);
            toast.error("An error occurred while processing the scan.");
            scannerRef.current?.reset();
        } finally {
            setIsSearchingExam(false);
        }
    }, [allExams, userEmail]);

    // ---------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------

    if (!allExams) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans relative overflow-hidden">

            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Instant Scanner</h1>
                        <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Automatic Exam Detection</p>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-4 flex flex-col gap-4 relative">

                {/* Status Bar */}
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-white/5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {isSearchingExam ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching Exam Database...</>
                    ) : (
                        <><Camera className="w-3.5 h-3.5" /> Point at any Answer Sheet</>
                    )}
                </div>

                <div className="relative w-full flex flex-col h-[75vh] min-h-[500px] max-h-[720px] bg-black rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl shadow-black/40 dark:shadow-violet-900/10 border-4 md:border-[6px] border-slate-200 dark:border-slate-900">
                    <OMRScanner
                        ref={scannerRef}
                        correctAnswers={[]}
                        onScanComplete={handleScanSuccess}
                        enabled={!isSearchingExam}
                    />
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl p-4 flex gap-4 items-start">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-blue-900 dark:text-blue-400">How to use Instant Scan:</p>
                        <p className="text-[11px] text-blue-800/70 dark:text-blue-400/60 leading-relaxed mt-1">
                            Ensure the **Exam Code** (4 digits) is shaded on the paper. The scanner will automatically find the matching quiz and save the score to the student's record.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
