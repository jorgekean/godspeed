import React, { useState } from 'react';
import { useLicense } from '../../contexts/LicenseContext';
import { 
    Sparkles, 
    Check, 
    X, 
    ShieldCheck, 
    RefreshCw, 
    Lock, 
    Zap, 
    Infinity,
    Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PaywallModal: React.FC = () => {
    const { 
        licenseStatus, 
        isPaywallOpen, 
        paywallTriggerReason, 
        closePaywall, 
        purchaseLifetime, 
        restorePurchases 
    } = useLicense();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    if (!isPaywallOpen) return null;

    const handlePurchase = async () => {
        setIsProcessing(true);
        try {
            await purchaseLifetime();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRestore = async () => {
        setIsRestoring(true);
        try {
            await restorePurchases();
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden relative animate-in zoom-in-95 duration-300">
                
                {/* Close Button */}
                <button
                    onClick={closePaywall}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Hero Gradient Header */}
                <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-b from-violet-500/10 via-amber-500/5 to-transparent">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-xl shadow-violet-500/30 mb-4 animate-bounce duration-1000">
                        <Sparkles className="w-8 h-8 fill-white/20" />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
                        <Award className="w-3.5 h-3.5" />
                        {licenseStatus.isInTrial 
                            ? `Trial Active: ${licenseStatus.daysRemaining} Days Left` 
                            : `Monthly Quota: ${licenseStatus.monthlyScansUsed}/${licenseStatus.monthlyScanLimit} Used`}
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Unlock Lifetime Access
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        {paywallTriggerReason || 'Grade unlimited exams forever with zero monthly subscriptions.'}
                    </p>

                    {/* Price Tag */}
                    <div className="mt-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 inline-block w-full">
                        <div className="flex items-baseline justify-center gap-1.5">
                            <span className="text-3xl sm:text-4xl font-black text-violet-900 dark:text-violet-200">
                                {licenseStatus.priceDisplay}
                            </span>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                / One-Time Forever
                            </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                            Pay once, own it for life. No recurring charges.
                        </p>
                    </div>
                </div>

                {/* Features List */}
                <div className="px-6 py-4 space-y-2.5">
                    {[
                        { title: 'Unlimited Exam Scanning', desc: 'Instant optical mark recognition with on-device AI' },
                        { title: 'Item Analysis & PDF Reports', desc: 'Export student test performance and competency matrices' },
                        { title: '100% Offline & Private', desc: 'Zero data tracking, FERPA & COPPA compliant design' },
                        { title: 'Apple Files & Google Drive', desc: 'Secure local and personal cloud data backup' },
                        { title: 'All Future Updates Included', desc: 'Continuous improvements with no maintenance fees' }
                    ].map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                    {feature.title}
                                </p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
                                    {feature.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-2 space-y-3">
                    <button
                        type="button"
                        onClick={handlePurchase}
                        disabled={isProcessing || isRestoring}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-violet-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Connecting to App Store...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4 fill-white" />
                                <span>Unlock Lifetime Access • {licenseStatus.priceDisplay}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleRestore}
                        disabled={isProcessing || isRestoring}
                        className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                        {isRestoring ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Restoring previous purchase...</span>
                            </>
                        ) : (
                            <span>Restore Purchases</span>
                        )}
                    </button>

                    {/* Legal & Privacy Links */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-3 text-[10px] text-slate-400">
                        <Link 
                            to="/privacy" 
                            onClick={closePaywall}
                            className="hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <a
                            href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                            Terms of Use (EULA)
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};
