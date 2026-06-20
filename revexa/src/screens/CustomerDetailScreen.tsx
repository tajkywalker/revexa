import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import {
  getCustomer, saveCustomer, deleteCustomer, Customer,
  getChimneys, saveChimney, deleteChimney, Chimney,
  getOrdersByCustomer, Order,
} from '../db/database';
import { uid, nowISO, formatDate, STATUS_LABELS, STATUS_COLORS } from '../utils';
import { RootStackParamList } from '../App';

type Route = RouteProp<RootStackParamList, 'CustomerDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

const CUSTOMER_FIELDS: [keyof Customer, string][] = [
  ['firstName', 'Jméno *'],
  ['lastName', 'Příjmení *'],
  ['phone', 'Telefon'],
  ['email', 'Email'],
  ['street', 'Ulice a číslo'],
  ['city', 'Město'],
  ['zip', 'PSČ'],
];

export default function CustomerDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isNew = !route.params?.customerId;

  const [customer, setCustomer] = useState<Customer>({
    id: uid(), firstName: '', lastName: '', phone: '', email: '',
    street: '', city: '', zip: '', note: '', createdAt: nowISO(),
  });
  const [chimneys, setChimneys] = useState<Chimney[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addChimneyMode, setAddChimneyMode] = useState(false);
  const [newChimney, setNewChimney] = useState({ label: '', type: '', fuel: '' });

  useFocusEffect(useCallback(() => {
    if (!isNew && route.params?.customerId) {
      const c = getCustomer(route.params.customerId);
      if (c) {
        setCustomer(c);
        setChimneys(getChimneys(c.id));
        setOrders(getOrdersByCustomer(c.id));
      }
    }
  }, [route.params?.customerId]));

  function update(field: keyof Customer, value: string) {
    setCustomer(p => ({ ...p, [field]: value }));
  }

  function save() {
    if (!customer.firstName || !customer.lastName) {
      Alert.alert('Chyba', 'Zadejte alespoň jméno a příjmení');
      return;
    }
    saveCustomer(customer);
    if (isNew) {
      nav.goBack();
    } else {
      Alert.alert('Uloženo', 'Informace o zákazníkovi byly uloženy.');
    }
  }

  function addChimney() {
    if (!newChimney.label.trim()) {
      Alert.alert('Chyba', 'Zadejte název / označení komína');
      return;
    }
    const ch: Chimney = {
      id: uid(), customerId: customer.id,
      label: newChimney.label, type: newChimney.type,
      fuel: newChimney.fuel, note: '',
    };
    saveChimney(ch);
    setChimneys(prev => [...prev, ch]);
    setNewChimney({ label: '', type: '', fuel: '' });
    setAddChimneyMode(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>

        {/* Osobní údaje */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>{isNew ? 'NOVÝ ZÁKAZNÍK' : 'OSOBNÍ ÚDAJE'}</Text>
          {CUSTOMER_FIELDS.map(([f, l]) => (
            <View key={f} style={{ marginBottom: S.sm }}>
              <Text style={s.label}>{l}</Text>
              <TextInput
                style={s.input}
                value={customer[f] as string}
                onChangeText={v => update(f, v)}
                placeholderTextColor={C.textTertiary}
                placeholder={l.replace(' *', '')}
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
            multiline
            textAlignVertical="top"
            placeholderTextColor={C.textTertiary}
            placeholder="Interní poznámky..."
          />
        </View>

        {/* Tlačítko Uložit */}
        <TouchableOpacity style={s.primaryBtn} onPress={save}>
          <Text style={s.primaryBtnText}>{isNew ? '+ Vytvořit zákazníka' : '✓ Uložit změny'}</Text>
        </TouchableOpacity>

        {/* Spalinové cesty / Komíny */}
        {!isNew && (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.sm }}>
              <Text style={s.sectionTitle}>🔥 SPALINOVÉ CESTY ({chimneys.length})</Text>
              <TouchableOpacity onPress={() => setAddChimneyMode(!addChimneyMode)}>
                <Text style={{ color: C.primary, fontSize: F.sm }}>{addChimneyMode ? 'Zrušit' : '+ Přidat'}</Text>
              </TouchableOpacity>
            </View>

            {/* Formulář přidání nového komína */}
            {addChimneyMode && (
              <View style={{ backgroundColor: C.surfaceEl, borderRadius: R.md, padding: S.sm, marginBottom: S.sm, gap: S.xs }}>
                <TextInput style={s.inputSm} value={newChimney.label} onChangeText={t => setNewChimney(p => ({ ...p, label: t }))} placeholder="Název / označení *" placeholderTextColor={C.textTertiary} />
                <TextInput style={s.inputSm} value={newChimney.type} onChangeText={t => setNewChimney(p => ({ ...p, type: t }))} placeholder="Typ (průduch, komín, kouřovod...)" placeholderTextColor={C.textTertiary} />
                <TextInput style={s.inputSm} value={newChimney.fuel} onChangeText={t => setNewChimney(p => ({ ...p, fuel: t }))} placeholder="Palivo (dřevo, plyn, uhlí...)" placeholderTextColor={C.textTertiary} />
                <TouchableOpacity style={[s.primaryBtn, { marginTop: S.xs }]} onPress={addChimney}>
                  <Text style={s.primaryBtnText}>Přidat komín</Text>
                </TouchableOpacity>
              </View>
            )}

            {chimneys.length === 0 && !addChimneyMode && (
              <Text style={{ color: C.textTertiary, fontSize: F.sm, textAlign: 'center', paddingVertical: S.md }}>
                Žádné spalinové cesty. Klikněte "+ Přidat".
              </Text>
            )}
            {chimneys.map((ch, i) => (
              <View key={ch.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: S.sm, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.border }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>{ch.label}</Text>
                  <View style={{ flexDirection: 'row', gap: S.md }}>
                    {ch.type ? <Text style={{ color: C.textTertiary, fontSize: F.xs }}>{ch.type}</Text> : null}
                    {ch.fuel ? <Text style={{ color: C.textTertiary, fontSize: F.xs }}>{ch.fuel}</Text> : null}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert('Smazat komín?', `"${ch.label}" bude smazán.`, [
                    { text: 'Zrušit', style: 'cancel' },
                    { text: 'Smazat', style: 'destructive', onPress: () => { deleteChimney(ch.id); setChimneys(c => c.filter(x => x.id !== ch.id)); } }
                  ])}
                >
                  <Text style={{ color: C.error, fontSize: F.xs }}>Smazat</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Historie zakázek */}
        {!isNew && orders.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>📋 HISTORIE ZAKÁZEK ({orders.length})</Text>
            {orders.map((o, i) => (
              <TouchableOpacity
                key={o.id}
                style={{ paddingVertical: S.sm, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.sm }}
                onPress={() => nav.navigate('OrderDetail', { orderId: o.id })}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[o.status], marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>
                    {o.orderNumber} — {formatDate(o.scheduledDate)}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: F.xs }}>{STATUS_LABELS[o.status]}</Text>
                  {o.note ? <Text style={{ color: C.textTertiary, fontSize: F.xs }}>{o.note}</Text> : null}
                </View>
                <Text style={{ color: C.textTertiary, fontSize: F.xs }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Smazat zákazníka */}
        {!isNew && (
          <TouchableOpacity
            style={{ borderRadius: R.md, padding: S.md, alignItems: 'center', borderWidth: 1, borderColor: C.error }}
            onPress={() => Alert.alert('Smazat zákazníka?', 'Smaže se zákazník ale NE jeho zakázky.', [
              { text: 'Zrušit', style: 'cancel' },
              { text: 'Smazat', style: 'destructive', onPress: () => { deleteCustomer(customer.id); nav.goBack(); } }
            ])}
          >
            <Text style={{ color: C.error, fontSize: F.sm }}>Smazat zákazníka</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  sectionTitle: { color: C.textTertiary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: S.sm },
  label: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  inputSm: { backgroundColor: C.bg, borderRadius: R.sm, color: C.textPrimary, paddingHorizontal: S.sm, paddingVertical: S.xs, fontSize: F.sm, borderWidth: 1, borderColor: C.border },
  primaryBtn: { backgroundColor: C.primary, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.md },
});
