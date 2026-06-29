import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, FolderKanban, LayoutDashboard, LogOut, UserCircle, Lock, User, RefreshCw, AlertCircle, Zap, CalendarDays, Settings2, ChevronUp, BookOpen, GraduationCap, MessageSquare, Mail, Printer, Camera, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { toast } from 'sonner';
import NoticesModal from './NoticesModal';

export default function AppLayout() {
    const { currentUser, logout } = useAuth();
    const { status: syncStatus } = useSync();
    const navigate = useNavigate();
    const location = useLocation();

    // NEW: State for mobile Manage menu
    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
    const [isNoticesModalOpen, setIsNoticesModalOpen] = useState(false);

    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/sections')) return 'Sections';
        if (path.startsWith('/students')) return 'Students';
        if (path.startsWith('/periods')) return 'Periods';
        if (path.startsWith('/subjects')) return 'Subjects';
        if (path.startsWith('/grades')) return 'Grade Levels';
        if (path.startsWith('/templates')) return 'Answer Sheets';
        if (path === '/scan') return 'Instant Scan';
        if (path.startsWith('/account')) return 'Account';
        if (path.startsWith('/create')) return 'Create Exam';
        if (path.startsWith('/edit')) return 'Edit Exam';
        if (path.includes('/results')) return 'Exam Results';
        return 'Godspeed Grader';
    };

    const getPageSub = (path: string) => {
        if (path === '/') return currentUser ? `Welcome back, ${currentUser?.email}` : 'Grade exams in a flash.';
        if (path.startsWith('/sections')) return 'Manage your classes and advisory groups.';
        if (path.startsWith('/students')) return 'Manage your student rosters.';
        if (path.startsWith('/periods')) return 'Manage your grading periods.';
        if (path.startsWith('/subjects')) return 'Manage your subjects.';
        if (path.startsWith('/grades')) return 'Manage your grade levels.';
        if (path.startsWith('/templates')) return 'Download and print empty bubble sheet templates.';
        if (path.startsWith('/account')) return 'Manage your profile and settings.';
        if (path.startsWith('/help')) return 'Learn how to use Godspeed Grader.';
        if (path.startsWith('/manual')) return 'Deep-dive into features and workflows.';
        return 'Grade exams in a flash.';
    };

    const pageTitle = getPageTitle(location.pathname);
    const pageSub = getPageSub(location.pathname);

    const allNavItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard, protected: true },
        { path: '/scan', label: 'Instant Scan', icon: Camera, protected: true },
        { path: '/templates', label: 'Answer Sheets', icon: Printer, protected: true },
        // { path: '/help', label: 'Help & Guide', icon: BookOpen },
        // { path: '/manual', label: 'User Manual', icon: FileText },
        { path: '/periods', label: 'Periods', icon: CalendarDays, protected: true },
        { path: '/grades', label: 'Grade Levels', icon: GraduationCap, protected: true },
        { path: '/subjects', label: 'Subjects', icon: BookOpen, protected: true },
        { path: '/sections', label: 'Sections', icon: FolderKanban, protected: true },
        { path: '/students', label: 'Students', icon: Users, protected: true },
    ];

    const navItems = allNavItems.filter(item => !item.protected || currentUser);

    const mobileMainItems = [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/templates', label: 'Sheets', icon: Printer },
        { path: '/scan', label: 'Scan', icon: Camera, isPrimary: true },
        { path: '/manage', label: 'Manage', icon: Settings2, isAction: true },
        { path: '/account', label: 'Account', icon: User },
    ].filter(item => {
        if (item.path === '/' || item.path === '/templates') return true;
        return currentUser;
    });

    const manageSubItems = [
        { path: '/grades', label: 'Grade Levels', icon: GraduationCap, protected: true },
        { path: '/sections', label: 'Sections', icon: FolderKanban, protected: true },
        { path: '/students', label: 'Students', icon: Users, protected: true },
        { path: '/periods', label: 'Periods', icon: CalendarDays, protected: true },
        { path: '/subjects', label: 'Subjects', icon: BookOpen, protected: true },
        { path: '/help', label: 'Help & Guide', icon: BookOpen },
    ].filter(item => !item.protected || currentUser);

    const handleLogout = async () => {
        await logout();
        navigate('/landing?mode=login');
    };

    const isManageActive = manageSubItems.some(item => location.pathname.startsWith(item.path));
    const isScannerPage = location.pathname.startsWith('/scan');

    return (
        <div className="flex h-[100dvh] bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">

            {/* ========================================== */}
            {/* DESKTOP SIDEBAR */}
            {/* ========================================== */}
            <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/50 dark:border-white/5 shadow-sm z-50">
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
                    {/* Support & Feedback Button */}
                    <a
                        href="mailto:contact@godspeedgrader.com"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-400 transition-all font-bold text-sm group"
                    >
                        <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span>Support & Feedback</span>
                    </a>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5 p-4">
                        {currentUser ? (
                            <>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center shrink-0">
                                        <UserCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {currentUser?.email}
                                        </p>
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                            Free Account
                                        </p>
                                    </div>
                                </div>

                                {syncStatus !== 'idle' && (
                                    <div className={`mb-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${syncStatus === 'syncing' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                        {syncStatus === 'syncing' ? (
                                            <>
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                Syncing...
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-3 h-3" />
                                                Sync Error
                                            </>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Join the Speed</p>
                                <button
                                    onClick={() => navigate('/landing?mode=login')}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
                                >
                                    <Zap className="w-4 h-4 fill-white" />
                                    Sign In / Register
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="text-center mt-2">
                        <button onClick={() => setIsNoticesModalOpen(true)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            Third-Party Notices
                        </button>
                    </div>
                </div>
            </aside>

            <NoticesModal isOpen={isNoticesModalOpen} onClose={() => setIsNoticesModalOpen(false)} />

            {/* ========================================== */}
            {/* MAIN CONTENT AREA */}
            {/* ========================================== */}
            <main className="flex-1 h-full overflow-y-auto relative w-full flex flex-col bg-slate-100 dark:bg-slate-950">

                {/* GLOBAL HEADER */}
                <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                    <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                        <div className="md:hidden">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {pageTitle === 'Dashboard' ? 'GodSpeed' : pageTitle}
                            </h1>
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{pageSub}</p>
                        </div>
                        <div className="hidden md:block">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pageTitle}</h2>
                            <p className="text-xs font-medium text-slate-500">{pageSub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {currentUser && (
                                <NavLink
                                    to="/account"
                                    className={({ isActive }) =>
                                        `hidden md:flex w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl items-center justify-center transition-all ${isActive
                                            ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                                            : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white shadow-sm border border-slate-200/50 dark:border-white/5'
                                        }`
                                    }
                                >
                                    <UserCircle className="w-6 h-6 md:w-7 md:h-7" />
                                </NavLink>
                            )}
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white/20" />
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`flex-1 min-h-full ${isScannerPage ? 'pb-0' : 'pb-24 pb-safe-bottom'} md:pb-0`}>
                    <Outlet />
                    {!isScannerPage && <div className="h-12 md:hidden" />} {/* Extra spacer for general pages */}
                </div>
            </main>

            {/* ========================================== */}
            {/* MOBILE MANAGE MENU (OVERLAY) */}
            {/* ========================================== */}
            {isManageMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsManageMenuOpen(false)}
                >
                    <div
                        className="absolute bottom-20 left-4 right-4 bg-white dark:bg-slate-900 rounded-[28px] p-2 shadow-2xl border border-slate-200/50 dark:border-white/10 animate-in slide-in-from-bottom-10 duration-300"
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

                            {/* Mobile Third-Party Notices Link */}
                            <button
                                onClick={() => {
                                    setIsManageMenuOpen(false);
                                    setIsNoticesModalOpen(true);
                                }}
                                className="flex items-center gap-4 px-4 py-4 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <span className="font-bold">Third-Party Notices</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MOBILE BOTTOM NAV */}
            {/* ========================================== */}
            {!isScannerPage && (
                <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 pb-safe">
                    <div className="flex items-center justify-around px-2 py-2">
                        {mobileMainItems.map((item) => {
                            const isActive = item.isAction ? (isManageActive || isManageMenuOpen) : location.pathname.startsWith(item.path);

                            // 1. Primary "Scan" Button (Big and Centered)
                            if (item.isPrimary) {
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex flex-col items-center justify-center -mt-8 w-16 h-16 rounded-full transition-all shadow-lg active:scale-90 ${isActive
                                                ? 'bg-violet-600 text-white shadow-violet-500/40'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-black/10'
                                            }`
                                        }
                                    >
                                        <item.icon className="w-8 h-8" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter mt-0.5">{item.label}</span>
                                    </NavLink>
                                );
                            }

                            // 2. "Manage" Action Button
                            if (item.isAction) {
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                        className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all relative ${isActive
                                            ? 'text-violet-600 dark:text-violet-400'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                            }`}
                                    >
                                        <div className="relative">
                                            {isManageMenuOpen ? <ChevronUp className="w-6 h-6 mb-0.5 animate-bounce" /> : <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'fill-violet-500/20' : ''}`} />}
                                        </div>
                                        <span className="text-[9px] font-semibold">{item.label}</span>
                                    </button>
                                );
                            }

                            // 3. Standard Nav Links
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={() =>
                                        `flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${isActive
                                            ? 'text-violet-600 dark:text-violet-400'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`
                                    }
                                >
                                    <div className="relative">
                                        <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'fill-violet-500/20' : ''}`} />
                                        {currentUser && item.path === '/account' && syncStatus === 'syncing' && (
                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                <RefreshCw className="w-1.5 h-1.5 text-white animate-spin" />
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-semibold">{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
