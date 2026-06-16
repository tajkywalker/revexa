import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, getStatusColor, getOrderTypeLabel } from '../utils/theme';
import { getOrdersByDate, OrderListItem } from '../database/database';
import { formatDate, formatMonthYear, getDayOfWeek, todayISO } from '../utils/helpers';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAppStore } from '../store/appStore';
import StatusBadge from '../components/common/StatusBadge';

export default function KalendarScreen() {
  const { calendarDate, setCalendarDate } = useAppStore();
  const [currentMonth, setCurrentMonth] = useState(new Date(calendarDate));
  const [dayOrders, setDayOrders] = useState<OrderListItem[]>([]);
  const [allOrders, setAllOrders] = useState<Record<string, number>>({});

  useEffect(() => {
    loadDayOrders(calendarDate);
  }, [calendarDate]);

  useEffect(() => {
    loadMonthOrders();
  }, [currentMonth]);

  async function loadDayOrders(date: string) {
    const orders = await getOrdersByDate(date);
    setDayOrders(orders);
  }

  async function loadMonthOrders() {
    const { getAllOrders } = await import('../database/database');
    const all = await getAllOrders();
    const counts: Record<string, number> = {};
    const monthStr = format(currentMonth, 'yyyy-MM');
    all.filter(o => o.scheduledDate.startsWith(monthStr)).forEach(o => {
      counts[o.scheduledDate] = (counts[o.scheduledDate] || 0) + 1;
    });
    setAllOrders(counts);
  }

  const today = todayISO();
  const firstDay = startOfMonth(currentMonth);
  const lastDay = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });

  // Offset pro začátek měsíce (pondělí = 0)
  let startOffset = getDay(firstDay) - 1;
  if (startOffset < 0) startOffset = 6;

  const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

  return (
    <View style={styles.container}>
      {/* Kalendář */}
      <View style={styles.calendarPanel}>
        {/* Navigace měsíce */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(m => subMonths(m, 1))} style={styles.monthNavBtn}>
            <Text style={styles.monthNavBtnText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {format(currentMonth, 'LLLL yyyy', { locale: cs }).toUpperCase()}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(m => addMonths(m, 1))} style={styles.monthNavBtn}>
            <Text style={styles.monthNavBtnText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Dny v týdnu */}
        <View style={styles.weekHeader}>
          {WEEKDAYS.map(d => (
            <Text key={d} style={styles.weekDay}>{d}</Text>
          ))}
        </View>

        {/* Mřížka dní */}
        <View style={styles.grid}>
          {/* Prázdné buňky na začátku */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}

          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = dateStr === calendarDate;
            const isToday = dateStr === today;
            const count = allOrders[dateStr] || 0;

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && styles.dayCellToday,
                ]}
                onPress={() => setCalendarDate(dateStr)}
              >
                <Text style={[
                  styles.dayNumber,
                  isSelected && styles.dayNumberSelected,
                  isToday && styles.dayNumberToday,
                ]}>
                  {format(day, 'd')}
                </Text>
                {count > 0 && (
                  <View style={[styles.orderDot, count > 3 && styles.orderDotMulti]}>
                    <Text style={styles.orderDotText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mini statistiky */}
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.primary }]}>
              {Object.values(allOrders).reduce((a, b) => a + b, 0)}
            </Text>
            <Text style={styles.miniStatLabel}>Tento měsíc</Text>
          </View>
          <View style={styles.miniStat}>
            <Text style={[styles.miniStatValue, { color: Colors.success }]}>
              {allOrders[today] || 0}
            </Text>
            <Text style={styles.miniStatLabel}>Dnes</Text>
          </View>
        </View>
      </View>

      {/* Pravý panel - zakázky dne */}
      <View style={styles.dayPanel}>
        <View style={styles.dayHeader}>
          <View>
            <Text style={styles.dayTitle}>{formatDate(calendarDate)}</Text>
            <Text style={styles.dayWeekday}>{getDayOfWeek(calendarDate)}</Text>
          </View>
          {calendarDate === today && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>DNES</Text>
            </View>
          )}
        </View>

        {dayOrders.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayIcon}>📅</Text>
            <Text style={styles.emptyDayText}>Žádné zakázky</Text>
            <Text style={styles.emptyDaySub}>Pro tento den nejsou naplánovány žádné zakázky</Text>
          </View>
        ) : (
          <FlatList
            data={dayOrders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <DayOrderCard order={item} />}
            contentContainerStyle={styles.orderList}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </View>
  );
}

function DayOrderCard({ order }: { order: OrderListItem }) {
  const statusColor = getStatusColor(order.status);

  return (
    <View style={[styles.dayOrderCard, { borderLeftColor: statusColor }]}>
      <View style={styles.timeCol}>
        <Text style={styles.timeText}>{order.scheduledTime || '—'}</Text>
      </View>
      <View style={styles.orderInfo}>
        <View style={styles.orderTop}>
          <Text style={styles.orderCustomer}>{order.customerName}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={styles.orderAddress}>{order.addressStreet}, {order.addressCity}</Text>
        <Text style={styles.orderType}>{getOrderTypeLabel(order.orderType)} · {order.orderNumber}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },

  // Kalendář
  calendarPanel: {
    width: 340,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    padding: Spacing.base,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthNavBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  monthNavBtnText: { color: Colors.textPrimary, fontSize: 22 },
  monthTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    fontWeight: Typography.semiBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100/7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
  },
  dayNumberSelected: { color: Colors.textPrimary, fontWeight: Typography.bold },
  dayNumberToday: { color: Colors.primary, fontWeight: Typography.bold },
  orderDot: {
    position: 'absolute',
    bottom: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  orderDotMulti: { backgroundColor: Colors.warning },
  orderDotText: { color: Colors.textPrimary, fontSize: 9, fontWeight: Typography.bold },

  miniStats: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: Spacing.base,
  },
  miniStat: { flex: 1, alignItems: 'center' },
  miniStatValue: { fontSize: Typography.xxl, fontWeight: Typography.bold },
  miniStatLabel: { color: Colors.textTertiary, fontSize: Typography.xs, marginTop: 2 },

  // Den
  dayPanel: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  dayTitle: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
  dayWeekday: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
  todayBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  todayBadgeText: { color: Colors.textPrimary, fontSize: Typography.xs, fontWeight: Typography.bold },

  emptyDay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  emptyDayIcon: { fontSize: 48, opacity: 0.3 },
  emptyDayText: { color: Colors.textSecondary, fontSize: Typography.lg, fontWeight: Typography.medium },
  emptyDaySub: { color: Colors.textTertiary, fontSize: Typography.base },

  orderList: { padding: Spacing.base },
  dayOrderCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  timeCol: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  timeText: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.base },
  orderInfo: { flex: 1, padding: Spacing.md, gap: 3 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderCustomer: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  orderAddress: { color: Colors.textSecondary, fontSize: Typography.sm },
  orderType: { color: Colors.textTertiary, fontSize: Typography.xs },
});
