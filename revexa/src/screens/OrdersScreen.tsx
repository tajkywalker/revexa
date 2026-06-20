import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, ScrollView, Alert } from 'react-native';
import { C, F, S, R } from '../theme';
import { getOrders, saveOrder, Order, getCustomers, Customer } from '../db/database';
import { uid, nowISO, todayISO, formatDate, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '../utils';

interface Props {
  onSelectOrder: (orderId: string) => void;
}

const FILTERS = [
  { key: 'dnes',        label: '📅 Dnes' },
  { key: '',            label: 'Vše' },
  { key: 'nova',        label: 'Nové' },
  { key: 'probihajici', label: 'Probíhající' },
  { key: 'dokoncena',   label: 'Dokončené' },
];

export default function OrdersScreen({ onSelectOrder }: Props) {
  const [orders, setOrders]     = useState<Order[]>([]);
  const [filter, setFilter]     = useState('dnes');
  const [search, setSearch]     = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newOrder, setNewOrder] = useState({ customerId: '', address: '', scheduledDate: todayISO(), note: '', price: '' });

  const loadOrders = useCallback(() => {
    let list: Order[];
    if (filter === 'dnes') {
      list = getOrders().filter(o => o.scheduledDate === todayISO());
    } else {
      list = getOrders(filter || undefined);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.address ?? '').toLowerCase().includes(q) ||
        (o.customerName ?? '').toLowerCase().includes(q)
      );
    }
    setOrders(list);
  }, [filter, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  function openNew() {
    setCustomers(getCustomers());
    setNewOrder({ customerId: '', address: '', scheduledDate: todayISO(), note: '', price: '' });
    setShowNew(true);
  }

  function createOrder() {
    if (!newOrder.customerId) { Alert.alert('Chyba', 'Vyberte zákazníka'); return; }
    const customer = customers.find(c => c.id === newOrder.customerId);
    const count = getOrders().length + 1;
    const order: Order = {
      id: uid(),
      customerId: newOrder.customerId,
      chimneyId: '',
      orderNumber: `#${String(count).padStart(4, '0')}`,
      status: 'nova',
      scheduledDate: newOrder.scheduledDate,
      completedAt: '',
      address: newOrder.address || `${customer?.street ?? ''}, ${customer?.city ?? ''}`.trim().replace(/^,\s*/, ''),
      note: newOrder.note,
      price: parseFloat(newOrder.price) || 0,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    saveOrder(order);
    setShowNew(false);
    loadOrders();
  }

  return (
    <View style={s.container}>
      {/* Hlavička */}
      <View style={s.header}>
        <Text style={s.title}>ZAKÁZKY</Text>
        <TouchableOpacity style={s.addBtn} onPress={openNew}>
          <Text style={s.addBtnText}>+ Nová zakázka</Text>
        </TouchableOpacity>
      </View>

      {/* Vyhledávání */}
      <View style={{ paddingHorizontal: S.base, paddingBottom: S.sm }}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Hledat zákazníka, adresu, číslo zakázky..."
          placeholderTextColor={C.textTertiary}
        />
      </View>

      {/* Filtry */}
      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seznam */}
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: S.base, gap: S.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => onSelectOrder(item.id)}>
            <View style={s.cardTop}>
              <Text style={s.orderNum}>{item.orderNumber}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLORS[item.status] + '30' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[item.status] }]}>
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>
            <Text style={s.customerName}>{item.customerName}</Text>
            <Text style={s.address}>{item.address}</Text>
            <View style={s.cardBottom}>
              <Text style={s.date}>📅 {formatDate(item.scheduledDate)}</Text>
              {item.price > 0 && <Text style={s.price}>{formatCurrency(item.price)}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: C.textTertiary, fontSize: F.lg }}>
              {filter === 'dnes' ? 'Dnes žádné zakázky' : 'Žádné zakázky'}
            </Text>
          </View>
        }
      />

      {/* Modal – Nová zakázka */}
      <Modal visible={showNew} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nová zakázka</Text>
            <ScrollView>
              <Text style={s.label}>Zákazník *</Text>
              <ScrollView style={s.customerList} nestedScrollEnabled>
                {customers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.customerItem, newOrder.customerId === c.id && s.customerItemActive]}
                    onPress={() => setNewOrder(p => ({ ...p, customerId: c.id }))}
                  >
                    <Text style={[s.customerItemText, newOrder.customerId === c.id && { color: C.primary }]}>
                      {c.firstName} {c.lastName} — {c.city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.label}>Datum (RRRR-MM-DD)</Text>
              <TextInput style={s.input} value={newOrder.scheduledDate} onChangeText={t => setNewOrder(p => ({ ...p, scheduledDate: t }))} placeholderTextColor={C.textTertiary} />

              <Text style={s.label}>Adresa (prázdné = adresa zákazníka)</Text>
              <TextInput style={s.input} value={newOrder.address} onChangeText={t => setNewOrder(p => ({ ...p, address: t }))} placeholderTextColor={C.textTertiary} />

              <Text style={s.label}>Cena (Kč)</Text>
              <TextInput style={s.input} value={newOrder.price} onChangeText={t => setNewOrder(p => ({ ...p, price: t }))} keyboardType="numeric" placeholderTextColor={C.textTertiary} />

              <Text style={s.label}>Poznámka</Text>
              <TextInput style={[s.input, { minHeight: 60 }]} value={newOrder.note} onChangeText={t => setNewOrder(p => ({ ...p, note: t }))} multiline placeholderTextColor={C.textTertiary} />
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.base }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowNew(false)}>
                <Text style={{ color: C.textSecondary }}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.createBtn} onPress={createOrder}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Vytvořit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  addBtn: { backgroundColor: C.primary, paddingHorizontal: S.base, paddingVertical: S.sm, borderRadius: R.md },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  search: { backgroundColor: C.surface, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  filters: { flexDirection: 'row', paddingHorizontal: S.base, gap: S.sm, marginBottom: S.sm, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.xl, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  filterText: { color: C.textSecondary, fontSize: F.sm },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs },
  orderNum: { color: C.primary, fontWeight: 'bold', fontSize: F.md },
  badge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.xl },
  badgeText: { fontSize: F.xs, fontWeight: 'bold' },
  customerName: { color: C.textPrimary, fontWeight: '600', fontSize: F.base, marginBottom: 2 },
  address: { color: C.textSecondary, fontSize: F.sm, marginBottom: S.sm },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: C.textTertiary, fontSize: F.sm },
  price: { color: C.success, fontSize: F.sm, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', padding: S.lg },
  modal: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, maxHeight: '85%' },
  modalTitle: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', marginBottom: S.base },
  label: { color: C.textSecondary, fontSize: F.sm, marginBottom: S.xs, marginTop: S.sm },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  customerList: { maxHeight: 140, backgroundColor: C.surfaceEl, borderRadius: R.md, borderWidth: 1, borderColor: C.border },
  customerItem: { padding: S.sm, borderBottomWidth: 1, borderBottomColor: C.border },
  customerItemActive: { backgroundColor: C.primaryDim },
  customerItemText: { color: C.textPrimary, fontSize: F.sm },
  cancelBtn: { flex: 1, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  createBtn: { flex: 2, padding: S.md, borderRadius: R.md, backgroundColor: C.primary, alignItems: 'center' },
});
