import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S, R } from '../theme';
import { getSetting, setSetting } from '../db/database';

const FIELDS: { key: string; label: string; placeholder: string; keyType?: any; secure?: boolean }[] = [
  { key: 'firstName',      label: 'Jméno',                         placeholder: 'Jan' },
  { key: 'lastName',       label: 'Příjmení',                      placeholder: 'Novák' },
  { key: 'email',          label: 'Email',                         placeholder: 'jan.novak@kominik.cz', keyType: 'email-address' },
  { key: 'phone',          label: 'Telefon',                       placeholder: '+420 600 000 000',    keyType: 'phone-pad' },
  { key: 'company',        label: 'Firma / OSVČ',                  placeholder: 'Kominictví Novák s.r.o.' },
  { key: 'address',        label: 'Adresa firmy',                  placeholder: 'Ulice 123, Praha' },
  { key: 'ico',            label: 'IČO',                           placeholder: '12345678',            keyType: 'number-pad' },
  { key: 'certNumber',     label: 'Číslo průkazu / osvědčení',    placeholder: 'PR-2020-001' },
  { key: 'certDate',       label: 'Platnost průkazu do',           placeholder: 'DD.MM.RRRR' },
  { key: 'requalDate',     label: 'Rekvalifikační kurz (datum)',   placeholder: 'DD.MM.RRRR' },
];

export default function SettingsScreen() {
  const [values, setValues]     = useState<Record<string,string>>({});
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    const loaded: Record<string,string> = {};
    for (const f of FIELDS) loaded[f.key] = getSetting(f.key) ?? '';
    setValues(loaded);
  }, []);

  function save() {
    for (const [k, v] of Object.entries(values)) setSetting(k, v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Alert.alert('✓ Uloženo', 'Profil byl uložen.');
  }

  function get(key: string) { return values[key] ?? ''; }
  function set(key: string, val: string) { setValues(p => ({ ...p, [key]: val })); }

  const techName = `${get('firstName')} ${get('lastName')}`.trim() || '—';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={s.header}>
        <Text style={s.title}>NASTAVENÍ</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>

        {/* Aktuální profil */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{get('firstName')[0] ?? '?'}{get('lastName')[0] ?? ''}</Text>
          </View>
          <View>
            <Text style={s.profileName}>{techName}</Text>
            {get('company') ? <Text style={s.profileCompany}>{get('company')}</Text> : null}
            {get('certNumber') ? <Text style={s.profileCert}>Průkaz: {get('certNumber')}</Text> : null}
          </View>
        </View>

        {/* Osobní a firemní údaje */}
        <View style={s.card}>
          <Text style={s.cardLabel}>OSOBNÍ A FIREMNÍ ÚDAJE</Text>
          {FIELDS.slice(0, 8).map(f => (
            <View key={f.key} style={{ marginBottom: S.sm }}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={get(f.key)}
                onChangeText={v => set(f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={C.textTertiary}
                keyboardType={f.keyType ?? 'default'}
                autoCapitalize={f.keyType === 'email-address' ? 'none' : 'words'}
              />
            </View>
          ))}
        </View>

        {/* Průkaz a certifikace */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PRŮKAZ A CERTIFIKACE</Text>
          {FIELDS.slice(8).map(f => (
            <View key={f.key} style={{ marginBottom: S.sm }}>
              <Text style={s.label}>{f.label}</Text>
              <TextInput
                style={s.input}
                value={get(f.key)}
                onChangeText={v => set(f.key, v)}
                placeholder={f.placeholder}
                placeholderTextColor={C.textTertiary}
                keyboardType={f.keyType ?? 'default'}
              />
            </View>
          ))}
        </View>

        {/* Razítko a podpis (placeholder) */}
        <View style={s.card}>
          <Text style={s.cardLabel}>DIGITÁLNÍ RAZÍTKO A PODPIS</Text>
          <Text style={{ color: C.textTertiary, fontSize: F.sm, marginBottom: S.md }}>
            Tyto funkce budou dostupné v plné verzi REVEXA. Razítko a podpis budou automaticky vkládány do protokolů.
          </Text>
          <View style={s.stampPlaceholder}>
            <Ionicons name="seal-outline" size={36} color={C.textTertiary} />
            <Text style={{ color: C.textTertiary, fontSize: F.sm, marginTop: S.sm }}>Nahrát digitální razítko</Text>
            <Text style={{ color: C.textTertiary, fontSize: F.xs }}>PNG nebo JPG, průhledné pozadí</Text>
          </View>
          <View style={[s.stampPlaceholder, { marginTop: S.sm }]}>
            <Ionicons name="create-outline" size={36} color={C.textTertiary} />
            <Text style={{ color: C.textTertiary, fontSize: F.sm, marginTop: S.sm }}>Nahrát digitální podpis</Text>
            <Text style={{ color: C.textTertiary, fontSize: F.xs }}>PNG nebo SVG, průhledné pozadí</Text>
          </View>
        </View>

        {/* Uložit */}
        <TouchableOpacity style={saved ? s.savedBtn : s.saveBtn} onPress={save}>
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: F.md }}>
            {saved ? 'Uloženo!' : 'Uložit profil'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={[s.card, { alignItems: 'center', paddingVertical: S.lg }]}>
          <Text style={{ color: C.primary, fontWeight: 'bold', fontSize: F.xl, letterSpacing: 3 }}>REVEXA</Text>
          <Text style={{ color: C.textTertiary, fontSize: F.sm, marginTop: 4 }}>Verze 1.0.0 · Prototyp</Text>
          <Text style={{ color: C.textTertiary, fontSize: F.xs, marginTop: 2 }}>Pro kominíky a revizní techniky</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { color: C.textPrimary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 2 },
  profileCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, flexDirection: 'row', alignItems: 'center', gap: S.base, borderWidth: 1, borderColor: C.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primary },
  avatarText: { color: C.primary, fontWeight: 'bold', fontSize: F.xl },
  profileName: { color: C.textPrimary, fontSize: F.lg, fontWeight: 'bold' },
  profileCompany: { color: C.textSecondary, fontSize: F.sm },
  profileCert: { color: C.primary, fontSize: F.xs, marginTop: 2 },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  cardLabel: { color: C.textTertiary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.md },
  label: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.sm, borderWidth: 1, borderColor: C.border },
  stampPlaceholder: { backgroundColor: C.surfaceEl, borderRadius: R.lg, padding: S.xl, alignItems: 'center', borderWidth: 2, borderColor: C.border, borderStyle: 'dashed' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.primary, borderRadius: R.lg, paddingVertical: S.md + 4 },
  savedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, backgroundColor: C.success, borderRadius: R.lg, paddingVertical: S.md + 4 },
});
