import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, CalendarDays, Edit3, Trash2, X, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PeriodsPage() {
    const { currentUser } = useAuth();

    // 1. Reactive Data Fetching
    const periods = useLiveQuery(() => db.periods.filter(p => !p.isDeleted).sortBy('startDate'));

    // 2. Modal & Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 3. Handlers
    const handleOpenModal = (period?: any) => {
        if (period) {
            setEditingId(period.id);
            setName(period.name);
            setStartDate(new Date(period.startDate).toISOString().split('T')[0]);
            setEndDate(new Date(period.endDate).toISOString().split('T')[0]);
        } else {
            setEditingId(null);
            setName('');
            const now = new Date();
            setStartDate(now.toISOString().split('T')[0]);
            const nextMonth = new Date();
            nextMonth.setMonth(now.getMonth() + 1);
            setEndDate(nextMonth.toISOString().split('T')[0]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setName('');
        setStartDate('');
        setEndDate('');
    };

    const handleSave = async () => {
        if (!name.trim() || !startDate || !endDate) return;

        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime();

        if (editingId) {
            await db.periods.update(editingId, {
                name: name.trim(),
                startDate: startTimestamp,
                endDate: endTimestamp,
            });
        } else {
            await db.periods.add({
                id: crypto.randomUUID(),
                name: name.trim(),
                startDate: startTimestamp,
                endDate: endTimestamp,
                createdAt: Date.now(),
                createdBy: currentUser?.email!,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });
        }
        handleCloseModal();
    };

    const handleDelete = async (id: string, periodName: string) => {
        if (window.confirm(`Are you sure you want to delete the period "${periodName}"?`)) {
            await db.periods.update(id, { isDeleted: true });
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isCurrentPeriod = (start: number, end: number) => {
        const now = Date.now();
        return now >= start && now <= end;
    };

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
            {/* Action Row */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Period</span>
                </button>
            </div>

            {/* Empty State */}
            {periods?.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays className="w-8 h-8 text-violet-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No periods yet</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Create grading periods (e.g., 1st Quarter, Midterms) to organize your exams and grades.</p>
                </div>
            )}

            {/* Periods List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periods?.map((period) => {
                    const isActive = isCurrentPeriod(period.startDate, period.endDate);
                    return (
                        <div key={period.id} className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm group transition-all ${isActive ? 'border-violet-500 ring-1 ring-violet-500/50' : 'border-slate-200/50 dark:border-white/5'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isActive ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                        <CalendarDays className={`w-5 h-5 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 dark:text-slate-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            {period.name}
                                            {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                        </h3>
                                        <p className="text-[12px] font-medium text-slate-500 flex items-center gap-1">
                                            {isActive ? (
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> Ongoing Period
                                                </span>
                                            ) : (
                                                'Grading Period'
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(period)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(period.id, period.name)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</p>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatDate(period.startDate)}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</p>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatDate(period.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CRUD Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                {editingId ? 'Edit Period' : 'Add New Period'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Period Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. 1st Quarter, Midterms"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                            <button onClick={handleCloseModal} className="flex-1 py-3 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={!name.trim() || !startDate || !endDate} className={`flex-1 py-3 font-bold rounded-xl transition-all ${name.trim() && startDate && endDate ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-500/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'}`}>Save Period</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}