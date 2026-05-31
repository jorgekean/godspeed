import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { ArrowLeft, BarChart3, TrendingUp, UserCheck, Users } from 'lucide-react';

export default function ExamResultsPage() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [filterSectionId, setFilterSectionId] = useState<string>('all');

    const exam = useLiveQuery(() => db.exams.get(examId as string), [examId]);
    const sections = useLiveQuery(() => db.sections.toArray());
    const results = useLiveQuery(() => db.scanResults.where('examId').equals(examId as string).toArray(), [examId]);
    const students = useLiveQuery(() => db.students.toArray());

    if (!exam || !results) return null;

    const filteredResults = filterSectionId === 'all'
        ? results
        : results.filter(r => r.sectionId === filterSectionId);

    const totalScanned = filteredResults.length;
    const averageScore = totalScanned > 0
        ? (filteredResults.reduce((acc, r) => acc + r.score, 0) / totalScanned).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Exams
                </button>

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