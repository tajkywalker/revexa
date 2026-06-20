import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import { getOrdersByDate, Order } from '../db/database';
import { STATUS_COLORS, STATUS_LABELS } from '../utils';

interface Props {
  onSelectOrder: (orderId: string) => void;
}

const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const DAY_NAMES   = ['Po','Út','St','Čt','Pá','So','Ne'];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

export default function CalendarScreen({ onSelectOrder }: Props) {
  const now   = new Date();
  const [year, setYear]               = useState(now.getFullYear());
  const [month, setMonth]             = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [dayOrders, setDayOrders]     = useState<Order[]>([]);
  const [orderMap, setOrderMap]       = useState<Record<string, number>>({});

  const reload = useCallback(() => {
    const days = getDaysInMonth(year, month);
    const map: Record<string, number> = {};
    for (const d of days) {
      const iso = d.toISOString().split('T')[0];
      const o = getOrdersByDate(iso);
      if (o.length > 0) map[iso] = o.length;
    }
    setOrderMap(map);
    setDayOrders(getOrdersByDate(selectedDate));
  }, [year, month, selectedDate]);

  useEffect(() => { reload(); }, [reload]);

  const days     = getDaysInMonth(year, month);
  const firstDow = (days[0].getDay() + 6) % 7;
  const today    = now.toISOString().split('T')[0];

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.header}>
        <Text style={s.title}>KALENDÁŘ</Text>
      </View>
      <ScrollView>
        {/* Navigace měsíce */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.arrow}><Text style={s.arrowText}>‹</Text></TouchableOpacity>
          <Text style={s.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth} style={s.arrow}><Text style={s.arrowText}>›</Text></TouchableOpacity>
        </View>

        {/* Názvy dnů */}
        <View style={s.dayNames}>
          {DAY_NAMES.map(d => <Text key={d} style={s.dayName}>{d}</Text>)}
        </View>

        {/* Mřížka dní */}
        <View style={s.grid}>
          {Array(firstDow).fill(null).map((_, i) => <View key={`e${i}`} style={s.dayCell} />)}
          {days.map(d => {
            const iso   = d.toISOString().split('T')[0];
            const count = orderMap[iso] ?? 0;
            const isSel = iso === selectedDate;
            const isTod = iso === today;
            return (
              <TouchableOpacity
                key={iso}
                style={[s.dayCell, isSel && s.dayCellSelected, isTod && !isSel && s.dayCellToday]}
                onPress={() => setSelectedDate(iso)}
              >
                <Text style={[s.dayNum, isSel && s.dayNumSelected]}>{d.getDate()}</Text>
                {count > 0 && (
                  <View style={s.dot}>
                    <Text style={s.dotText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Zakázky vybraného dne */}
        <View style={{ padding: S.base, gap: S.sm }}>
          <Text style={s.dayTitle}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {dayOrders.length === 0
            ? <Text style={s.empty}>Žádné zakázky</Text>
            : dayOrders.map(o => (
              <TouchableOpacity key={o.id} style={s.orderRow} onPress={() => onSelectOrder(o.id)}>
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[o.status] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.orderRowNum}>{o.orderNumber} — {o.customerName}</Text>
                  <Text style={s.orderRowAddr}>{o.address}</Text>
                </View>
                <Text style={[s.orderRowStatus, { color: STATUS_COLORS[o.status] }]}>
                  {STATUS_LABELS[o.status]}
                </Text>
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.base },
  arrow: { padding: S.sm },
  arrowText: { color: C.primary, fontSize: 28, fontWeight: 'bold' },
  monthLabel: { color: C.textPrimary, fontSize: F.lg, fontWeight: 'bold' },
  dayNames: { flexDirection: 'row', paddingHorizontal: S.base },
  dayName: { flex: 1, textAlign: 'center', color: C.textTertiary, fontSize: F.xs, paddingVertical: S.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: S.base },
  dayCell: { width: `${100 / 7}%` as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: R.md },
  dayCellSelected: { backgroundColor: C.primary },
  dayCellToday: { borderWidth: 1, borderColor: C.primary },
  dayNum: { color: C.textPrimary, fontSize: F.sm },
  dayNumSelected: { color: '#fff', fontWeight: 'bold' },
  dot: { backgroundColor: C.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  dotText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  dayTitle: { color: C.textPrimary, fontSize: F.md, fontWeight: 'bold', marginBottom: S.sm },
  empty: { color: C.textTertiary, textAlign: 'center', paddingVertical: S.xl },
  orderRow: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  orderRowNum: { color: C.textPrimary, fontSize: F.sm, fontWeight: '600' },
  orderRowAddr: { color: C.textSecondary, fontSize: F.xs },
  orderRowStatus: { fontSize: F.xs, fontWeight: 'bold' },
});
