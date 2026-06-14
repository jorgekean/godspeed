import React, { useState } from 'react';
import { Tag, Check, X, Hash, ChevronDown } from 'lucide-react';

interface AnswerKeyManagerProps {
    answerKey: string;
    setAnswerKey: (key: string) => void;
    competencyMap: Record<string, string>;
    setCompetencyMap: (map: Record<string, string>) => void;
    competencyList: string[];
    setCompetencyList: (list: string[]) => void;
}

export const AnswerKeyManager: React.FC<AnswerKeyManagerProps> = ({
    answerKey,
    setAnswerKey,
    competencyMap,
    setCompetencyMap,
    competencyList,
    setCompetencyList
}) => {
    const [newCompName, setNewCompName] = useState('');
    const [addingCompForItem, setAddingCompForItem] = useState<number | null>(null);

    // Derived from props
    const itemCount = answerKey.length;

    const handleItemCountChange = (newCount: number) => {
        const val = Math.min(100, Math.max(1, newCount));
        let newKey = answerKey;
        if (answerKey.length < val) {
            newKey = answerKey.padEnd(val, ' ');
        } else if (answerKey.length > val) {
            newKey = answerKey.substring(0, val);
        }
        setAnswerKey(newKey);
    };

    const handleAnswerSelect = (index: number, letter: string) => {
        const keyArray = answerKey.split('').map((char, i) => i === index ? letter : char);
        setAnswerKey(keyArray.join(''));
    };

    const handleCompetencyChange = (index: number, value: string) => {
        const itemNum = (index + 1).toString();
        if (value === 'NEW') {
            setAddingCompForItem(index);
        } else {
            const newMap = { ...competencyMap };
            if (value === '') {
                delete newMap[itemNum];
            } else {
                newMap[itemNum] = value;
            }
            setCompetencyMap(newMap);
        }
    };

    const handleAddNewCompetency = () => {
        if (!newCompName.trim()) return;
        const name = newCompName.trim();
        if (!competencyList.includes(name)) {
            setCompetencyList([...competencyList, name]);
        }
        
        if (addingCompForItem !== null) {
            const itemNum = (addingCompForItem + 1).toString();
            setCompetencyMap({ ...competencyMap, [itemNum]: name });
        }
        
        setNewCompName('');
        setAddingCompForItem(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Item Count Selector */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-50 dark:bg-violet-500/10 rounded-2xl">
                        <Hash className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1 uppercase tracking-wider">Number of Items</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={itemCount || ''}
                            onChange={(e) => handleItemCountChange(parseInt(e.target.value) || 0)}
                            placeholder="e.g. 20"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-violet-500/50 outline-none transition-all text-violet-600 dark:text-violet-400"
                        />
                    </div>
                </div>
            </div>

            {/* Bubble Sheet UI */}
            {itemCount > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-500" />
                            Answer Key & Competencies
                        </h3>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto scrollbar-hide">
                        {Array.from({ length: itemCount }).map((_, i) => {
                            const currentAnswer = answerKey[i] || ' ';
                            const currentComp = competencyMap[(i + 1).toString()] || '';
                            
                            return (
                                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    {/* Item Number */}
                                    <div className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black text-slate-400 shrink-0">
                                        {i + 1}
                                    </div>

                                    {/* Bubbles */}
                                    <div className="flex items-center gap-2">
                                        {['A', 'B', 'C', 'D'].map((letter) => (
                                            <button
                                                key={letter}
                                                onClick={() => handleAnswerSelect(i, letter)}
                                                className={`w-10 h-10 rounded-full border-2 font-bold text-sm transition-all flex items-center justify-center active:scale-90 ${
                                                    currentAnswer === letter
                                                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-violet-300 dark:hover:border-violet-700'
                                                }`}
                                            >
                                                {letter}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Competency Dropdown */}
                                    <div className="flex-1 min-w-0">
                                        {addingCompForItem === i ? (
                                            <div className="flex gap-2 animate-in slide-in-from-right-2">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newCompName}
                                                    onChange={(e) => setNewCompName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCompetency()}
                                                    placeholder="New topic..."
                                                    className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                />
                                                <button onClick={handleAddNewCompetency} className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm active:scale-95"><Check className="w-4 h-4" /></button>
                                                <button onClick={() => setAddingCompForItem(null)} className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-xl active:scale-95"><X className="w-4 h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <select
                                                    value={currentComp}
                                                    onChange={(e) => handleCompetencyChange(i, e.target.value)}
                                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                                                >
                                                    <option value="">No Competency Tag</option>
                                                    {competencyList.map(comp => (
                                                        <option key={comp} value={comp}>{comp}</option>
                                                    ))}
                                                    <option value="NEW" className="text-violet-600 font-bold">+ Add New Topic...</option>
                                                </select>
                                                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Scroll Indicator */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scroll for more items</p>
                    </div>
                </div>
            )}
        </div>
    );
};
