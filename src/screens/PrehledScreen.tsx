import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/theme';
import { getAllOrders, getAllCustomers } from '../database/database';
import { OrderListItem } from '../database/database';
import { Customer } from '../types';
import { formatDate, todayISO, formatDateRelative } from '../utils/helpers';
import { getStatusColor, getStatusLabel, getOrderTypeLabel } from '../utils/theme';
import { useAppStore } from '../store/appStore';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';

export default function PrehledScreen() {
  const { setActiveTab, setShowNewOrderModal } = useAppStore();
  const [todayOrders, setTodayOrders] = useState<OrderListItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({ total: 0, done: 0, planned: 0, thisMonth: 0 });
  const today = todayISO();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const all = await getAllOrders();
    const todayOrd = all.filter(o => o.scheduledDate === today);
    setTodayOrders(todayOrd);

    const custs = await getAllCustomers();
    setCustomers(custs);

    const thisMonth = new Date().toISOString().substring(0, 7);
    setStats({
      total: all.length,
      done: all.filter(o => o.status === 'dokoncena').length,
      planned: all.filter(o => o.status === 'planovana').length,
      thisMonth: all.filter(o => o.scheduledDate.startsWith(thisMonth)).length,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hlavička */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dobrý den!</Text>
          <Text style={styles.subGreeting}>
            {formatDate(today)} — máte dnes {todayOrders.length} zakázek
          </Text>
        </View>
        <TouchableOpacity style={styles.newOrderBtn} onPress={() => setShowNewOrderModal(true)}>
          <Text style={styles.newOrderBtnText}>+ Nová zakázka</Text>
        </TouchableOpacity>
      </View>

      {/* Statistiky */}
      <View style={styles.statsRow}>
        <StatCard title="Celkem zakázek" value={stats.total.toString()} color={Colors.primary} />
        <StatCard title="Dokončeno" value={stats.done.toString()} color={Colors.success} />
        <StatCard title="Naplánováno" value={stats.planned.toString()} color={Colors.statusPlanovana} />
        <StatCard title="Tento měsíc" value={stats.thisMonth.toString()} color={Colors.warning} />
        <StatCard title="Zákazníků" value={customers.length.toString()} color={Colors.textSecondary} />
      </View>

      {/* Dnešní zakázky */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dnešní zakázky</Text>
          <TouchableOpacity onPress={() => setActiveTab('zakazky')}>
            <Text style={styles.sectionLink}>Zobrazit vše →</Text>
          </TouchableOpacity>
        </View>

        {todayOrders.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Na dnešní den nejsou naplánovány žádné zakázky.</Text>
          </Card>
        ) : (
          todayOrders.map(order => (
            <TouchableOpacity
              key={order.id}
              onPress={() => setActiveTab('zakazky')}
            >
              <Card style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <View style={styles.orderTime}>
                    <Text style={styles.timeText}>{order.scheduledTime || '—'}</Text>
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderName}>{order.customerName}</Text>
                    <Text style={styles.orderAddress}>
                      {order.addressStreet}, {order.addressCity}
                    </Text>
                    <Text style={styles.orderType}>{getOrderTypeLabel(order.orderType)}</Text>
                  </View>
                  <StatusBadge status={order.status} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Rychlé akce */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rychlé akce</Text>
        <View style={styles.quickActions}>
          <QuickActionBtn label="Nová zakázka" icon="📋" onPress={() => setShowNewOrderModal(true)} />
          <QuickActionBtn label="Hledat zákazníka" icon="🔍" onPress={() => setActiveTab('zakaznici')} />
          <QuickActionBtn label="Kalendář" icon="📅" onPress={() => setActiveTab('kalendar')} />
          <QuickActionBtn label="Statistiky" icon="📊" onPress={() => setActiveTab('statistiky')} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Card>
  );
}

function QuickActionBtn({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
  },
  subGreeting: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    marginTop: 4,
  },
  newOrderBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  newOrderBtnText: {
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
    fontSize: Typography.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statValue: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
  },
  statTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginTop: 4,
  },
  section: { gap: Spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  sectionLink: {
    color: Colors.primary,
    fontSize: Typography.sm,
  },
  orderCard: { marginBottom: 0 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  orderTime: {
    width: 52,
    alignItems: 'center',
  },
  timeText: {
    color: Colors.primary,
    fontWeight: Typography.bold,
    fontSize: Typography.base,
  },
  orderInfo: { flex: 1 },
  orderName: {
    color: Colors.textPrimary,
    fontWeight: Typography.semiBold,
    fontSize: Typography.md,
  },
  orderAddress: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  orderType: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    textAlign: 'center',
  },
});
