import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ArrowRight, CheckCircle, Check, Star, X, Mail, Cloud, ShieldCheck, Database, HardDrive, Smartphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
    const navigate = useNavigate();
    const { loginAsGuest, currentUser } = useAuth();
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

    const handleLaunchApp = () => {
        loginAsGuest();
        navigate('/');
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
                        <button
                            onClick={handleLaunchApp}
                            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-full transition-colors flex items-center gap-2"
                        >
                            <span>Open Grader</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-20 pb-32 px-6 max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 text-center lg:text-left z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-bold mb-6">
                        <ShieldCheck className="w-4 h-4" /> 100% Offline • Pure Edge Computing
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[1.1] mb-6">
                        Awaken your <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500">
                            camera's potential.
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 font-medium mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Grade exams at lightning speed. Turn your phone into an offline high-speed OMR scanner with local edge-computing. No cloud servers required, with easy backup to Google Drive.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                        <button
                            onClick={handleLaunchApp}
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

            {/* FEATURES SECTION */}
            <section className="bg-slate-100 py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                            Pure Offline Grading with Google Drive Peace of Mind.
                        </h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">
                            No logins or external servers required. Your exam data lives safely on your device and backs up directly to your personal Google Drive.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8">
                        {/* 1. Offline Tier */}
                        <div className="bg-white rounded-3xl p-8 border-2 border-violet-500 shadow-xl shadow-violet-500/10 flex flex-col relative">
                            <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                                <span className="bg-violet-500 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full">
                                    100% Free Forever
                                </span>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Offline Teacher</h3>
                                <p className="text-slate-500 text-sm">Everything stored locally on your device.</p>
                                <div className="mt-4"><span className="text-4xl font-black text-slate-900">₱0</span></div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-900 font-bold"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Unlimited Offline Scans</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Create Unlimited Sections & Rosters</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Rapid Key Importer & Answer Sheets</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Export Rosters & Item Analysis to Excel</li>
                                <li className="flex items-center gap-3 text-slate-600 font-medium"><Check className="w-5 h-5 text-violet-500 shrink-0" /> Zero Internet Required for Grading</li>
                            </ul>
                            <button
                                onClick={handleLaunchApp}
                                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 transition-all"
                            >
                                Launch Workspace
                            </button>
                        </div>

                        {/* 2. Google Drive Backup Tier */}
                        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Cloud className="w-5 h-5 text-amber-400" /> Google Drive Backup
                                </h3>
                                <p className="text-slate-400 text-sm">Direct, private cloud backup to your own Drive.</p>
                                <div className="mt-4 flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">INCLUDED</span>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-slate-400 text-sm font-medium">Free for all teachers</span>
                                    </div>
                                </div>
                            </div>
                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Direct 1-Click Backup to Google Drive</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> 1-Click Restore to any device</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Local JSON File Export & Import</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Zero intermediary servers (Direct to Google)</li>
                                <li className="flex items-center gap-3 text-slate-300 font-medium"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> Full student data privacy compliance</li>
                            </ul>
                            <button
                                onClick={handleLaunchApp}
                                className="w-full py-3.5 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors"
                            >
                                Start Grading Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* PARTNERSHIP / CONTACT SECTION */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-full text-sm font-bold mb-8">
                        <Zap className="w-4 h-4" /> Institutional Support
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-6">
                        Built for educators, everywhere.
                    </h2>
                    <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
                        Whether you teach in a high-tech smart classroom or a remote province with limited connectivity, Godspeed Grader works offline everywhere you need it.
                    </p>
                    <a
                        href="mailto:contact@godspeedgrader.com"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-lg shadow-xl transition-all active:scale-95 mx-auto"
                    >
                        <Mail className="w-5 h-5" /> Contact Us via Email
                    </a>
                </div>
            </section>

            {/* TERMS MODAL */}
            {isTermsModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">Terms and Conditions</h3>
                            <button onClick={() => setIsTermsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto text-slate-600 space-y-4 text-sm leading-relaxed">
                            <p className="font-bold text-slate-900">Last Updated: June 14, 2026</p>
                            <h4 className="font-bold text-slate-900">1. Offline First & Privacy</h4>
                            <p>GodSpeed Grader operates as a client-side offline application. Your student records, rosters, and test scores are processed locally on your device and are never transmitted to our servers.</p>

                            <h4 className="font-bold text-slate-900">2. Google Drive Backup</h4>
                            <p>When you choose to use the Google Drive backup feature, the application interacts directly with Google's Drive API from your web browser to store your backup files in your personal account.</p>

                            <h4 className="font-bold text-slate-900">3. Limitation of Liability</h4>
                            <p>GodSpeed Grader is provided "as is" without any warranties. Users are advised to regularly create backups using the Google Drive or Export Backup features.</p>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 text-right">
                            <button
                                onClick={() => setIsTermsModalOpen(false)}
                                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
