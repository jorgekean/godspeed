import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Share2, 
    Check, 
    ShieldCheck, 
    Printer, 
    Camera, 
    BarChart3, 
    PlusCircle,
    SlidersHorizontal,
    Lightbulb
} from 'lucide-react';

export default function TutorialPage() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async () => {
        const url = 'https://godspeedgrader.com/tutorial.html';
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
            {/* Sticky Header with Back & Share */}
            <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 pt-safe-top">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopyLink}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-500 hover:to-sky-400 text-white font-bold rounded-full text-xs transition-all shadow-md active:scale-95"
                        >
                            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-3.5 sm:px-6 py-6 md:py-10 space-y-8">
                {/* Hero Header */}
                <div className="text-center max-w-xl mx-auto space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100% Offline • Instant Video Guide
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                        Visual Setup Walkthrough
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                        Follow the 5 step-by-step videos below to set up classes, create exams, print bubble sheets, and grade papers with your camera.
                    </p>
                </div>

                {/* Steps List */}
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-[1fr,270px] gap-6 items-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-md">
                                    Step 1
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    Quick Setup
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-violet-400" /> Setup and Manage
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Organize your school structure, grade levels, classes, and student rosters.
                            </p>
                            <div className="space-y-2 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                    <span>Go to <strong>Manage</strong> in the bottom tab to create Grade Levels and Sections (e.g. <em>Grade 10</em>, <em>Section Rizal</em>).</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                    <span>Add Subjects (e.g. <em>Math</em>, <em>Science</em>, <em>English</em>).</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                    <span>Add students with unique numbers, or import your entire roster in seconds via Excel or spreadsheet copy-paste!</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-violet-950/30 p-2.5 rounded-xl border border-violet-500/30 text-slate-200">
                                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">💡</span>
                                    <span><strong>Computer/Web Tip:</strong> Go to <a href="https://godspeedgrader.com/students" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-bold">godspeedgrader.com/students</a> on your computer to drag & drop your Excel file (<code className="text-[10px] font-mono bg-slate-800 px-1 py-0.5 rounded">.xlsx</code>, <code className="text-[10px] font-mono bg-slate-800 px-1 py-0.5 rounded">.csv</code>) or copy-paste directly from Google Sheets. <strong>Don't forget to click "Sync with Google Drive" on your computer, so on your phone you can simply tap "Sync" to pick up the data!</strong></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-[250px] rounded-[10px] p-[2px] bg-black border-2 border-slate-700 shadow-2xl">
                                <video controls playsInline preload="metadata" className="w-full h-auto object-contain rounded-[4px] bg-black" poster="/tutorial_assets/poster_step1.jpg">
                                    <source src="/tutorial_assets/step1_video.mp4" type="video/mp4" />
                                    <source src="/tutorial_assets/step1_video.mov" type="video/quicktime" />
                                </video>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 mt-2">📱 Setup & Manage Demo (0:43)</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-[1fr,270px] gap-6 items-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-md">
                                    Step 2
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    1-Minute Exam
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <PlusCircle className="w-5 h-5 text-indigo-400" /> Creation of Exam
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Create your exam and tap in your answer key in seconds.
                            </p>
                            <div className="space-y-2 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                    <span>Tap <strong>+ Create New Exam</strong> on the Home dashboard.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                    <span>Enter exam title (e.g. <em>Midterm Math</em>), select Grade Level and Subject.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                    <span>Choose <strong>10, 20, 50, or 100 questions</strong>.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                                    <span>Tap the bubbles to input your Answer Key (A, B, C, D) and tap <strong>Save Exam</strong>.</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-[250px] rounded-[10px] p-[2px] bg-black border-2 border-slate-700 shadow-2xl">
                                <video controls playsInline preload="metadata" className="w-full h-auto object-contain rounded-[4px] bg-black" poster="/tutorial_assets/poster_step2.jpg">
                                    <source src="/tutorial_assets/step2_video.mp4" type="video/mp4" />
                                    <source src="/tutorial_assets/step2_video.mov" type="video/quicktime" />
                                </video>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 mt-2">📱 Exam Creation Demo (0:50)</span>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-[1fr,270px] gap-6 items-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-md">
                                    Step 3
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    Print Sheets
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Printer className="w-5 h-5 text-sky-400" /> Downloading Answer Sheet
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Generate and print optical bubble sheets on standard printer paper.
                            </p>
                            <div className="space-y-2 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                    <span>Tap the <strong>Sheets</strong> tab in the bottom bar.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                    <span>Select <strong>Generate 20, 50, or 100-Item Sheet</strong>.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                    <span>AirPrint directly from iPhone or visit <strong>godspeedgrader.com</strong> on your laptop to print to desktop printer.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
                                    <span><strong>Print Rule:</strong> Print at <strong>100% scale</strong> on regular Letter or A4 paper (do not shrink to fit).</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-[250px] rounded-[10px] p-[2px] bg-black border-2 border-slate-700 shadow-2xl">
                                <video controls playsInline preload="metadata" className="w-full h-auto object-contain rounded-[4px] bg-black" poster="/tutorial_assets/poster_step3.jpg">
                                    <source src="/tutorial_assets/step3_video.mp4" type="video/mp4" />
                                    <source src="/tutorial_assets/step3_video.mov" type="video/quicktime" />
                                </video>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 mt-2">📱 Answer Sheet Demo (0:56)</span>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-[1fr,270px] gap-6 items-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-md">
                                    Step 4
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    1 Sec / Paper
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Camera className="w-5 h-5 text-emerald-400" /> Scanning / Grading
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Grade papers automatically in 1 second per paper with your camera.
                            </p>
                            <div className="space-y-2 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                    <span>Tap your exam card on the Home screen and select your section.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                    <span>Tap <strong>Scan</strong> to activate the camera scanner.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                    <span>Align all <strong>4 corner square markers</strong> inside the guide box. The app scores automatically!</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-[250px] rounded-[10px] p-[2px] bg-black border-2 border-slate-700 shadow-2xl">
                                <video controls playsInline preload="metadata" className="w-full h-auto object-contain rounded-[4px] bg-black" poster="/tutorial_assets/poster_step4.jpg">
                                    <source src="/tutorial_assets/step4_video.mp4" type="video/mp4" />
                                    <source src="/tutorial_assets/step4_video.mov" type="video/quicktime" />
                                </video>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 mt-2">📱 Live Scanning Demo (1:13)</span>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl grid grid-cols-1 md:grid-cols-[1fr,270px] gap-6 items-center">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-md">
                                    Step 5
                                </span>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                    Instant Analytics
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-violet-400" /> Reports / Item Analysis
                            </h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                See detailed item analysis, score averages, and export grades directly.
                            </p>
                            <div className="space-y-2 text-xs text-slate-300">
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                    <span>Your exam card displays <strong className="text-emerald-400">GRADED</strong> on the dashboard.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                    <span>Tap the <strong>Analytics icon</strong> to view class averages, passing rate, and hardest questions.</span>
                                </div>
                                <div className="flex items-start gap-2.5 bg-slate-800/40 p-2.5 rounded-xl border border-white/5">
                                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                    <span>Export grades directly to <strong>CSV / Excel</strong> for your school portal.</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-full max-w-[250px] rounded-[10px] p-[2px] bg-black border-2 border-slate-700 shadow-2xl">
                                <video controls playsInline preload="metadata" className="w-full h-auto object-contain rounded-[4px] bg-black" poster="/tutorial_assets/poster_step5.jpg">
                                    <source src="/tutorial_assets/step5_video.mp4" type="video/mp4" />
                                    <source src="/tutorial_assets/step5_video.mov" type="video/quicktime" />
                                </video>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 mt-2">📱 Reports & Item Analysis Demo (0:32)</span>
                        </div>
                    </div>
                </div>

                {/* Pro Tips Card */}
                <div className="bg-gradient-to-r from-amber-500/10 to-violet-500/10 border border-amber-500/20 rounded-3xl p-5 sm:p-6 space-y-2.5">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Pro-Tips for Perfect Scanning
                    </h4>
                    <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
                        <p>• <strong>Lighting:</strong> Ensure even overhead lighting without strong diagonal shadows across the 4 corner squares.</p>
                        <p>• <strong>Flatness:</strong> Smooth out any folded or curled corners so all 4 square markers lie flat.</p>
                        <p>• <strong>Pencils or Pens:</strong> Supports standard HB/2B pencils and dark black or dark blue ballpoint pens.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}