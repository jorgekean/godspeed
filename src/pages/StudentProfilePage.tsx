import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ArrowLeft, User, TrendingUp, Calendar, Hash, FileText, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentProfilePage() {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const student = useLiveQuery(() => db.students.get(studentId as string), [studentId]);
    const section = useLiveQuery(() => student?.sectionId ? db.sections.get(student.sectionId) : undefined, [student?.sectionId]);
    const results = useLiveQuery(() => db.scanResults.where('studentId').equals(studentId as string).filter(r => !r.isDeleted).toArray(), [studentId]);
    const exams = useLiveQuery(() => db.exams.toArray(), []);

    const enrichedResults = useMemo(() => {
        if (!results || !exams) return [];
        return results.map(res => {
            const exam = exams.find(e => e.id === res.examId);
            return {
                ...res,
                examTitle: exam?.title || 'Unknown Exam',
                subject: exam?.subject || 'Unknown Subject',
                percentage: res.total > 0 ? (res.score / res.total) * 100 : 0,
                scannedAtDate: new Date(res.scannedAt).toLocaleDateString()
            };
        }).sort((a, b) => a.scannedAt - b.scannedAt);
    }, [results, exams]);

    const chartData = useMemo(() => {
        return enrichedResults.map(r => ({
            name: r.examTitle,
            percentage: parseFloat(r.percentage.toFixed(1)),
            date: r.scannedAtDate
        }));
    }, [enrichedResults]);

    const averageScore = useMemo(() => {
        if (enrichedResults.length === 0) return 0;
        const sum = enrichedResults.reduce((acc, curr) => acc + curr.percentage, 0);
        return sum / enrichedResults.length;
    }, [enrichedResults]);

    if (student === undefined) {
        return <div className="p-8">Loading...</div>;
    }
    if (student === null) {
        return <div className="p-8">Student not found</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans">
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Student Profile</h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
                
                {/* Profile Header */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/50 dark:border-slate-800 flex flex-col sm:flex-row gap-6 items-start sm:items-center animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                        <User className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student.fullName}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1.5"><Hash className="w-4 h-4"/> ID: {student.studentNo || 'N/A'}</div>
                            {section && <div className="flex items-center gap-1.5"><FileText className="w-4 h-4"/> {section.gradeLevel} - {section.sectionName}</div>}
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-bottom-6 duration-500">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Exams Taken</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{enrichedResults.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-800 flex items-center gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Score</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{averageScore.toFixed(1)}%</h3>
                        </div>
                    </div>
                </div>

                {/* Performance Chart */}
                {enrichedResults.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 shadow-sm border border-slate-200/50 dark:border-slate-800 animate-in slide-in-from-bottom-8 duration-500">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Performance Trend</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                    <YAxis domain={[0, 100]} tick={{fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#c4b5fd' }}
                                    />
                                    <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Exam History Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/50 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Exam History</h3>
                    </div>
                    {enrichedResults.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No exams recorded for this student yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Exam Title</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                        <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrichedResults.map((r) => (
                                        <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {r.scannedAtDate}</div>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{r.examTitle}</td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">{r.subject}</td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-slate-900 dark:text-white">{r.score} / {r.total}</span>
                                                    <span className={`text-xs font-medium ${r.percentage >= 75 ? 'text-emerald-500' : r.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                                        {r.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
