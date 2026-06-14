import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { backgroundColor: '#FFFFFF', position: 'relative', padding: 0 },

    // Universal 4 Corner Registration Blocks (40x40 pixels)
    // Centers exactly at (50,50), (750,50), (50,950), and (750,950)
    markerTopLeft: { position: 'absolute', top: 30, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerTopRight: { position: 'absolute', top: 30, left: 730, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomLeft: { position: 'absolute', top: 930, left: 30, width: 40, height: 40, backgroundColor: '#000000' },
    markerBottomRight: { position: 'absolute', top: 930, left: 730, width: 40, height: 40, backgroundColor: '#000000' },

    title: { position: 'absolute', width: '100%', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
    headerText: { position: 'absolute', fontFamily: 'Helvetica' },
    questionNumber: { position: 'absolute', fontFamily: 'Helvetica-Bold', color: '#000000' },

    bubble: { position: 'absolute', borderRadius: 15, borderWidth: 1.5, borderColor: '#B4B4B4', justifyContent: 'center', alignItems: 'center' },
    bubbleText: { fontFamily: 'Helvetica', color: '#B4B4B4' }
});

const SheetBase = ({ children, title }: { children: React.ReactNode, title: string }) => (
    <Document>
        <Page size={[800, 1000]} style={styles.page}>
            <View style={styles.markerTopLeft} />
            <View style={styles.markerTopRight} />
            <View style={styles.markerBottomLeft} />
            <View style={styles.markerBottomRight} />

            <Text style={[styles.title, { top: 60, fontSize: 24 }]}>{title}</Text>
            <Text style={[styles.headerText, { top: 110, left: 100, fontSize: 14 }]}>Name: _________________________________</Text>
            <Text style={[styles.headerText, { top: 110, left: 500, fontSize: 14 }]}>Score: _______________</Text>

            {children}
        </Page>
    </Document>
);

const Document20Item = ({ studentNo }: { studentNo?: string }) => {
    const choicesMap = ['A', 'B', 'C', 'D'];
    const startX = 520; const startY = 180;
    const rowHeight = 35; const bubbleSpacing = 45; const bubbleSize = 30;

    // Grid config for Student Info
    const gridStartX = 100;
    const examCodeY = 180;
    const studentNoY = 460;
    const gridBubbleSize = 18;
    const gridSpacingX = 24;
    const gridSpacingY = 22;

    const paddedStudentNo = studentNo ? studentNo.padStart(8, '0') : '';

    return (
        <SheetBase title="20-Item Answer Sheet">
            {/* Exam Code Grid (4 digits) */}
            <Text style={[styles.questionNumber, { top: examCodeY - 15, left: gridStartX, fontSize: 10 }]}>EXAM CODE</Text>
            {/* Row labels for ID grids */}
            {Array.from({ length: 10 }).map((_, row) => (
                <Text key={`ec-row-label-${row}`} style={[styles.questionNumber, { top: examCodeY + gridBubbleSize + 10 + (row * gridSpacingY), left: gridStartX - 15, fontSize: 8 }]}>{row}</Text>
            ))}
            {Array.from({ length: 4 }).map((_, col) => (
                <React.Fragment key={`ec-col-${col}`}>
                    <View style={{ position: 'absolute', top: examCodeY, left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderWidth: 1, borderColor: '#000' }} />
                    {Array.from({ length: 10 }).map((_, row) => (
                        <View key={`ec-q${col}-${row}`} style={[styles.bubble, { top: examCodeY + gridBubbleSize + 5 + (row * gridSpacingY), left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderRadius: 9 }]} />
                    ))}
                </React.Fragment>
            ))}

            {/* Student Number Grid (8 digits) */}
            <Text style={[styles.questionNumber, { top: studentNoY - 15, left: gridStartX, fontSize: 10 }]}>STUDENT NUMBER (Pad with leading 0s)</Text>
            {/* Row labels for ID grids */}
            {Array.from({ length: 10 }).map((_, row) => (
                <Text key={`sn-row-label-${row}`} style={[styles.questionNumber, { top: studentNoY + gridBubbleSize + 10 + (row * gridSpacingY), left: gridStartX - 15, fontSize: 8 }]}>{row}</Text>
            ))}
            {Array.from({ length: 8 }).map((_, col) => (
                <React.Fragment key={`sn-col-${col}`}>
                    <View style={{ position: 'absolute', top: studentNoY, left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderWidth: 1, borderColor: '#000' }}>
                        {/* Optionally show the typed digit in the top box if pre-filled */}
                        {paddedStudentNo && <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 3 }}>{paddedStudentNo[col]}</Text>}
                    </View>
                    {Array.from({ length: 10 }).map((_, row) => {
                        const isFilled = paddedStudentNo && paddedStudentNo[col] === row.toString();
                        return (
                            <View key={`sn-q${col}-${row}`} style={[styles.bubble, { 
                                top: studentNoY + gridBubbleSize + 5 + (row * gridSpacingY), 
                                left: gridStartX + (col * gridSpacingX), 
                                width: gridBubbleSize, 
                                height: gridBubbleSize, 
                                borderRadius: 9,
                                backgroundColor: isFilled ? '#000000' : 'transparent',
                                borderColor: isFilled ? '#000000' : '#B4B4B4'
                            }]} />
                        )
                    })}
                </React.Fragment>
            ))}

            {/* Questions Header (A B C D) */}
            {choicesMap.map((letter, cIndex) => (
                <Text key={`q-header-${letter}`} style={[styles.questionNumber, { top: startY - 25, left: startX + (cIndex * bubbleSpacing) + 10, fontSize: 12 }]}>{letter}</Text>
            ))}

            {/* Questions (1-20) moved to the right */}
            {Array.from({ length: 20 }).map((_, qIndex) => (
                <React.Fragment key={`q-${qIndex}`}>
                    <Text style={[styles.questionNumber, { top: startY + (qIndex * rowHeight) + 8, left: startX - 30, fontSize: 12 }]}>
                        {qIndex + 1}.
                    </Text>
                    {choicesMap.map((letter, cIndex) => (
                        <View key={`q${qIndex}-${letter}`} style={[styles.bubble, { top: startY + (qIndex * rowHeight), left: startX + (cIndex * bubbleSpacing), width: bubbleSize, height: bubbleSize }]} />
                    ))}
                </React.Fragment>
            ))}
        </SheetBase>
    );
};

const Document50Item = ({ studentNo }: { studentNo?: string }) => {
    const choicesMap = ['A', 'B', 'C', 'D'];
    const colStarts = [340, 580]; // Shifted right to make room for ID grids
    const startY = 160;
    const rowHeight = 28; const bubbleSpacing = 35; const bubbleSize = 24;

    // Grid config for Student Info (copied from Document20Item)
    const gridStartX = 60;
    const examCodeY = 160;
    const studentNoY = 440;
    const gridBubbleSize = 18;
    const gridSpacingX = 24;
    const gridSpacingY = 22;

    const paddedStudentNo = studentNo ? studentNo.padStart(8, '0') : '';

    return (
        <SheetBase title="50-Item Answer Sheet">
            {/* Exam Code Grid (4 digits) */}
            <Text style={[styles.questionNumber, { top: examCodeY - 15, left: gridStartX, fontSize: 10 }]}>EXAM CODE</Text>
            {Array.from({ length: 10 }).map((_, row) => (
                <Text key={`ec-row-label-${row}`} style={[styles.questionNumber, { top: examCodeY + gridBubbleSize + 10 + (row * gridSpacingY), left: gridStartX - 15, fontSize: 8 }]}>{row}</Text>
            ))}
            {Array.from({ length: 4 }).map((_, col) => (
                <React.Fragment key={`ec-col-${col}`}>
                    <View style={{ position: 'absolute', top: examCodeY, left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderWidth: 1, borderColor: '#000' }} />
                    {Array.from({ length: 10 }).map((_, row) => (
                        <View key={`ec-q${col}-${row}`} style={[styles.bubble, { top: examCodeY + gridBubbleSize + 5 + (row * gridSpacingY), left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderRadius: 9 }]} />
                    ))}
                </React.Fragment>
            ))}

            {/* Student Number Grid (8 digits) */}
            <Text style={[styles.questionNumber, { top: studentNoY - 15, left: gridStartX, fontSize: 10 }]}>STUDENT NUMBER (Pad with leading 0s)</Text>
            {Array.from({ length: 10 }).map((_, row) => (
                <Text key={`sn-row-label-${row}`} style={[styles.questionNumber, { top: studentNoY + gridBubbleSize + 10 + (row * gridSpacingY), left: gridStartX - 15, fontSize: 8 }]}>{row}</Text>
            ))}
            {Array.from({ length: 8 }).map((_, col) => (
                <React.Fragment key={`sn-col-${col}`}>
                    <View style={{ position: 'absolute', top: studentNoY, left: gridStartX + (col * gridSpacingX), width: gridBubbleSize, height: gridBubbleSize, borderWidth: 1, borderColor: '#000' }}>
                        {/* Optionally show the typed digit in the top box if pre-filled */}
                        {paddedStudentNo && <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 3 }}>{paddedStudentNo[col]}</Text>}
                    </View>
                    {Array.from({ length: 10 }).map((_, row) => {
                        const isFilled = paddedStudentNo && paddedStudentNo[col] === row.toString();
                        return (
                            <View key={`sn-q${col}-${row}`} style={[styles.bubble, { 
                                top: studentNoY + gridBubbleSize + 5 + (row * gridSpacingY), 
                                left: gridStartX + (col * gridSpacingX), 
                                width: gridBubbleSize, 
                                height: gridBubbleSize, 
                                borderRadius: 9,
                                backgroundColor: isFilled ? '#000000' : 'transparent',
                                borderColor: isFilled ? '#000000' : '#B4B4B4'
                            }]} />
                        )
                    })}
                </React.Fragment>
            ))}

            {/* Column Headers */}
            {colStarts.map((colX, colIdx) => (
                <React.Fragment key={`col-header-${colIdx}`}>
                    {choicesMap.map((letter, cIndex) => (
                        <Text key={`col${colIdx}-header-${letter}`} style={[styles.questionNumber, { top: startY - 20, left: colX + (cIndex * bubbleSpacing) + 8, fontSize: 11 }]}>{letter}</Text>
                    ))}
                </React.Fragment>
            ))}

            {Array.from({ length: 50 }).map((_, qIndex) => {
                const isCol2 = qIndex >= 25;
                const colX = isCol2 ? colStarts[1] : colStarts[0];
                const rowY = startY + ((qIndex % 25) * rowHeight);

                return (
                    <React.Fragment key={`q-${qIndex}`}>
                        <Text style={[styles.questionNumber, { top: rowY + 6, left: colX - 30, fontSize: 11 }]}>
                            {qIndex + 1}.
                        </Text>
                        {choicesMap.map((letter, cIndex) => (
                            <View key={`q${qIndex}-${letter}`} style={[styles.bubble, { top: rowY, left: colX + (cIndex * bubbleSpacing), width: bubbleSize, height: bubbleSize }]} />
                        ))}
                    </React.Fragment>
                );
            })}
        </SheetBase>
    );
};

import { Printer, Loader2 } from 'lucide-react';

export function OMRTemplateGenerator() {
    const [isGenerating, setIsGenerating] = React.useState<'20' | '50' | null>(null);

    const handleDownload = async (type: '20' | '50') => {
        setIsGenerating(type);
        try {
            const fileName = `${type}_Item_Sheet_Blank.pdf`;
            const doc = type === '20' ? <Document20Item /> : <Document50Item />;
            const blob = await pdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsGenerating(null);
        }
    };

    return (
        <div className="flex flex-col gap-4 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Blank Answer Sheets</h3>
            <p className="text-slate-500 text-sm mb-4">Print on standard A4 or Letter paper. Do not scale to fit.</p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    disabled={isGenerating !== null} 
                    onClick={() => handleDownload('20')} 
                    className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        isGenerating === '20' 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait' 
                        : isGenerating === '50'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    }`}
                >
                    {isGenerating === '20' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Printer className="w-5 h-5" />
                            Generate 20-Item Sheet
                        </>
                    )}
                </button>

                <button 
                    disabled={isGenerating !== null} 
                    onClick={() => handleDownload('50')} 
                    className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                        isGenerating === '50' 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-wait' 
                        : isGenerating === '20'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    }`}
                >
                    {isGenerating === '50' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Printer className="w-5 h-5" />
                            Generate 50-Item Sheet
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}