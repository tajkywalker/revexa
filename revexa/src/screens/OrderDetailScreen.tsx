import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import {
  getOrder, saveOrder, deleteOrder, Order,
  getCustomer, Customer,
  getChimneys, Chimney,
  getInspection, Inspection,
} from '../db/database';
import { formatDate, formatCurrency, STATUS_LABELS, STATUS_COLORS, nowISO } from '../utils';
import { RootStackParamList } from '../App';

type Route = RouteProp<RootStackParamList, 'OrderDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

const RESULT_COLORS: Record<string, string> = {
  vyhovuje: C.success,
  podminecne: '#FF9F0A',
  nevyhovuje: '#FF453A',
};
const RESULT_LABELS: Record<string, string> = {
  vyhovuje: 'VYHOVUJE',
  podminecne: 'PODMÍNEČNĚ',
  nevyhovuje: 'NEVYHOVUJE',
};

const STATUSES: Order['status'][] = ['nova', 'probihajici', 'dokoncena', 'zrusena'];

export default function OrderDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [chimneys, setChimneys] = useState<Chimney[]>([]);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ address: '', note: '', price: '', scheduledDate: '' });

  useFocusEffect(useCallback(() => {
    const o = getOrder(route.params.orderId);
    setOrder(o);
    if (o) {
      setEdit({ address: o.address, note: o.note, price: String(o.price || ''), scheduledDate: o.scheduledDate });
      const c = getCustomer(o.customerId);
      setCustomer(c);
      if (c) setChimneys(getChimneys(c.id));
      setInspection(getInspection(o.id));
    }
  }, [route.params.orderId]));

  if (!order) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  function changeStatus(status: Order['status']) {
    if (!order) return;
    const updated = { ...order, status, updatedAt: nowISO(), completedAt: status === 'dokoncena' ? nowISO() : order.completedAt };
    saveOrder(updated);
    setOrder(updated);
  }

  function saveEdits() {
    if (!order) return;
    const updated = { ...order, address: edit.address, note: edit.note, price: parseFloat(edit.price) || 0, scheduledDate: edit.scheduledDate, updatedAt: nowISO() };
    saveOrder(updated);
    setOrder(updated);
    setEditing(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>

        {/* Hlavička zakázky */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs }}>
            <Text style={{ color: C.primary, fontSize: F.xl, fontWeight: 'bold' }}>{order.orderNumber}</Text>
            <View style={{ paddingHorizontal: S.sm, paddingVertical: 3, borderRadius: R.xl, backgroundColor: STATUS_COLORS[order.status] + '30' }}>
              <Text style={{ fontSize: F.xs, fontWeight: 'bold', color: STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status]}</Text>
            </View>
          </View>
          <Text style={{ color: C.textPrimary, fontSize: F.lg, fontWeight: '600' }}>{order.customerName}</Text>
          <Text style={{ color: C.textSecondary, fontSize: F.sm, marginTop: 2 }}>📅 {formatDate(order.scheduledDate)}</Text>
          {order.address ? <Text style={{ color: C.textSecondary, fontSize: F.sm, marginTop: 2 }}>📍 {order.address}</Text> : null}
        </View>

        {/* Zákazník - kontaktní info */}
        {customer && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>👤 ZÁKAZNÍK</Text>
            <View style={{ gap: S.xs }}>
              <Text style={s.infoValue}>{customer.firstName} {customer.lastName}</Text>
              {customer.street ? <Text style={s.infoSecondary}>🏠 {customer.street}, {customer.zip} {customer.city}</Text> : null}
              {customer.phone ? (
                <Text style={s.infoSecondary}>📞 {customer.phone}</Text>
              ) : null}
              {customer.email ? (
                <Text style={s.infoSecondary}>✉️  {customer.email}</Text>
              ) : null}
              {customer.note ? <Text style={{ color: C.textTertiary, fontSize: F.xs, marginTop: S.xs, fontStyle: 'italic' }}>{customer.note}</Text> : null}
            </View>
            <TouchableOpacity
              style={{ marginTop: S.sm, alignSelf: 'flex-start', paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.sm, borderWidth: 1, borderColor: C.border }}
              onPress={() => nav.navigate('CustomerDetail', { customerId: customer.id })}
            >
              <Text style={{ color: C.textSecondary, fontSize: F.xs }}>Zobrazit zákazníka →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Komíny */}
        {chimneys.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>🔥 SPALINOVÉ CESTY ({chimneys.length})</Text>
            {chimneys.map((ch, i) => (
              <View key={ch.id} style={{ paddingVertical: S.xs, borderBottomWidth: i < chimneys.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>{ch.label}</Text>
                <View style={{ flexDirection: 'row', gap: S.base, marginTop: 2 }}>
                  {ch.type ? <Text style={s.infoTiny}>Typ: {ch.type}</Text> : null}
                  {ch.fuel ? <Text style={s.infoTiny}>Palivo: {ch.fuel}</Text> : null}
                </View>
                {ch.note ? <Text style={s.infoTiny}>{ch.note}</Text> : null}
              </View>
            ))}
          </View>
        )}

        {/* Poslední zpráva z kontroly */}
        {inspection && (
          <View style={[s.card, { borderColor: RESULT_COLORS[inspection.overallResult] + '60' }]}>
            <Text style={s.sectionTitle}>📋 POSLEDNÍ ZPRÁVA</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm }}>
              <View>
                <Text style={{ color: C.textSecondary, fontSize: F.xs }}>Zpráva č. {inspection.reportNumber}</Text>
                <Text style={{ color: C.textSecondary, fontSize: F.xs }}>Datum: {formatDate(inspection.inspectionDate)}</Text>
              </View>
              <View style={{ paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.md, backgroundColor: RESULT_COLORS[inspection.overallResult] + '25' }}>
                <Text style={{ color: RESULT_COLORS[inspection.overallResult], fontWeight: 'bold', fontSize: F.sm }}>
                  {RESULT_LABELS[inspection.overallResult] ?? inspection.overallResult.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              {inspection.checkItems.filter(ci => ci.result !== 'neuvedeno').map(ci => (
                <View key={ci.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: C.textSecondary, fontSize: F.xs, flex: 1 }}>{ci.label}</Text>
                  <Text style={{
                    fontSize: F.xs, fontWeight: 'bold',
                    color: ci.result === 'vyhovuje' ? C.success : ci.result === 'nevyhovuje' ? C.error : C.warning
                  }}>
                    {ci.result === 'vyhovuje' ? '✓' : ci.result === 'nevyhovuje' ? '✗' : '?'}
                  </Text>
                </View>
              ))}
            </View>
            {inspection.coMeasurement != null && (
              <Text style={{ color: C.textSecondary, fontSize: F.xs, marginTop: S.xs }}>CO: {inspection.coMeasurement} ppm</Text>
            )}
            {inspection.notes ? <Text style={{ color: C.textTertiary, fontSize: F.xs, marginTop: S.xs, fontStyle: 'italic' }}>{inspection.notes}</Text> : null}
            {inspection.signatureBase64 ? <Text style={{ color: C.success, fontSize: F.xs, marginTop: S.xs }}>✅ Podpis zákazníka uložen</Text> : null}
          </View>
        )}

        {/* HLAVNÍ TLAČÍTKO - Nová / Upravit zprávu */}
        <TouchableOpacity
          style={{ backgroundColor: C.primary, borderRadius: R.lg, padding: S.md + 4, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: S.sm }}
          onPress={() => nav.navigate('Inspection', { orderId: order.id })}
        >
          <Text style={{ fontSize: F.xl }}>📋</Text>
          <Text style={{ color: '#fff', fontSize: F.md + 1, fontWeight: 'bold' }}>
            {inspection ? 'Upravit zprávu z kontroly' : 'Nová zpráva z kontroly'}
          </Text>
        </TouchableOpacity>

        {/* Stav zakázky */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>ZMĚNIT STAV ZAKÁZKY</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.sm }}>
            {STATUSES.map(st => (
              <TouchableOpacity
                key={st}
                style={[{ paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.md, borderWidth: 1, borderColor: C.border }, order.status === st && { backgroundColor: STATUS_COLORS[st] + '30', borderColor: STATUS_COLORS[st] }]}
                onPress={() => changeStatus(st)}
              >
                <Text style={[{ color: C.textSecondary, fontSize: F.sm }, order.status === st && { color: STATUS_COLORS[st], fontWeight: 'bold' }]}>
                  {STATUS_LABELS[st]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Detaily - editace */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm }}>
            <Text style={s.sectionTitle}>DETAILY ZAKÁZKY</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              <Text style={{ color: C.primary, fontSize: F.sm }}>{editing ? 'Zrušit' : 'Upravit'}</Text>
            </TouchableOpacity>
          </View>
          {editing ? (
            <>
              {([['scheduledDate', 'Datum (RRRR-MM-DD)'], ['address', 'Adresa'], ['price', 'Cena (Kč)'], ['note', 'Poznámka']] as [keyof typeof edit, string][]).map(([f, l]) => (
                <View key={f} style={{ marginBottom: S.sm }}>
                  <Text style={{ color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs }}>{l}</Text>
                  <TextInput
                    style={s.input}
                    value={edit[f]}
                    onChangeText={t => setEdit(p => ({ ...p, [f]: t }))}
                    keyboardType={f === 'price' ? 'numeric' : 'default'}
                    multiline={f === 'note'}
                    placeholderTextColor={C.textTertiary}
                  />
                </View>
              ))}
              <TouchableOpacity style={{ backgroundColor: C.primary, borderRadius: R.md, padding: S.md, alignItems: 'center', marginTop: S.sm }} onPress={saveEdits}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Uložit změny</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {([
                ['Datum', formatDate(order.scheduledDate)],
                ['Adresa', order.address],
                order.price > 0 ? ['Cena', formatCurrency(order.price)] : null,
                order.note ? ['Poznámka', order.note] : null,
              ] as (string[] | null)[]).filter((x): x is string[] => x !== null).map(([l, v]) => (
                <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: S.xs, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <Text style={{ color: C.textSecondary, fontSize: F.sm }}>{l}</Text>
                  <Text style={{ color: C.textPrimary, fontSize: F.sm, flex: 1, textAlign: 'right' }}>{v}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Smazat zakázku */}
        <TouchableOpacity
          style={{ borderRadius: R.md, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.error }}
          onPress={() => Alert.alert('Smazat zakázku?', 'Tato akce je nevratná.', [
            { text: 'Zrušit', style: 'cancel' },
            { text: 'Smazat', style: 'destructive', onPress: () => { deleteOrder(order.id); nav.goBack(); } }
          ])}
        >
          <Text style={{ color: C.error, fontSize: F.sm }}>Smazat zakázku</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.textTertiary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: S.sm },
  infoValue: { color: C.textPrimary, fontSize: F.base, fontWeight: '600' },
  infoSecondary: { color: C.textSecondary, fontSize: F.sm },
  infoTiny: { color: C.textTertiary, fontSize: F.xs },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
});
