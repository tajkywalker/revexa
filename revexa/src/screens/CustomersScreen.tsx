import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import { getCustomers, Customer } from '../db/database';

interface Props {
  onSelectCustomer: (customerId: string) => void;
  onNewCustomer: () => void;
}

export default function CustomersScreen({ onSelectCustomer, onNewCustomer }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]       = useState('');

  function load() {
    let list = getCustomers();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.includes(q)
      );
    }
    setCustomers(list);
  }

  useEffect(() => { load(); }, [search]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.header}>
        <Text style={s.title}>ZÁKAZNÍCI</Text>
        <TouchableOpacity style={s.addBtn} onPress={onNewCustomer}>
          <Text style={s.addBtnText}>+ Nový zákazník</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: S.base, paddingBottom: S.sm }}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Hledat jméno, město, telefon..."
          placeholderTextColor={C.textTertiary}
        />
      </View>
      <FlatList
        data={customers}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: S.base, gap: S.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => onSelectCustomer(item.id)}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.firstName[0]}{item.lastName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.firstName} {item.lastName}</Text>
              <Text style={s.address}>{item.street}, {item.city}</Text>
              {item.phone ? <Text style={s.phone}>📞 {item.phone}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ color: C.textTertiary, fontSize: F.lg }}>Žádní zákazníci</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  addBtn: { backgroundColor: C.primary, paddingHorizontal: S.base, paddingVertical: S.sm, borderRadius: R.md },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  search: { backgroundColor: C.surface, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.primaryDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.primary },
  avatarText: { color: C.primary, fontWeight: 'bold', fontSize: F.md },
  name: { color: C.textPrimary, fontWeight: '600', fontSize: F.md },
  address: { color: C.textSecondary, fontSize: F.sm },
  phone: { color: C.textTertiary, fontSize: F.xs, marginTop: 2 },
});
