import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Camera, Printer, ShieldCheck, ArrowRight, BarChart3, CheckCircle, Check, Star, X, Lock, Loader2 } from 'lucide-react';

// 1. Import your custom AuthContext instead of Firebase
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const navigate = useNavigate();
    // 2. Destructure the login method
    const { login } = useAuth();

    // Auth Modal States
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(false); // Toggle between Signup / Login
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Loading & Error States
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setIsLoading(true);

        try {
            // 3. Point to our new Fastify endpoints
            const endpoint = isLoginMode ? '/auth/login' : '/auth/register';

            const response = await fetch(API_BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role: 'user' })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Authentication failed');
            }

            if (isLoginMode) {
                // Sign In: Update context state
                login(data.token, data.user);
            } else {
                // Sign Up: Auto-login to fetch the JWT token
                const loginResponse = await fetch(API_BASE_URL + '/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const loginData = await loginResponse.json();

                if (loginResponse.ok && loginData.success) {
                    login(loginData.token, loginData.user);
                } else {
                    // Fallback if auto-login fails
                    setIsLoginMode(true);
                    setAuthError('Account created successfully! Please sign in.');
                    setIsLoading(false);
                    return; // Stop execution so we don't navigate yet
                }
            }

            // Success! Close modal and go to dashboard
            setIsAuthModalOpen(false);
            navigate('/dashboard');

        } catch (error: any) {
            console.error("Auth error:", error);
            // Display the specific error message from the backend
            setAuthError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const openModal = (mode: 'login' | 'signup') => {
        setIsLoginMode(mode === 'login');
        setAuthError('');
        setEmail('');
        setPassword('');
        setIsAuthModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500/30 overflow-x-hidden">

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 pt-safe-top">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-sm">
                            <Zap className="w-4 h-4 text-white fill-white/20" />
                        </div>
                        <span className="font-bold tracking-tight text-lg">GodSpeed <span className="font-normal text-slate-500">Grader</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => openModal('login')} className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">Sign In</button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full transition-colors"
                        >
                            Open App (Guest)
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-20 pb-32 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6">
                        Awaken your <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500">
                            camera's potential.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Grade exams at the speed of thought. Turn your phone into a high-speed OMR scanner with local edge-computing. No internet required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button
                            onClick={() => openModal('signup')}
                            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-full font-bold text-lg shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            Start Grading Free <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative w-full max-w-md lg:max-w-none flex justify-center animate-in fade-in zoom-in-95 duration-1000 delay-150">
                    <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/30 via-fuchsia-500/20 to-cyan-400/30 blur-[80px] rounded-full z-0 translate-y-10"></div>

                    <div className="relative z-10 w-[280px] h-[580px] bg-black rounded-[3rem] border-[6px] border-slate-800 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
                        <div className="absolute top-2 inset-x-0 w-24 h-7 bg-black rounded-full mx-auto z-20 shadow-inner"></div>
                        <div className="flex-1 bg-slate-900 relative flex items-center justify-center">
                            <div className="w-48 h-64 bg-slate-100 rounded-sm rotate-2 opacity-80 flex flex-col p-4 gap-2">
                                <div className="w-1/2 h-2 bg-slate-300 rounded"></div>
                                <div className="w-full h-2 bg-slate-300 rounded"></div>
                                <div className="mt-4 grid grid-cols-4 gap-2">
                                    {Array.from({ length: 16 }).map((_, i) => <div key={i} className="w-3 h-3 rounded-full border border-slate-400"></div>)}
                                </div>
                            </div>
                            <div className="absolute inset-0 m-12 border-2 border-green-400/50 rounded-xl rounded-tr-xl shadow-[inset_0_0_20px_rgba(74,222,128,0.2)]"></div>
                        </div>
                        <div className="absolute bottom-6 inset-x-4 bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-2xl">
                            <CheckCircle className="text-green-500 w-12 h-12 mb-3 mx-auto" />
                            <h3 className="text-4xl font-black text-center text-slate-900 mb-1">19 <span className="text-lg text-slate-400">/ 20</span></h3>
                            <p className="text-sm font-bold text-slate-500 text-center bg-slate-100 py-1.5 rounded-lg">Dela Cruz, Juan</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section className="bg-slate-100 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">Simple pricing for Filipino educators.</h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">Serverless, local-first architecture keeps Godspeed free forever. Upgrade only when you need cloud peace of mind.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Guest Tier */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Guest</h3>
                                <p className="text-slate-500 text-sm">Perfect for a quick pop quiz.</p>
                                <div className="mt-4"><span className="text-4xl font-black text-slate-900">Free</span></div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> 50 Scans total</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Local device storage</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> No account required</li>
                            </ul>
                            <button onClick={() => navigate('/dashboard')} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors">
                                Try it out (Guest)
                            </button>
                        </div>

                        {/* 2. Free Account Tier */}
                        <div className="bg-white rounded-3xl p-8 border-2 border-violet-500 shadow-xl shadow-violet-500/10 flex flex-col relative transform md:-translate-y-4">
                            <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                                <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full">Most Popular</span>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Teacher Free</h3>
                                <p className="text-slate-500 text-sm">Everything you need, stored locally.</p>
                                <div className="mt-4"><span className="text-4xl font-black text-slate-900">Free</span></div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-900 font-bold"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Unlimited Scans</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Create unlimited Sections</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Excel Roster Import</li>
                                <li className="flex items-center gap-3 text-slate-400 font-medium text-sm mt-4 p-3 bg-slate-50 rounded-lg">
                                    <ShieldCheck className="w-5 h-5 shrink-0" /> Note: Data is saved to your browser. Clearing cache removes data.
                                </li>
                            </ul>
                            <button onClick={() => openModal('signup')} className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all">
                                Create Free Account
                            </button>
                        </div>

                        {/* 3. Premium Tier */}
                        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Premium Pro
                                </h3>
                                <p className="text-slate-400 text-sm">Peace of mind & deep analytics.</p>
                                <div className="mt-4 flex flex-col">
                                    <div className="flex items-end gap-1">
                                        <span className="text-4xl font-black text-white">₱399</span>
                                        <span className="text-slate-500 mb-1 font-medium">/year</span>
                                    </div>
                                    <div className="mt-1 inline-block bg-cyan-950/50 border border-cyan-800/50 rounded-md px-2 py-1 w-fit">
                                        <span className="text-cyan-400 text-xs font-bold tracking-wide">EQUALS ₱28 / MONTH</span>
                                    </div>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Everything in Free</li>
                                <li className="flex items-center gap-3 text-white font-bold"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Secure Cloud Auto-Sync</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> DepEd Item Analysis Export</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Sync across Phone & Laptop</li>
                            </ul>
                            <button onClick={() => openModal('signup')} className="w-full py-3.5 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors">
                                Subscribe to Pro
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================== */}
            {/* REAL AUTHENTICATION MODAL */}
            {/* ========================================== */}
            {isAuthModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsAuthModalOpen(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pt-10 text-center">
                            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-8 h-8 text-violet-600" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2">
                                {isLoginMode ? 'Welcome Back' : 'Create your Account'}
                            </h3>
                            <p className="text-slate-500 mb-6 font-medium">
                                {isLoginMode ? 'Sign in to access your grading data.' : 'Get unlimited local scans for free.'}
                            </p>

                            {authError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl">
                                    {authError}
                                </div>
                            )}

                            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="teacher@school.edu.ph"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 mt-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLoginMode ? 'Sign In' : 'Create Account')}
                                </button>
                            </form>

                            <div className="mt-6 text-sm text-slate-500 font-medium">
                                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => openModal(isLoginMode ? 'signup' : 'login')}
                                    className="text-violet-600 font-bold hover:underline"
                                >
                                    {isLoginMode ? 'Sign Up' : 'Sign In'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}