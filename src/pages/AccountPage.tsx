import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBackup } from '../contexts/SyncContext';
import { db } from '../services/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { backupService } from '../services/backupService';
import { type DriveBackupFile } from '../services/googleDriveService';
import {
    ShieldCheck,
    Loader2,
    RefreshCw,
    AlertCircle,
    Download,
    Upload,
    Cloud,
    HardDrive,
    Trash2,
    Edit3,
    FileJson,
    Save,
    CheckCircle2,
    X
} from 'lucide-react';
import { toast } from 'sonner';

export default function AccountPage() {
    const { currentUser, updateProfile } = useAuth();
    const {
        lastBackupTimestamp,
        isBackingUp,
        isRestoring,
        isGoogleConnected,
        disconnectGoogleDrive,
        triggerBackupToDrive,
        triggerRestoreFromDrive,
        listDriveBackups,
        exportLocalBackupFile,
        importLocalBackupFile,
        error: backupError
    } = useBackup();

    // Profile editing states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [school, setSchool] = useState(currentUser?.school || '');

    // Google Drive restore modal states
    const [isDriveRestoreOpen, setIsDriveRestoreOpen] = useState(false);
    const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
    const [isLoadingDriveList, setIsLoadingDriveList] = useState(false);
    const [selectedDriveFileId, setSelectedDriveFileId] = useState<string | null>(null);
    const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

    // File input ref for local JSON restore
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    // Live counts of IndexedDB tables
    const stats = useLiveQuery(async () => {
        const [sections, students, exams, scanResults, periods, subjects, gradeLevels] = await Promise.all([
            db.sections.count(),
            db.students.count(),
            db.exams.count(),
            db.scanResults.count(),
            db.periods.count(),
            db.subjects.count(),
            db.gradeLevels.count()
        ]);
        return {
            sections,
            students,
            exams,
            scanResults,
            periods,
            subjects,
            gradeLevels,
            total: sections + students + exams + scanResults + periods + subjects + gradeLevels
        };
    }, []);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || 'Teacher');
            setEmail(currentUser.email || 'guest@godspeedgrader.local');
            setSchool(currentUser.school || '');
        }
    }, [currentUser]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateProfile({ name, email, school });
            setIsEditingProfile(false);
            toast.success('Local profile updated!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile.');
        }
    };

    const handleOpenDriveRestore = async () => {
        setIsDriveRestoreOpen(true);
        setIsLoadingDriveList(true);
        try {
            const list = await listDriveBackups();
            setDriveBackups(list);
            if (list.length > 0) {
                setSelectedDriveFileId(list[0].id);
            }
        } catch (err: any) {
            toast.error(err.message || 'Could not fetch backups from Google Drive.');
        } finally {
            setIsLoadingDriveList(false);
        }
    };

    const handleConfirmDriveRestore = async () => {
        if (!selectedDriveFileId) return;

        const confirmMsg = restoreMode === 'replace'
            ? 'Restoring will REPLACE your current local data with the backup from Google Drive. Continue?'
            : 'Restoring will MERGE the backup from Google Drive into your current local data. Continue?';

        if (!window.confirm(confirmMsg)) return;

        const success = await triggerRestoreFromDrive(selectedDriveFileId, restoreMode);
        if (success) {
            setIsDriveRestoreOpen(false);
        }
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const mode = window.confirm(
            'Do you want to REPLACE your current data with this file?\n\nClick OK to REPLACE, or Cancel to MERGE without overwriting existing unique entries.'
        )
            ? 'replace'
            : 'merge';

        try {
            await importLocalBackupFile(file, mode);
        } catch (err) {
            // Error handled in context
        } finally {
            e.target.value = '';
        }
    };

    const handleClearAll = async () => {
        const answer = window.prompt(
            'WARNING: This will permanently delete all local sections, students, exams, and grades on this device.\n\nType "DELETE" to confirm:'
        );
        if (answer === 'DELETE') {
            await backupService.clearAllData();
            toast.success('All local workspace data has been cleared.');
        }
    };

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
            <div className="max-w-4xl mx-auto w-full space-y-6">

                {/* ========================================== */}
                {/* 1. LOCAL PROFILE & WORKSPACE STATUS */}
                {/* ========================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20 text-white font-black text-2xl">
                                {name ? name.charAt(0).toUpperCase() : 'T'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                                        {name || 'Offline Teacher'}
                                    </h2>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Offline & Private
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {email} {school ? `• ${school}` : ''}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    All grading data is processed directly inside your browser. No external server account needed.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditingProfile(!isEditingProfile)}
                            className="w-full md:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 font-bold text-sm transition-all flex items-center justify-center gap-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {/* Inline Profile Editor */}
                    {isEditingProfile && (
                        <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                    Teacher Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Teacher Maria"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                    School Name
                                </label>
                                <input
                                    type="text"
                                    value={school}
                                    onChange={(e) => setSchool(e.target.value)}
                                    placeholder="e.g. Rizal High School"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1 ml-1">
                                    Email / ID (Local)
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="teacher@school.edu.ph"
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div className="sm:col-span-3 flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-violet-500/20 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" /> Save Profile
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* ========================================== */}
                {/* 2. GOOGLE DRIVE BACKUP & RESTORE (HERO) */}
                {/* ========================================== */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/90 rounded-3xl border-2 border-violet-500/20 dark:border-violet-500/30 p-6 md:p-8 shadow-xl shadow-violet-500/5 relative overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                <Cloud className="w-7 h-7 text-amber-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Google Drive Backup & Restore
                                    </h3>
                                    {isGoogleConnected ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                            Ready to Connect
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 font-medium mt-1 max-w-xl">
                                    Backup and restore your entire offline database directly into your personal Google Drive account. Works seamlessly on iPhone PWA with automatic token caching and popup bypass.
                                </p>

                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp || isRestoring ? 'animate-spin text-violet-500' : ''}`} />
                                        {isBackingUp ? 'Uploading to Google Drive...' : isRestoring ? 'Restoring from Drive...' : (
                                            lastBackupTimestamp > 0
                                                ? `Last backup: ${new Date(lastBackupTimestamp).toLocaleString()}`
                                                : 'No Google Drive backups yet'
                                        )}
                                    </span>

                                    {isGoogleConnected && (
                                        <button
                                            type="button"
                                            onClick={disconnectGoogleDrive}
                                            className="text-xs text-slate-400 hover:text-red-500 font-semibold underline transition-colors"
                                        >
                                            Disconnect Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
                            <button
                                onClick={() => triggerBackupToDrive()}
                                disabled={isBackingUp || isRestoring}
                                className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                            >
                                {isBackingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                                <span>Backup to Google Drive</span>
                            </button>

                            <button
                                onClick={handleOpenDriveRestore}
                                disabled={isBackingUp || isRestoring}
                                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Download className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                <span>Restore from Drive</span>
                            </button>
                        </div>
                    </div>

                    {backupError && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{backupError}</span>
                        </div>
                    )}
                </div>

                {/* ========================================== */}
                {/* 3. OFFLINE FILE BACKUP & RESTORE (LOCAL JSON) */}
                {/* ========================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Local JSON Backup & Restore
                                </h3>
                                <p className="text-sm text-slate-500 font-medium max-w-xl">
                                    Save your data as a physical file on your device. Works completely offline with zero internet access. You can keep copies on flash drives, computer folders, or manually upload to Google Drive.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={exportLocalBackupFile}
                                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Export Backup File (.json)
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                            >
                                <Upload className="w-4 h-4" /> Restore from File
                            </button>
                        </div>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 4. WORKSPACE STORAGE OVERVIEW */}
                {/* ========================================== */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <HardDrive className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Device Database Storage</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                            Total Records: {stats?.total || 0}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classes</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.sections || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.students || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exams</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.exams || 0}</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grades Scanned</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats?.scanResults || 0}</p>
                        </div>
                    </div>
                </div>

                {/* ========================================== */}
                {/* 5. DANGER ZONE */}
                {/* ========================================== */}
                <div className="bg-red-50/50 dark:bg-red-950/20 rounded-3xl border border-red-200/60 dark:border-red-900/40 p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Reset Local Workspace
                            </h4>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 max-w-lg">
                                Irreversibly delete all offline classes, students, exams, and scanned grades from this device. Please ensure you have backed up to Google Drive or downloaded a JSON file before proceeding.
                            </p>
                        </div>
                        <button
                            onClick={handleClearAll}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0"
                        >
                            Clear All Data
                        </button>
                    </div>
                </div>

            </div>

            {/* ========================================== */}
            {/* GOOGLE DRIVE RESTORE MODAL */}
            {/* ========================================== */}
            {isDriveRestoreOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Cloud className="w-5 h-5 text-amber-500" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Restore from Google Drive
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsDriveRestoreOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {isLoadingDriveList ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                                    <p className="text-sm font-semibold">Connecting to Google Drive...</p>
                                </div>
                            ) : driveBackups.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    <p className="font-bold text-slate-700 dark:text-slate-300">No Godspeed backups found</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Backups created with "Backup to Google Drive" will appear here automatically.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Select a backup file to restore:
                                    </label>
                                    <div className="space-y-2">
                                        {driveBackups.map((file) => (
                                            <div
                                                key={file.id}
                                                onClick={() => setSelectedDriveFileId(file.id)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                                    selectedDriveFileId === file.id
                                                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-500'
                                                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                                }`}
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {file.createdTime ? new Date(file.createdTime).toLocaleString() : ''}
                                                    </p>
                                                </div>
                                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-slate-300 dark:border-slate-600">
                                                    {selectedDriveFileId === file.id && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600"></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                            Restore Mode:
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setRestoreMode('replace')}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                    restoreMode === 'replace'
                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                Replace Workspace
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRestoreMode('merge')}
                                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                    restoreMode === 'merge'
                                                        ? 'bg-violet-600 text-white border-violet-600'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                                }`}
                                            >
                                                Merge into Current
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
                            <button
                                onClick={() => setIsDriveRestoreOpen(false)}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDriveRestore}
                                disabled={!selectedDriveFileId || isRestoring || driveBackups.length === 0}
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Restore Selected Backup
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
