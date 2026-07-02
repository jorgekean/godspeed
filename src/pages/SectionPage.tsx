import React, { useState, useTransition } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, FolderKanban, Edit3, Trash2, X, Users, Printer, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { sortStudents } from '../utils/studentUtils';

// Need to import the generator components from OMRTemplate to wrap them
// Because we modified OMRTemplate.tsx to export Document20Item and Document50Item, we'll redefine a wrapper here for multi-page export
// For simplicity and avoiding massive PDF rendering freezes, we'll generate one multi-page PDF document.

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
    const sections = useLiveQuery(() => db.sections.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(), [userEmail]);
    const storedGradeLevels = useLiveQuery(() => db.gradeLevels
        .filter(g => g.createdBy === userEmail && !g.isDeleted)
        .sortBy('sortOrder'), [userEmail]);

    const activeGradeLevels = storedGradeLevels && storedGradeLevels.length > 0
        ? storedGradeLevels.map(g => g.title)
        : DEFAULT_GRADE_LEVELS;

    // 2. Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [gradeLevel, setGradeLevel] = useState('');
    const [sectionName, setSectionName] = useState('');

    // --- NEW: Print Modal State ---
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
            setGradeLevel('');
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
            const currentSectionName = sections?.find(s => s.id === printSectionId)?.sectionName || 'Section';
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
            // Update existing
            await db.sections.update(editingId, {
                gradeLevel,
                sectionName: sectionName.trim()
            });
        } else {
            // Create new
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
        // Simple confirmation before deleting
        if (window.confirm(`Are you sure you want to delete the section "${name}"? This will not delete the students, but they will lose their section assignment.`)) {
            await db.sections.update(id, { isDeleted: true });
        }
    };

    const isReady = gradeLevel !== '' && sectionName.trim().length > 0;

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">

            {/* Action Row */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Section</span>
                </button>
            </div>

            {/* Empty State */}
            {sections?.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
                        <FolderKanban className="w-8 h-8 text-violet-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No sections yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Create your first section to start organizing your students and tracking their performance.</p>
                </div>
            )}

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections?.map((section) => (
                    <div key={section.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <FolderKanban className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{section.sectionName}</h3>
                                    <p className="text-[12px] font-medium text-slate-500">{section.gradeLevel}</p>
                                </div>
                            </div>

                            {/* Actions Container */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setPrintSectionId(section.id)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="Print Pre-filled Answer Sheets"
                                >
                                    <Printer className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenModal(section)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(section.id, section.sectionName)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Quick Stats (Placeholder for future joins) */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-slate-500">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">Ready for students</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ========================================== */}
            {/* PRINT MODAL OVERLAY */}
            {/* ========================================== */}
            {printSectionId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Printer className="w-5 h-5 text-indigo-500" />
                                Print Pre-filled Sheets
                            </h2>
                            <button onClick={handleClosePrintModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 text-center">
                            {printStudents && printStudents.length > 0 ? (
                                <>
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-500/20">
                                        <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Print Pre-filled Sheets</h3>
                                    <p className="text-sm text-slate-500 mb-6">
                                        Generate PDFs for <strong>{printStudents.length}</strong> students in this section. Each sheet will be pre-filled with student details.
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            disabled={isGenerating !== null}
                                            onClick={() => handleDownload('20')}
                                            className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-md ${isGenerating === '20'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                    : isGenerating === '50'
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isGenerating === '20' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating 20-Item...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-5 h-5" />
                                                    Generate 20-Item Sheets
                                                </>
                                            )}
                                        </button>

                                        <button
                                            disabled={isGenerating !== null}
                                            onClick={() => handleDownload('50')}
                                            className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-md ${isGenerating === '50'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                    : isGenerating !== null
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isGenerating === '50' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating 50-Item...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-5 h-5" />
                                                    Generate 50-Item Sheets
                                                </>
                                            )}
                                        </button>

                                        <button
                                            disabled={isGenerating !== null}
                                            onClick={() => handleDownload('100')}
                                            className={`w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-md ${isGenerating === '100'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait shadow-none'
                                                    : isGenerating !== null
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isGenerating === '100' ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating 100-Item...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-5 h-5" />
                                                    Generate 100-Item Sheets
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8">
                                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">This section has no students yet.</p>
                                    <p className="text-xs text-slate-400 mt-2">Add students in the Students tab before printing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* CRUD MODAL OVERLAY */}
            {/* ========================================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Section' : 'Add New Section'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grade/Year Level</label>
                                <select
                                    value={gradeLevel}
                                    onChange={(e) => setGradeLevel(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Grade/Year Level</option>
                                    {activeGradeLevels.map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Section Name</label>
                                <input
                                    type="text"
                                    value={sectionName}
                                    onChange={(e) => setSectionName(e.target.value)}
                                    placeholder="e.g. Rizal, Newton, Apple"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="flex-1 py-3 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!isReady}
                                className={`flex-1 py-3 font-bold rounded-xl transition-all ${isReady ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}
                            >
                                Save Section
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}