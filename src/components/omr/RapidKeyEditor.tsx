import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface RapidKeyEditorProps {
    answerKey: string;
    setAnswerKey: (key: string) => void;
    onClose: () => void;
}

export const RapidKeyEditor: React.FC<RapidKeyEditorProps> = ({
    answerKey,
    setAnswerKey,
    onClose
}) => {

    const handleKeyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase().replace(/[^A-D]/g, '');
        // Hard cap at 50 maximum items
        if (val.length <= 50) {
            setAnswerKey(val);
        }
    };

    return (
        <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] shadow-sm border border-slate-200/50 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-white/5 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-4 pr-8 mb-6">
                <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl shrink-0">
                    <Keyboard className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-[17px] font-semibold text-slate-900 dark:text-white mb-1">Rapid Key Importer</h2>
                    <p className="text-[14px] text-slate-500 dark:text-slate-400">Type your answers (A-D). The length of your key sets the exam length.</p>
                </div>
            </div>

            {/* Massive Input Field */}
            <div className="relative">
                <input
                    type="text"
                    value={answerKey}
                    onChange={handleKeyInput}
                    placeholder="AABCCD..."
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-lg font-mono tracking-[0.3em] text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all uppercase"
                />

                {/* Auto-updating counter */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end pointer-events-none">
                    <span className="text-[11px] font-bold text-violet-500">
                        {answerKey.length} / 50 Max
                    </span>
                </div>
            </div>

            {/* Visual Validation Preview */}
            {answerKey.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Scanned Preview</p>
                        <p className="text-[11px] font-bold text-slate-500">{answerKey.length} Total Items</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {answerKey.split('').map((char, idx) => (
                            <div key={idx} className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold flex items-center justify-center border border-violet-200 dark:border-violet-500/30">
                                {char}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};