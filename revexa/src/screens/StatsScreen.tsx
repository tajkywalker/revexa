import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import { getStats, getOrders } from '../db/database';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../utils';

export default function StatsScreen() {
  const [stats, setStats]             = useState({ total: 0, done: 0, revenue: 0, monthDone: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    setStats(getStats());
    const orders = getOrders();
    const counts: Record<string, number> = {};
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
    setStatusCounts(counts);
  }, []);

  const doneRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.header}><Text style={s.title}>STATISTIKY</Text></View>
      <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>

        {/* Základní čísla */}
        <View style={s.row}>
          {[{ label: 'Celkem zakázek', value: String(stats.total), color: C.primary },
            { label: 'Dokončených',    value: String(stats.done),  color: C.success }].map(({ label, value, color }) => (
            <View key={label} style={[s.statCard, { borderColor: color + '50' }]}>
              <Text style={[s.statValue, { color }]}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.row}>
          {[{ label: 'Tento měsíc', value: String(stats.monthDone), color: C.warning },
            { label: 'Tržby celkem', value: formatCurrency(stats.revenue), color: C.success }].map(({ label, value, color }) => (
            <View key={label} style={[s.statCard, { borderColor: color + '50' }]}>
              <Text style={[s.statValue, { color, fontSize: F.xl }]}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Progress bar */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Úspěšnost zakázek</Text>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${doneRate}%` as any }]} />
          </View>
          <Text style={s.progressLabel}>{doneRate}% dokončeno</Text>
        </View>

        {/* Přehled stavů */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Přehled stavů</Text>
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = statusCounts[key] ?? 0;
            const pct = Math.round((count / (stats.total || 1)) * 100);
            return (
              <View key={key} style={s.statusRow}>
                <View style={s.statusRowLeft}>
                  <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[key] }]} />
                  <Text style={s.statusRowLabel}>{label}</Text>
                </View>
                <View style={s.statusBarBg}>
                  <View style={[s.statusBarFill, { width: `${pct}%` as any, backgroundColor: STATUS_COLORS[key] }]} />
                </View>
                <Text style={s.statusCount}>{count}</Text>
              </View>
            );
          })}
        </View>

        {/* Verze */}
        <View style={[s.card, { alignItems: 'center', paddingVertical: S.lg }]}>
          <Text style={{ color: C.primary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 3 }}>REVEXA v1.0</Text>
          <Text style={{ color: C.textSecondary, fontSize: F.sm, marginTop: S.xs }}>Správa spalinových cest</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  row: { flexDirection: 'row', gap: S.md },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: F.xxl, fontWeight: 'bold', marginBottom: S.xs },
  statLabel: { color: C.textSecondary, fontSize: F.xs, textAlign: 'center' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  cardTitle: { color: C.textPrimary, fontSize: F.md, fontWeight: 'bold', marginBottom: S.md },
  progressBg: { height: 12, backgroundColor: C.surfaceEl, borderRadius: R.xl, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.success, borderRadius: R.xl },
  progressLabel: { color: C.textSecondary, fontSize: F.sm, marginTop: S.sm, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.sm },
  statusRowLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm, width: 120 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusRowLabel: { color: C.textSecondary, fontSize: F.sm },
  statusBarBg: { flex: 1, height: 8, backgroundColor: C.surfaceEl, borderRadius: R.xl, overflow: 'hidden', marginHorizontal: S.sm },
  statusBarFill: { height: '100%', borderRadius: R.xl },
  statusCount: { color: C.textPrimary, fontSize: F.sm, width: 24, textAlign: 'right' },
});
