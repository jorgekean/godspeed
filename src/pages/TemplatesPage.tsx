import React from 'react';
import { OMRTemplateGenerator } from '../components/omr/OMRTemplate';
import { Printer, Laptop } from 'lucide-react';

export default function TemplatesPage() {
    return (
        <div className="min-h-full flex flex-col font-sans selection:bg-violet-500/30">
            <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 pb-28 md:pb-6 flex flex-col gap-6">
                
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-xl">
                            <Printer className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        Answer Sheet Templates
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm ml-12">
                        Download and print empty bubble sheets for your manual exams.
                    </p>
                </div>

                {/* Desktop Printing Tip Banner */}
                <div className="bg-gradient-to-r from-violet-50/80 via-indigo-50/60 to-slate-50 dark:from-violet-950/20 dark:via-indigo-950/20 dark:to-slate-900/40 border border-violet-100 dark:border-violet-500/20 rounded-2xl p-4 flex items-start sm:items-center gap-3.5 shadow-sm">
                    <div className="p-2.5 bg-violet-600 dark:bg-violet-500 text-white rounded-xl shadow-md shadow-violet-500/20 shrink-0">
                        <Laptop className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Printing sheets from a laptop or computer?
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                            Visit <span className="font-bold text-violet-600 dark:text-violet-400">godspeedgrader.com</span> on your laptop/computer and click <strong className="font-semibold text-slate-800 dark:text-slate-200">Answer Sheets</strong> to print empty bubble sheets directly to your connected printer.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[32px] shadow-sm border border-slate-200/50 dark:border-white/5 overflow-hidden">
                    <OMRTemplateGenerator />
                </div>

                {/* Instructions/Help */}
                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-2">Printing Tips:</h4>
                    <ul className="text-xs text-amber-800/80 dark:text-amber-400/60 space-y-1.5 list-disc pl-4">
                        <li>Print on standard A4 or Letter sized white paper.</li>
                        <li>Ensure the print scale is set to "100%" or "Actual Size" (don't "fit to page").</li>
                        <li>High contrast printing helps the scanner detect bubbles more accurately.</li>
                        <li>Avoid folding or wrinkling the paper before scanning.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}
