import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Plus, Users, Edit3, Trash2, X, ClipboardPaste, AlertTriangle, FolderKanban, Search, UserPlus, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function StudentsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // ==========================================
    // 1. DATA FETCHING & FILTERING
    // ==========================================
    const userEmail = currentUser?.email!;
    const sections = useLiveQuery(() => db.sections.filter(s => !s.isDeleted && s.createdBy === userEmail).sortBy('gradeLevel'), [userEmail]);

    const [selectedFilterSection, setSelectedFilterSection] = useState<string>(() => localStorage.getItem('lastSelectedSection') || '');
    const [searchQuery, setSearchQuery] = useState(''); // NEW: Search state

    useEffect(() => {
        if (selectedFilterSection) {
            localStorage.setItem('lastSelectedSection', selectedFilterSection);
        }
    }, [selectedFilterSection]);

    useEffect(() => {
        if (sections && sections.length > 0) {
            // If there's no selected section, or if the stored section was deleted
            if (!selectedFilterSection || !sections.some(s => s.id === selectedFilterSection)) {
                setSelectedFilterSection(sections[0].id);
            }
        }
    }, [sections]);

    // Fetch students for the selected section
    const students = useLiveQuery(
        () => {
            if (!selectedFilterSection) return [];
            return db.students.where('sectionId').equals(selectedFilterSection).filter(s => s.createdBy === userEmail && !s.isDeleted).toArray();
        },
        [selectedFilterSection, userEmail]
    );

    // NEW: Instant client-side search filtering
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
        if (!fullName.trim() || !formSectionId) return;

        if (editingId) {
            await db.students.update(editingId, {
                studentNo: studentNo.trim(),
                fullName: fullName.trim(),
                sectionId: formSectionId
            });
        } else {
            await db.students.add({
                id: crypto.randomUUID(),
                sectionId: formSectionId,
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

    const parsedBulkData = React.useMemo(() => {
        if (!pasteData.trim()) return [];
        return pasteData.split('\n').filter(row => row.trim() !== '').map(row => {
            const columns = row.split('\t').map(col => col.trim());
            if (columns.length >= 2) {
                // Strip non-digits and truncate to max 8 characters
                const rawId = columns[0].replace(/\D/g, ''); 
                const validId = rawId.substring(0, 8);
                return { studentNo: validId, fullName: columns[1] };
            }
            return { studentNo: '', fullName: columns[0] };
        });
    }, [pasteData]);

    const handleSaveBulk = async () => {
        if (parsedBulkData.length === 0 || !bulkSectionId) return;

        const newStudents = parsedBulkData.map(student => ({
            id: crypto.randomUUID(),
            sectionId: bulkSectionId,
            fullName: student.fullName,
            studentNo: student.studentNo,
            createdBy: userEmail,
            updatedAt: Date.now(),
            isSynced: false,
            isDeleted: false
        }));

        await db.students.bulkAdd(newStudents);

        setSelectedFilterSection(bulkSectionId);
        setIsBulkModalOpen(false);
        setPasteData('');
    };

    // ==========================================
    // 4. DELETE HANDLER
    // ==========================================
    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove ${name}?`)) {
            await db.students.update(id, { isDeleted: true });
        }
    };

    if (sections !== undefined && sections.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
                <FolderKanban className="w-16 h-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create a Section First</h2>
                <p className="text-slate-500 max-w-sm mb-6">You need to create at least one section before you can add students.</p>
            </div>
        );
    }

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                            setIsBulkModalOpen(true);
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-medium active:scale-95 transition-all"
                    >
                        <ClipboardPaste className="w-4 h-4" />
                        <span className="text-sm">Import Paste</span>
                    </button>
                    <button
                        onClick={() => openSingleModal()}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm">Add</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                    value={selectedFilterSection}
                    onChange={(e) => {
                        setSelectedFilterSection(e.target.value);
                        setSearchQuery(''); // Reset search when changing sections
                    }}
                    className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-semibold shadow-sm"
                >
                    {sections?.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.gradeLevel} - {section.sectionName}
                        </option>
                    ))}
                </select>

                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Students List */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                {students?.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">No students in this section.</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                        <p className="text-slate-500 font-medium">No results found for "{searchQuery}"</p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 text-sm text-violet-600 font-medium hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Student No.</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</th>
                                    <th className="p-4 w-24"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-4 text-sm font-medium text-slate-500">{student.studentNo || '—'}</td>
                                        <td className="p-4 text-sm font-bold text-slate-900 dark:text-white">{student.fullName}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => navigate(`/students/${student.id}`)} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg" title="View Performance">
                                                    <TrendingUp className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => openSingleModal(student)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg" title="Edit Student">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(student.id, student.fullName)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg" title="Delete Student">
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

            {/* Manual Edit/Create Modal - Same as before */}
            {isSingleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Student' : 'Add Student'}</h2>
                            <button onClick={() => setIsSingleModalOpen(false)} className="p-2 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Section</label>
                                <select value={formSectionId} onChange={(e) => setFormSectionId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50">
                                    {sections?.map(s => <option key={s.id} value={s.id}>{s.gradeLevel} - {s.sectionName}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Student No. (Optional)</label>
                                <input 
                                    type="text" 
                                    value={studentNo} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        // Allow only digits (integers) and restrict to max 8 characters
                                        if (val === '' || (/^\d+$/.test(val) && val.length <= 8)) {
                                            setStudentNo(val);
                                        }
                                    }} 
                                    placeholder="e.g. 2026001 (Max 8 digits)" 
                                    className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Dela Cruz, Juan" className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50" autoFocus />
                            </div>
                        </div>
                        <div className="p-5 border-t bg-slate-50 flex gap-3">
                            <button onClick={() => setIsSingleModalOpen(false)} className="flex-1 py-3 font-medium text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
                            <button onClick={handleSaveSingle} disabled={!fullName.trim()} className={`flex-1 py-3 font-bold rounded-xl text-white ${fullName.trim() ? 'bg-violet-600' : 'bg-slate-300'}`}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal - Same as before */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[24px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import Students</h2>
                                <p className="text-xs text-slate-500">Copy from Excel, Paste below.</p>
                            </div>
                            <button onClick={() => { setIsBulkModalOpen(false); setPasteData(''); }} className="p-2 text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-full"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="p-5 space-y-4 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Target Section</label>
                                <select value={bulkSectionId} onChange={(e) => setBulkSectionId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50">
                                    {sections?.map(s => <option key={s.id} value={s.id}>{s.gradeLevel} - {s.sectionName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Paste Data Here</label>
                                <textarea
                                    value={pasteData}
                                    onChange={(e) => setPasteData(e.target.value)}
                                    placeholder="Format 1: [Student No] [TAB] [Full Name]&#10;Format 2: [Full Name]"
                                    className="w-full h-32 bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500/50 text-sm whitespace-pre"
                                />
                                <p className="text-xs text-slate-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Ensure names are formatted nicely in Excel before pasting.</p>
                            </div>

                            {/* Live Preview */}
                            {parsedBulkData.length > 0 && (
                                <div className="mt-4 border rounded-xl overflow-hidden border-violet-200 bg-violet-50/50">
                                    <div className="bg-violet-100/50 px-4 py-2 text-xs font-bold text-violet-700 flex justify-between">
                                        <span>Preview ({parsedBulkData.length} detected)</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto p-2">
                                        {parsedBulkData.slice(0, 5).map((d, i) => (
                                            <div key={i} className="text-xs text-slate-600 flex gap-4 py-1 px-2 border-b last:border-0 border-slate-200">
                                                <span className="w-20 font-mono text-slate-400">{d.studentNo || '(No ID)'}</span>
                                                <span className="font-medium text-slate-900">{d.fullName}</span>
                                            </div>
                                        ))}
                                        {parsedBulkData.length > 5 && <div className="text-xs text-center text-slate-400 py-2">...and {parsedBulkData.length - 5} more</div>}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t bg-slate-50 flex gap-3">
                            <button onClick={() => { setIsBulkModalOpen(false); setPasteData(''); }} className="flex-1 py-3 font-medium text-slate-600 hover:bg-slate-200 rounded-xl">Cancel</button>
                            <button onClick={handleSaveBulk} disabled={parsedBulkData.length === 0} className={`flex-1 py-3 font-bold rounded-xl text-white ${parsedBulkData.length > 0 ? 'bg-violet-600' : 'bg-slate-300'}`}>Import {parsedBulkData.length > 0 ? parsedBulkData.length : ''} Students</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}