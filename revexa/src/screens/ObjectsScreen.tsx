import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S, R } from '../theme';
import { getObjects, saveObject, ObjectRecord, generateOID } from '../db/database';
import { uid, nowISO } from '../utils';

interface Props {
  onSelectObject: (objectId: string) => void;
}

export default function ObjectsScreen({ onSelectObject }: Props) {
  const [objects, setObjects] = useState<ObjectRecord[]>([]);
  const [search, setSearch]   = useState('');

  function load() {
    let list = getObjects();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.oid.includes(q) ||
        `${o.ownerFirstName} ${o.ownerLastName}`.toLowerCase().includes(q) ||
        o.street.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
      );
    }
    setObjects(list);
  }

  useEffect(() => { load(); }, [search]);

  function createNew() {
    const now = nowISO();
    const obj: ObjectRecord = {
      id: uid(), oid: generateOID(),
      street: '', city: '', zip: '',
      ownerFirstName: '', ownerLastName: '', ownerPhone: '', ownerEmail: '',
      ownerStreet: '', ownerCity: '', ownerZip: '',
      buildingType: '', buildingFloors: '', heatingSystem: '', boilerBrand: '',
      flueType: '', flueHeight: 0, flueDiameter: 0,
      numAppliances: 1, applianceLocation: '', cleaningDoorLocation: '',
      revisionNumber: '', notes: '',
      createdAt: now, updatedAt: now,
    };
    saveObject(obj);
    load();
    onSelectObject(obj.id);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Hlavička */}
      <View style={s.header}>
        <Text style={s.title}>OBJEKTY</Text>
        <TouchableOpacity style={s.addBtn} onPress={createNew}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Nový objekt</Text>
        </TouchableOpacity>
      </View>

      {/* Vyhledávání */}
      <View style={{ paddingHorizontal: S.base, paddingBottom: S.sm }}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={16} color={C.textTertiary} />
          <TextInput
            style={s.search}
            value={search}
            onChangeText={setSearch}
            placeholder="Hledat OID, adresu, jméno..."
            placeholderTextColor={C.textTertiary}
          />
        </View>
      </View>

      {/* Seznam */}
      <FlatList
        data={objects}
        keyExtractor={o => o.id}
        contentContainerStyle={{ padding: S.base, gap: S.sm }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => onSelectObject(item.id)}>
            <View style={s.cardLeft}>
              <View style={s.oidBadge}>
                <Text style={s.oidText}>{item.oid}</Text>
              </View>
            </View>
            <View style={s.cardBody}>
              <Text style={s.address}>
                {item.city ? `${item.city}` : '—'}{item.street ? ` – ${item.street}` : ''}
              </Text>
              <Text style={s.owner}>
                {item.ownerFirstName || item.ownerLastName
                  ? `${item.ownerFirstName} ${item.ownerLastName}`.trim()
                  : 'Majitel nevyplněn'}
              </Text>
            </View>
            <View style={s.cardRight}>
              {item.numAppliances > 0 && (
                <View style={s.chipRow}>
                  <Ionicons name="flame-outline" size={12} color={C.primary} />
                  <Text style={s.chip}>{item.numAppliances}× spotřebič</Text>
                </View>
              )}
              {item.flueHeight > 0 && (
                <Text style={s.meta}>{item.flueHeight} m / ⌀{item.flueDiameter} mm</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="business-outline" size={48} color={C.textTertiary} />
            <Text style={s.emptyText}>Žádné objekty</Text>
            <Text style={s.emptyHint}>Klikněte na „Nový objekt" pro přidání</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.md },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: S.sm, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: S.md, borderWidth: 1, borderColor: C.border },
  search: { flex: 1, color: C.textPrimary, paddingVertical: S.sm, fontSize: F.base },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, flexDirection: 'row', alignItems: 'center', gap: S.md },
  cardLeft: { alignItems: 'center', justifyContent: 'center' },
  oidBadge: { backgroundColor: C.primary + '20', borderRadius: R.md, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.primary + '40', minWidth: 72, alignItems: 'center' },
  oidText: { color: C.primary, fontWeight: 'bold', fontSize: F.sm, letterSpacing: 1 },
  cardBody: { flex: 1 },
  address: { color: C.textPrimary, fontWeight: '600', fontSize: F.base, marginBottom: 2 },
  owner: { color: C.textSecondary, fontSize: F.sm },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  chip: { color: C.primary, fontSize: F.xs },
  meta: { color: C.textTertiary, fontSize: F.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: S.sm },
  emptyText: { color: C.textSecondary, fontSize: F.lg },
  emptyHint: { color: C.textTertiary, fontSize: F.sm },
});
