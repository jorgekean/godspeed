import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, FolderKanban, LayoutDashboard, LogOut, UserCircle, Lock, User, RefreshCw, AlertCircle, Zap, CalendarDays, Settings2, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { toast } from 'sonner';

export default function AppLayout() {
    const { currentUser, logout } = useAuth();
    const { status: syncStatus } = useSync();
    const navigate = useNavigate();
    const location = useLocation();

    // NEW: State for mobile Manage menu
    const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);

    const getPageTitle = (path: string) => {
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/sections')) return 'Sections';
        if (path.startsWith('/students')) return 'Students';
        if (path.startsWith('/periods')) return 'Periods';
        if (path.startsWith('/account')) return 'Account';
        if (path.startsWith('/create')) return 'Create Exam';
        if (path.startsWith('/edit')) return 'Edit Exam';
        if (path.includes('/results')) return 'Exam Results';
        return 'Godspeed Grader';
    };

    const getPageSub = (path: string) => {
        if (path === '/') return `Welcome back, ${currentUser?.email}`;
        if (path.startsWith('/sections')) return 'Manage your classes and advisory groups.';
        if (path.startsWith('/students')) return 'Manage your student rosters.';
        if (path.startsWith('/periods')) return 'Manage your grading periods.';
        if (path.startsWith('/account')) return 'Manage your profile and settings.';
        return 'Grade exams in a flash.';
    };

    const pageTitle = getPageTitle(location.pathname);
    const pageSub = getPageSub(location.pathname);

    const navItems = [
        { path: '/', label: 'Overview', icon: LayoutDashboard },
        { path: '/periods', label: 'Periods', icon: CalendarDays },
        { path: '/sections', label: 'Sections', icon: FolderKanban },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/account', label: 'Account', icon: User },
    ];

    const mobileMainItems = [
        { path: '/', label: 'Home', icon: LayoutDashboard },
        { path: '/manage', label: 'Manage', icon: Settings2, isAction: true },
        { path: '/account', label: 'Account', icon: User },
    ];

    const manageSubItems = [
        { path: '/sections', label: 'Sections', icon: FolderKanban },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/periods', label: 'Periods', icon: CalendarDays },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/landing?mode=login');
    };

    const isManageActive = manageSubItems.some(item => location.pathname.startsWith(item.path));

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

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
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
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* USER PROFILE SECTION */}
                <div className="p-4 m-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center shrink-0">
                            <UserCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {currentUser?.email}
                            </p>
                            <p className="text-xs font-medium text-slate-500 truncate">
                                Free Account
                            </p>
                        </div>
                    </div>

                    {currentUser && syncStatus !== 'idle' && (
                        <div className={`mb-3 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${syncStatus === 'syncing' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {syncStatus === 'syncing' ? (
                                <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    Syncing Cloud Data
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
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

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
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                            <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white/20" />
                        </div>
                    </div>
                </header>

                <div className="pb-24 md:pb-0 min-h-full">
                    <Outlet />
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
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* MOBILE BOTTOM NAV */}
            {/* ========================================== */}
            <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 pb-safe">
                <div className="flex items-center justify-around px-2 py-2">
                    {mobileMainItems.map((item) => {
                        const isActive = item.isAction ? (isManageActive || isManageMenuOpen) : location.pathname.startsWith(item.path);

                        if (item.isAction) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => setIsManageMenuOpen(!isManageMenuOpen)}
                                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all relative ${isActive
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <div className="relative">
                                        {isManageMenuOpen ? <ChevronUp className="w-6 h-6 mb-1 animate-bounce" /> : <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-violet-500/20' : ''}`} />}
                                    </div>
                                    <span className="text-[10px] font-semibold">{item.label}</span>
                                </button>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={() =>
                                    `flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`
                                }
                            >
                                <div className="relative">
                                    <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-violet-500/20' : ''}`} />
                                    {currentUser && item.path === '/account' && syncStatus === 'syncing' && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                            <RefreshCw className="w-2 h-2 text-white animate-spin" />
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-semibold">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}