import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/theme';
import Card from '../components/common/Card';

export default function NastaveniScreen() {
  const [companyName, setCompanyName] = useState('Kominická firma s.r.o.');
  const [companyAddress, setCompanyAddress] = useState('Kominická 1, Praha');
  const [companyPhone, setCompanyPhone] = useState('+420 777 000 111');
  const [companyEmail, setCompanyEmail] = useState('info@kominik.cz');
  const [licenseNumber, setLicenseNumber] = useState('KOM-2024-001');
  const [autoSync, setAutoSync] = useState(true);
  const [emailCopy, setEmailCopy] = useState(false);

  function handleSave() {
    Alert.alert('Uloženo', 'Nastavení bylo uloženo.');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Nastavení</Text>

      {/* Firemní údaje */}
      <Card>
        <Text style={styles.sectionTitle}>Firemní údaje</Text>
        <Text style={styles.sectionSub}>Tyto údaje se zobrazí na protokolech</Text>

        <FormField label="Název firmy" value={companyName} onChangeText={setCompanyName} />
        <FormField label="Adresa" value={companyAddress} onChangeText={setCompanyAddress} />
        <View style={styles.row}>
          <FormField label="Telefon" value={companyPhone} onChangeText={setCompanyPhone} flex />
          <FormField label="E-mail" value={companyEmail} onChangeText={setCompanyEmail} flex />
        </View>
        <FormField label="Číslo živnostenského oprávnění" value={licenseNumber} onChangeText={setLicenseNumber} />
      </Card>

      {/* Synchronizace */}
      <Card>
        <Text style={styles.sectionTitle}>Synchronizace a záloha</Text>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Automatická synchronizace</Text>
            <Text style={styles.switchSub}>Synchronizovat data při připojení k internetu</Text>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
            thumbColor={Colors.textPrimary}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Kopie e-mailem sobě</Text>
            <Text style={styles.switchSub}>Při odeslání zákazníkovi také mně</Text>
          </View>
          <Switch
            value={emailCopy}
            onValueChange={setEmailCopy}
            trackColor={{ false: Colors.surfaceBorder, true: Colors.primary }}
            thumbColor={Colors.textPrimary}
          />
        </View>
      </Card>

      {/* O aplikaci */}
      <Card>
        <Text style={styles.sectionTitle}>O aplikaci</Text>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Verze aplikace</Text>
          <Text style={styles.aboutValue}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Databáze</Text>
          <Text style={styles.aboutValue}>SQLite (lokální)</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={styles.aboutLabel}>Platforma</Text>
          <Text style={styles.aboutValue}>Android (Xiaomi HyperOS)</Text>
        </View>
      </Card>

      {/* Tlačítko uložit */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Uložit nastavení</Text>
      </TouchableOpacity>

      {/* Nebezpečná zóna */}
      <Card>
        <Text style={[styles.sectionTitle, { color: Colors.error }]}>Nebezpečná zóna</Text>
        <TouchableOpacity
          style={styles.dangerBtn}
          onPress={() => Alert.alert('Smazat data', 'Opravdu chcete smazat všechna data? Tuto akci nelze vrátit.', [
            { text: 'Zrušit', style: 'cancel' },
            { text: 'Smazat', style: 'destructive', onPress: () => {} }
          ])}
        >
          <Text style={styles.dangerBtnText}>Smazat všechna data</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

function FormField({ label, value, onChangeText, flex }: any) {
  return (
    <View style={[styles.field, flex && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.md },
  pageTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold, marginBottom: Spacing.sm },

  sectionTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold, marginBottom: 4 },
  sectionSub: { color: Colors.textTertiary, fontSize: Typography.xs, marginBottom: Spacing.md },

  row: { flexDirection: 'row', gap: Spacing.sm },
  field: { marginBottom: Spacing.md },
  fieldLabel: { color: Colors.textTertiary, fontSize: Typography.xs, fontWeight: Typography.semiBold, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  fieldInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
    color: Colors.textPrimary, fontSize: Typography.base,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },

  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.md },
  switchInfo: { flex: 1 },
  switchLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.medium },
  switchSub: { color: Colors.textTertiary, fontSize: Typography.xs, marginTop: 2 },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder },
  aboutLabel: { color: Colors.textSecondary, fontSize: Typography.base },
  aboutValue: { color: Colors.textPrimary, fontWeight: Typography.medium },

  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: Colors.textPrimary, fontWeight: Typography.bold, fontSize: Typography.md },

  dangerBtn: {
    borderWidth: 1, borderColor: Colors.error,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm,
  },
  dangerBtnText: { color: Colors.error, fontWeight: Typography.semiBold },
});
