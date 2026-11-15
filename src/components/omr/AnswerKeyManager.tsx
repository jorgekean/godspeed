import React, { useState } from 'react';
import { Tag, Check, X, Hash, ChevronDown, Award, Sparkles } from 'lucide-react';

interface AnswerKeyManagerProps {
    answerKey: string;
    setAnswerKey: (key: string) => void;
    competencyMap: Record<string, string>;
    setCompetencyMap: (map: Record<string, string>) => void;
    competencyList: string[];
    setCompetencyList: (list: string[]) => void;
    itemPoints?: number[];
    setItemPoints?: (points: number[]) => void;
    defaultPointsPerItem?: number;
    setDefaultPointsPerItem?: (pts: number) => void;
}

interface ItemPointInputProps {
    value: number;
    onChange: (val: number) => void;
    isCustom: boolean;
}

const ItemPointInput: React.FC<ItemPointInputProps> = ({ value, onChange, isCustom }) => {
    const [localVal, setLocalVal] = useState(value.toString());

    React.useEffect(() => {
        setLocalVal(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value.replace(/[^0-9]/g, '');
        setLocalVal(text);
        if (text === '') return;
        const num = parseInt(text, 10);
        if (!isNaN(num) && num > 0) {
            onChange(Math.min(100, num));
        }
    };

    const handleBlur = () => {
        const num = parseInt(localVal, 10);
        if (isNaN(num) || num < 1) {
            setLocalVal('1');
            onChange(1);
        } else if (num > 100) {
            setLocalVal('100');
            onChange(100);
        } else {
            setLocalVal(num.toString());
            onChange(num);
        }
    };

    return (
        <div
            className={`flex items-center gap-1 shrink-0 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border transition-all ${
                isCustom
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
            }`}
            title="Points for this specific question"
        >
            <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={localVal}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-5 sm:w-6 text-center font-black text-xs bg-transparent outline-none focus:text-violet-600 dark:focus:text-violet-400"
            />
            <span className="text-[10px] font-bold text-slate-400 select-none">
                {parseInt(localVal || '1', 10) === 1 ? 'pt' : 'pts'}
            </span>
        </div>
    );
};

export const AnswerKeyManager: React.FC<AnswerKeyManagerProps> = ({
    answerKey,
    setAnswerKey,
    competencyMap,
    setCompetencyMap,
    competencyList,
    setCompetencyList,
    itemPoints,
    setItemPoints,
    defaultPointsPerItem = 1,
    setDefaultPointsPerItem
}) => {
    const [newCompName, setNewCompName] = useState('');
    const [addingCompForItem, setAddingCompForItem] = useState<number | null>(null);

    // Local state to allow clearing and free-typing
    const [itemCountInput, setItemCountInput] = useState(answerKey.length.toString());
    const [defaultPointsInput, setDefaultPointsInput] = useState((defaultPointsPerItem || 1).toString());

    // Sync input value if answerKey length changes externally
    React.useEffect(() => {
        setItemCountInput(answerKey.length.toString());
    }, [answerKey.length]);

    React.useEffect(() => {
        setDefaultPointsInput((defaultPointsPerItem || 1).toString());
    }, [defaultPointsPerItem]);

    // Derived from props
    const itemCount = answerKey.length;
    const defPoints = defaultPointsPerItem || 1;

    // Synchronized points array
    const currentPoints = React.useMemo(() => {
        const arr = Array(itemCount).fill(defPoints);
        if (itemPoints && Array.isArray(itemPoints)) {
            for (let i = 0; i < Math.min(itemCount, itemPoints.length); i++) {
                if (typeof itemPoints[i] === 'number' && !isNaN(itemPoints[i])) {
                    arr[i] = itemPoints[i];
                }
            }
        }
        return arr;
    }, [itemPoints, itemCount, defPoints]);

    const totalPossibleScore = React.useMemo(() => {
        return currentPoints.reduce((sum, p) => sum + (p || 0), 0);
    }, [currentPoints]);

    const handleItemCountChange = (newCount: number) => {
        const val = Math.min(100, Math.max(1, newCount));
        let newKey = answerKey;
        if (answerKey.length < val) {
            newKey = answerKey.padEnd(val, ' ');
        } else if (answerKey.length > val) {
            newKey = answerKey.substring(0, val);
        }
        setAnswerKey(newKey);

        if (setItemPoints) {
            const nextPoints = Array(val).fill(defPoints);
            for (let i = 0; i < Math.min(val, currentPoints.length); i++) {
                nextPoints[i] = currentPoints[i];
            }
            setItemPoints(nextPoints);
        }
    };

    const handleInputChange = (val: string) => {
        setItemCountInput(val);
        const parsed = parseInt(val);
        if (!isNaN(parsed)) {
            const cleanVal = Math.min(100, Math.max(0, parsed));
            let newKey = answerKey;
            if (answerKey.length < cleanVal) {
                newKey = answerKey.padEnd(cleanVal, ' ');
            } else if (answerKey.length > cleanVal) {
                newKey = answerKey.substring(0, cleanVal);
            }
            setAnswerKey(newKey);
            if (setItemPoints) {
                const nextPoints = Array(cleanVal).fill(defPoints);
                for (let i = 0; i < Math.min(cleanVal, currentPoints.length); i++) {
                    nextPoints[i] = currentPoints[i];
                }
                setItemPoints(nextPoints);
            }
        } else {
            setAnswerKey('');
            if (setItemPoints) setItemPoints([]);
        }
    };

    const handleInputBlur = () => {
        const parsed = parseInt(itemCountInput);
        if (isNaN(parsed) || parsed < 1) {
            setItemCountInput('1');
            handleItemCountChange(1);
        } else if (parsed > 100) {
            setItemCountInput('100');
            handleItemCountChange(100);
        } else {
            setItemCountInput(parsed.toString());
            handleItemCountChange(parsed);
        }
    };

    const handleDefaultPointsChange = (raw: string) => {
        const clean = raw.replace(/[^0-9]/g, '');
        setDefaultPointsInput(clean);

        if (clean === '') return;

        const parsed = parseInt(clean, 10);
        if (!isNaN(parsed) && parsed > 0) {
            const clamped = Math.min(100, parsed);
            if (setDefaultPointsPerItem) {
                setDefaultPointsPerItem(clamped);
            }
            if (setItemPoints) {
                setItemPoints(Array(itemCount).fill(clamped));
            }
        }
    };

    const handleDefaultPointsBlur = () => {
        const parsed = parseInt(defaultPointsInput, 10);
        if (isNaN(parsed) || parsed < 1) {
            setDefaultPointsInput('1');
            if (setDefaultPointsPerItem) setDefaultPointsPerItem(1);
            if (setItemPoints) setItemPoints(Array(itemCount).fill(1));
        } else if (parsed > 100) {
            setDefaultPointsInput('100');
            if (setDefaultPointsPerItem) setDefaultPointsPerItem(100);
            if (setItemPoints) setItemPoints(Array(itemCount).fill(100));
        } else {
            setDefaultPointsInput(parsed.toString());
        }
    };

    const handleSingleItemPointChange = (index: number, pointVal: number) => {
        if (!setItemPoints) return;
        const nextPoints = [...currentPoints];
        nextPoints[index] = pointVal;
        setItemPoints(nextPoints);
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
            
            {/* Header: Item Count & Scoring Controls */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Number of Items */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 bg-violet-100 dark:bg-violet-500/10 rounded-xl shrink-0">
                            <Hash className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Number of Items</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={itemCountInput}
                                onChange={(e) => handleInputChange(e.target.value.replace(/[^0-9]/g, ''))}
                                onBlur={handleInputBlur}
                                placeholder="20"
                                className="w-full bg-transparent font-black text-lg text-slate-900 dark:text-white outline-none focus:text-violet-600"
                            />
                        </div>
                    </div>

                    {/* Default Score / Points per Item */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 rounded-xl shrink-0">
                            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Default Points</label>
                            <div className="flex items-center gap-1 mt-0.5">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={defaultPointsInput}
                                    onChange={(e) => handleDefaultPointsChange(e.target.value)}
                                    onBlur={handleDefaultPointsBlur}
                                    placeholder="1"
                                    className="w-12 bg-transparent font-black text-lg text-slate-900 dark:text-white outline-none focus:text-amber-500"
                                />
                                <span className="text-xs font-bold text-slate-400">pt/item</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Maximum Score */}
                    <div className="flex items-center gap-3 p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-2xl border border-violet-100 dark:border-violet-900/30">
                        <div className="p-2.5 bg-violet-600 text-white rounded-xl shrink-0 shadow-sm shadow-violet-500/30">
                            <Award className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-violet-600/80 dark:text-violet-400 uppercase tracking-wider">Total Max Score</p>
                            <p className="font-black text-lg text-violet-900 dark:text-violet-200">
                                {totalPossibleScore} <span className="text-xs font-bold text-violet-500">pts</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bubble Sheet UI */}
            {itemCount > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/50 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-500" />
                            Answer Key & Item Points
                        </h3>
                        <span className="text-xs font-bold text-slate-400">
                            {itemCount} Items • {totalPossibleScore} Total Pts
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {Array.from({ length: itemCount }).map((_, i) => {
                            const currentAnswer = answerKey[i] || ' ';
                            const currentComp = competencyMap[(i + 1).toString()] || '';
                            const currentItemPt = currentPoints[i] ?? defPoints;
                            
                            return (
                                <div key={i} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    {/* Item Number */}
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black text-slate-400 shrink-0">
                                        {i + 1}
                                    </div>

                                    {/* Bubbles */}
                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                        {['A', 'B', 'C', 'D'].map((letter) => (
                                             <button
                                                key={letter}
                                                type="button"
                                                onClick={() => handleAnswerSelect(i, letter)}
                                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 font-bold text-xs sm:text-sm transition-all flex items-center justify-center active:scale-90 ${
                                                    currentAnswer === letter
                                                        ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-violet-300 dark:hover:border-violet-700'
                                                }`}
                                            >
                                                {letter}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Customizable Point Badge per Item */}
                                    {setItemPoints && (
                                        <ItemPointInput
                                            value={currentItemPt}
                                            onChange={(val) => handleSingleItemPointChange(i, val)}
                                            isCustom={currentItemPt !== defPoints}
                                        />
                                    )}

                                    {/* Competency Dropdown */}
                                    <div className="flex-1 min-w-0">
                                        {addingCompForItem === i ? (
                                            <div className="flex gap-1 sm:gap-2 animate-in slide-in-from-right-2">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newCompName}
                                                    onChange={(e) => setNewCompName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCompetency()}
                                                    placeholder="New topic..."
                                                    className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-800 border-none rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                                />
                                                <button type="button" onClick={handleAddNewCompetency} className="p-1.5 sm:p-2 bg-emerald-500 text-white rounded-lg sm:rounded-xl shadow-sm active:scale-95 shrink-0"><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                                <button type="button" onClick={() => setAddingCompForItem(null)} className="p-1.5 sm:p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg sm:rounded-xl active:scale-95 shrink-0"><X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                                            </div>
                                        ) : (
                                            <div className="relative group">
                                                <select
                                                    value={currentComp}
                                                    onChange={(e) => handleCompetencyChange(i, e.target.value)}
                                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg sm:rounded-xl pl-8 sm:pl-10 pr-6 sm:pr-10 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none outline-none focus:ring-2 focus:ring-violet-500/20 cursor-pointer truncate"
                                                >
                                                    <option value="">No Tag</option>
                                                    {competencyList.map(comp => (
                                                        <option key={comp} value={comp}>{comp}</option>
                                                    ))}
                                                    <option value="NEW" className="text-violet-600 font-bold">+ New Topic...</option>
                                                </select>
                                                <Tag className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
                                                <ChevronDown className="absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 pointer-events-none transition-transform group-focus-within:rotate-180" />
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
