import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, Edit3, Trash2, X, ChevronUp, ChevronDown, Save, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';

const DEFAULT_SUBJECTS = ["Math", "Science", "English"];

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
                sortOrder: 0, // Placeholder
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
        if (window.confirm("Seed default subjects (Math, Science, English)?")) {
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
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subject Registry</h2>
                    <p className="text-sm text-slate-500">Manage subjects available for your exams.</p>
                </div>
                <div className="flex gap-2">
                    {subjects?.length === 0 && (
                        <button
                            onClick={handleSeedDefaults}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Seed Defaults
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Subject</span>
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {subjects?.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No subjects yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Create subjects or seed defaults to start organizing your exams.</p>
                </div>
            )}

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {subjects?.map((subject, index) => (
                    <div key={subject.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{subject.title}</h3>
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleOpenModal(subject)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(subject.id, subject.title)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* No footer needed */}
                    </div>
                ))}
            </div>

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Subject' : 'Add New Subject'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Subject Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && title.trim() && handleSave()}
                                    placeholder="e.g. Mathematics, Physical Education"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button onClick={handleCloseModal} className="flex-1 py-3 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={!title.trim()} className={`flex-1 py-3 font-bold rounded-xl transition-all ${title.trim() ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>Save Subject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
