import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Users,
    FolderKanban,
    LayoutDashboard,
    UserCircle,
    User,
    Settings2,
    BookOpen,
    GraduationCap,
    MessageSquare,
    Printer,
    Camera,
    Folder,
    HelpCircle,
    Cloud,
    Loader2,
    Upload,
    ShieldCheck,
    Sparkles,
    Award,
    Lock,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBackup } from '../../contexts/SyncContext';
import { useLicense } from '../../contexts/LicenseContext';
import { useIsMobileLayout } from '../../hooks/useIsMobileLayout';
import NoticesModal from './NoticesModal';

export default function AppLayout() {
    const isMobile = useIsMobileLayout();
    const { currentUser } = useAuth();
    const {
        triggerBackupToDrive,
        isBackingUp
    } = useBackup();
    const { licenseStatus, openPaywall } = useLicense();
    const location = useLocation();
    const navigate = useNavigate();

    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
    const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);
    const [isScanGuideOpen, setIsScanGuideOpen] = useState(false);

    const handlePrimaryScanClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const hasSeenNotice = localStorage.getItem('has_seen_instant_scan_notice');
        if (!hasSeenNotice) {
            setIsScanGuideOpen(true);
        } else {
            navigate('/scan');
        }
    };

    const handleConfirmInstantScan = () => {
        localStorage.setItem('has_seen_instant_scan_notice', 'true');
        setIsScanGuideOpen(false);
        navigate('/scan');
    };

    const handleGoToDashboard = () => {
        localStorage.setItem('has_seen_instant_scan_notice', 'true');
        setIsScanGuideOpen(false);
        navigate('/');
    };

    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/sections')) return 'Classes';
        if (path.startsWith('/students')) return 'Students';
        if (path.startsWith('/periods')) return 'Terms & Folders';
        if (path.startsWith('/subjects')) return 'Subjects';
        if (path.startsWith('/grades')) return 'Grade/Year Levels';
        if (path.startsWith('/templates')) return 'Answer Sheets';
        if (path === '/scan') return 'Instant Scan';
        if (path.startsWith('/account')) return 'Profile & Backup';
        if (path.startsWith('/create')) return 'Create Exam';
        if (path.startsWith('/edit')) return 'Edit Exam';
        if (path.includes('/results')) return 'Exam Results';
        return 'Godspeed Grader';
    };

    const getPageSub = (path: string) => {
        if (path === '/') return 'Local Workspace • 100% Offline';
        return null;
    };

    const pageTitle = getPageTitle(location.pathname);
    const pageSub = getPageSub(location.pathname);

    const allNavItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard, protected: true },
        { path: '/scan', label: 'Instant Scan', icon: Camera, protected: true },
        { path: '/templates', label: 'Answer Sheets', icon: Printer, protected: true },
        { path: '/periods', label: 'Terms / Folders', icon: Folder, protected: true },
        { path: '/grades', label: 'Grade/Year Levels', icon: GraduationCap, protected: true },
        { path: '/subjects', label: 'Subjects', icon: BookOpen, protected: true },
        { path: '/sections', label: 'Classes', icon: FolderKanban, protected: true },
        { path: '/students', label: 'Students', icon: Users, protected: true },
        { path: '/account', label: 'Profile & Backup', icon: User, protected: true },
    ];

    const navItems = allNavItems.filter(item => !item.protected || currentUser);

    const mobileMainItems = [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/templates', label: 'Sheets', icon: Printer },
        { path: '/scan', label: 'Scan', icon: Camera, isPrimary: true },
        { path: '/manage', label: 'Manage', icon: Settings2, isAction: true },
        { path: '/account', label: 'Profile', icon: User },
    ];

    const manageSubItems = [
        { path: '/grades', label: 'Grade/Year Levels', icon: GraduationCap, protected: true },
        { path: '/sections', label: 'Classes', icon: FolderKanban, protected: true },
        { path: '/students', label: 'Students', icon: Users, protected: true },
        { path: '/periods', label: 'Terms / Folders', icon: Folder, protected: true },
        { path: '/subjects', label: 'Subjects', icon: BookOpen, protected: true },
        { path: '/help', label: 'Help & Guide', icon: HelpCircle },
    ].filter(item => !item.protected || currentUser);

    const isManageActive = manageSubItems.some(item => location.pathname.startsWith(item.path));
    const isScannerPage = location.pathname.startsWith('/scan');

    const handleQuickDriveBackup = async () => {
        await triggerBackupToDrive();
    };

    return (
        <div className="flex h-[100dvh] bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">

            {/* ========================================== */}
            {/* DESKTOP SIDEBAR (Only rendered on desktop/laptop screens) */}
            {/* ========================================== */}
            {!isMobile && (
                <aside className="flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-white/5 shadow-sm z-50">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            GodSpeed <span className="font-normal text-slate-400">Grader</span>
                        </h1>
                    </div>

                    <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
                        {navItems.map((item) => {
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${isActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                            : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                                        }`
                                    }
                                >
                                    {() => (
                                        <>
                                            <div className="relative">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm">{item.label}</span>
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* USER PROFILE & FOOTER SECTION */}
                    <div className="p-4 m-4 mt-auto flex flex-col gap-2">
                        {/* Backup to GDrive Quick Button */}
                        <button
                            onClick={handleQuickDriveBackup}
                            disabled={isBackingUp}
                            className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-300 transition-all font-bold text-xs group text-left active:scale-95"
                        >
                            <div className="flex items-center gap-2.5">
                                <Cloud className={`w-4 h-4 text-amber-500 ${isBackingUp ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                                <span>{isBackingUp ? 'Backing Up...' : 'Backup to Drive'}</span>
                            </div>
                            {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Upload className="w-3.5 h-3.5 opacity-60" />}
                        </button>

                        {/* Support & Feedback Button */}
                        <a
                            href="mailto:contact@godspeedgrader.com"
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 transition-all font-bold text-xs group"
                        >
                            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Support & Feedback</span>
                        </a>

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <UserCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {currentUser?.name || 'Local Teacher'}
                                    </p>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Offline Mode
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-2">
                            <button onClick={() => setIsNoticesModalOpen(true)} className="hover:text-slate-600 dark:hover:text-slate-300">
                                Licenses
                            </button>
                            <span>•</span>
                            <NavLink to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">
                                Privacy Policy
                            </NavLink>
                        </div>
                    </div>
                </aside>
            )}

            <NoticesModal isOpen={isNoticesModalOpen} onClose={() => setIsNoticesModalOpen(false)} />

            {/* ========================================== */}
            {/* MAIN CONTENT AREA */}
            {/* ========================================== */}
            <main className="flex-1 h-full overflow-y-auto relative w-full flex flex-col bg-slate-100 dark:bg-slate-950">

                {/* GLOBAL HEADER */}
                <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                    <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-3.5">
                        {isMobile ? (
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {pageTitle === 'Dashboard' ? 'GodSpeed' : pageTitle}
                                </h1>
                                {pageSub && <p className="text-[10px] font-medium text-slate-500">{pageSub}</p>}
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pageTitle}</h2>
                                {pageSub && <p className="text-xs font-medium text-slate-500">{pageSub}</p>}
                            </div>
                        )}

                        <div className="flex items-center gap-2 md:gap-3">
                            {/* License & Trial Pill */}
                            {licenseStatus.isLifetime ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
                                    <Award className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Lifetime License</span>
                                    <span className="sm:hidden">Lifetime</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => openPaywall()}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0 ${
                                        licenseStatus.isInTrial
                                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20 animate-pulse'
                                    }`}
                                    title="View Lifetime Access Options"
                                >
                                    {licenseStatus.isInTrial ? (
                                        <>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Trial: {licenseStatus.daysRemaining}d</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Trial Ended</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Prominent GDrive Backup Action Button */}
                            <button
                                onClick={handleQuickDriveBackup}
                                disabled={isBackingUp}
                                title="Sync with Google Drive"
                                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold text-xs md:text-sm transition-all active:scale-95 shadow-sm"
                            >
                                <Cloud className={`w-4 h-4 md:w-5 md:h-5 ${isBackingUp ? 'animate-bounce' : ''}`} />
                                <span className="hidden sm:inline">{isBackingUp ? 'Syncing...' : 'Sync to Drive'}</span>
                            </button>

                            {/* Manage Account Link: Only shown on desktop header (hidden on mobile, which uses bottom nav tab) */}
                            {!isMobile && (
                                <NavLink
                                    to="/account"
                                    className={({ isActive }) =>
                                        `flex w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl items-center justify-center transition-all ${isActive
                                            ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-white/5'
                                        }`
                                    }
                                    title="Manage Account & Settings"
                                >
                                    <UserCircle className="w-5 h-5 md:w-6 md:h-6" />
                                </NavLink>
                            )}

                            <NavLink
                                to="/help"
                                className={({ isActive }) =>
                                    `flex w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl items-center justify-center transition-all shrink-0 ${isActive
                                        ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                                        : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-white/5'
                                    }`
                                }
                                title="Help"
                            >
                                <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
                            </NavLink>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 min-h-full ${isScannerPage ? 'pb-0' : isMobile ? 'pb-24 pb-safe-bottom' : 'pb-6'}`}>
                    <Outlet />
                    {isMobile && !isScannerPage && <div className="h-12 shrink-0" />}
                </div>
            </main>

            {/* ========================================== */}
            {/* MOBILE MANAGE MENU (OVERLAY) */}
            {/* ========================================== */}
            {isMobile && isManageMenuOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsManageMenuOpen(false)}
                >
                    <div
                        className="absolute bottom-20 left-4 right-4 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-2xl border border-slate-200/50 dark:border-white/10 animate-in slide-in-from-bottom-10 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest ml-1">Manage Workspace</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                            {manageSubItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsManageMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive
                                            ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`
                                    }
                                >
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-active:scale-90 transition-transform">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">{item.label}</span>
                                </NavLink>
                            ))}

                            {/* Mobile Support Link */}
                            <a
                                href="mailto:contact@godspeedgrader.com"
                                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <span className="font-bold">Support & Feedback</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MOBILE BOTTOM NAV */}
            {/* ========================================== */}
            {isMobile && !isScannerPage && (
                <nav className="fixed bottom-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 pb-safe">
                    <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
                        {mobileMainItems.map((item) => {
                            const isActive = item.isAction ? (isManageActive || isManageMenuOpen) : location.pathname.startsWith(item.path);

                            if (item.isPrimary) {
                                const isScanActive = location.pathname.startsWith('/scan');
                                return (
                                    <button
                                        key={item.path}
                                        type="button"
                                        onClick={handlePrimaryScanClick}
                                        className={`flex flex-col items-center justify-center -mt-8 w-16 h-16 rounded-full transition-all shadow-lg active:scale-90 ${
                                            isScanActive
                                                ? 'bg-violet-600 text-white shadow-violet-500/40'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-black/10'
                                        }`}
                                    >
                                        <item.icon className="w-8 h-8" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter mt-0.5">{item.label}</span>
                                    </button>
                                );
                            }

                            if (item.isAction) {
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${isActive
                                            ? 'text-violet-600 dark:text-violet-400 font-bold'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="text-[10px] mt-1">{item.label}</span>
                                    </button>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${isActive
                                            ? 'text-violet-600 dark:text-violet-400 font-bold'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                    }`
                                    }
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-[10px] mt-1">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* FIRST-TIME INSTANT SCANNER ONBOARDING DIALOG */}
            {isScanGuideOpen && (
                <div 
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setIsScanGuideOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div className="w-14 h-14 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Camera className="w-7 h-7" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Instant Universal Scanner
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Multi-exam automatic grading
                            </p>

                            <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-left space-y-1.5">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                                        <strong>Expected on Answer Sheets:</strong> Both the <strong>Exam Code</strong> and <strong>Student No.</strong> must be shaded on the bubble sheet so Godspeed can automatically recognize the exam and record the grade.
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-left text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                                💡 <strong>Alternative:</strong> You can also tap any specific exam from your <strong>Dashboard</strong> and tap <em>"Scan Papers"</em> to scan directly without needing an Exam Code!
                            </div>
                        </div>

                        <div className="p-5 pt-0 space-y-2">
                            <button
                                type="button"
                                onClick={handleConfirmInstantScan}
                                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                            >
                                Got it, Start Scanner
                            </button>
                            <button
                                type="button"
                                onClick={handleGoToDashboard}
                                className="w-full py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Select Exam from Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
