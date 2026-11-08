import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, FolderKanban, Edit3, Trash2, X, Users, Printer, FileText, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pdf, Document } from '@react-pdf/renderer';
import { sortStudents } from '../utils/studentUtils';
import { Page20Item, Page50Item, Page100Item } from '../components/omr/OMRTemplate';

const MultiStudentDocument = ({ students, examType }: { students: any[], examType: '20' | '50' | '100' }) => (
    <Document>
        {students.map(s => {
            if (examType === '20') {
                return <Page20Item key={s.id} studentNo={s.studentNo || '00000000'} studentName={s.fullName} />;
            } else if (examType === '50') {
                return <Page50Item key={s.id} studentNo={s.studentNo || '00000000'} studentName={s.fullName} />;
            } else {
                return <Page100Item key={s.id} studentNo={s.studentNo || '00000000'} studentName={s.fullName} />;
            }
        })}
    </Document>
);

const DEFAULT_GRADE_LEVELS = ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "College 1"];

export default function SectionsPage() {
    const { currentUser } = useAuth();
    const userEmail = currentUser?.email!;

    // 1. Reactive Queries
    const sections = useLiveQuery(() => db.sections.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels
        .filter(g => g.createdBy === userEmail && !g.isDeleted)
        .sortBy('sortOrder'), [userEmail]);
    const allStudents = useLiveQuery(() => db.students.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);

    const activeGradeLevels = storedGradeLevels && storedGradeLevels.length > 0
        ? storedGradeLevels.map(g => g.title)
        : DEFAULT_GRADE_LEVELS;

    // 2. Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [gradeLevel, setGradeLevel] = useState('');
    const [sectionName, setSectionName] = useState('');

    // Print Modal State
    const [printSectionId, setPrintSectionId] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState<'20' | '50' | '100' | null>(null);

    // Fetch students only for the selected print section
    const printStudents = useLiveQuery(
        async () => {
            if (!printSectionId) return [];
            const list = await db.students.where('sectionId').equals(printSectionId).filter(s => !s.isDeleted).toArray();
            return list.sort(sortStudents);
        },
        [printSectionId]
    );

    // 3. Handlers
    const handleOpenModal = (section?: any) => {
        if (section) {
            setEditingId(section.id);
            setGradeLevel(section.gradeLevel);
            setSectionName(section.sectionName);
        } else {
            setEditingId(null);
            setGradeLevel(activeGradeLevels[0] || 'Grade 10');
            setSectionName('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setGradeLevel('');
        setSectionName('');
    };

    const handleClosePrintModal = () => {
        setPrintSectionId(null);
        setIsGenerating(null);
    };

    const handleDownload = async (type: '20' | '50' | '100') => {
        if (!printStudents || printStudents.length === 0) return;

        setIsGenerating(type);
        try {
            const currentSectionName = sections?.find(s => s.id === printSectionId)?.sectionName || 'Class';
            const fileName = `Prefilled_${type}Items_${currentSectionName}.pdf`;

            const blob = await pdf(<MultiStudentDocument students={printStudents} examType={type} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsGenerating(null);
        }
    };

    const handleSave = async () => {
        if (!gradeLevel || !sectionName.trim()) return;

        if (editingId) {
            await db.sections.update(editingId, {
                gradeLevel,
                sectionName: sectionName.trim(),
                updatedAt: Date.now(),
                isSynced: false
            });
        } else {
            await db.sections.add({
                id: crypto.randomUUID(),
                gradeLevel,
                sectionName: sectionName.trim(),
                createdAt: Date.now(),
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete the class "${name}"? This will not delete the students, but they will become unassigned.`)) {
            await db.sections.update(id, { isDeleted: true });
        }
    };

    const isReady = gradeLevel !== '' && sectionName.trim().length > 0;

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30 animate-in fade-in duration-300">
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">

                {/* ========================================== */}
                {/* 1. UNIFIED PAGE HEADER & ACTIONS */}
                {/* ========================================== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <FolderKanban className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Classes & Sections
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                                    {sections?.length || 0} {sections?.length === 1 ? 'Class' : 'Classes'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Organize your student rosters and generate pre-filled answer sheets.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Class</span>
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 2. EMPTY STATE */}
                {/* ========================================== */}
                {sections?.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/30">
                        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <FolderKanban className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No classes yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6">
                            Create your first class or section (e.g. Period 1, Class 4A, Newton) to start organizing student rosters and printing personalized sheets.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Your First Class</span>
                        </button>
                    </div>
                )}

                {/* ========================================== */}
                {/* 3. CLASSES GRID */}
                {/* ========================================== */}
                {sections && sections.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sections.map((section) => {
                            const studentCount = allStudents ? allStudents.filter(s => s.sectionId === section.id).length : 0;

                            return (
                                <div
                                    key={section.id}
                                    className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group hover:ring-2 hover:ring-violet-500/10 transition-all flex flex-col justify-between"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors shrink-0">
                                                <FolderKanban className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                    {section.sectionName}
                                                </h3>
                                                <p className="text-xs font-medium text-slate-500 truncate">
                                                    {section.gradeLevel}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                            <button
                                                onClick={() => setPrintSectionId(section.id)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                                                title="Print Pre-filled Answer Sheets"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(section)}
                                                className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-all"
                                                title="Edit Class"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(section.id, section.sectionName)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                                title="Delete Class"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-500">
                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{studentCount} {studentCount === 1 ? 'student' : 'students'}</span>
                                        </div>
                                        <button
                                            onClick={() => setPrintSectionId(section.id)}
                                            className="inline-flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 hover:underline"
                                        >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Print Sheets</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ========================================== */}
                {/* 4. PRINT MODAL OVERLAY */}
                {/* ========================================== */}
                {printSectionId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <Printer className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Print Pre-filled Sheets
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            {sections?.find(s => s.id === printSectionId)?.sectionName}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClosePrintModal}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 text-center">
                                {printStudents && printStudents.length > 0 ? (
                                    <>
                                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                                            <FileText className="w-7 h-7" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                                            Ready to Generate PDF
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-6">
                                            Found <strong>{printStudents.length}</strong> students. Each answer sheet will have pre-printed student names and bubbled student IDs.
                                        </p>

                                        <div className="flex flex-col gap-2.5">
                                            <button
                                                disabled={isGenerating !== null}
                                                onClick={() => handleDownload('20')}
                                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-xl text-sm transition-all shadow-md ${
                                                    isGenerating === '20'
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                        : isGenerating !== null
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                                                }`}
                                            >
                                                {isGenerating === '20' ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating 20-Item PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Printer className="w-4 h-4" />
                                                        Download 20-Item Sheets
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                disabled={isGenerating !== null}
                                                onClick={() => handleDownload('50')}
                                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-xl text-sm transition-all shadow-md ${
                                                    isGenerating === '50'
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                        : isGenerating !== null
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                                                }`}
                                            >
                                                {isGenerating === '50' ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating 50-Item PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Printer className="w-4 h-4" />
                                                        Download 50-Item Sheets
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                disabled={isGenerating !== null}
                                                onClick={() => handleDownload('100')}
                                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-xl text-sm transition-all shadow-md ${
                                                    isGenerating === '100'
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                        : isGenerating !== null
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
                                                }`}
                                            >
                                                {isGenerating === '100' ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Generating 100-Item PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Printer className="w-4 h-4" />
                                                        Download 100-Item Sheets
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-8">
                                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">This class has no students yet.</p>
                                        <p className="text-xs text-slate-500 mt-1">Add students in the Students tab before generating pre-filled answer sheets.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* 5. CREATE / EDIT MODAL */}
                {/* ========================================== */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                        <FolderKanban className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {editingId ? 'Edit Class' : 'Add New Class'}
                                        </h2>
                                        <p className="text-xs text-slate-500">Class or section roster</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Grade / Year Level
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={gradeLevel}
                                            onChange={(e) => setGradeLevel(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {activeGradeLevels.map(grade => (
                                                <option key={grade} value={grade}>{grade}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Class / Section Name
                                    </label>
                                    <input
                                        type="text"
                                        value={sectionName}
                                        onChange={(e) => setSectionName(e.target.value)}
                                        placeholder="e.g. Period 1, Class 4A, Newton, Rizal"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && isReady && handleSave()}
                                    />
                                </div>
                            </div>

                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button
                                    onClick={handleCloseModal}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!isReady}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                        isReady
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Save Class
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
