import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ArrowLeft, BarChart3, TrendingUp, UserCheck, FileDown, Loader2, List, LayoutGrid, Target, Award, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Workbook } from 'exceljs';
import { ItemAnalysisPDF, type ItemAnalysisData } from '../components/omr/ItemAnalysisPDF';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'summary' | 'detailed' | 'mastery';

export default function ExamResultsPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [filterSectionId, setFilterSectionId] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('summary');
    const [isGenerating, setIsGenerating] = useState(false);

    const userEmail = currentUser?.email!;

    const exam = useLiveQuery(async () => {
        const e = await db.exams.get(examId as string);
        if (e && e.createdBy === userEmail) return e;
        return null;
    }, [examId, userEmail]);

    const periods = useLiveQuery(() => db.periods.filter(p => p.createdBy === userEmail && !p.isDeleted).toArray(), [userEmail]);
    const subjects = useLiveQuery(() => db.subjects.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);
    const gradeLevels = useLiveQuery(() => db.gradeLevels.filter(g => g.createdBy === userEmail && !g.isDeleted).toArray(), [userEmail]);
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
        const compMap = exam.competencyMap || {};

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
                competency: compMap[itemNumber.toString()] || `Item ${itemNumber}`,
                percentPassed: Math.round((correctCount / totalStudents) * 100),
                correctCount,
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

    const masteryData = useMemo(() => {
        if (analysisData.length === 0) return [];

        // Group analysis items by competency
        const groups: Record<string, { totalPercent: number, count: number, items: number[] }> = {};

        analysisData.forEach(item => {
            const name = item.competency;
            if (!groups[name]) groups[name] = { totalPercent: 0, count: 0, items: [] };
            groups[name].totalPercent += item.percentPassed;
            groups[name].count += 1;
            groups[name].items.push(item.itemNumber);
        });

        return Object.entries(groups).map(([name, data]) => ({
            name,
            mastery: Math.round(data.totalPercent / data.count),
            itemCount: data.count,
            items: data.items
        })).sort((a, b) => a.mastery - b.mastery);
    }, [analysisData]);

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

    const handleExportExcel = async () => {
        if (!exam || filteredResults.length === 0) return;

        const workbook = new Workbook();
        const sheet = workbook.addWorksheet('Detailed Report');

        const periodName = periods?.find(p => p.id === exam.periodId)?.name || 'N/A';
        const subjectName = subjects?.find(s => s.id === exam.subject)?.title || exam.subject;
        const sectionInfo = filterSectionId === 'all' 
            ? `${exam.gradeLevel} - All Sections`
            : `${exam.gradeLevel} - ${currentSectionName}`;

        // 1. Add Header Information
        const headerRows = [
            ['GRADE & SECTION:', sectionInfo],
            ['TOTAL TAKERS:', filteredResults.length],
            ['FOLDER:', periodName],
            ['SUBJECT:', subjectName],
            ['TOTAL ITEMS:', exam.itemCount],
        ];

        headerRows.forEach((row, i) => {
            const r = sheet.getRow(i + 1);
            r.getCell(1).value = row[0];
            r.getCell(1).font = { bold: true, color: { argb: 'FF4F46E5' } }; // Indigo color
            r.getCell(2).value = row[1];
            r.getCell(2).font = { bold: true };
        });

        // 2. Add Table Headers
        const headerRowIndex = 7;
        const tableHeaders = ['Student', 'Score', ...Array.from({ length: exam.itemCount }, (_, i) => `Q${i + 1}`)];
        const headerRow = sheet.getRow(headerRowIndex);
        
        tableHeaders.forEach((text, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = text;
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E293B' } // Slate-800
            };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // 3. Add Student Data
        filteredResults.forEach((res, i) => {
            const student = students?.find(s => s.id === res.studentId);
            const rowIndex = headerRowIndex + 1 + i;
            const r = sheet.getRow(rowIndex);
            
            r.getCell(1).value = student?.fullName || "Unknown";
            r.getCell(2).value = res.score;
            r.getCell(2).font = { bold: true };
            r.getCell(2).alignment = { horizontal: 'center' };

            for (let q = 0; q < exam.itemCount; q++) {
                const qNum = (q + 1).toString();
                const studentAns = res.answers[qNum];
                const correctAns = exam.answerKey[q];
                const isCorrect = studentAns === correctAns;
                const cell = r.getCell(q + 3);

                cell.value = studentAns === 'BLANK' ? '-' : (studentAns || '-');
                cell.alignment = { horizontal: 'center' };
                
                if (studentAns && studentAns !== 'BLANK') {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: isCorrect ? 'FFDCFCE7' : 'FFFEE2E2' } // Green-100 or Red-100
                    };
                    cell.font = { color: { argb: isCorrect ? 'FF166534' : 'FF991B1B' } }; // Green-800 or Red-800
                }
            }

            // Add borders to the row
            r.eachCell({ includeEmpty: false }, (cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // 4. Add Summary Rows
        const summaryStartRow = headerRowIndex + 1 + filteredResults.length;
        
        // Total Correct Row
        const totalCorrectRow = sheet.getRow(summaryStartRow);
        totalCorrectRow.getCell(1).value = 'Total Correct';
        totalCorrectRow.getCell(1).font = { bold: true };
        totalCorrectRow.getCell(2).value = `Mean: ${averageScore}`;
        totalCorrectRow.getCell(2).font = { bold: true };
        
        analysisData.forEach((item, i) => {
            const cell = totalCorrectRow.getCell(i + 3);
            cell.value = item.correctCount;
            cell.font = { bold: true };
            cell.alignment = { horizontal: 'center' };
        });

        // Item MPS Row
        const itemMPSRow = sheet.getRow(summaryStartRow + 1);
        itemMPSRow.getCell(1).value = 'Item MPS (%)';
        itemMPSRow.getCell(1).font = { bold: true };
        itemMPSRow.getCell(2).value = `Overall: ${((parseFloat(averageScore.toString()) / exam.itemCount) * 100).toFixed(1)}%`;
        itemMPSRow.getCell(2).font = { bold: true };

        analysisData.forEach((item, i) => {
            const cell = itemMPSRow.getCell(i + 3);
            cell.value = `${item.percentPassed}%`;
            cell.font = { bold: true, color: { argb: 'FF7C3AED' } }; // Violet-600
            cell.alignment = { horizontal: 'center' };
        });

        // Formatting summary rows
        [totalCorrectRow, itemMPSRow].forEach(r => {
            r.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                if (colNumber <= exam.itemCount + 2) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF8FAFC' } // Slate-50
                    };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                }
            });
        });

        // 5. Adjust Column Widths
        sheet.getColumn(1).width = 30; // Student Name
        sheet.getColumn(2).width = 12; // Score
        for (let i = 3; i <= exam.itemCount + 2; i++) {
            sheet.getColumn(i).width = 6;
        }

        // Generate and download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Detailed_Report_${exam.title.replace(/\s+/g, '_')}_${currentSectionName}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" /> Back to Exams
                    </button>

                    {totalScanned > 0 && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('summary')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'summary' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <List className="w-4 h-4" /> Summary
                                </button>
                                <button
                                    onClick={() => setViewMode('mastery')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'mastery' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <Target className="w-4 h-4" /> Mastery
                                </button>
                                <button
                                    onClick={() => setViewMode('detailed')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'detailed' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" /> Detailed
                                </button>
                            </div>

                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <FileDown className="w-5 h-5" />
                                )}
                                {isGenerating ? 'Preparing Report...' : 'Download Item Analysis'}
                            </button>
                        </div>
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

                {viewMode === 'summary' && (
                    /* SUMMARY RESULTS LIST */
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
                )}

                {viewMode === 'mastery' && (
                    /* MASTERY BY COMPETENCY VIEW */
                    <div className="space-y-4">
                        {masteryData.length === 0 && <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center text-slate-400">No competency data mapped.</div>}
                        {masteryData.map((comp, idx) => {
                            const isLow = comp.mastery < 50;
                            const isHigh = comp.mastery >= 85;

                            return (
                                <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${isLow ? 'bg-red-50 dark:bg-red-500/10' : isHigh ? 'bg-green-50 dark:bg-green-500/10' : 'bg-violet-50 dark:bg-violet-500/10'}`}>
                                                {isLow ? <AlertCircle className="w-5 h-5 text-red-500" /> : isHigh ? <Award className="w-5 h-5 text-green-500" /> : <Target className="w-5 h-5 text-violet-500" />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{comp.name}</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    Items: {comp.items.join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${isLow ? 'text-red-500' : isHigh ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                                {comp.mastery}%
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</p>
                                        </div>
                                    </div>

                                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isLow ? 'bg-red-500' : isHigh ? 'bg-green-500' : 'bg-violet-500'}`}
                                            style={{ width: `${comp.mastery}%` }}
                                        />
                                    </div>

                                    <div className="mt-4 flex justify-between items-center text-[11px] font-bold">
                                        <span className={isLow ? 'text-red-500' : 'text-slate-400'}>
                                            {isLow ? 'Intervention Recommended' : isHigh ? 'Exceptional Mastery' : 'Steady Progress'}
                                        </span>
                                        <span className="text-slate-400">{comp.itemCount} items mapped</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {viewMode === 'detailed' && (
                    /* DETAILED RESULTS TABLE */
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                                {filterSectionId === 'all' ? 'Detailed Breakdown' : sections?.find(s => s.id === filterSectionId)?.sectionName + ' - Detailed'}
                            </span>
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                            >
                                <FileSpreadsheet className="w-4 h-4" /> Export to Excel
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Student</th>
                                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Score</th>
                                        {Array.from({ length: exam.itemCount }).map((_, i) => (
                                            <th key={i} className="p-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center min-w-[40px]">
                                                Q{i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredResults.map(res => {
                                        const student = students?.find(s => s.id === res.studentId);
                                        return (
                                            <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 whitespace-nowrap border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                    {student?.fullName || "Unknown"}
                                                </td>
                                                <td className="p-4 font-black text-center text-slate-900 dark:text-white">
                                                    {res.score}
                                                </td>
                                                {Array.from({ length: exam.itemCount }).map((_, i) => {
                                                    const qNum = (i + 1).toString();
                                                    const studentAns = res.answers[qNum];
                                                    const correctAns = exam.answerKey[i];
                                                    const isCorrect = studentAns === correctAns;

                                                    return (
                                                        <td key={i} className="p-1 text-center">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto text-[11px] font-bold transition-all ${!studentAns || studentAns === 'BLANK'
                                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                                    : isCorrect
                                                                        ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30'
                                                                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                                                                }`}>
                                                                {studentAns === 'BLANK' ? '—' : studentAns || '—'}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td className="p-4 font-bold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                                            Total Correct
                                        </td>
                                        <td className="p-4 font-black text-center text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-700/50">
                                            Mean: {averageScore}
                                        </td>
                                        {analysisData.map((item, i) => (
                                            <td key={i} className="p-1 text-center font-bold text-slate-900 dark:text-white">
                                                {item.correctCount}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-bold text-slate-500 dark:text-slate-400 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 whitespace-nowrap border-r border-slate-100 dark:border-slate-800">
                                            Item MPS (%)
                                        </td>
                                        <td className="p-4 font-black text-center text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-700/50">
                                            Overall: {((parseFloat(averageScore.toString()) / exam.itemCount) * 100).toFixed(1)}%
                                        </td>
                                        {analysisData.map((item, i) => (
                                            <td key={i} className="p-1 text-center font-bold text-violet-600 dark:text-violet-400">
                                                {item.percentPassed}%
                                            </td>
                                        ))}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}