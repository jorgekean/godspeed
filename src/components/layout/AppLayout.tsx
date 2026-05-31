import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FileText, Users, FolderKanban, LayoutDashboard, LogOut, UserCircle, Lock, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function AppLayout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, requiresAuth: false },
        // { path: '/exams', label: 'Exams', icon: FileText, requiresAuth: false },
        { path: '/sections', label: 'Sections', icon: FolderKanban, requiresAuth: true },
        { path: '/students', label: 'Students', icon: Users, requiresAuth: true },
        { path: '/account', label: 'Account', icon: User, requiresAuth: false },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const showAuthToast = () => {
        toast('Free Account Required', {
            icon: '🔒',
            description: 'Please sign up for a free account to manage Sections and Students.'
        });
    };

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
                        const isDisabled = item.requiresAuth && !currentUser;
                        const needsAttention = !currentUser && item.path === '/account';

                        // DISABLED STATE RENDER
                        if (isDisabled) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={showAuthToast}
                                    className="w-full flex flex-col px-4 py-2.5 rounded-2xl cursor-not-allowed bg-slate-50 dark:bg-slate-800/20 text-left border border-transparent dark:border-white/5 transition-all"
                                >
                                    <div className="flex items-center justify-between w-full text-slate-400 dark:text-slate-500 opacity-70">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="line-through">{item.label}</span>
                                        </div>
                                        <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mt-1 ml-8">
                                        Registered Only
                                    </span>
                                </button>
                            );
                        }

                        // ACTIVE / NORMAL RENDER
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
                                {({ isActive }) => (
                                    <>
                                        <div className="relative">
                                            <item.icon className="w-5 h-5" />
                                            {/* BOUNCING INDICATOR FOR DESKTOP */}
                                            {needsAttention && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.8)] border-2 border-white dark:border-slate-900"></span>
                                            )}
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
                                {currentUser ? currentUser.email : 'Local Guest'}
                            </p>
                            <p className="text-xs font-medium text-slate-500 truncate">
                                {currentUser ? 'Free Account' : 'Data not backed up'}
                            </p>
                        </div>
                    </div>

                    {currentUser ? (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/account')}
                            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-violet-600 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 rounded-xl transition-colors relative"
                        >
                            <Lock className="w-4 h-4" /> Sign Up for Free
                        </button>
                    )}
                </div>
            </aside>

            {/* ========================================== */}
            {/* MAIN CONTENT AREA */}
            {/* ========================================== */}
            <main className="flex-1 h-full overflow-y-auto relative w-full flex flex-col bg-slate-100 dark:bg-slate-950">
                <div className="pb-24 md:pb-0 min-h-full">
                    <Outlet />
                </div>
            </main>

            {/* ========================================== */}
            {/* MOBILE BOTTOM NAV */}
            {/* ========================================== */}
            <nav className="md:hidden fixed bottom-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 pb-safe">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const isDisabled = item.requiresAuth && !currentUser;
                        const needsAttention = !currentUser && item.path === '/account';

                        // DISABLED STATE RENDER (MOBILE)
                        if (isDisabled) {
                            return (
                                <button
                                    key={item.path}
                                    onClick={showAuthToast}
                                    className="flex flex-col items-center justify-center w-16 h-14 rounded-xl opacity-50 cursor-not-allowed text-slate-400"
                                >
                                    <div className="relative">
                                        <item.icon className="w-6 h-6 mb-1" />
                                        <Lock className="w-3 h-3 absolute -top-1 -right-1 text-violet-500" />
                                    </div>
                                    <span className="text-[10px] font-semibold line-through">{item.label}</span>
                                </button>
                            );
                        }

                        // ACTIVE / NORMAL RENDER (MOBILE)
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className="relative">
                                            <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'fill-violet-500/20' : ''}`} />
                                            {/* BOUNCING INDICATOR FOR MOBILE */}
                                            {needsAttention && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.8)] border-2 border-white dark:border-slate-900"></span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-semibold">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}