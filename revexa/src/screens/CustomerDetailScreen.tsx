import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import {
  getCustomer, saveCustomer, deleteCustomer, Customer,
  getChimneys, saveChimney, deleteChimney, Chimney,
  getOrdersByCustomer, Order,
} from '../db/database';
import { uid, nowISO, formatDate, STATUS_LABELS, STATUS_COLORS } from '../utils';

interface Props {
  customerId?: string;
  onBack: () => void;
  onSelectOrder: (orderId: string) => void;
}

const FIELDS: [keyof Customer, string][] = [
  ['firstName', 'Jméno *'],
  ['lastName',  'Příjmení *'],
  ['phone',     'Telefon'],
  ['email',     'Email'],
  ['street',    'Ulice a číslo'],
  ['city',      'Město'],
  ['zip',       'PSČ'],
];

export default function CustomerDetailScreen({ customerId, onBack, onSelectOrder }: Props) {
  const isNew = !customerId;
  const [customer, setCustomer] = useState<Customer>({
    id: uid(), firstName: '', lastName: '', phone: '', email: '',
    street: '', city: '', zip: '', note: '', createdAt: nowISO(),
  });
  const [chimneys, setChimneys] = useState<Chimney[]>([]);
  const [orders, setOrders]     = useState<Order[]>([]);
  const [addMode, setAddMode]   = useState(false);
  const [newCh, setNewCh]       = useState({ label: '', type: '', fuel: '' });

  useEffect(() => {
    if (!isNew && customerId) {
      const c = getCustomer(customerId);
      if (c) {
        setCustomer(c);
        setChimneys(getChimneys(c.id));
        setOrders(getOrdersByCustomer(c.id));
      }
    }
  }, [customerId]);

  function update(field: keyof Customer, value: string) {
    setCustomer(p => ({ ...p, [field]: value }));
  }

  function save() {
    if (!customer.firstName || !customer.lastName) {
      Alert.alert('Chyba', 'Zadejte alespoň jméno a příjmení');
      return;
    }
    saveCustomer(customer);
    if (isNew) onBack();
    else Alert.alert('Uloženo', 'Informace zákazníka byly uloženy.');
  }

  function addChimney() {
    if (!newCh.label.trim()) { Alert.alert('Chyba', 'Zadejte název komína'); return; }
    const ch: Chimney = { id: uid(), customerId: customer.id, label: newCh.label, type: newCh.type, fuel: newCh.fuel, note: '' };
    saveChimney(ch);
    setChimneys(p => [...p, ch]);
    setNewCh({ label: '', type: '', fuel: '' });
    setAddMode(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>← Zpět</Text>
        </TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Nový zákazník' : `${customer.firstName} ${customer.lastName}`}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>
        {/* Osobní údaje */}
        <View style={s.card}>
          <Text style={s.cardLabel}>OSOBNÍ ÚDAJE</Text>
          {FIELDS.map(([f, l]) => (
            <View key={f} style={{ marginBottom: S.sm }}>
              <Text style={s.label}>{l}</Text>
              <TextInput
                style={s.input}
                value={customer[f] as string}
                onChangeText={v => update(f, v)}
                placeholder={l.replace(' *', '')}
                placeholderTextColor={C.textTertiary}
                keyboardType={f === 'phone' ? 'phone-pad' : f === 'email' ? 'email-address' : 'default'}
                autoCapitalize={f === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}
          <Text style={s.label}>Poznámka</Text>
          <TextInput
            style={[s.input, { minHeight: 64 }]}
            value={customer.note}
            onChangeText={v => update('note', v)}
            multiline textAlignVertical="top"
            placeholder="Interní poznámky..."
            placeholderTextColor={C.textTertiary}
          />
        </View>

        <TouchableOpacity style={s.primaryBtn} onPress={save}>
          <Text style={s.primaryBtnText}>{isNew ? '+ Vytvořit zákazníka' : '✓ Uložit změny'}</Text>
        </TouchableOpacity>

        {/* Spalinové cesty */}
        {!isNew && (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.cardLabel}>SPALINOVÉ CESTY ({chimneys.length})</Text>
              <TouchableOpacity onPress={() => setAddMode(!addMode)}>
                <Text style={{ color: C.primary, fontSize: F.sm }}>{addMode ? 'Zrušit' : '+ Přidat'}</Text>
              </TouchableOpacity>
            </View>

            {addMode && (
              <View style={s.addForm}>
                <TextInput style={s.inputSm} value={newCh.label} onChangeText={t => setNewCh(p => ({ ...p, label: t }))} placeholder="Název / označení *" placeholderTextColor={C.textTertiary} />
                <TextInput style={s.inputSm} value={newCh.type}  onChangeText={t => setNewCh(p => ({ ...p, type: t }))}  placeholder="Typ (průduch, komín...)" placeholderTextColor={C.textTertiary} />
                <TextInput style={s.inputSm} value={newCh.fuel}  onChangeText={t => setNewCh(p => ({ ...p, fuel: t }))}  placeholder="Palivo (dřevo, plyn...)" placeholderTextColor={C.textTertiary} />
                <TouchableOpacity style={[s.primaryBtn, { marginTop: S.xs }]} onPress={addChimney}>
                  <Text style={s.primaryBtnText}>Přidat</Text>
                </TouchableOpacity>
              </View>
            )}

            {chimneys.length === 0 && !addMode
              ? <Text style={s.empty}>Žádné spalinové cesty</Text>
              : chimneys.map((ch, i) => (
                <View key={ch.id} style={[s.chRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>{ch.label}</Text>
                    <View style={{ flexDirection: 'row', gap: S.md }}>
                      {ch.type ? <Text style={s.chMeta}>{ch.type}</Text> : null}
                      {ch.fuel ? <Text style={s.chMeta}>{ch.fuel}</Text> : null}
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Smazat?', `"${ch.label}"`, [
                    { text: 'Zrušit', style: 'cancel' },
                    { text: 'Smazat', style: 'destructive', onPress: () => { deleteChimney(ch.id); setChimneys(p => p.filter(x => x.id !== ch.id)); } },
                  ])}>
                    <Text style={{ color: C.error, fontSize: F.xs }}>Smazat</Text>
                  </TouchableOpacity>
                </View>
              ))
            }
          </View>
        )}

        {/* Historie zakázek */}
        {!isNew && orders.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>HISTORIE ZAKÁZEK ({orders.length})</Text>
            {orders.map((o, i) => (
              <TouchableOpacity
                key={o.id}
                style={[s.orderRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
                onPress={() => onSelectOrder(o.id)}
              >
                <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[o.status] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>
                    {o.orderNumber} — {formatDate(o.scheduledDate)}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: F.xs }}>{STATUS_LABELS[o.status]}</Text>
                </View>
                <Text style={{ color: C.textTertiary, fontSize: F.xs }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Smazat zákazníka */}
        {!isNew && (
          <TouchableOpacity
            style={s.deleteBtn}
            onPress={() => Alert.alert('Smazat zákazníka?', '', [
              { text: 'Zrušit', style: 'cancel' },
              { text: 'Smazat', style: 'destructive', onPress: () => { deleteCustomer(customer.id); onBack(); } },
            ])}
          >
            <Text style={{ color: C.error, fontSize: F.sm }}>Smazat zákazníka</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: {},
  backText: { color: C.textSecondary, fontSize: F.sm },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', flex: 1 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm },
  cardLabel: { color: C.textTertiary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.sm },
  label: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  inputSm: { backgroundColor: C.bg, borderRadius: R.sm, color: C.textPrimary, paddingHorizontal: S.sm, paddingVertical: S.xs, fontSize: F.sm, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  addForm: { backgroundColor: C.surfaceEl, borderRadius: R.md, padding: S.sm, marginBottom: S.sm },
  empty: { color: C.textTertiary, fontSize: F.sm, textAlign: 'center', paddingVertical: S.md },
  chRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm, gap: S.sm },
  chMeta: { color: C.textTertiary, fontSize: F.xs },
  orderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.sm, gap: S.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  primaryBtn: { backgroundColor: C.primary, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.md },
  deleteBtn: { borderRadius: R.md, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.error },
});
