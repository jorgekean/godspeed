import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { 
    Plus, 
    Users, 
    Edit3, 
    Trash2, 
    X, 
    ClipboardPaste, 
    AlertTriangle, 
    Search, 
    UserPlus, 
    TrendingUp, 
    ChevronDown, 
    Laptop, 
    FileSpreadsheet, 
    Upload, 
    Download, 
    Check, 
    Copy, 
    Sparkles, 
    FileText 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sortStudents } from '../utils/studentUtils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ParsedStudentItem {
    studentNo: string;
    fullName: string;
    isAutoId: boolean;
}

export default function StudentsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==========================================
    // 1. DATA FETCHING & FILTERING
    // ==========================================
    const userEmail = currentUser?.email!;
    const sections = useLiveQuery(() => db.sections.filter(s => !s.isDeleted && s.createdBy === userEmail).sortBy('gradeLevel'), [userEmail]);

    const [selectedFilterSection, setSelectedFilterSection] = useState<string>(() => localStorage.getItem('lastSelectedSection') || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedWebLink, setCopiedWebLink] = useState(false);

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
            toast.success('Student profile updated!');
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
            toast.success('Student added successfully!');
        }
        setIsSingleModalOpen(false);
    };

    // ==========================================
    // 3. BULK / EXCEL IMPORT MODAL
    // ==========================================
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importTab, setImportTab] = useState<'upload' | 'paste'>('upload');
    const [bulkSectionId, setBulkSectionId] = useState('');
    const [pasteData, setPasteData] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState('');
    const [parsedItems, setParsedItems] = useState<ParsedStudentItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [nextGeneratedId, setNextGeneratedId] = useState<number>(10000001);

    // Determine next sequential ID starting point
    useEffect(() => {
        const determineNextId = async () => {
            const allStudents = await db.students.where('createdBy').equals(userEmail).toArray();
            let maxId = 10000001;
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

        if (isImportModalOpen) {
            determineNextId();
        }
    }, [isImportModalOpen, userEmail]);

    // Smart Row Parser for both Excel files and Pasted text
    const parseRosterRows = (rawRows: (string | number)[][], startingId: number): ParsedStudentItem[] => {
        if (!rawRows || rawRows.length === 0) return [];

        const rows = rawRows
            .map(r => Array.isArray(r) ? r.map(c => String(c ?? '').trim()) : [String(r ?? '').trim()])
            .filter(r => r.some(c => c.length > 0));

        if (rows.length === 0) return [];

        let headerIndex = -1;
        let idCol = -1;
        let nameCol = -1;
        let lastNameCol = -1;
        let firstNameCol = -1;

        // Check first 3 rows for potential header words
        for (let i = 0; i < Math.min(3, rows.length); i++) {
            const row = rows[i];
            const isHeaderRow = row.some(cell => 
                /^(student(\s*no|\s*id|\s*number)?|id|lrn|no\.?|name|full\s*name|learner.*name|last\s*name|first\s*name)$/i.test(cell)
            );
            if (isHeaderRow) {
                headerIndex = i;
                row.forEach((cell, idx) => {
                    const lower = cell.toLowerCase().trim();
                    if (/^(student(\s*no|\s*id|\s*number)?|id|lrn|no\.?)$/i.test(lower)) idCol = idx;
                    else if (/^(full\s*name|learner.*name|name)$/i.test(lower)) nameCol = idx;
                    else if (/^last(\s*name)?$/i.test(lower)) lastNameCol = idx;
                    else if (/^first(\s*name)?$/i.test(lower)) firstNameCol = idx;
                });
                break;
            }
        }

        const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : rows;
        const results: ParsedStudentItem[] = [];
        let currentId = startingId;

        for (const row of dataRows) {
            let studentNo = '';
            let fullName = '';
            let isAutoId = false;

            if (idCol !== -1 && row[idCol]) {
                studentNo = row[idCol].replace(/\D/g, '').slice(0, 8);
            }
            if (nameCol !== -1 && row[nameCol]) {
                fullName = row[nameCol];
            } else if (lastNameCol !== -1 && firstNameCol !== -1 && (row[lastNameCol] || row[firstNameCol])) {
                fullName = [row[lastNameCol], row[firstNameCol]].filter(Boolean).join(', ');
            }

            // Fallback heuristics when headers are absent
            if (!fullName) {
                const nonEmpties = row.filter(Boolean);
                if (nonEmpties.length === 1) {
                    fullName = nonEmpties[0];
                } else if (nonEmpties.length >= 2) {
                    const numericIdx = nonEmpties.findIndex(c => /^\d+$/.test(c.replace(/[-\s]/g, '')));
                    if (numericIdx !== -1) {
                        studentNo = nonEmpties[numericIdx].replace(/\D/g, '').slice(0, 8);
                        const nameParts = nonEmpties.filter((_, idx) => idx !== numericIdx);
                        fullName = nameParts.join(', ');
                    } else {
                        fullName = nonEmpties.join(', ');
                    }
                }
            }

            // Sanitize full name
            fullName = fullName.replace(/[\r\n\t]+/g, ' ').trim();
            if (!fullName || fullName.length < 2) continue;

            if (!studentNo) {
                studentNo = String(currentId).slice(-8);
                currentId++;
                isAutoId = true;
            }

            results.push({ studentNo, fullName, isAutoId });
        }

        return results;
    };

    // Handle Excel File Drop / Upload
    const handleProcessFile = async (file: File) => {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                toast.error('The selected Excel file has no readable sheets.');
                return;
            }
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as (string | number)[][];
            const parsed = parseRosterRows(rawRows, nextGeneratedId);

            if (parsed.length === 0) {
                toast.error('No valid student rows could be found in this file.');
                return;
            }

            setUploadedFileName(file.name);
            setParsedItems(parsed);
            toast.success(`Loaded ${parsed.length} students from ${file.name}!`);
        } catch (err) {
            console.error('File parsing error:', err);
            toast.error('Failed to parse file. Please upload a standard .xlsx, .xls, or .csv file.');
        }
    };

    // Re-parse when text is pasted
    useEffect(() => {
        if (importTab === 'paste') {
            if (!pasteData.trim()) {
                setParsedItems([]);
                return;
            }
            const lines = pasteData.trim().split(/\r?\n/);
            const rawRows = lines.map(line => {
                if (line.includes('\t')) return line.split('\t');
                if (line.includes(',')) return line.split(',');
                return [line];
            });
            const parsed = parseRosterRows(rawRows, nextGeneratedId);
            setParsedItems(parsed);
        }
    }, [pasteData, importTab, nextGeneratedId]);

    // Download Sample Excel Template
    const handleDownloadSampleTemplate = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([
            ['Student Number', 'Full Name'],
            ['20260001', 'Dela Cruz, Juan'],
            ['20260002', 'Santos, Maria'],
            ['20260003', 'Reyes, Jose'],
            ['20260004', 'Aquino, Corazon'],
            ['20260005', 'Bonifacio, Andres']
        ]);
        ws['!cols'] = [{ wch: 18 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Roster Template');
        XLSX.writeFile(wb, 'Godspeed_Students_Template.xlsx');
        toast.success('Sample Excel template downloaded!');
    };

    const handleCopyWebLink = async () => {
        const url = 'https://godspeedgrader.com/students';
        try {
            await navigator.clipboard.writeText(url);
            setCopiedWebLink(true);
            toast.success('Link copied! Open https://godspeedgrader.com/students on your computer.');
            setTimeout(() => setCopiedWebLink(false), 3500);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = url;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedWebLink(true);
            toast.success('Link copied! Open https://godspeedgrader.com/students on your computer.');
            setTimeout(() => setCopiedWebLink(false), 3500);
        }
    };

    const handleSaveBulk = async () => {
        if (parsedItems.length === 0) return;

        let targetId = bulkSectionId;
        if (!targetId) {
            targetId = await ensureGeneralClass();
        }

        const newStudents = parsedItems.map(student => ({
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
        toast.success(`Imported ${newStudents.length} students successfully into this class!`);

        setSelectedFilterSection(targetId);
        setIsImportModalOpen(false);
        setPasteData('');
        setUploadedFileName('');
        setParsedItems([]);
    };

    // ==========================================
    // 4. DELETE HANDLER
    // ==========================================
    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to remove "${name}" from this class?`)) {
            await db.students.update(id, { isDeleted: true, updatedAt: Date.now(), isSynced: false });
            toast.success(`Removed "${name}" from class.`);
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
            <div className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-6 flex flex-col gap-6">

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
                                Manage student profiles, track performance analytics, and import rosters from Excel.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
                        <button
                            onClick={() => {
                                setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                                setImportTab('upload');
                                setIsImportModalOpen(true);
                            }}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl md:rounded-2xl font-bold text-sm shadow-md shadow-violet-500/20 transition-all active:scale-95"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-white" />
                            <span>Import Excel / Roster</span>
                        </button>
                        <button
                            onClick={() => openSingleModal()}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl md:rounded-2xl font-bold text-sm transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Single</span>
                        </button>
                    </div>
                </div>

                {/* ========================================== */}
                {/* COMPUTER / WEB ROSTER PROMO BANNER */}
                {/* ========================================== */}
                <div className="bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-sky-600/10 border border-violet-500/20 dark:border-violet-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-violet-600 text-white rounded-xl shadow-md shadow-violet-600/30 shrink-0 mt-0.5">
                            <Laptop className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Fastest Way: Upload Excel on Computer or Web
                                </h4>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                                    Desktop Friendly
                                </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                Open <strong className="text-violet-600 dark:text-violet-400 font-bold">https://godspeedgrader.com/students</strong> on your computer's browser to drag & drop your Excel file (<code className="text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.xlsx</code>, <code className="text-[11px] font-mono font-bold bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.csv</code>) or copy-paste directly from Google Sheets!
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                            onClick={handleCopyWebLink}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            {copiedWebLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedWebLink ? 'Link Copied!' : 'Copy Web Link'}</span>
                        </button>
                        <button
                            onClick={handleDownloadSampleTemplate}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Sample Excel</span>
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
                {/* 3. STUDENTS TABLE OR EMPTY STATE */}
                {/* ========================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
                    {students?.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                            <div className="w-14 h-14 bg-violet-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-3 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20">
                                <FileSpreadsheet className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">No students in this class yet</h3>
                            <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                                Set up your student roster in seconds. You can upload an Excel file, paste a spreadsheet, or add students one by one.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-4">
                                <button
                                    onClick={() => {
                                        setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                                        setImportTab('upload');
                                        setIsImportModalOpen(true);
                                    }}
                                    className="p-4 bg-violet-50/60 hover:bg-violet-100/60 dark:bg-violet-950/20 dark:hover:bg-violet-900/30 border border-violet-200 dark:border-violet-500/30 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 group"
                                >
                                    <Upload className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:-translate-y-0.5 transition-transform" />
                                    <span className="text-sm font-bold text-violet-900 dark:text-violet-200">Upload Excel Spreadsheet</span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Drag & drop .xlsx, .xls, or .csv</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setBulkSectionId(selectedFilterSection || sections?.[0]?.id || '');
                                        setImportTab('paste');
                                        setIsImportModalOpen(true);
                                    }}
                                    className="p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col items-center text-center gap-1.5 transition-all active:scale-95 group"
                                >
                                    <ClipboardPaste className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:-translate-y-0.5 transition-transform" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">Copy & Paste Roster</span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Paste columns from Excel or Sheets</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                                <button
                                    onClick={handleDownloadSampleTemplate}
                                    className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download Sample Template (.xlsx)</span>
                                </button>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <button
                                    onClick={() => openSingleModal()}
                                    className="text-slate-600 dark:text-slate-400 font-bold hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Single Student</span>
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
                {/* 5. FIRST-CLASS EXCEL & BULK IMPORT MODAL */}
                {/* ========================================== */}
                {isImportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <span>Import Students Roster</span>
                                            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                Excel & Sheets
                                            </span>
                                        </h2>
                                        <p className="text-xs text-slate-500">Upload a spreadsheet or paste directly from Excel</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { 
                                        setIsImportModalOpen(false); 
                                        setPasteData(''); 
                                        setUploadedFileName(''); 
                                        setParsedItems([]); 
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                                
                                {/* Target Class Selection */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                                        Target Class / Section
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={bulkSectionId}
                                            onChange={(e) => setBulkSectionId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {sections?.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    📁 {s.gradeLevel} - {s.sectionName}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Tabs: Upload vs Paste */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setImportTab('upload')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            importTab === 'upload'
                                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Excel / CSV File</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImportTab('paste')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                            importTab === 'paste'
                                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <ClipboardPaste className="w-3.5 h-3.5" />
                                        <span>Copy & Paste Spreadsheet</span>
                                    </button>
                                </div>

                                {/* TAB 1: FILE UPLOAD */}
                                {importTab === 'upload' && (
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".xlsx, .xls, .csv"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleProcessFile(e.target.files[0]);
                                                }
                                            }}
                                        />

                                        <div
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                                    handleProcessFile(e.dataTransfer.files[0]);
                                                }
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                                                isDragging
                                                    ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 scale-[0.99]'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                                                <Upload className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Choose or Drag & Drop Excel File'}
                                            </h4>
                                            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-3">
                                                Supports standard <strong className="text-slate-700 dark:text-slate-300">.xlsx, .xls, and .csv</strong> files. Auto-detects Student Number & Full Name columns.
                                            </p>
                                            <button
                                                type="button"
                                                className="px-4 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 pointer-events-none"
                                            >
                                                {uploadedFileName ? 'Change File' : 'Browse Files'}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between text-xs px-1">
                                            <span className="text-slate-500">Need a template?</span>
                                            <button
                                                type="button"
                                                onClick={handleDownloadSampleTemplate}
                                                className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download Sample Excel Template (.xlsx)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: COPY & PASTE */}
                                {importTab === 'paste' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs px-1 mb-1">
                                            <label className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                Paste Cells from Excel or Sheets
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPasteData("Student No\tFull Name\n20260001\tDela Cruz, Juan\n20260002\tSantos, Maria\n20260003\tReyes, Jose\n20260004\tAquino, Corazon");
                                                }}
                                                className="text-violet-600 dark:text-violet-400 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                <span>Insert Sample Data</span>
                                            </button>
                                        </div>

                                        <textarea
                                            value={pasteData}
                                            onChange={(e) => setPasteData(e.target.value)}
                                            placeholder={"Copy columns from Excel / Google Sheets and press Ctrl+V / Cmd+V here.\n\nExamples accepted:\n• Column 1: [Student No], Column 2: [Full Name]\n• Column 1: [Full Name] (one student per row)"}
                                            className="w-full h-36 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs whitespace-pre font-mono"
                                        />

                                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 ml-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <span>Student numbers are capped at 8 digits. Missing numbers are generated sequentially.</span>
                                        </p>
                                    </div>
                                )}

                                {/* PARSED PREVIEW TABLE */}
                                {parsedItems.length > 0 && (
                                    <div className="border rounded-2xl overflow-hidden border-violet-200 dark:border-violet-500/30 bg-violet-50/40 dark:bg-violet-950/20">
                                        <div className="bg-violet-100/70 dark:bg-violet-900/40 px-4 py-2.5 text-xs font-bold text-violet-800 dark:text-violet-200 flex justify-between items-center">
                                            <span className="flex items-center gap-1.5">
                                                <Check className="w-4 h-4 text-emerald-500" />
                                                <span>Roster Preview</span>
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-full bg-violet-200 dark:bg-violet-800/60 text-[11px] font-black">
                                                {parsedItems.length} Detected
                                            </span>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                            {parsedItems.slice(0, 8).map((d, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 px-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                                                            {d.fullName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                                                            {d.studentNo}
                                                        </span>
                                                        {d.isAutoId && (
                                                            <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                                                                Auto-ID
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {parsedItems.length > 8 && (
                                                <div className="text-xs text-center text-slate-500 dark:text-slate-400 py-2 bg-slate-50/50 dark:bg-slate-900/50 font-semibold">
                                                    ...and {parsedItems.length - 8} more students
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                                <button
                                    onClick={() => { 
                                        setIsImportModalOpen(false); 
                                        setPasteData(''); 
                                        setUploadedFileName(''); 
                                        setParsedItems([]); 
                                    }}
                                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveBulk}
                                    disabled={parsedItems.length === 0}
                                    className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                        parsedItems.length > 0
                                            ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Import {parsedItems.length > 0 ? `${parsedItems.length} ` : ''}Students</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}