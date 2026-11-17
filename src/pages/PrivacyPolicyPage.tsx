import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, 
    Lock, 
    Camera, 
    Database, 
    Cloud, 
    Trash2, 
    ArrowLeft, 
    FileText,
    CheckCircle2,
    EyeOff
} from 'lucide-react';

export default function PrivacyPolicyPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
            {/* Top Bar with Back Button */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 pt-safe-top">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-4 h-4" /> Privacy-First Architecture
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
                {/* Hero */}
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 mb-2">
                        <Lock className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Last Updated: November 2026 • Godspeed Grader
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                        Godspeed Grader is built from the ground up to protect student privacy and teacher data. We believe your educational records belong solely to you and your school.
                    </p>
                </div>

                {/* Key Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-2 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <Database className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">100% Local Storage</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            All students, classes, and exam grades live in your device's local database. No central server stores your data.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-2 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                            <Camera className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">On-Device CV</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Camera frames are processed in real-time via WebAssembly on your phone. No photos or videos are ever uploaded.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 space-y-2 shadow-sm">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <EyeOff className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">No Trackers or Ads</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Zero third-party tracking libraries, advertising SDKs, or data brokers. Your educational workflow is strictly private.
                        </p>
                    </div>
                </div>

                {/* Detailed Sections */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 p-6 md:p-8 space-y-8 shadow-sm">
                    
                    {/* Section 1 */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center justify-center">1</span>
                            Student Data Privacy & FERPA / COPPA Alignment
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Godspeed Grader does not collect, transmit, sell, or rent student personal data. All student identifiers, rosters, and test scores remain confined within your device's sandboxed storage. Because the application does not transmit student data to developer servers, it aligns with student privacy standards, including the Family Educational Rights and Privacy Act (FERPA) and Children’s Online Privacy Protection Act (COPPA).
                        </p>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Section 2 */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center justify-center">2</span>
                            Camera Permission & Video Feed Processing
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            When you grant camera access, the camera feed is used exclusively for scanning bubble answer sheets in real-time. The computer vision analysis is executed completely on-device using a client-side WebAssembly build of OpenCV.
                        </p>
                        <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside pl-1">
                            <li>Camera frames are evaluated in volatile memory and discarded immediately after mark detection.</li>
                            <li>No photos, video streams, or biometric faces are ever recorded, saved, or sent over the internet.</li>
                            <li>You can revoke camera permissions at any time in your device’s System Settings.</li>
                        </ul>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Section 3 */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center justify-center">3</span>
                            Optional Cloud Storage & Apple Files / iCloud Drive
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Godspeed Grader provides optional cloud and file backup features strictly under your control:
                        </p>
                        <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside pl-1">
                            <li><strong className="text-slate-800 dark:text-slate-200">Apple Files & iCloud Drive:</strong> When you export a backup, the file is saved directly to your Apple Files or iCloud Drive using standard iOS native file dialogs.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Google Drive Sync:</strong> If you connect Google Drive, the app uses direct OAuth 2.0 PKCE to write a single backup file directly to your personal Google Drive storage. Godspeed Grader developers never have access to your credentials or files.</li>
                        </ul>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Section 4 */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center justify-center">4</span>
                            Data Retention & Full Deletion Control
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            You retain full authority over your data. Under the <strong className="text-slate-800 dark:text-slate-200">Profile & Backup</strong> screen, you have access to:
                        </p>
                        <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc list-inside pl-1">
                            <li><strong className="text-slate-800 dark:text-slate-200">Export:</strong> Download a full, readable JSON backup of your records at any time.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Clear All Workspace Data:</strong> Immediately wipe all local IndexedDB tables with a single tap.</li>
                            <li><strong className="text-slate-800 dark:text-slate-200">Uninstalling:</strong> Deleting the app from your device immediately erases all locally stored database files.</li>
                        </ul>
                    </section>

                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                    {/* Section 5 */}
                    <section className="space-y-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-black flex items-center justify-center">5</span>
                            Contact Us
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            If you have questions about this Privacy Policy or data privacy in Godspeed Grader, please contact us:
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400">
                            Email: privacy@godspeedgrader.com
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}
