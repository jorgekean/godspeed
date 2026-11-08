import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, Edit3, Trash2, X, Sparkles } from 'lucide-react';
import { db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';

const DEFAULT_SUBJECTS = ["Mathematics", "Science", "English", "History", "Filipino"];

export default function SubjectsPage() {
    const { currentUser } = useAuth();
    const userEmail = currentUser?.email!;

    const subjects = useLiveQuery(() => db.subjects
        .filter(s => s.createdBy === userEmail && !s.isDeleted)
        .sortBy('title'), [userEmail]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');

    const handleOpenModal = (subject?: any) => {
        if (subject) {
            setEditingId(subject.id);
            setTitle(subject.title);
        } else {
            setEditingId(null);
            setTitle('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setTitle('');
    };

    const handleSave = async () => {
        if (!title.trim()) return;

        if (editingId) {
            await db.subjects.update(editingId, {
                title: title.trim(),
                updatedAt: Date.now(),
                isSynced: false
            });
        } else {
            await db.subjects.add({
                id: crypto.randomUUID(),
                title: title.trim(),
                sortOrder: 0,
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string, subjectTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${subjectTitle}"?`)) {
            await db.subjects.update(id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
        }
    };

    const handleSeedDefaults = async () => {
        if (window.confirm("Seed default subjects (Math, Science, English, History, Filipino)?")) {
            const newSubjects = DEFAULT_SUBJECTS.map((s, i) => ({
                id: crypto.randomUUID(),
                title: s,
                sortOrder: i,
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            }));
            await db.subjects.bulkAdd(newSubjects);
        }
    };

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30 animate-in fade-in duration-300">
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">

                {/* ========================================== */}
                {/* 1. UNIFIED PAGE HEADER & ACTIONS */}
                {/* ========================================== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Subjects
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                                    {subjects?.length || 0} {subjects?.length === 1 ? 'Subject' : 'Subjects'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Define subject areas and disciplines for creating and filtering exams.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        {(!subjects || subjects.length === 0) && (
                            <button
                                onClick={handleSeedDefaults}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl font-bold text-sm transition-all active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Seed Defaults</span>
                            </button>
                        )}
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Subject</span>
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 2. EMPTY STATE */}
                {/* ========================================== */}
                {subjects?.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/30">
                        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <BookOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No subjects yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6">
                            Create your taught subjects or seed standard presets to organize your answer sheets and exams.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={handleSeedDefaults}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl font-bold transition-all text-sm active:scale-95"
                            >
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Seed Defaults</span>
                            </button>
                            <button
                                onClick={() => handleOpenModal()}
                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Custom Subject</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* 3. GRID */}
                {/* ========================================== */}
                {subjects && subjects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {subjects.map((subject) => (
                            <div
                                key={subject.id}
                                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group hover:ring-2 hover:ring-violet-500/10 transition-all flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors shrink-0">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                {subject.title}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500">
                                                Subject Field
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => handleOpenModal(subject)}
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-all"
                                            title="Edit Subject"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subject.id, subject.title)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete Subject"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ========================================== */}
                {/* 4. MODAL */}
                {/* ========================================== */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {editingId ? 'Edit Subject' : 'Add New Subject'}
                                        </h2>
                                        <p className="text-xs text-slate-500">Subject discipline and category</p>
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
                                        Subject Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Mathematics, Science, English"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && title.trim() && handleSave()}
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
                                    disabled={!title.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                        title.trim()
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Save Subject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
