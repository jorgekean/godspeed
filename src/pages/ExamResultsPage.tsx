import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEMO_USER_ID } from '../services/db';
import { ArrowLeft, BarChart3, TrendingUp, UserCheck, FileDown, Loader2 } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ItemAnalysisPDF, type ItemAnalysisData } from '../components/omr/ItemAnalysisPDF';
import { useAuth } from '../contexts/AuthContext';

export default function ExamResultsPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [filterSectionId, setFilterSectionId] = useState<string>('all');
    const [isGenerating, setIsGenerating] = useState(false);

    const userEmail = currentUser?.email || DEMO_USER_ID;

    const exam = useLiveQuery(async () => {
        const e = await db.exams.get(examId as string);
        if (e && e.createdBy === userEmail) return e;
        return null;
    }, [examId, userEmail]);

    const sections = useLiveQuery(() => db.sections.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);
    const results = useLiveQuery(() => db.scanResults.where('examId').equals(examId as string).filter(r => r.createdBy === userEmail).toArray(), [examId, userEmail]);
    const students = useLiveQuery(() => db.students.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);

    const analysisData = useMemo(() => {
        if (!exam || !results || results.length === 0) return [];

        const currentResults = filterSectionId === 'all'
            ? results
            : results.filter(r => r.sectionId === filterSectionId);

        if (currentResults.length === 0) return [];

        const totalStudents = currentResults.length;
        const itemCount = exam.itemCount;
        const answerKey = exam.answerKey;

        const analysis: ItemAnalysisData[] = [];
        for (let i = 0; i < itemCount; i++) {
            const itemNumber = i + 1;
            const correctAnswer = answerKey[i] as string;

            let correctCount = 0;
            const distractors: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

            currentResults.forEach(res => {
                const studentAnswer = res.answers[itemNumber.toString()];
                if (studentAnswer === correctAnswer) {
                    correctCount++;
                }
                if (studentAnswer && studentAnswer in distractors) {
                    distractors[studentAnswer]++;
                }
            });

            analysis.push({
                itemNumber,
                correctAnswer,
                competency: `Item ${itemNumber}`, // Placeholder
                percentPassed: Math.round((correctCount / totalStudents) * 100),
                distractors: {
                    A: Math.round((distractors.A / totalStudents) * 100),
                    B: Math.round((distractors.B / totalStudents) * 100),
                    C: Math.round((distractors.C / totalStudents) * 100),
                    D: Math.round((distractors.D / totalStudents) * 100),
                }
            });
        }
        return analysis;
    }, [exam, results, filterSectionId]);

    if (!exam || !results) return null;

    const filteredResults = filterSectionId === 'all'
        ? results
        : results.filter(r => r.sectionId === filterSectionId);

    const totalScanned = filteredResults.length;
    const averageScore = totalScanned > 0
        ? (filteredResults.reduce((acc, r) => acc + r.score, 0) / totalScanned).toFixed(1)
        : 0;

    const currentSectionName = filterSectionId === 'all' 
        ? 'All Sections' 
        : sections?.find(s => s.id === filterSectionId)?.sectionName || 'Selected Section';

    const handleDownload = async () => {
        if (!exam || totalScanned === 0) return;
        
        setIsGenerating(true);
        try {
            const fileName = `Item_Analysis_${exam.title.replace(/\s+/g, '_')}_${currentSectionName}.pdf`;
            const doc = (
                <ItemAnalysisPDF
                    title={exam.title}
                    sectionName={currentSectionName}
                    totalStudents={totalScanned}
                    averageScore={averageScore.toString()}
                    data={analysisData}
                />
            );
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Exams
                    </button>

                    {totalScanned > 0 && (
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileDown className="w-5 h-5" />
                            )}
                            {isGenerating ? 'Preparing Report...' : 'Download Item Analysis'}
                        </button>
                    )}
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">{exam.title}</h1>

                    {/* SECTION FILTERS - Dark Mode Styled */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                            onClick={() => setFilterSectionId('all')}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filterSectionId === 'all'
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            All Sections
                        </button>
                        {sections?.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setFilterSectionId(s.id)}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filterSectionId === s.id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {s.sectionName}
                            </button>
                        ))}
                    </div>
                </div>

                {/* STATS CARDS - Dark Mode Styled */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <BarChart3 className="w-6 h-6 text-violet-500 mb-2" />
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{averageScore}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalScanned}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Papers Graded</p>
                    </div>
                </div>

                {/* RESULTS TABLE - Dark Mode Styled */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                        {filterSectionId === 'all' ? 'All Results' : sections?.find(s => s.id === filterSectionId)?.sectionName}
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredResults.length === 0 && <p className="p-8 text-center text-slate-400 dark:text-slate-600">No results found.</p>}
                        {filteredResults.map(res => {
                            const student = students?.find(s => s.id === res.studentId);
                            return (
                                <div key={res.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                            <UserCheck className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{student?.fullName || "Unknown Student"}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-lg text-slate-900 dark:text-white">{res.score} <span className="text-sm text-slate-400 dark:text-slate-500">/ {res.total}</span></p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}