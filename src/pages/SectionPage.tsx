import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, FolderKanban, Edit3, Trash2, X, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


const GRADE_LEVELS = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

export default function SectionsPage() {
    const { currentUser } = useAuth();

    // 1. Reactive Data Fetching
    // Sort by grade level, then by section name for a clean list
    const sections = useLiveQuery(() =>
        db.sections.orderBy('gradeLevel').toArray()
    );

    // 2. Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [gradeLevel, setGradeLevel] = useState('');
    const [sectionName, setSectionName] = useState('');

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
                createdBy: currentUser?.email!
            });
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string, name: string) => {
        // Simple confirmation before deleting
        if (window.confirm(`Are you sure you want to delete the section "${name}"? This will not delete the students, but they will lose their section assignment.`)) {
            await db.sections.delete(id);
        }
    };

    const isReady = gradeLevel !== '' && sectionName.trim().length > 0;

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">

            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Sections
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        Manage your classes and advisory groups.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Section</span>
                </button>
            </header>

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
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Grade Level</label>
                                <select
                                    value={gradeLevel}
                                    onChange={(e) => setGradeLevel(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                                >
                                    <option value="" disabled>Select Grade Level</option>
                                    {GRADE_LEVELS.map(grade => (
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