import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, BookOpen, AlertCircle, Lightbulb, Shield, HelpCircle, X, Mail, FileText, Zap, Camera, Printer, LayoutDashboard } from 'lucide-react';

const Help = () => {
    const navigate = useNavigate();
    const [expandedStep, setExpandedStep] = useState<number | null>(0);

    const steps = [
        {
            id: 1,
            icon: <LayoutDashboard className="w-6 h-6" />,
            title: 'Set Up Your Workspace',
            color: 'from-blue-500 to-blue-600',
            content: [
                'Before scanning, define your Grade Levels and Subjects in the "Manage" menu.',
                'Add your Sections (e.g., Section Einstein) and Students.',
                'Pro Tip: Use "Import Paste" to quickly add student rosters from Excel.'
            ]
        },
        {
            id: 2,
            icon: <Printer className="w-6 h-6" />,
            title: 'Download & Print Answer Sheets',
            color: 'from-purple-500 to-purple-600',
            subtitle: 'Pre-filled or Blank Templates',
            content: [
                'Go to "Answer Sheets" for blank templates (20 or 50 items).',
                'Or go to "Sections" and click the Printer icon to get pre-filled sheets with student names.',
                '⚠️ Important: Print at 100% scale (Actual Size). Do NOT "Fit to Page".',
                'Use standard white A4 or Letter paper.'
            ]
        },
        {
            id: 3,
            icon: <FileText className="w-6 h-6" />,
            title: 'Create Your Exam',
            color: 'from-green-500 to-green-600',
            content: [
                'Click "Create New Exam" on the Dashboard.',
                'Set a 4-digit Exam Code (e.g., 0001) — students must shade this on their sheets.',
                'Enter your Answer Key by tapping the bubbles.',
                'Optional: Map competencies to questions for detailed mastery analysis.'
            ]
        },
        {
            id: 4,
            icon: <Camera className="w-6 h-6" />,
            title: 'Scan & Grade',
            color: 'from-violet-500 to-violet-600',
            subtitle: 'Instant or Smart Scanning',
            content: [
                'Instant Scan (Global): Point at any sheet. The app reads the Exam Code and Student ID automatically.',
                'Smart Scanner (Targeted): Open a specific exam and section for guided grading.',
                'Keep the sheet flat and ensure all 4 corners are visible in the camera frame.',
                'Results are saved locally and can be exported to PDF or Excel.'
            ]
        }
    ];

    const proTips = [
        { icon: '✅', text: 'Use good lighting when scanning' },
        { icon: '✅', text: 'Keep the sheet flat and straight in frame' },
        { icon: '✅', text: 'Use black bubbles (not light pencil marks)' },
        { icon: '✅', text: 'Make sure the entire sheet is visible' },
        { icon: '❌', text: 'Avoid using photocopied sheets. Use original prints.' },
        { icon: '❌', text: 'Avoid scanning while moving' },
        { icon: '❌', text: 'Avoid very dim lighting' },
        { icon: '❌', text: 'Avoid folded or wrinkled sheets' }
    ];

    const troubleshooting = [
        { problem: '📸 Sheet not scanning?', solution: 'Check lighting and ensure all 4 corner markers are clearly visible.' },
        { problem: '🎯 Wrong student identified?', solution: 'Ensure the Student ID bubbles are shaded correctly and match your registry.' },
        { problem: '📄 Exam Code not found?', solution: 'Verify the 4-digit code shaded on the sheet matches the code in your Exam settings.' }
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">Help & Guide</h1>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Mastering Godspeed Grader</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <main className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

                {/* Quick Start Section */}
                <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Zap className="w-32 h-32 text-violet-600" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic">Quick Start Guide</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xl">Follow these 4 steps to go from a blank sheet to fully graded exams in record time.</p>

                        <div className="space-y-4">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className="rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all"
                                >
                                    <button
                                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 text-left flex-1">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                {step.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    {step.id}. {step.title}
                                                </h3>
                                                {step.subtitle && (
                                                    <p className="text-xs text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">
                                                        {step.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`w-5 h-5 text-slate-400 transition-transform ${expandedStep === step.id ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {expandedStep === step.id && (
                                        <div className="px-6 pb-6 pt-2 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                                            {step.content.map((line, idx) => (
                                                <div key={idx} className="flex gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 shrink-0" />
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{line}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* User Manual Reference */}
                <section className="bg-violet-600 rounded-[32px] p-8 text-white shadow-xl shadow-violet-500/20">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                            <FileText className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black mb-2 italic uppercase tracking-tight">Looking for the full manual?</h2>
                            <p className="text-violet-100 text-sm leading-relaxed mb-6">
                                Download our comprehensive guide for deep-dives into competency mapping, advanced grade calculations, and multi-class management.
                            </p>
                            <button 
                                onClick={() => navigate('/manual')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-violet-600 font-bold rounded-xl hover:bg-violet-50 transition-all active:scale-95"
                            >
                                <FileText className="w-4 h-4" />
                                View Full User Manual
                            </button>
                        </div>
                    </div>
                </section>

                {/* Pro Tips & Privacy */}
                <div className="grid md:grid-cols-2 gap-6">
                    <section className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 p-6">
                        <h2 className="text-lg font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2 italic uppercase">
                            <Lightbulb className="w-5 h-5" />
                            Pro Tips
                        </h2>
                        <div className="grid gap-3">
                            {proTips.map((tip, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <span className="text-lg shrink-0">{tip.icon}</span>
                                    <p className="text-xs font-bold text-amber-900/70 dark:text-amber-100/70">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 p-6">
                        <h2 className="text-lg font-black text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2 italic uppercase">
                            <Shield className="w-5 h-5" />
                            Privacy First
                        </h2>
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-emerald-800/70 dark:text-emerald-100/70 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                All processing happens on your device.
                            </p>
                            <p className="text-xs font-bold text-emerald-800/70 dark:text-emerald-100/70 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                No student data is uploaded to any cloud.
                            </p>
                            <p className="text-xs font-bold text-emerald-800/70 dark:text-emerald-100/70 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                100% functional without internet.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Troubleshooting */}
                <section className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200/50 dark:border-white/5 shadow-sm">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase">
                        <AlertCircle className="w-6 h-6 text-orange-500" />
                        Troubleshooting
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {troubleshooting.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
                                <p className="font-bold text-slate-900 dark:text-white mb-2 text-sm">{item.problem}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">💡 {item.solution}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Support Footer */}
                <section className="bg-slate-900 dark:bg-white rounded-[40px] p-10 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 dark:bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-white dark:text-slate-900" />
                        </div>
                        <h3 className="text-2xl font-black text-white dark:text-slate-900 mb-2 italic">Still Need Help?</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mb-8 max-w-sm mx-auto font-medium">
                            Our team is ready to assist you. Send us an email and we'll get back to you as soon as possible.
                        </p>
                        <a
                            href="mailto:contact@godspeedgrader.com"
                            className="inline-flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl shadow-xl shadow-violet-500/40 transition-all active:scale-95"
                        >
                            <Mail className="w-5 h-5" />
                            Email Support
                        </a>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Help;
