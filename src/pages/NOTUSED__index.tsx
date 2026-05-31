import React, { useState, useEffect } from 'react';
import { OMRScanner } from "../components/omr/OMRScanner";
import { RapidKeyEditor } from "../components/omr/RapidKeyEditor"; // <-- Import it here
import { Zap, Printer, Download, X, KeySquare } from 'lucide-react';

const OMRCheckerPage = () => {
    const [showTemplates, setShowTemplates] = useState(() => {
        const saved = localStorage.getItem('godspeed_show_templates');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const [showKeyEditor, setShowKeyEditor] = useState(false);
    const [examLength, setExamLength] = useState(20);
    const [answerKey, setAnswerKey] = useState("");

    useEffect(() => {
        localStorage.setItem('godspeed_show_templates', JSON.stringify(showTemplates));
    }, [showTemplates]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 font-sans selection:bg-violet-500/30 pb-8 md:pb-12">

            {/* Header stays exactly the same */}
            <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white transition-all">
                            GodSpeed <span className="font-normal text-slate-400 dark:text-slate-500">Grader</span>
                        </h1>
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Awaken your camera's potential. Grade exams in a flash.
                        </p>
                    </div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0 transition-all">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white fill-white/20" />
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col gap-5 md:gap-6 transition-all">

                {/* Top Action Bar */}
                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                    {!showTemplates && (
                        <button
                            onClick={() => { setShowTemplates(true); setShowKeyEditor(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-200/50 dark:border-white/5 active:scale-95 transition-all"
                        >
                            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">Templates</span>
                        </button>
                    )}

                    {!showKeyEditor && (
                        <button
                            onClick={() => { setShowKeyEditor(true); setShowTemplates(false); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-600 rounded-full shadow-sm shadow-violet-500/20 active:scale-95 transition-all group"
                        >
                            <KeySquare className="w-4 h-4 text-white" />
                            <span className="text-[13px] font-medium text-white">
                                {answerKey.length === examLength ? "Key Ready" : "Set Answer Key"}
                            </span>
                        </button>
                    )}
                </div>

                {/* 1. Templates Card */}
                {showTemplates && (
                    <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-200/50 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => setShowTemplates(false)} className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-200 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-4 pr-8">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0">
                                <Printer className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-1">Answer Sheets</h2>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400">Download and print the official 20-item and 50-item bubble sheet templates.</p>
                            </div>
                        </div>
                        <button className="mt-5 w-full flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl active:scale-[0.98] transition-transform group">
                            <span className="text-[14px] font-medium text-violet-600 dark:text-violet-400">Get PDF Templates</span>
                            <Download className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </button>
                    </div>
                )}

                {/* 2. Rapid Key Editor Component is now neat and modular! */}
                {showKeyEditor && (
                    <RapidKeyEditor
                        answerKey={answerKey}
                        setAnswerKey={setAnswerKey}
                        // examLength={examLength}
                        // setExamLength={setExamLength}
                        onClose={() => setShowKeyEditor(false)}
                    />
                )}

                {/* Scanner Viewport */}
                <div className="relative w-full flex flex-col min-h-[650px] sm:min-h-[700px] bg-black rounded-[28px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-black/40 dark:shadow-violet-900/10 border-4 md:border-[6px] border-slate-200 dark:border-slate-900 transition-all">

                    {answerKey.length !== examLength && (
                        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                            <KeySquare className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-white font-semibold text-lg mb-2">Answer Key Required</h3>
                            <p className="text-slate-400 text-sm max-w-[250px] mb-6">You need to set up the answer key before you can start grading.</p>
                            <button
                                onClick={() => {
                                    setShowKeyEditor(true);
                                    setShowTemplates(false);
                                    // ADD THIS LINE: smoothly scroll the user back to the top!
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-full transition-colors"
                            >
                                Setup Key Now
                            </button>
                        </div>
                    )}

                    <OMRScanner />
                </div>

                <p className="text-center text-[11px] sm:text-[12px] md:text-[13px] text-slate-500 dark:text-slate-500 font-medium">
                    Processing locally on-device. No data leaves your hardware.
                </p>
            </main>
        </div>
    );
}

export default OMRCheckerPage;