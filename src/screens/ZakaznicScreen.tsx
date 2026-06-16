import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../utils/theme';
import { getAllCustomers, saveCustomer, deleteCustomer, getAddressesByCustomer, searchCustomers } from '../database/database';
import { Customer, Address } from '../types';
import { generateId, nowISO } from '../utils/helpers';
import Card from '../components/common/Card';

export default function ZakaznicScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (search.length > 1) {
      searchCustomers(search).then(setCustomers);
    } else {
      loadCustomers();
    }
  }, [search]);

  async function loadCustomers() {
    const data = await getAllCustomers();
    setCustomers(data);
  }

  async function handleSelectCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    const addrs = await getAddressesByCustomer(customer.id);
    setAddresses(addrs);
  }

  function handleNewCustomer() {
    setEditingCustomer(null);
    setShowForm(true);
  }

  function handleEditCustomer(c: Customer) {
    setEditingCustomer(c);
    setShowForm(true);
  }

  async function handleDeleteCustomer(c: Customer) {
    Alert.alert(
      'Smazat zákazníka',
      `Opravdu chcete smazat zákazníka ${c.firstName} ${c.lastName}?`,
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Smazat', style: 'destructive',
          onPress: async () => {
            await deleteCustomer(c.id);
            if (selectedCustomer?.id === c.id) setSelectedCustomer(null);
            loadCustomers();
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Levý panel */}
      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Hledat zákazníky..."
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleNewCustomer}>
            <Text style={styles.addBtnText}>+ Přidat</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.countText}>{customers.length} zákazníků</Text>

        <FlatList
          data={customers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CustomerCard
              customer={item}
              isSelected={selectedCustomer?.id === item.id}
              onPress={() => handleSelectCustomer(item)}
              onEdit={() => handleEditCustomer(item)}
              onDelete={() => handleDeleteCustomer(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        />
      </View>

      {/* Pravý panel - detail zákazníka */}
      <View style={styles.detailPanel}>
        {selectedCustomer ? (
          <CustomerDetail
            customer={selectedCustomer}
            addresses={addresses}
            onEdit={() => handleEditCustomer(selectedCustomer)}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>Vyberte zákazníka ze seznamu</Text>
          </View>
        )}
      </View>

      {/* Modal pro editaci */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => setShowForm(false)}
          onSaved={(c) => {
            setShowForm(false);
            loadCustomers();
            setSelectedCustomer(c);
            getAddressesByCustomer(c.id).then(setAddresses);
          }}
        />
      )}
    </View>
  );
}

// -----------------------------------------------------------------------
function CustomerCard({ customer, isSelected, onPress, onEdit, onDelete }: any) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.customerCard, isSelected && styles.customerCardSelected]}>
        {isSelected && <View style={styles.selectedBar} />}
        <View style={styles.customerCardContent}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {customer.firstName[0]}{customer.lastName[0]}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {customer.firstName} {customer.lastName}
            </Text>
            {customer.companyName && (
              <Text style={styles.companyName}>{customer.companyName}</Text>
            )}
            <Text style={styles.customerAddr}>{customer.city}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={onEdit} style={styles.cardAction}>
              <Text style={styles.cardActionText}>✏</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CustomerDetail({ customer, addresses, onEdit }: any) {
  return (
    <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent}>
      {/* Záhlaví */}
      <View style={styles.detailHeader}>
        <View style={styles.detailAvatar}>
          <Text style={styles.detailAvatarText}>
            {customer.firstName[0]}{customer.lastName[0]}
          </Text>
        </View>
        <View style={styles.detailHeaderInfo}>
          <Text style={styles.detailName}>{customer.firstName} {customer.lastName}</Text>
          {customer.companyName && (
            <Text style={styles.detailCompany}>{customer.companyName}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.detailEditBtn} onPress={onEdit}>
          <Text style={styles.detailEditBtnText}>Upravit</Text>
        </TouchableOpacity>
      </View>

      {/* Kontaktní informace */}
      <Card style={styles.detailCard}>
        <Text style={styles.cardSectionLabel}>KONTAKT</Text>
        <InfoRow icon="📞" value={customer.phone} />
        <InfoRow icon="✉" value={customer.email} />
        <InfoRow icon="📍" value={`${customer.street}, ${customer.zip} ${customer.city}`} />
        {customer.note && <InfoRow icon="📝" value={customer.note} />}
      </Card>

      {/* Adresy a komíny */}
      <Text style={styles.sectionTitle}>Adresy a spalinové cesty</Text>
      {addresses.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Žádné adresy</Text>
        </Card>
      ) : (
        addresses.map((addr: Address) => (
          <Card key={addr.id} style={styles.detailCard}>
            <Text style={styles.addrTitle}>{addr.street}, {addr.city}</Text>
            <Text style={styles.addrType}>{addr.applianceType}</Text>
            {addr.chimneys.map(ch => (
              <View key={ch.id} style={styles.chimneyRow}>
                <Text style={styles.chimneyLabel}>🏚 {ch.label}</Text>
                <Text style={styles.chimneyInfo}>{ch.type} · Ø{ch.diameter}mm · {ch.height}m</Text>
              </View>
            ))}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function InfoRow({ icon, value }: { icon: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// -----------------------------------------------------------------------
function CustomerFormModal({ customer, onClose, onSaved }: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (c: Customer) => void;
}) {
  const [firstName, setFirstName] = useState(customer?.firstName || '');
  const [lastName, setLastName] = useState(customer?.lastName || '');
  const [company, setCompany] = useState(customer?.companyName || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [street, setStreet] = useState(customer?.street || '');
  const [city, setCity] = useState(customer?.city || '');
  const [zip, setZip] = useState(customer?.zip || '');
  const [note, setNote] = useState(customer?.note || '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert('Chyba', 'Vyplňte jméno, příjmení a telefon.');
      return;
    }
    setSaving(true);
    const now = nowISO();
    const c: Customer = {
      id: customer?.id || generateId(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      companyName: company.trim() || undefined,
      phone: phone.trim(),
      email: email.trim(),
      street: street.trim(),
      city: city.trim(),
      zip: zip.trim(),
      note: note.trim() || undefined,
      createdAt: customer?.createdAt || now,
      updatedAt: now,
    };
    await saveCustomer(c);
    onSaved(c);
    setSaving(false);
  }

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {customer ? 'Upravit zákazníka' : 'Nový zákazník'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formRow}>
              <FormField label="Jméno *" value={firstName} onChangeText={setFirstName} placeholder="Jan" />
              <FormField label="Příjmení *" value={lastName} onChangeText={setLastName} placeholder="Novák" />
            </View>
            <FormField label="Firma (nepovinné)" value={company} onChangeText={setCompany} placeholder="ABC s.r.o." />
            <View style={styles.formRow}>
              <FormField label="Telefon *" value={phone} onChangeText={setPhone} placeholder="+420 777 123 456" keyboardType="phone-pad" />
              <FormField label="E-mail" value={email} onChangeText={setEmail} placeholder="jan@novak.cz" keyboardType="email-address" />
            </View>
            <FormField label="Ulice a číslo popisné" value={street} onChangeText={setStreet} placeholder="Hlavní 123" />
            <View style={styles.formRow}>
              <FormField label="Město" value={city} onChangeText={setCity} placeholder="Praha" />
              <FormField label="PSČ" value={zip} onChangeText={setZip} placeholder="110 00" keyboardType="numeric" />
            </View>
            <FormField label="Poznámka" value={note} onChangeText={setNote} placeholder="Volitelná poznámka..." multiline />
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Ukládám...' : 'Uložit zákazníka'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormField({ label, value, onChangeText, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },

  listPanel: {
    width: 300,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    paddingTop: Spacing.base,
  },
  listHeader: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchIcon: { fontSize: 12 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    paddingVertical: Spacing.sm,
    marginLeft: 6,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  addBtnText: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  countText: { color: Colors.textTertiary, fontSize: Typography.xs, paddingHorizontal: Spacing.base, marginBottom: 8 },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },

  customerCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  customerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  selectedBar: { width: 3, backgroundColor: Colors.primary },
  customerCardContent: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 10, gap: 10,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.sm },
  customerInfo: { flex: 1 },
  customerName: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  companyName: { color: Colors.textSecondary, fontSize: Typography.xs },
  customerAddr: { color: Colors.textTertiary, fontSize: Typography.xs },
  cardActions: { flexDirection: 'row', gap: 4 },
  cardAction: { padding: 6 },
  cardActionText: { fontSize: 14 },

  detailPanel: { flex: 1 },
  detailScroll: { flex: 1 },
  detailContent: { padding: Spacing.base, gap: Spacing.md },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  detailAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  detailAvatarText: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.xl },
  detailHeaderInfo: { flex: 1 },
  detailName: { color: Colors.textPrimary, fontSize: Typography.xl, fontWeight: Typography.bold },
  detailCompany: { color: Colors.textSecondary, fontSize: Typography.sm },
  detailEditBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primary,
  },
  detailEditBtnText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  detailCard: { marginBottom: 0 },
  cardSectionLabel: {
    color: Colors.textTertiary, fontSize: Typography.xs,
    fontWeight: Typography.semiBold, letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 5 },
  infoIcon: { fontSize: 14, width: 20 },
  infoValue: { color: Colors.textPrimary, fontSize: Typography.base, flex: 1 },
  sectionTitle: {
    color: Colors.textPrimary, fontSize: Typography.lg,
    fontWeight: Typography.bold, marginTop: Spacing.sm,
  },
  addrTitle: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base, marginBottom: 4 },
  addrType: { color: Colors.textSecondary, fontSize: Typography.sm, marginBottom: 8 },
  chimneyRow: { paddingVertical: 4, borderTopWidth: 1, borderTopColor: Colors.surfaceBorder },
  chimneyLabel: { color: Colors.textPrimary, fontSize: Typography.sm, fontWeight: Typography.medium },
  chimneyInfo: { color: Colors.textSecondary, fontSize: Typography.xs },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyIcon: { fontSize: 56, opacity: 0.3 },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.lg },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '70%', maxHeight: '90%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: Typography.lg, fontWeight: Typography.bold },
  modalClose: { color: Colors.textSecondary, fontSize: 20 },
  modalBody: { padding: Spacing.base, maxHeight: 500 },
  modalFooter: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
  },
  cancelBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: Typography.semiBold },
  saveBtn: {
    flex: 2, backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center',
  },
  saveBtnText: { color: Colors.textPrimary, fontWeight: Typography.bold },

  formRow: { flexDirection: 'row', gap: Spacing.sm },
  formField: { flex: 1, marginBottom: Spacing.md },
  formLabel: {
    color: Colors.textTertiary, fontSize: Typography.xs,
    fontWeight: Typography.semiBold, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 4,
  },
  formInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: Typography.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  formInputMulti: { minHeight: 80, paddingTop: Spacing.sm },
});
