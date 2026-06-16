import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/theme';
import { getAllOrders } from '../database/database';
import { OrderListItem } from '../database/database';
import Card from '../components/common/Card';

export default function StatistikyScreen() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);

  useEffect(() => {
    getAllOrders().then(setOrders);
  }, []);

  const total = orders.length;
  const done = orders.filter(o => o.status === 'dokoncena').length;
  const planned = orders.filter(o => o.status === 'planovana').length;
  const cancelled = orders.filter(o => o.status === 'zrusena').length;

  // Typy zakázek
  const typeCounts: Record<string, number> = {};
  orders.forEach(o => {
    typeCounts[o.orderType] = (typeCounts[o.orderType] || 0) + 1;
  });

  // Měsíční statistika - posledních 6 měsíců
  const monthly: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toISOString().substring(0, 7);
    monthly[key] = 0;
  }
  orders.forEach(o => {
    const key = o.scheduledDate.substring(0, 7);
    if (key in monthly) monthly[key] = (monthly[key] || 0) + 1;
  });

  const maxMonthly = Math.max(...Object.values(monthly), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Statistiky</Text>

      {/* Celkové statistiky */}
      <View style={styles.statsGrid}>
        <BigStat label="Celkem zakázek" value={total} color={Colors.primary} />
        <BigStat label="Dokončeno" value={done} color={Colors.success} />
        <BigStat label="Naplánováno" value={planned} color={Colors.statusPlanovana} />
        <BigStat label="Zrušeno" value={cancelled} color={Colors.error} />
      </View>

      {/* Procento dokončení */}
      <Card style={styles.progressCard}>
        <Text style={styles.cardTitle}>Míra dokončení</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${total > 0 ? (done / total) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {total > 0 ? Math.round((done / total) * 100) : 0}% zakázek dokončeno
        </Text>
      </Card>

      {/* Typy zakázek */}
      <Card>
        <Text style={styles.cardTitle}>Typy zakázek</Text>
        {Object.entries(typeCounts).map(([type, count]) => (
          <View key={type} style={styles.typeRow}>
            <Text style={styles.typeLabel}>{typeLabel(type)}</Text>
            <View style={styles.typeBarContainer}>
              <View style={[styles.typeBar, { width: `${(count / total) * 100}%` }]} />
            </View>
            <Text style={styles.typeCount}>{count}</Text>
          </View>
        ))}
      </Card>

      {/* Měsíční trend */}
      <Card>
        <Text style={styles.cardTitle}>Měsíční trend (posledních 6 měsíců)</Text>
        <View style={styles.monthChart}>
          {Object.entries(monthly).map(([month, count]) => (
            <View key={month} style={styles.monthBar}>
              <View style={styles.barContainer}>
                <View style={[
                  styles.bar,
                  { height: `${maxMonthly > 0 ? (count / maxMonthly) * 100 : 0}%` }
                ]} />
              </View>
              <Text style={styles.monthLabel}>{month.substring(5)}</Text>
              <Text style={styles.monthCount}>{count}</Text>
            </View>
          ))}
        </View>
      </Card>
    </ScrollView>
  );
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={styles.bigStat}>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
    </Card>
  );
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    kontrola: 'Kontrola', cisteni: 'Čištění',
    revize: 'Revize', mereni_co: 'Měření CO', jiny: 'Jiný',
  };
  return labels[type] || type;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.md },
  pageTitle: {
    color: Colors.textPrimary, fontSize: Typography.xxl,
    fontWeight: Typography.bold, marginBottom: Spacing.sm,
  },
  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  bigStat: { flex: 1, alignItems: 'center' },
  bigStatValue: { fontSize: 36, fontWeight: Typography.extraBold },
  bigStatLabel: { color: Colors.textSecondary, fontSize: Typography.xs, textAlign: 'center', marginTop: 4 },

  progressCard: {},
  cardTitle: {
    color: Colors.textPrimary, fontSize: Typography.md,
    fontWeight: Typography.semiBold, marginBottom: Spacing.md,
  },
  progressBar: {
    height: 12, backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.success,
    borderRadius: BorderRadius.full,
  },
  progressText: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 8 },

  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 8 },
  typeLabel: { color: Colors.textSecondary, fontSize: Typography.sm, width: 80 },
  typeBarContainer: { flex: 1, height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4 },
  typeBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  typeCount: { color: Colors.textPrimary, fontWeight: Typography.semiBold, width: 24, textAlign: 'right' },

  monthChart: { flexDirection: 'row', height: 120, gap: Spacing.sm, alignItems: 'flex-end' },
  monthBar: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barContainer: { flex: 1, width: '100%', justifyContent: 'flex-end', minHeight: 1 },
  bar: { backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, minHeight: 4, width: '100%' },
  monthLabel: { color: Colors.textTertiary, fontSize: 10, marginTop: 4 },
  monthCount: { color: Colors.textSecondary, fontSize: Typography.xs },
});
