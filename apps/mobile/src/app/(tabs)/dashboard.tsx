import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* What do I do next */}
      <View style={styles.nextBanner}>
        <Text style={styles.nextLabel}>What should I do next?</Text>
        <Text style={styles.nextTitle}>Start your recommended training routine.</Text>
        <Text style={styles.nextBody}>
          Focus on face control — your face-to-path is averaging +4.8°.
          Open the Training tab to see today&apos;s drill plan.
        </Text>
      </View>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>58</Text>
          <Text style={styles.statLabel}>Overall Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>42</Text>
          <Text style={styles.statLabel}>Driver Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#16a34a' }]}>71</Text>
          <Text style={styles.statLabel}>Wedge Score</Text>
        </View>
      </View>

      {/* Primary diagnosis */}
      <View style={styles.diagCard}>
        <View style={styles.diagHeader}>
          <Text style={styles.diagTitle}>Primary Diagnosis</Text>
          <View style={styles.critBadge}><Text style={styles.critText}>CRITICAL</Text></View>
        </View>
        <Text style={styles.diagName}>Open Face / Slice Pattern</Text>
        <Text style={styles.diagBody}>
          Face-to-path: +4.8° · Lateral miss: 26 yds right.
          Face control is your #1 priority.
        </Text>
        <TouchableOpacity style={styles.diagButton}>
          <Text style={styles.diagButtonText}>View Full Diagnosis</Text>
        </TouchableOpacity>
      </View>

      {/* Recent session */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Session</Text>
      </View>
      <View style={styles.sessionCard}>
        <Text style={styles.sessionName}>Range Session — Driver</Text>
        <Text style={styles.sessionMeta}>30 shots · Today 2:30 PM</Text>
        <View style={styles.sessionStats}>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatVal}>218</Text>
            <Text style={styles.sessionStatLabel}>Avg Carry (yds)</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={[styles.sessionStatVal, { color: '#dc2626' }]}>26R</Text>
            <Text style={styles.sessionStatLabel}>Avg Miss (yds)</Text>
          </View>
          <View style={styles.sessionStat}>
            <Text style={styles.sessionStatVal}>1.44</Text>
            <Text style={styles.sessionStatLabel}>Smash Factor</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  nextBanner: {
    backgroundColor: '#052e16',
    borderRadius: 16,
    padding: 16,
  },
  nextLabel: { color: '#86efac', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  nextTitle: { color: '#ffffff', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  nextBody: { color: '#bbf7d0', fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  diagCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  diagHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  diagTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  critBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  critText: { fontSize: 10, fontWeight: '700', color: '#dc2626' },
  diagName: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 6 },
  diagBody: { fontSize: 13, color: '#4b5563', lineHeight: 19, marginBottom: 12 },
  diagButton: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  diagButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sessionName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sessionMeta: { fontSize: 12, color: '#9ca3af', marginTop: 2, marginBottom: 12 },
  sessionStats: { flexDirection: 'row', gap: 8 },
  sessionStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  sessionStatVal: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sessionStatLabel: { fontSize: 10, color: '#6b7280', marginTop: 2, textAlign: 'center' },
});
