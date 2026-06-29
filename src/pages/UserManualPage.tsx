import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, LayoutDashboard, Printer, FileText, Camera, BarChart3, Lightbulb, Zap, CheckCircle2, ChevronRight } from 'lucide-react';

export default function UserManualPage() {
    const navigate = useNavigate();

    const sections = [
        {
            id: 'setup',
            title: '1. Setting Up Your Workspace',
            icon: <LayoutDashboard className="w-6 h-6 text-blue-500" />,
            content: (
                <div className="space-y-6">
                    <p className="text-slate-600 dark:text-slate-400">
                        Before scanning, you need to define your academic structure. On <strong className="text-slate-900 dark:text-white">Desktop</strong>, use the sidebar; on <strong className="text-slate-900 dark:text-white">Mobile</strong>, tap the <strong className="text-slate-900 dark:text-white">Manage</strong> icon in the bottom bar.
                    </p>
                    
                    <div className="grid gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                The Registries
                            </h4>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-6 list-disc">
                                <li><strong>Grade/Year Levels:</strong> Navigate to <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">Grade/Year Levels</code> to define your levels (e.g., Grade 7, Grade 10, 1st Year College).</li>
                                <li><strong>Subjects:</strong> List the classes you teach. You can define "WW-PT-QA" weights (e.g., 30-50-20) for automatic grade calculation.</li>
                            </ul>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                Folders & Sections
                            </h4>
                            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2 ml-6 list-disc">
                                <li><strong>Folders:</strong> Create folders (e.g., 1st Quarter, Midterms) to organize your exams and grades.</li>
                                <li><strong>Sections:</strong> Create sections (e.g., "Newton") and link them to Grade/Year Levels.</li>
                                <li><strong>Students:</strong> Add manually or use <strong className="text-violet-600">Import Paste</strong> to copy rosters directly from Excel.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'exams',
            title: '2. Managing Your Exams',
            icon: <FileText className="w-6 h-6 text-emerald-500" />,
            content: (
                <div className="space-y-6">
                    <div className="p-6 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-[24px]">
                        <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-4">Creating an Exam</h4>
                        <ol className="space-y-4 text-sm text-emerald-800/80 dark:text-emerald-400/60">
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center font-bold text-xs text-emerald-700">1</span>
                                <span><strong>Exam Code:</strong> Set a unique 4-digit code (e.g., <code>0001</code>). Students <strong>must</strong> shade this for the scanner to work.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center font-bold text-xs text-emerald-700">2</span>
                                <span><strong>Answer Key:</strong> Tap the bubbles in the editor to set the correct answers.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center font-bold text-xs text-emerald-700">3</span>
                                <span><strong>Competency Mapping:</strong> Link questions to specific skills to track student mastery automatically.</span>
                            </li>
                        </ol>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl">
                        <Printer className="w-5 h-5 text-amber-600 shrink-0 mt-1" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">Printing Templates</h4>
                            <p className="text-xs text-amber-800/80 dark:text-amber-400/60 leading-relaxed">
                                Use the <strong>Answer Sheets</strong> page for blank templates. For pre-filled sheets with student names, go to the <strong>Sections</strong> page and click the printer icon.
                                <br/><br/>
                                <strong>Tip:</strong> Always print at "100%" scale. Do not "Fit to Page."
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'scanning',
            title: '3. Dual-Mode Scanning',
            icon: <Camera className="w-6 h-6 text-violet-500" />,
            content: (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                        <div className="w-10 h-10 bg-violet-50 dark:bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5 text-violet-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Instant Scan</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Tap the <strong>Scan</strong> icon in the mobile nav. Point at any sheet, and Godspeed reads the code and ID automatically. Best for mixed stacks of papers.
                        </p>
                    </div>
                    <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-2">Smart Scanner</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Open a specific exam from your dashboard. Select a section first for guided grading and manual student tagging if IDs are unreadable.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'results',
            title: '4. Analyzing Results',
            icon: <BarChart3 className="w-6 h-6 text-fuchsia-500" />,
            content: (
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                        Click the <strong>Bar Chart</strong> icon on any exam card to enter the results dashboard.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['Summary View', 'Mastery View', 'Detailed Grid', 'Excel Export'].map(item => (
                            <div key={item} className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center uppercase tracking-wider">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">User Manual</h1>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                        <Zap className="w-3 h-3 fill-current" />
                        Privacy-First Offline OMR
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 italic tracking-tight">
                        Master Godspeed <span className="text-violet-600">Grader</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Welcome to the official manual. This guide covers everything from your first section setup to advanced competency tracking and exports.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="space-y-12">
                    {sections.map((section) => (
                        <section key={section.id} className="relative">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/5">
                                    {section.icon}
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="pl-0 md:pl-16">
                                {section.content}
                            </div>
                        </section>
                    ))}
                </div>

                {/* Pro Tips Footer */}
                <section className="mt-20 p-8 md:p-12 bg-slate-900 dark:bg-white rounded-[40px] text-white dark:text-slate-900 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <Lightbulb className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-8 italic uppercase tracking-tighter">Pro Tips for Success</h2>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {[
                                { title: 'Lighting', desc: 'Scan in bright, indirect light. Avoid harsh shadows.' },
                                { title: 'Steady', desc: 'Keep your phone parallel to the paper for maximum accuracy.' },
                                { title: 'Bubbles', desc: 'Use dark ink/pencil. Ensure students shade fully.' },
                                { title: 'Offline', desc: 'Sync your data to the cloud only when you need a backup.' },
                            ].map((tip, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-slate-100 flex items-center justify-center font-black text-xs shrink-0">
                                        0{i + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">{tip.title}</h4>
                                        <p className="text-sm opacity-60 leading-relaxed">{tip.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="mt-20 pb-12 text-center">
                    <p className="text-slate-400 text-xs font-medium">
                        Godspeed Grader © 2026 • Privacy-First EdTech
                    </p>
                </footer>
            </main>
        </div>
    );
}
