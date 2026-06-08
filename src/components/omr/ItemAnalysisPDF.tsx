import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register fonts if needed, but Helvetica is default
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#FFFFFF',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#1e293b',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 4,
        fontWeight: 'medium',
    },
    summaryGrid: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    summaryCard: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 4,
    },
    summaryLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    alertBanner: {
        backgroundColor: '#fff1f2',
        borderWidth: 1,
        borderColor: '#fecdd3',
        padding: 10,
        borderRadius: 4,
        marginBottom: 20,
    },
    alertTitle: {
        color: '#be123c',
        fontWeight: 'bold',
        fontSize: 9,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    alertText: {
        color: '#9f1239',
        fontSize: 9,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1e293b',
        padding: 6,
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 8,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        padding: 6,
        alignItems: 'center',
    },
    colItem: { width: '10%' },
    colComp: { width: '35%' },
    colKey: { width: '10%', textAlign: 'center' },
    colMastery: { width: '15%', textAlign: 'center' },
    colDistractors: { width: '30%' },

    distractorContainer: {
        flexDirection: 'row',
        gap: 4,
    },
    distractorBox: {
        fontSize: 7,
        padding: 2,
        width: 25,
        textAlign: 'center',
        borderWidth: 0.5,
        borderColor: '#cbd5e1',
    },
    correctDistractor: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
        color: '#166534',
        fontWeight: 'bold',
    },
    misconceptionDistractor: {
        backgroundColor: '#fee2e2',
        borderColor: '#fecaca',
        color: '#991b1b',
    },
    badge: {
        fontSize: 7,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 2,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    easy: { backgroundColor: '#dcfce7', color: '#166534' },
    average: { backgroundColor: '#fef3c7', color: '#92400e' },
    difficult: { backgroundColor: '#fee2e2', color: '#991b1b' },
});

export interface ItemAnalysisData {
    itemNumber: number;
    correctAnswer: string;
    competency: string;
    percentPassed: number;
    distractors: Record<string, number>;
}

interface Props {
    title: string;
    sectionName: string;
    totalStudents: number;
    averageScore: string;
    data: ItemAnalysisData[];
}

export const ItemAnalysisPDF = ({ title, sectionName, totalStudents, averageScore, data }: Props) => {
    const criticalItems = [...data]
        .sort((a, b) => a.percentPassed - b.percentPassed)
        .slice(0, 3)
        .filter(item => item.percentPassed < 30);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Item Analysis Report</Text>
                    <Text style={styles.subtitle}>{title} | {sectionName}</Text>
                </View>

                {/* Summary */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total Students</Text>
                        <Text style={styles.summaryValue}>{totalStudents}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Average Score</Text>
                        <Text style={styles.summaryValue}>{averageScore}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Date Generated</Text>
                        <Text style={styles.summaryValue}>{new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Alert Banner */}
                {criticalItems.length > 0 && (
                    <View style={styles.alertBanner}>
                        <Text style={styles.alertTitle}>Critical Mastery Alert</Text>
                        <Text style={styles.alertText}>
                            Immediate intervention needed for Questions: {criticalItems.map(i => i.itemNumber).join(', ')}.
                            Mastery level is below 30%.
                        </Text>
                    </View>
                )}

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={styles.colItem}>#</Text>
                    <Text style={styles.colComp}>Competency/Description</Text>
                    <Text style={styles.colKey}>Key</Text>
                    <Text style={styles.colMastery}>Mastery %</Text>
                    <Text style={styles.colDistractors}>Distractor Analysis (A-B-C-D %)</Text>
                </View>

                {/* Table Rows */}
                {data.map((item) => {
                    const difficulty = item.percentPassed > 75 ? styles.easy : item.percentPassed >= 30 ? styles.average : styles.difficult;
                    const difficultyLabel = item.percentPassed > 75 ? 'Easy' : item.percentPassed >= 30 ? 'Average' : 'Difficult';

                    return (
                        <View key={item.itemNumber} style={styles.tableRow} wrap={false}>
                            <Text style={styles.colItem}>{item.itemNumber}</Text>
                            <Text style={styles.colComp}>{item.competency}</Text>
                            <Text style={styles.colKey}>{item.correctAnswer}</Text>

                            <View style={styles.colMastery}>
                                <Text style={[styles.badge, difficulty]}>{item.percentPassed}% ({difficultyLabel})</Text>
                            </View>

                            <View style={styles.colDistractors}>
                                <View style={styles.distractorContainer}>
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        const isCorrect = opt === item.correctAnswer;
                                        const isMisconception = !isCorrect && item.distractors[opt] > 25;
                                        return (
                                            <Text 
                                                key={opt} 
                                                style={[
                                                    styles.distractorBox, 
                                                    isCorrect ? styles.correctDistractor : {},
                                                    isMisconception ? styles.misconceptionDistractor : {}
                                                ]}
                                            >
                                                {item.distractors[opt]}%
                                            </Text>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    );
                })}

                <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 8 }}>
                    Generated by Godspeed Grader - Privacy-First Offline Grading
                </Text>
            </Page>
        </Document>
    );
};

export default ItemAnalysisPDF;