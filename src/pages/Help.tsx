import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, BookOpen, AlertCircle, Lightbulb, Shield, HelpCircle, X } from 'lucide-react';

const Help = () => {
    const navigate = useNavigate();
    const [expandedStep, setExpandedStep] = useState<number | null>(0);

    const steps = [
        {
            id: 1,
            icon: '📋',
            title: 'Create an Exam (In the App)',
            color: 'from-blue-500 to-blue-600',
            content: [
                'Open GodSpeed Grader on your phone or tablet',
                'Go to "Create Exam" section',
                'Fill in:',
                '  • Exam Name (e.g., "Math Quiz - Chapter 5")',
                '  • Number of Questions (Choose 20 items or 50 items)',
                '  • Subject (e.g., Mathematics, Science, English)',
                'Click "Create" — Your exam is now ready!'
            ]
        },
        {
            id: 2,
            icon: '🖨️',
            title: 'Download & Print Answer Sheets',
            color: 'from-purple-500 to-purple-600',
            subtitle: '💡 Use a Laptop or Desktop Computer',
            content: [
                'Open GodSpeed Grader on your phone or tablet',
                'Click "Download 20-Item Sheet" and "Download 50-Item Sheet"',
                'Save the file to your computer',
                'Open the PDF on your laptop/desktop',
                'Click "Print" and make sure:',
                '  ✅ Do NOT scale or fit to page',
                '  ✅ Print at 100% size',
                '  ✅ Use white paper (8.5" x 11" or A4)'
            ]
        },
        {
            id: 3,
            icon: '✏️',
            title: 'Students Answer the Sheet',
            color: 'from-green-500 to-green-600',
            subtitle: 'Outside the App',
            content: [
                'Distribute the printed answer sheets to students',
                'If the total number of questions is 20 or less, use the 20-item sheet; if 21 , use the 50-item sheet',
                'Students answer by completely shading the bubble (A, B, C, or D)',
                'Students should use:',
                '  • Pencil or black pen for best scanning results',
                '  • Complete shading of the bubble (not just a mark)',
                'Collect all completed sheets'
            ]
        },
        {
            id: 4,
            icon: '📱',
            title: 'Scan & Grade (Back in the App)',
            color: 'from-violet-500 to-violet-600',
            content: [
                '1. Open the Exam: Open GodSpeed Grader → Find and tap your exam → Tap "Start Scanning"',
                '2. Scan Each Sheet:',
                '  • Point your camera at the answer sheet',
                '  • Align all 4 corners inside the blue dotted box',
                '  • The app will automatically capture and scan',
                '3. Review Ambiguous Answers:',
                '  • If the scanner is unsure, check the physical sheet',
                '  • Select the correct answer from the options',
                '4. Move to Next Paper: Click "Scan Next Paper" and repeat'
            ]
        }
    ];

    const proTips = [
        { icon: '✅', text: 'Use good lighting when scanning' },
        { icon: '✅', text: 'Keep the sheet flat and straight in frame' },
        { icon: '✅', text: 'Use black bubbles (not light pencil marks)' },
        { icon: '✅', text: 'Make sure the entire sheet is visible' },
        { icon: '❌', text: 'Avoid using photocopied sheets. Strictly use printed.' },
        { icon: '❌', text: 'Avoid scanning while moving' },
        { icon: '❌', text: 'Avoid very dim lighting' },
        { icon: '❌', text: 'Avoid light pencil marks' },
        { icon: '❌', text: 'Avoid folded or wrinkled sheets' }
    ];

    const troubleshooting = [
        { problem: '📸 Sheet not scanning clearly?', solution: 'Check lighting — Make sure you have good light' },
        { problem: '🎯 Can\'t align the sheet?', solution: 'Align all 4 corners in the blue box on screen' },
        { problem: '📄 Still getting errors?', solution: 'Use fresh, clean sheets — Wrinkled or faded sheets may not scan well' },
        { problem: '🔄 Need to scan again?', solution: 'Sometimes one or two attempts are needed — Keep trying!' }
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div className="flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Help & Guide</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Learn how to use GodSpeed Grader</p>
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

                {/* Steps Section */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span>📚</span> 4 Simple Steps
                    </h2>

                    <div className="space-y-4">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <button
                                    onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 text-left flex-1">
                                        <div className={`text-4xl w-12 h-12 flex items-center justify-center`}>
                                            {step.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                Step {step.id}: {step.title}
                                            </h3>
                                            {step.subtitle && (
                                                <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
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
                                    <div className="px-6 pb-6 pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                                        {step.content.map((line, idx) => (
                                            <p
                                                key={idx}
                                                className={`text-slate-700 dark:text-slate-300 ${line.startsWith('  ') ? 'pl-6 text-sm' : 'font-medium'
                                                    }`}
                                            >
                                                {line.replace(/^  /, '')}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Pro Tips */}
                <section className="bg-linear-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-6">
                    <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Pro Tips for Best Results
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {proTips.map((tip, idx) => (
                            <div key={idx} className="flex gap-2">
                                <span className="text-lg shrink-0">{tip.icon}</span>
                                <p className="text-sm text-amber-900 dark:text-amber-100">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Privacy Section */}
                <section className="bg-linear-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 p-6">
                    <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Your Privacy & Security
                    </h2>
                    <div className="space-y-2 text-sm text-emerald-900 dark:text-emerald-100">
                        <p>✅ All processing happens <strong>on your phone only</strong></p>
                        <p>✅ <strong>No data is uploaded</strong> to the internet</p>
                        <p>✅ Your grades stay with you</p>
                        <p>✅ Perfect for offline use</p>
                    </div>
                </section>

                {/* Troubleshooting */}
                <section>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Troubleshooting
                    </h2>
                    <div className="space-y-3">
                        {troubleshooting.map((item, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/50 dark:border-white/5">
                                <p className="font-bold text-slate-900 dark:text-white mb-2">{item.problem}</p>
                                <p className="text-slate-600 dark:text-slate-300 text-sm">💡 {item.solution}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Still Need Help */}
                <section className="bg-linear-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-6 text-center">
                    <HelpCircle className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Still Need Help?</h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        Try scanning again with better lighting, or check that all corners of the sheet are aligned in the blue box.
                    </p>
                </section>

            </main>
        </div>
    );
};

export default Help;
