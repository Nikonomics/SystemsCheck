import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Calculate item points
const calculateItemPoints = (maxPoints, chartsMet, sampleSize) => {
  if (!sampleSize || sampleSize <= 0) return 0;
  if (chartsMet === null || chartsMet === undefined) return 0;
  const pointsPerChart = maxPoints / sampleSize;
  return Math.min(pointsPerChart * chartsMet, maxPoints);
};

// Calculate system total
const calculateSystemTotal = (items) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((sum, item) => {
    return sum + calculateItemPoints(item.maxPoints, item.chartsMet, item.sampleSize);
  }, 0);
};

// Get score color
const getScoreColor = (percentage) => {
  if (percentage >= 90) return '#16a34a'; // green-600
  if (percentage >= 70) return '#ca8a04'; // yellow-600
  return '#dc2626'; // red-600
};

const getScoreBgColor = (percentage) => {
  if (percentage >= 90) return '#dcfce7'; // green-100
  if (percentage >= 70) return '#fef9c3'; // yellow-100
  return '#fee2e2'; // red-100
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Header styles
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 3,
  },
  generatedDate: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 8,
  },
  // Score display
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    marginBottom: 15,
  },
  scoreBox: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 18,
    color: '#9ca3af',
  },
  scorePercent: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Summary table
  summarySection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRowLast: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  tableCellLast: {
    padding: 8,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableCellText: {
    fontSize: 10,
    color: '#374151',
  },
  // System detail styles
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  systemScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Item table
  itemTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  itemRowLast: {
    flexDirection: 'row',
  },
  itemNumber: {
    width: 25,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    textAlign: 'center',
  },
  itemCriteria: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  itemMet: {
    width: 45,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    textAlign: 'center',
  },
  itemSample: {
    width: 45,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    textAlign: 'center',
  },
  itemPoints: {
    width: 55,
    padding: 6,
    textAlign: 'center',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 8,
    color: '#9ca3af',
  },
  // Residents
  residentsSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  residentsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  residentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  residentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
  },
  residentText: {
    fontSize: 9,
    color: '#374151',
  },
  // Notes section
  notesSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#374151',
    lineHeight: 1.4,
  },
});

/**
 * ScorecardPDF - PDF document for scorecard export
 */
export function ScorecardPDF({ scorecard, scores }) {
  if (!scorecard || !scores) return null;

  const facilityName = scorecard.facility?.name || 'Unknown Facility';
  const monthYear = `${monthNames[scorecard.month - 1]} ${scorecard.year}`;
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const percentage = scores.percentage;
  const scoreColor = getScoreColor(percentage);
  const scoreBgColor = getScoreBgColor(percentage);

  const statusLabels = {
    draft: 'Draft',
    trial_close: 'Trial Close',
    hard_close: 'Hard Close',
  };
  const statusColors = {
    draft: { bg: '#dbeafe', text: '#1d4ed8' },
    trial_close: { bg: '#fef3c7', text: '#b45309' },
    hard_close: { bg: '#dcfce7', text: '#16a34a' },
  };

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Clinical Audit Scorecard</Text>
          <Text style={styles.subtitle}>{facilityName}</Text>
          <Text style={styles.subtitle}>{monthYear}</Text>
          <Text style={styles.generatedDate}>Generated: {generatedDate}</Text>
        </View>

        {/* Score display */}
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBox, { backgroundColor: scoreBgColor }]}>
            <Text style={styles.scoreLabel}>Total Score</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {scores.totalScore}
              </Text>
              <Text style={styles.scoreMax}>/700</Text>
            </View>
            <Text style={[styles.scorePercent, { color: scoreColor }]}>
              {percentage}%
            </Text>
            <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 4 }}>
              {scores.systemScores.map(s => `S${s.systemNumber}:${s.score.toFixed(0)}`).join('  ')}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors[scorecard.status]?.bg || '#f3f4f6' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColors[scorecard.status]?.text || '#374151' },
                ]}
              >
                {statusLabels[scorecard.status] || scorecard.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Systems Summary Table */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Systems Summary</Text>
          <View style={styles.table}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, { width: 60 }]}>
                <Text style={styles.tableCellHeader}>System</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1 }]}>
                <Text style={styles.tableCellHeader}>Description</Text>
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <Text style={styles.tableCellHeader}>Score</Text>
              </View>
              <View style={[styles.tableCellLast, { width: 50 }]}>
                <Text style={styles.tableCellHeader}>%</Text>
              </View>
            </View>

            {/* Table rows */}
            {scores.systemScores.map((system, index) => {
              const pct = Math.round((system.score / system.maxScore) * 100);
              const isLast = index === scores.systemScores.length - 1;
              return (
                <View
                  key={system.systemNumber}
                  style={isLast ? styles.tableRowLast : styles.tableRow}
                >
                  <View style={[styles.tableCell, { width: 60 }]}>
                    <Text style={styles.tableCellText}>System {system.systemNumber}</Text>
                  </View>
                  <View style={[styles.tableCell, { flex: 1 }]}>
                    <Text style={styles.tableCellText}>{system.systemName}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: 70 }]}>
                    <Text style={[styles.tableCellText, { color: getScoreColor(pct), fontWeight: 'bold' }]}>
                      {system.score.toFixed(1)}/100
                    </Text>
                  </View>
                  <View style={[styles.tableCellLast, { width: 50 }]}>
                    <Text style={[styles.tableCellText, { color: getScoreColor(pct) }]}>
                      {pct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            SystemsCheck Clinical Audit - {facilityName}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* Pages 2+: System Details */}
      {scorecard.systems.map((system, systemIndex) => {
        const systemScore = calculateSystemTotal(system.items || []);
        const pct = systemScore;
        const items = system.items || [];

        return (
          <Page key={system.id || systemIndex} size="LETTER" style={styles.page}>
            {/* System header */}
            <View style={styles.systemHeader}>
              <View>
                <Text style={styles.systemTitle}>
                  System {system.systemNumber}: {system.systemName}
                </Text>
              </View>
              <Text style={[styles.systemScore, { color: getScoreColor(pct) }]}>
                {systemScore.toFixed(1)}/100 ({Math.round(pct)}%)
              </Text>
            </View>

            {/* Audit items table */}
            <View style={styles.itemTable}>
              {/* Header */}
              <View style={[styles.itemRow, { backgroundColor: '#f3f4f6' }]}>
                <View style={styles.itemNumber}>
                  <Text style={styles.tableCellHeader}>#</Text>
                </View>
                <View style={styles.itemCriteria}>
                  <Text style={styles.tableCellHeader}>Audit Criteria</Text>
                </View>
                <View style={styles.itemMet}>
                  <Text style={styles.tableCellHeader}># Met</Text>
                </View>
                <View style={styles.itemSample}>
                  <Text style={styles.tableCellHeader}>Sample</Text>
                </View>
                <View style={styles.itemPoints}>
                  <Text style={styles.tableCellHeader}>Points</Text>
                </View>
              </View>

              {/* Items */}
              {items.map((item, itemIndex) => {
                const points = calculateItemPoints(item.maxPoints, item.chartsMet, item.sampleSize);
                const itemPct = item.maxPoints > 0 ? (points / item.maxPoints) * 100 : 0;
                const isLast = itemIndex === items.length - 1;

                return (
                  <View key={item.id || itemIndex} style={isLast ? styles.itemRowLast : styles.itemRow}>
                    <View style={styles.itemNumber}>
                      <Text style={styles.tableCellText}>{itemIndex + 1}</Text>
                    </View>
                    <View style={styles.itemCriteria}>
                      <Text style={[styles.tableCellText, { fontSize: 9 }]}>
                        {item.criteriaText}
                      </Text>
                    </View>
                    <View style={styles.itemMet}>
                      <Text style={styles.tableCellText}>
                        {item.chartsMet ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.itemSample}>
                      <Text style={styles.tableCellText}>
                        {item.sampleSize ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.itemPoints}>
                      <Text style={[styles.tableCellText, { color: getScoreColor(itemPct), fontWeight: 'bold' }]}>
                        {points.toFixed(1)}/{item.maxPoints}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Subtotal row */}
              <View style={[styles.itemRow, { backgroundColor: '#f3f4f6' }]}>
                <View style={[styles.itemNumber, { borderRightWidth: 0 }]} />
                <View style={[styles.itemCriteria, { borderRightWidth: 0 }]}>
                  <Text style={[styles.tableCellText, { fontWeight: 'bold', textAlign: 'right' }]}>
                    System {system.systemNumber} Total:
                  </Text>
                </View>
                <View style={styles.itemMet} />
                <View style={styles.itemSample} />
                <View style={styles.itemPoints}>
                  <Text style={[styles.tableCellText, { color: getScoreColor(pct), fontWeight: 'bold' }]}>
                    {systemScore.toFixed(1)}/100
                  </Text>
                </View>
              </View>
            </View>

            {/* Residents reviewed */}
            {system.residents?.length > 0 && (
              <View style={styles.residentsSection}>
                <Text style={styles.residentsTitle}>
                  Residents Reviewed ({system.residents.length})
                </Text>
                <View style={styles.residentsList}>
                  {system.residents.map((resident, idx) => (
                    <View key={resident.id || idx} style={styles.residentBadge}>
                      <Text style={styles.residentText}>
                        {resident.initials}
                        {resident.patientRecordNumber && ` #${resident.patientRecordNumber}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Auditor Notes */}
            {system.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Auditor Notes</Text>
                <Text style={styles.notesText}>{system.notes}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer} fixed>
              <Text style={styles.footerText}>
                SystemsCheck Clinical Audit - {facilityName}
              </Text>
              <Text
                style={styles.pageNumber}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}
