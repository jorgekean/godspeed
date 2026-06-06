import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../contexts/SyncContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ShieldCheck, LogOut, Star, Lock, Database, FileText, Loader2, Mail, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AccountPage() {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // 1. Destructure login from our custom context
    const { currentUser, login, logout } = useAuth();
    const { status, triggerSync, lastSyncTimestamp, error: syncError } = useSync();
    const navigate = useNavigate();

    // Auth Form States (Only used if user is NOT logged in)
// ... (rest of the file remains same until the return section)
    const [isLoginMode, setIsLoginMode] = useState(false); // Default to Sign Up
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setIsLoading(true);

        try {
            // 2. Point to our new Fastify endpoints
            const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

            const response = await fetch(API_BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'user' })
            }).catch(() => {
                throw new Error('Could not connect to the server. Please check your internet connection and try again.');
            });

            const data = await response.json().catch(() => ({}));

            // Handle backend errors (e.g., "Email already registered", "Invalid email or password")
            if (!response.ok || !data.success) {
                // If it looks like a Prisma/DB error, hide the technical details
                if (data.message?.includes('prisma') || data.message?.includes('database') || data.message?.includes('connect')) {
                    throw new Error('Our database is currently unavailable. Please try again in a few minutes.');
                }
                throw new Error(data.message || 'Authentication failed. Please check your credentials.');
            }

            if (isLoginMode) {
                // 3. Successful Login: Pass token and user to Context
                login(data.token, data.user);
            } else {
                // 4. Successful Registration: Auto-login to generate the JWT token
                const loginResponse = await fetch(API_BASE_URL + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok && loginData.success) {
                    login(loginData.token, loginData.user);
                } else {
                    // Fallback in case auto-login fails for some reason
                    setIsLoginMode(true);
                    setAuthError('Account created successfully! Please sign in.');
                }
            }
        } catch (error: any) {
            console.error("Auth error:", error);
            // Display the specific message returned from our Fastify backend
            setAuthError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        // Our custom logout is synchronous now, no need to await
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-full flex flex-col p-4 md:p-8 animate-in fade-in duration-300">
            <div className="max-w-3xl space-y-6">

                {/* ========================================== */}
                {/* VIEW 1: USER IS NOT LOGGED IN (AUTH FORM) */}
                {/* ========================================== */}
                {!currentUser && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm max-w-md mx-auto md:mx-0">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isLoginMode ? 'Welcome Back' : 'Create Free Account'}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {isLoginMode ? 'Sign in to access your local gradebooks.' : 'Secure your data and unlock class management.'}
                            </p>
                        </div>

                        {authError && (
                            <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl text-center">
                                {authError}
                            </div>
                        )}

                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="teacher@school.edu.ph"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 mt-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? 'Sign In' : 'Create Account')}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-500 font-medium">
                                {isLoginMode ? "Don't have an account? " : "Already registered? "}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLoginMode(!isLoginMode);
                                        setAuthError('');
                                    }}
                                    className="text-violet-600 dark:text-violet-400 font-bold hover:underline"
                                >
                                    {isLoginMode ? 'Sign Up Free' : 'Sign In'}
                                </button>
                            </p>
                        </div>
                    </div>
                )}

                {/* ========================================== */}
                {/* VIEW 2: USER IS LOGGED IN (DASHBOARD) */}
                {/* ========================================== */}
                {currentUser && (
                    <>
                        {/* PROFILE CARD */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="w-20 h-20 bg-violet-100 dark:bg-violet-500/20 rounded-full flex items-center justify-center shrink-0">
                                    <UserCircle className="w-12 h-12 text-violet-600 dark:text-violet-400" />
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                                        {currentUser.email}
                                    </h2>
                                    <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Free Account
                                    </p>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full md:w-auto px-5 py-3 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* CLOUD SYNC CARD */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cloud Data Sync</h3>
                                        <p className="text-sm text-slate-500 font-medium max-w-sm">
                                            Pull latest data from the cloud or push your local changes manually.
                                        </p>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <RefreshCw className={`w-3.5 h-3.5 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                                                {status === 'syncing' ? 'Syncing...' : (lastSyncTimestamp > 0 ? `Last: ${new Date(lastSyncTimestamp).toLocaleString()}` : 'Never synced')}
                                            </span>
                                            {status === 'idle' && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => triggerSync()}
                                        disabled={status === 'syncing' || !navigator.onLine}
                                        className="w-full md:w-auto px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'syncing' ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-5 h-5" />
                                        )}
                                        Sync Now
                                    </button>
                                    {!navigator.onLine && (
                                        <p className="text-[10px] text-center text-red-500 font-bold uppercase tracking-tighter">Check Internet Connection</p>
                                    )}
                                </div>
                            </div>

                            {syncError && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {syncError}
                                </div>
                            )}
                        </div>

                        {/* SUBSCRIPTION TIER CARD */}
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-xl text-white relative overflow-hidden">
                            {/* Background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                    <h3 className="text-lg font-bold">Premium Pro</h3>
                                </div>
                                <p className="text-slate-400 mb-6 max-w-md">
                                    Get complete peace of mind. Sync your grades to the cloud and unlock DepEd Item Analysis exports.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                        <Database className="w-5 h-5 text-cyan-400 mb-2" />
                                        <h4 className="font-bold text-sm mb-1">Cloud Auto-Sync</h4>
                                        <p className="text-xs text-slate-400">Never lose a gradebook if your cache clears.</p>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                        <FileText className="w-5 h-5 text-fuchsia-400 mb-2" />
                                        <h4 className="font-bold text-sm mb-1">Item Analysis</h4>
                                        <p className="text-xs text-slate-400">Export precise competency reports to Excel.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => alert("Premium upgrades are currently in waitlist mode!")}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl active:scale-95 transition-all"
                                >
                                    Upgrade for ₱299/year
                                </button>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}