import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, Users, Edit3, Trash2, X, ClipboardPaste, AlertTriangle, FolderKanban, Search, UserPlus, TrendingUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sortStudents } from '../utils/studentUtils';

export default function StudentsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // ==========================================
    // 1. DATA FETCHING & FILTERING
    // ==========================================
    const userEmail = currentUser?.email!;
    const sections = useLiveQuery(() => db.sections.filter(s => !s.isDeleted && s.createdBy === userEmail).sortBy('gradeLevel'), [userEmail]);

    const [selectedFilterSection, setSelectedFilterSection] = useState<string>(() => localStorage.getItem('lastSelectedSection') || '');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (selectedFilterSection) {
            localStorage.setItem('lastSelectedSection', selectedFilterSection);
        }
    }, [selectedFilterSection]);

    useEffect(() => {
        if (sections && sections.length > 0) {
            if (!selectedFilterSection || !sections.some(s => s.id === selectedFilterSection)) {
                setSelectedFilterSection(sections[0].id);
            }
        }
    }, [sections]);

    // Fetch students for the selected section
    const students = useLiveQuery(
        async () => {
            if (!selectedFilterSection) return [];
            const list = await db.students.where('sectionId').equals(selectedFilterSection).filter(s => s.createdBy === userEmail && !s.isDeleted).toArray();
            return list.sort(sortStudents);
        },
        [selectedFilterSection, userEmail]
    );

    // Instant client-side search filtering
    const filteredStudents = React.useMemo(() => {
        if (!students) return [];
        if (!searchQuery.trim()) return students;

        const query = searchQuery.toLowerCase();
        return students.filter(s =>
            s.fullName.toLowerCase().includes(query) ||
            (s.studentNo && s.studentNo.toLowerCase().includes(query))
        );
    }, [students, searchQuery]);

    // ==========================================
    // 2. SINGLE STUDENT MODAL (Manual Create/Edit)
    // ==========================================
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [studentNo, setStudentNo] = useState('');
    const [fullName, setFullName] = useState('');
    const [formSectionId, setFormSectionId] = useState('');

    const ensureGeneralClass = async () => {
        const existing = await db.sections.where('createdBy').equals(userEmail).filter(s => !s.isDeleted).first();
        if (existing) {
            setSelectedFilterSection(existing.id);
            return existing.id;
        }

        const newId = crypto.randomUUID();
        await db.sections.add({
            id: newId,
            gradeLevel: 'General',
            sectionName: 'General Class',
            createdAt: Date.now(),
            createdBy: userEmail,
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        });
        setSelectedFilterSection(newId);
        return newId;
    };

    const openSingleModal = (student?: any) => {
        if (student) {
            setEditingId(student.id);
            setStudentNo(student.studentNo || '');
            setFullName(student.fullName);
            setFormSectionId(student.sectionId);
        } else {
            setEditingId(null);
            setStudentNo('');
            setFullName('');
            setFormSectionId(selectedFilterSection || (sections?.[0]?.id ?? ''));
        }
        setIsSingleModalOpen(true);
    };

    const handleSaveSingle = async () => {
        if (!fullName.trim()) return;

        let targetId = formSectionId;
        if (!targetId) {
            targetId = await ensureGeneralClass();
        }

        if (editingId) {
            await db.students.update(editingId, {
                studentNo: studentNo.trim(),
                fullName: fullName.trim(),
                sectionId: targetId,
                updatedAt: Date.now(),
                isSynced: false
            });
        } else {
            await db.students.add({
                id: crypto.randomUUID(),
                sectionId: targetId,
                fullName: fullName.trim(),
                studentNo: studentNo.trim(),
                createdBy: userEmail,
                updatedAt: Date.now(),
                isSynced: false,
                isDeleted: false
            });
        }
        setIsSingleModalOpen(false);
    };

    // ==========================================
    // 3. BULK IMPORT MODAL (The Magic Paste)
    // ==========================================
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [pasteData, setPasteData] = useState('');
    const [bulkSectionId, setBulkSectionId] = useState('');
    const [nextGeneratedId, setNextGeneratedId] = useState<number>(10000000);

    useEffect(() => {
        const determineNextId = async () => {
            const allStudents = await db.students.where('createdBy').equals(userEmail).toArray();
            let maxId = 10000000;
            for (const s of allStudents) {
                if (s.studentNo && /^\d{8}$/.test(s.studentNo)) {
                    const parsed = parseInt(s.studentNo, 10);
                    if (parsed >= maxId) {
                        maxId = parsed + 1;
                    }
                }
            }
            setNextGeneratedId(maxId);
        };

        if (isBulkModalOpen) {
            determineNextId();
        }
    }, [isBulkModalOpen, userEmail]);

    const parsedBulkData = React.useMemo(() => {
        if (!pasteData.trim()) return [];

        const lines = pasteData.trim().split(/\r?\n/);
        const results: { studentNo: string; fullName: string }[] = [];
        let runningId = nextGeneratedId;

        for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            const tabParts = cleanLine.split('\t').map(p => p.trim()).filter(Boolean);

            if (tabParts.length >= 2) {
                const part0IsNumeric = /^\d+$/.test(tabParts[0]);
                const part1IsNumeric = /^\d+$/.test(tabParts[1]);

                let id = '';
                let name = '';

                if (part0IsNumeric && !part1IsNumeric) {
                    id = tabParts[0].slice(0, 8);
                    name = tabParts.slice(1).join(' ');
                } else if (!part0IsNumeric && part1IsNumeric) {
                    id = tabParts[1].slice(0, 8);
                    name = tabParts[0];
                } else {
                    id = tabParts[0].slice(0, 8);
                    name = tabParts.slice(1).join(' ');
                }

                if (name) {
                    results.push({ studentNo: id, fullName: name });
                    continue;
                }
            }

            results.push({
                studentNo: String(runningId).slice(-8),
                fullName: cleanLine
            });
            runningId++;
        }

        return results;
    }, [pasteData, nextGeneratedId]);

    const handleSaveBulk = async () => {
        if (parsedBulkData.length === 0) return;

        let targetId = bulkSectionId;
        if (!targetId) {
            targetId = await ensureGeneralClass();
        }

        const newStudents = parsedBulkData.map(student => ({
            id: crypto.randomUUID(),
            sectionId: targetId,
            fullName: student.fullName,
            studentNo: student.studentNo,
            createdBy: userEmail,
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        }));

        await db.students.bulkAdd(newStudents);

        setSelectedFilterSection(targetId);
        setIsBulkModalOpen(false);
        setPasteData('');
    };

    // ==========================================
    // 4. DELETE HANDLER
    // ==========================================
    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove "${name}" from this class?`)) {
            await db.students.update(id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
        }
    };

    if (sections !== undefined && sections.length === 0) {
        return (
            <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30 animate-in fade-in duration-300">
                <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                        <Users className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Students</h2>
                    <p className="text-slate-500 max-w-md mb-6 text-sm">
                        Students are organized by class or roster. You can start immediately with a default <strong>General Class</strong> or create your own custom class.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={async () => {
                                await ensureGeneralClass();
                            }}
                            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl md:rounded-2xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <UserPlus className="w-4 h-4" />
                            <span>Start with General Class</span>
                        </button>
                        <button
                            onClick={() => navigate('/sections')}
                            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl md:rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                        >
                            Create Custom Class
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30 animate-in fade-in duration-300">
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6">

                {/* ========================================== */}
                {/* 1. UNIFIED PAGE HEADER & ACTIONS */}
                {/* ========================================== */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-500/20 shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Students & Rosters
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
                                    {students?.length || 0} {students?.length === 1 ? 'Student' : 'Students'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage student profiles, track performance analytics, and import rosters.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <button
                            onClick={() => {
                                setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                                setIsBulkModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl font-bold text-sm transition-all active:scale-95"
                        >
                            <ClipboardPaste className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            <span>Import Paste</span>
                        </button>
                        <button
                            onClick={() => openSingleModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl md:rounded-2xl font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Student</span>
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 2. FILTER & SEARCH CONTROLS */}
                {/* ========================================== */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative min-w-[220px]">
                        <select
                            value={selectedFilterSection}
                            onChange={(e) => {
                                setSelectedFilterSection(e.target.value);
                                setSearchQuery('');
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 shadow-sm appearance-none cursor-pointer"
                        >
                            {sections?.map(section => (
                                <option key={section.id} value={section.id}>
                                    📁 {section.gradeLevel} - {section.sectionName}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by student name or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ========================================== */}
                {/* 3. STUDENTS TABLE */}
                {/* ========================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                    {students?.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 text-slate-400">
                                <Users className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-1">No students in this class yet</h3>
                            <p className="text-xs text-slate-500 max-w-sm mb-5">
                                Add students manually or paste an entire roster directly from Excel or Google Sheets.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                                        setIsBulkModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
                                >
                                    Import Paste
                                </button>
                                <button
                                    onClick={() => openSingleModal()}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/20"
                                >
                                    Add Student
                                </button>
                            </div>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                            <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                            <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">No results found for "{searchQuery}"</p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="mt-3 text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline"
                            >
                                Clear search filter
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                                        <th className="py-3.5 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider w-36">Student No.</th>
                                        <th className="py-3.5 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</th>
                                        <th className="py-3.5 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right w-28">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="py-3.5 px-5 text-sm font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                                {student.studentNo || '—'}
                                            </td>
                                            <td className="py-3.5 px-5 text-sm font-bold text-slate-900 dark:text-white">
                                                {student.fullName}
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => navigate(`/students/${student.id}`)}
                                                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
                                                        title="View Performance Analytics"
                                                    >
                                                        <TrendingUp className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openSingleModal(student)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                        title="Edit Student"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student.id, student.fullName)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ========================================== */}
                {/* 4. SINGLE STUDENT MODAL */}
                {/* ========================================== */}
                {isSingleModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {editingId ? 'Edit Student' : 'Add Student'}
                                        </h2>
                                        <p className="text-xs text-slate-500">Student roster assignment</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSingleModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Class / Section
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formSectionId}
                                            onChange={(e) => setFormSectionId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {sections?.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.gradeLevel} - {s.sectionName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Student Number (Max 8 Digits)
                                    </label>
                                    <input
                                        type="text"
                                        value={studentNo}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || (/^\d+$/.test(val) && val.length <= 8)) {
                                                setStudentNo(val);
                                            }
                                        }}
                                        placeholder="e.g. 20260001 (Optional)"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1 ml-1">
                                        Used for optical bubble recognition. If left blank, one will be generated automatically.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="e.g. Dela Cruz, Juan"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && fullName.trim() && handleSaveSingle()}
                                    />
                                </div>
                            </div>

                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button
                                    onClick={() => setIsSingleModalOpen(false)}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSingle}
                                    disabled={!fullName.trim()}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                        fullName.trim()
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Save Student
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* 5. BULK IMPORT MODAL */}
                {/* ========================================== */}
                {isBulkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                        <ClipboardPaste className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Import Students from Excel / Sheets
                                        </h2>
                                        <p className="text-xs text-slate-500">Paste student names and IDs in bulk</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setIsBulkModalOpen(false); setPasteData(''); }}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Target Class
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={bulkSectionId}
                                            onChange={(e) => setBulkSectionId(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {sections?.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.gradeLevel} - {s.sectionName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Paste Data from Spreadsheet
                                    </label>
                                    <textarea
                                        value={pasteData}
                                        onChange={(e) => setPasteData(e.target.value)}
                                        placeholder={"Format 1: [Student No] [TAB] [Full Name]\nFormat 2: [Full Name] (one per line)"}
                                        className="w-full h-36 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm whitespace-pre font-mono"
                                    />
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2 ml-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        <span>Student numbers are capped at 8 digits. Missing numbers are assigned automatically.</span>
                                    </p>
                                </div>

                                {/* Live Preview */}
                                {parsedBulkData.length > 0 && (
                                    <div className="mt-3 border rounded-2xl overflow-hidden border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20">
                                        <div className="bg-violet-100/60 dark:bg-violet-900/30 px-4 py-2.5 text-xs font-bold text-violet-700 dark:text-violet-300 flex justify-between items-center">
                                            <span>Roster Preview</span>
                                            <span className="px-2 py-0.5 rounded-full bg-violet-200 dark:bg-violet-800/50 text-[11px]">
                                                {parsedBulkData.length} detected
                                            </span>
                                        </div>
                                        <div className="max-h-36 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800">
                                            {parsedBulkData.slice(0, 5).map((d, i) => (
                                                <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-4 py-1.5 px-3">
                                                    <span className="w-24 font-mono font-bold text-violet-600 dark:text-violet-400">
                                                        {d.studentNo || '(Auto-ID)'}
                                                    </span>
                                                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                                                        {d.fullName}
                                                    </span>
                                                </div>
                                            ))}
                                            {parsedBulkData.length > 5 && (
                                                <div className="text-xs text-center text-slate-400 py-2">
                                                    ...and {parsedBulkData.length - 5} more students
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button
                                    onClick={() => { setIsBulkModalOpen(false); setPasteData(''); }}
                                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBulk}
                                    disabled={parsedBulkData.length === 0}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                        parsedBulkData.length > 0
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    Import {parsedBulkData.length > 0 ? `${parsedBulkData.length} ` : ''}Students
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
