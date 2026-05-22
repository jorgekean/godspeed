import React, { useState, useEffect } from 'react';
import { OMRScanner } from "../components/omr/OMRScanner";
import { Zap, Printer, Download, X } from 'lucide-react';

const OMRCheckerPage = () => {
    // 1. Lazy load the initial state from localStorage (defaults to true if empty)
    const [showTemplates, setShowTemplates] = useState(() => {
        const saved = localStorage.getItem('godspeed_show_templates');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // 2. Automatically sync to localStorage whenever the state changes
    useEffect(() => {
        localStorage.setItem('godspeed_show_templates', JSON.stringify(showTemplates));
    }, [showTemplates]);

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] font-sans selection:bg-blue-500/30 pb-safe flex flex-col">

            {/* iOS-Style Glass Header */}
            <header className="sticky top-0 z-40 bg-[#F5F5F7]/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 pt-safe-top">
                <div className="w-full max-w-5xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-all">
                            GodSpeed <span className="font-normal text-gray-400 dark:text-gray-500">Grader</span>
                        </h1>
                        <p className="text-[12px] sm:text-[13px] md:text-[14px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                            Awaken your camera's potential.
                        </p>
                    </div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0 transition-all">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white fill-white/20" />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 transition-all">

                {showTemplates ? (
                    <div className="relative bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 md:p-6 rounded-[24px] sm:rounded-[28px] md:rounded-[32px] shadow-sm border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">

                        <button
                            onClick={() => setShowTemplates(false)}
                            className="absolute top-4 md:top-5 right-4 md:right-5 p-1.5 md:p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>

                        <div className="flex items-start gap-3 sm:gap-4 md:gap-5 pr-8 sm:pr-6">
                            <div className="p-2.5 sm:p-3 md:p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl sm:rounded-2xl shrink-0">
                                <Printer className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-[16px] sm:text-[17px] md:text-[19px] font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
                                    Answer Sheets
                                </h2>
                                <p className="text-[13px] sm:text-[14px] md:text-[15px] text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                                    Download and print the official 20-item and 50-item bubble sheet templates. Ensure your printer does not scale the document.
                                </p>
                            </div>
                        </div>

                        <button className="mt-4 md:mt-5 w-full flex items-center justify-between px-4 md:px-5 py-3 sm:py-3.5 md:py-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl md:rounded-2xl active:scale-[0.98] transition-transform group">
                            <span className="text-[13px] sm:text-[14px] md:text-[15px] font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 transition-colors">
                                Get PDF Templates
                            </span>
                            <Download className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-end animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                            onClick={() => setShowTemplates(true)}
                            className="flex items-center gap-2 px-4 md:px-5 py-2 sm:py-2.5 md:py-3 bg-white dark:bg-[#1C1C1E] rounded-full shadow-sm border border-gray-100 dark:border-white/5 active:scale-95 transition-all"
                        >
                            <Printer className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[13px] md:text-[14px] font-medium text-gray-700 dark:text-gray-300 tracking-tight">Templates</span>
                        </button>
                    </div>
                )}

                {/* Scanner Viewport */}
                <div className="relative w-full flex-1 min-h-[500px] h-[60vh] md:h-[70vh] max-h-[850px] bg-black rounded-[28px] sm:rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl shadow-black/20 dark:shadow-blue-900/10 border-4 md:border-[6px] border-white dark:border-[#1C1C1E] transition-all">
                    <div className="absolute inset-0">
                        <OMRScanner />
                    </div>
                </div>

                <p className="text-center text-[11px] sm:text-[12px] md:text-[13px] text-gray-400 font-medium pb-4">
                    Processing locally on-device. No data leaves your hardware.
                </p>
            </main>
        </div>
    );
}

export default OMRCheckerPage;