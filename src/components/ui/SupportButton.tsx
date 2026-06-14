import React from 'react';
import { MessageSquare, Mail, X } from 'lucide-react';

export function SupportButton() {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="fixed top-20 right-4 md:top-24 md:right-8 z-[60] flex flex-col items-end gap-3 pointer-events-none">
            {/* Popover/Tooltip */}
            {isOpen && (
                <div className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 w-64 animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                            <MessageSquare className="w-4 h-4 text-violet-500" />
                            Need help?
                        </h4>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Found a bug or have a suggestion? We're here to help you grade faster.
                    </p>
                    <a 
                        href="mailto:contact@godspeedgrader.com"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-95"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        Email Support
                    </a>
                </div>
            )}

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-full shadow-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 active:scale-90 transition-all group relative"
                title="Support & Feedback"
            >
                <div className="absolute inset-0 bg-violet-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                <MessageSquare className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
                <X className={`absolute w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
                
                {/* Notification dot */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-violet-500 border-2 border-white dark:border-slate-950 rounded-full animate-pulse"></span>
                )}
            </button>
        </div>
    );
}
