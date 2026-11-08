import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, Folder, Edit3, Trash2, X, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PeriodsPage() {
    const { currentUser } = useAuth();

    // 1. Reactive Data Fetching
    const userEmail = currentUser?.email!;
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted && p.createdBy === userEmail).sortBy('createdAt'), [userEmail]);
    const sortedPeriods = periods ? [...periods].reverse() : [];

    // 2. Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');

    // 3. Handlers
    const handleOpenModal = (period?: any) => {
        if (period) {
            setEditingId(period.id);
            setName(period.name);
        } else {
            setEditingId(null);
            setName('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setName('');
    };

    const handleSave = async () => {
        if (!name.trim()) return;

        if (editingId) {
            await db.periods.update(editingId, {
                name: name.trim(),
                updatedAt: Date.now(),
                isSynced: false
            });
        } else {
            await db.periods.add({
                id: crypto.randomUUID(),
                name: name.trim(),
                createdAt: Date.now(),
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string, periodName: string) => {
        if (window.confirm(`Are you sure you want to delete the academic term "${periodName}"?`)) {
            await db.periods.update(id, { isDeleted: true });
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
                            <Folder className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Academic Terms
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                                    {sortedPeriods.length} {sortedPeriods.length === 1 ? 'Term' : 'Terms'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage grading quarters, semesters, and testing periods for your exams.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Term</span>
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 2. EMPTY STATE */}
                {/* ========================================== */}
                {sortedPeriods.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/30">
                        <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <Folder className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No academic terms yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6">
                            Create academic terms or quarters (e.g. 1st Quarter, Midterms, Fall Semester) to organize your exams and grades.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Your First Term</span>
                        </button>
                    </div>
                )}

                {/* ========================================== */}
                {/* 3. PERIODS GRID */}
                {/* ========================================== */}
                {sortedPeriods.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedPeriods.map((period) => (
                            <div
                                key={period.id}
                                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm group hover:ring-2 hover:ring-violet-500/10 transition-all flex flex-col justify-between"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors shrink-0">
                                            <Folder className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 dark:text-white truncate">
                                                {period.name}
                                            </h3>
                                            <p className="text-xs font-medium text-slate-500">
                                                Academic Term
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={() => handleOpenModal(period)}
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-xl transition-all"
                                            title="Edit Term"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(period.id, period.name)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Delete Term"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        Created {formatDate(period.createdAt)}
                                    </span>
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
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {editingId ? 'Edit Term' : 'Add New Term'}
                                        </h2>
                                        <p className="text-xs text-slate-500">Grading quarter or academic period</p>
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
                                        Term / Quarter Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. 1st Quarter, Fall 2026, Midterm"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
                                    disabled={!name.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                        name.trim()
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Save Term
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
