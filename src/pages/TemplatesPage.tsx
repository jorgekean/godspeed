import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { sortStudents } from '../utils/studentUtils';
import { exportFile } from '../utils/fileExport';
import { pdf } from '@react-pdf/renderer';
import { OMRTemplateGenerator, MultiStudentDocument } from '../components/omr/OMRTemplate';
import {
    Printer,
    Laptop,
    Users,
    FileText,
    Loader2,
    ChevronDown,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    HelpCircle,
    Info,
    Hash
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userEmail = currentUser?.email || '';

    // Active mode: 'blank' or 'class'
    const [mode, setMode] = useState<'blank' | 'class'>('blank');

    // Live queries
    const sections = useLiveQuery(
        () => db.sections.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(),
        [userEmail]
    );

    const allStudents = useLiveQuery(
        () => db.students.filter(s => s.createdBy === userEmail && !s.isDeleted).toArray(),
        [userEmail]
    );

    // Selected section for pre-filled sheets
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [showRosterPreview, setShowRosterPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState<'20' | '50' | '100' | null>(null);

    // Auto-select first section when sections load
    React.useEffect(() => {
        if (sections && sections.length > 0 && !selectedSectionId) {
            setSelectedSectionId(sections[0].id);
        }
    }, [sections, selectedSectionId]);

    // Active section
    const currentSection = useMemo(() => {
        return sections?.find(s => s.id === selectedSectionId) || null;
    }, [sections, selectedSectionId]);

    // Filter and sort students for the selected section
    const sectionStudents = useMemo(() => {
        if (!allStudents || !selectedSectionId) return [];
        const filtered = allStudents.filter(s => s.sectionId === selectedSectionId);
        return [...filtered].sort(sortStudents);
    }, [allStudents, selectedSectionId]);

    // Edge Case Analysis:
    // 1. Duplicate student numbers
    const duplicateStudentNumbers = useMemo(() => {
        const counts = new Map<string, number>();
        const duplicates: string[] = [];
        sectionStudents.forEach(s => {
            const raw = (s.studentNo || '').trim();
            if (raw) {
                counts.set(raw, (counts.get(raw) || 0) + 1);
            }
        });
        counts.forEach((count, id) => {
            if (count > 1) duplicates.push(id);
        });
        return duplicates;
    }, [sectionStudents]);

    // 2. Students with missing or non-8 digit student numbers
    const studentsWithNonStandardId = useMemo(() => {
        return sectionStudents.filter(s => {
            const digits = (s.studentNo || '').replace(/\D/g, '');
            return !digits || digits.length !== 8;
        });
    }, [sectionStudents]);

    // Handle PDF generation for selected class
    const handleDownloadClassSheets = async (type: '20' | '50' | '100') => {
        if (!sectionStudents || sectionStudents.length === 0) {
            toast.error('This class has no students to print.');
            return;
        }

        setIsGenerating(type);
        try {
            const secName = currentSection ? `${currentSection.gradeLevel}_${currentSection.sectionName}`.replace(/\s+/g, '_') : 'Class';
            const fileName = `Prefilled_${type}Items_${secName}.pdf`;

            const blob = await pdf(<MultiStudentDocument students={sectionStudents} examType={type} />).toBlob();
            await exportFile({
                blob,
                filename: fileName,
                mimeType: 'application/pdf',
                dialogTitle: 'Save Answer Sheets PDF'
            });
            toast.success(`Generated ${sectionStudents.length} pre-filled sheets!`);
        } catch (error) {
            console.error('Failed to generate pre-filled PDF', error);
            toast.error('Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-6 flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl">
                            <Printer className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        Answer Sheet Templates
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-12">
                        Download blank bubble sheets or generate pre-filled sheets with student IDs.
                    </p>
                </div>

                {/* Desktop Printing Tip Banner */}
                <div className="bg-gradient-to-r from-violet-50/80 via-indigo-50/60 to-slate-50 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4 flex items-start sm:items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-violet-600 dark:bg-violet-500 text-white rounded-xl shadow-md shadow-violet-500/20 shrink-0">
                        <Laptop className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Printing sheets from a laptop or computer?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Visit <span className="font-bold text-violet-600 dark:text-violet-400">godspeedgrader.com</span> on your laptop or computer and click <strong className="font-semibold text-slate-800 dark:text-slate-200">Answer Sheets</strong> to print sheets directly to your connected printer.
                        </p>
                    </div>
                </div>

                {/* Segmented Mode Selector */}
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl max-w-md w-full border border-slate-200/60 dark:border-white/5">
                    <button
                        onClick={() => setMode('blank')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            mode === 'blank'
                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Blank Sheets
                    </button>
                    <button
                        onClick={() => setMode('class')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                            mode === 'class'
                                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Pre-Filled for Class
                        {sections && sections.length > 0 && (
                            <span className="text-[10px] bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full font-bold">
                                {sections.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content Section */}
                {mode === 'blank' ? (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden">
                        <OMRTemplateGenerator />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col gap-6">
                        
                        {/* Check if user has any sections */}
                        {!sections || sections.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                                <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                    No classes found yet
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                                    Create a class section and enroll students first to print customized answer sheets pre-bubbled with their student numbers.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => navigate('/sections')}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md transition-all"
                                    >
                                        Go to Classes
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setMode('blank')}
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
                                    >
                                        Print Blank Sheets Instead
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Section Selection Dropdown Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                                    <div>
                                        <label htmlFor="section-select" className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                            Select Class / Section
                                        </label>
                                        <div className="relative inline-block w-full sm:w-80">
                                            <select
                                                id="section-select"
                                                value={selectedSectionId}
                                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all cursor-pointer"
                                            >
                                                {sections.map(s => {
                                                    const count = allStudents?.filter(st => st.sectionId === s.id).length || 0;
                                                    return (
                                                        <option key={s.id} value={s.id}>
                                                            {s.gradeLevel} - {s.sectionName} ({count} {count === 1 ? 'student' : 'students'})
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                                                <ChevronDown className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action link */}
                                    <button
                                        onClick={() => navigate('/students')}
                                        className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline self-start sm:self-center flex items-center gap-1"
                                    >
                                        Manage Students
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Active Class Summary Card */}
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-white/5 flex flex-col gap-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                    {currentSection?.gradeLevel} - {currentSection?.sectionName}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {sectionStudents.length} {sectionStudents.length === 1 ? 'student' : 'students'} enrolled
                                                </p>
                                            </div>
                                        </div>

                                        {sectionStudents.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setShowRosterPreview(!showRosterPreview)}
                                                className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                                            >
                                                {showRosterPreview ? 'Hide Roster' : 'Preview Roster'}
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRosterPreview ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Edge Case Warning: 0 Students */}
                                    {sectionStudents.length === 0 && (
                                        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                            <div className="flex-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                                                <strong className="font-bold block mb-0.5">This class currently has 0 students.</strong>
                                                Add students to this section in the Students tab, or print Blank Sheets to let students write their info manually.
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => navigate('/students')}
                                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold text-[11px]"
                                                    >
                                                        Add Students
                                                    </button>
                                                    <button
                                                        onClick={() => setMode('blank')}
                                                        className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold text-[11px] border border-amber-200 dark:border-amber-500/30"
                                                    >
                                                        Print Blank Sheets
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Edge Case Warning: Duplicate Student Numbers */}
                                    {duplicateStudentNumbers.length > 0 && (
                                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                                            <div className="flex-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                                                <strong className="font-bold block mb-0.5">Duplicate Student Number Warning</strong>
                                                Multiple students in this class share the same ID ({duplicateStudentNumbers.join(', ')}). Ensure each student has a unique student number so their scanned grades don't conflict.
                                            </div>
                                        </div>
                                    )}

                                    {/* Edge Case Notice: Non-8 Digit Numbers Auto-Padded */}
                                    {studentsWithNonStandardId.length > 0 && sectionStudents.length > 0 && (
                                        <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 flex items-start gap-2.5">
                                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                            <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                                                <strong>Auto-Formatting Notice:</strong> {studentsWithNonStandardId.length} student(s) have IDs with fewer than 8 digits. Godspeed will automatically pad them with leading zeros on the printed bubble grid (e.g. ID "123" becomes "00000123").
                                            </p>
                                        </div>
                                    )}

                                    {/* Collapsible Roster Preview */}
                                    {showRosterPreview && sectionStudents.length > 0 && (
                                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 mt-1 max-h-60 overflow-y-auto">
                                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex justify-between">
                                                <span>Student Name</span>
                                                <span>Printed 8-Digit ID</span>
                                            </div>
                                            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                                                {sectionStudents.map((st, idx) => {
                                                    const cleanDigits = (st.studentNo || '').replace(/\D/g, '').slice(-8).padStart(8, '0');
                                                    return (
                                                        <li key={st.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <span className="font-medium text-slate-800 dark:text-slate-200">
                                                                {idx + 1}. {st.fullName}
                                                            </span>
                                                            <span className="font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                                                {cleanDigits}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Download Buttons */}
                                <div className="flex flex-col gap-3">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Choose exam length to generate a multi-page PDF ({sectionStudents.length} {sectionStudents.length === 1 ? 'page' : 'pages'}, 1 per student):
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <button
                                            disabled={isGenerating !== null || sectionStudents.length === 0}
                                            onClick={() => handleDownloadClassSheets('20')}
                                            className={`py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                                                isGenerating === '20'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                                                    : isGenerating !== null || sectionStudents.length === 0
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                                            }`}
                                        >
                                            {isGenerating === '20' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating {sectionStudents.length} pages...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-4 h-4" />
                                                    20-Item Sheets ({sectionStudents.length}p)
                                                </>
                                            )}
                                        </button>

                                        <button
                                            disabled={isGenerating !== null || sectionStudents.length === 0}
                                            onClick={() => handleDownloadClassSheets('50')}
                                            className={`py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                                                isGenerating === '50'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                                                    : isGenerating !== null || sectionStudents.length === 0
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                                            }`}
                                        >
                                            {isGenerating === '50' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating {sectionStudents.length} pages...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-4 h-4" />
                                                    50-Item Sheets ({sectionStudents.length}p)
                                                </>
                                            )}
                                        </button>

                                        <button
                                            disabled={isGenerating !== null || sectionStudents.length === 0}
                                            onClick={() => handleDownloadClassSheets('100')}
                                            className={`py-3.5 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                                                isGenerating === '100'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait'
                                                    : isGenerating !== null || sectionStudents.length === 0
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                                            }`}
                                        >
                                            {isGenerating === '100' ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating {sectionStudents.length} pages...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="w-4 h-4" />
                                                    100-Item Sheets ({sectionStudents.length}p)
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Instructions / Printing Help */}
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-2">Printing Tips for Optimal Camera Scanning:</h4>
                    <ul className="text-xs text-amber-800/80 dark:text-amber-400/60 space-y-1.5 list-disc pl-4">
                        <li><strong>Scale at 100% or "Actual Size":</strong> Do not use "Fit to Page" in your printer settings, as it shrinks the 4 corner alignment markers.</li>
                        <li><strong>Standard Paper:</strong> Print on standard Letter or A4 white copy paper.</li>
                        <li><strong>Alphabetical Order:</strong> Pre-filled sheets are automatically generated in alphabetical order (A–Z by last name) to match your physical class attendance.</li>
                        <li><strong>Scan Readiness:</strong> Instruct students not to wrinkle, fold, or tear the four black corner squares.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
