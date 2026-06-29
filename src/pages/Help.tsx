import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronDown, 
    BookOpen, 
    AlertCircle, 
    Lightbulb, 
    X, 
    FileText, 
    Zap, 
    Camera, 
    Printer, 
    LayoutDashboard,
    BarChart3,
    ArrowLeft,
    ListChecks,
    Info
} from 'lucide-react';

export default function Help() {
    const navigate = useNavigate();
    const [expandedStep, setExpandedStep] = useState<number | null>(1);

    const steps = [
        {
            id: 1,
            title: 'Setting Up Your Classes and Students',
            icon: <LayoutDashboard className="w-6 h-6 text-blue-500" />,
            intro: 'Before you create an exam, you need to set up your school structure. All of these settings are located under the Manage button.',
            content: (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">1</span>
                            Create a Grade or Year Level
                        </h4>
                        <p className="pl-7 leading-relaxed">
                            Tap the <strong className="text-slate-800 dark:text-slate-200">Manage</strong> button in your app. Start by creating your <strong>Grade Level</strong> (e.g., Grade 10, Grade 11) or <strong>Year Level</strong> (e.g., 1st Year, 2nd Year). Setting this up first ensures your sections have a proper category to fall under.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">2</span>
                            Create a Section
                        </h4>
                        <p className="pl-7 leading-relaxed">
                            Still under the <strong className="text-slate-800 dark:text-slate-200">Manage</strong> menu, select <strong>Create Section</strong>. Name your class (e.g., "Section A" or "Rizal") and assign it to the Grade or Year Level you just created.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/35 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center">3</span>
                            Add Students
                        </h4>
                        <div className="pl-7 space-y-3">
                            <p className="leading-relaxed">
                                Go to <strong>Create Students</strong> under the <strong className="text-slate-800 dark:text-slate-200">Manage</strong> menu.
                            </p>
                            <ul className="list-disc pl-5 space-y-2.5">
                                <li><strong>Manual Entry:</strong> You can type in student details one by one.</li>
                                <li><strong>Bulk Entry (Laptop/Web):</strong> If you are using a laptop and have your student list in an Excel file, you can simply copy and paste the data.</li>
                            </ul>

                            <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-2xl mt-2 text-amber-850 dark:text-amber-400">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h5 className="font-bold text-xs uppercase tracking-wider">⚠️ Important Note on Student Numbers</h5>
                                    <p className="text-xs leading-relaxed opacity-90">
                                        Every student must have a unique Student Number (maximum of 8 characters). The system relies on this unique number for automatic grading and saving. If your school's official student numbers are longer than 8 characters, please trim them down, just ensure no two students have the same number.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: 'Creating an Exam',
            icon: <FileText className="w-6 h-6 text-emerald-500" />,
            intro: 'Now that your students are in the system, let’s create an exam.',
            content: (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <p className="leading-relaxed">Fill out the following fields to set up your test:</p>
                    <div className="grid gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 font-medium">
                        <ul className="space-y-2.5 list-disc pl-5 leading-relaxed">
                            <li><strong>Title:</strong> Give your exam a clear name (e.g., "Midterm Math Exam").</li>
                            <li><strong>Exam Code:</strong> <em className="text-violet-650 dark:text-violet-400 font-semibold">Auto-generated.</em> The system will create a code (e.g., 0001). This code is crucial because the app uses it to instantly grade the right answer key.</li>
                            <li><strong>Grade/Year Level:</strong> Select the appropriate level. This automatically tags the exam to the matching sections you created earlier.</li>
                            <li><strong>Subject:</strong> Enter the subject name.</li>
                            <li><strong>Folder:</strong> Assign the exam to a specific folder (e.g., <em>1st Qtr 2026</em>, <em>2026 1st Sem</em>). This keeps your terms organized and is highly useful for future reporting and filtering.</li>
                            <li><strong>Number of Items:</strong> Enter the total number of questions (Maximum of 100 items).</li>
                            <li><strong>Answer Key:</strong> Select the correct answers for your test.</li>
                        </ul>
                    </div>

                    <div className="flex gap-3 p-4 bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/10 rounded-2xl text-violet-850 dark:text-violet-400">
                        <Lightbulb className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-xs uppercase tracking-wider block mb-0.5">💡 Pro-Tip</span>
                            <p className="text-xs leading-relaxed opacity-95">
                                You can optionally tag "Competencies" to each question. This provides you with detailed item analysis and competency reports after grading!
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: 'Printing Answer Sheets',
            icon: <Printer className="w-6 h-6 text-purple-500" />,
            intro: 'You have two convenient ways to print answer sheets for your students:',
            content: (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <ul className="space-y-3 leading-relaxed list-disc pl-5">
                        <li><strong>Option A (Standard):</strong> Tap <strong className="text-slate-900 dark:text-white">Sheets</strong> on the bottom navigation bar to print blank sheets.</li>
                        <li><strong>Option B (Recommended):</strong> Go to the <strong className="text-slate-900 dark:text-white">Sections</strong> page. Printing from here is great because it automatically pre-fills the students' numbers onto their answer sheets!</li>
                    </ul>

                    <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl text-blue-800 dark:text-blue-400">
                        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-xs uppercase tracking-wider block mb-0.5">🗣️ Instructions for Students</span>
                            <p className="text-xs leading-relaxed opacity-95">
                                When handing out the printed answer sheets, firmly remind your students to write down and bubble in the correct <strong>Exam Code</strong> (the one auto-generated in Step 2) so the scanner knows which answer key to use.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: 'Grading the Exams',
            icon: <Camera className="w-6 h-6 text-violet-500" />,
            intro: 'Time to grade! The app features a powerful scanner to make this instant.',
            content: (
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs mt-0.5">1</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Select Your Exam</h4>
                                <p className="leading-relaxed">Go to the <strong>Home Page</strong>. Tap on the Exam you want to grade (Make sure to tap the exam item itself, <em>not</em> the edit button).</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs mt-0.5">2</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Test Your Environment (Quick Scan)</h4>
                                <p className="leading-relaxed">Once inside the exam page, it is highly recommended to try the <strong>Quick Scan</strong> feature first. This acts as a trial run to test if your room's lighting and camera positioning are optimal for the scanner to read the bubbles, without actually saving the grades yet.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs mt-0.5">3</span>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">Start Official Grading</h4>
                                <p className="leading-relaxed">Once you confirm the environment is good, select the section you want to grade first from the list shown under that exam. Align your camera and <strong>Start Scanning</strong>. Once finished with one section, simply move on to the next section or a different exam.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 p-5 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-[24px] text-amber-850 dark:text-amber-400">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-xs uppercase tracking-wider block mb-1">💡 Scanning Tips for Best Results</span>
                            <ul className="text-xs list-disc pl-4 space-y-1.5 leading-relaxed opacity-95">
                                <li>The scanner works well in dim light, but if you are grading at night, avoid harsh, direct glare from overhead lights hitting the paper.</li>
                                <li>If the scanner struggles to pick up the paper during your Quick Scan test, try slightly changing your phone's angle or moving away from direct light sources.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 5,
            title: 'Viewing Results and Analytics',
            icon: <BarChart3 className="w-6 h-6 text-fuchsia-500" />,
            intro: 'Once scanning is complete, you can review your students\' performance and insights.',
            content: (
                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <ul className="space-y-2.5 list-disc pl-5 leading-relaxed">
                        <li>Navigate back to the <strong>Home Page</strong>.</li>
                        <li>Select the exam you want to review.</li>
                        <li>Tap the <strong>Bar Icon</strong> (Analytics/Reports tab) to view detailed results, class averages, and competency reports.</li>
                    </ul>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 pb-20 font-sans transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
                <div className="w-full max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-600" />
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Help & Guide</h1>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="w-full max-w-4xl mx-auto px-4 py-12">
                {/* Hero Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        How-To Guide
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 italic tracking-tight">
                        📱 App User Guide: <span className="text-violet-600">From Setup to Grading</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
                        Welcome! This guide will walk you through everything you need to know to easily manage your classes, create exams, print answer sheets, and automatically grade them using our built-in scanner.
                    </p>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                    {steps.map((step) => {
                        const isOpen = expandedStep === step.id;
                        return (
                            <div 
                                key={step.id} 
                                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() => setExpandedStep(isOpen ? null : step.id)}
                                    className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shrink-0">
                                            {step.icon}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest block mb-0.5">Step 0{step.id}</span>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{step.title}</h3>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-600' : ''}`} />
                                </button>

                                {isOpen && (
                                    <div className="px-6 pb-8 border-t border-slate-100/50 dark:border-slate-800/40 pt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-350 leading-relaxed border-l-2 border-violet-500 pl-3">
                                            {step.intro}
                                        </p>
                                        <div className="pt-2">
                                            {step.content}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
