import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../utils/theme';
import { getAllCustomers, getAddressesByCustomer, saveOrder, getNextOrderNumber, saveAddress } from '../../database/database';
import { Customer, Address, Order, OrderType } from '../../types';
import { generateId, nowISO, todayISO } from '../../utils/helpers';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

type Step = 'klient' | 'termin' | 'potvrdit';

export default function NewOrderModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('klient');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // Termín
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('09:00');
  const [orderType, setOrderType] = useState<OrderType>('kontrola');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllCustomers().then(c => {
      setCustomers(c);
      setFilteredCustomers(c);
    });
  }, []);

  useEffect(() => {
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      setFilteredCustomers(customers.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      ));
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchText, customers]);

  async function handleSelectCustomer(c: Customer) {
    setSelectedCustomer(c);
    const addrs = await getAddressesByCustomer(c.id);
    setAddresses(addrs);
    if (addrs.length === 1) setSelectedAddress(addrs[0]);
  }

  async function handleSave() {
    if (!selectedCustomer || !selectedAddress) {
      Alert.alert('Chyba', 'Vyberte zákazníka a adresu.');
      return;
    }
    setSaving(true);
    try {
      const orderNumber = await getNextOrderNumber();
      const order: Order = {
        id: generateId(),
        orderNumber,
        customerId: selectedCustomer.id,
        addressId: selectedAddress.id,
        orderType,
        status: 'planovana',
        scheduledDate: date,
        scheduledTime: time,
        note: note.trim() || undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await saveOrder(order);
      onSaved();
    } catch (e) {
      Alert.alert('Chyba', 'Nepodařilo se uložit zakázku.');
    } finally {
      setSaving(false);
    }
  }

  const ORDER_TYPES: { key: OrderType; label: string }[] = [
    { key: 'kontrola', label: 'Kontrola' },
    { key: 'cisteni', label: 'Čištění' },
    { key: 'revize', label: 'Revize' },
    { key: 'mereni_co', label: 'Měření CO' },
    { key: 'jiny', label: 'Jiný' },
  ];

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nová zakázka</Text>
            <View style={styles.stepIndicator}>
              {(['klient', 'termin', 'potvrdit'] as Step[]).map((s, i) => (
                <View key={s} style={styles.stepRow}>
                  <View style={[
                    styles.stepCircle,
                    step === s && styles.stepCircleActive,
                    ((step === 'termin' && i === 0) || (step === 'potvrdit' && i <= 1)) && styles.stepCircleDone,
                  ]}>
                    <Text style={[
                      styles.stepCircleText,
                      (step === s || (step === 'termin' && i === 0) || (step === 'potvrdit' && i <= 1)) && styles.stepCircleTextActive,
                    ]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
                    {s === 'klient' ? 'Klient' : s === 'termin' ? 'Termín' : 'Potvrdit'}
                  </Text>
                  {i < 2 && <Text style={styles.stepSep}>—</Text>}
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* KROK 1 - Výběr klienta */}
          {step === 'klient' && (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <Text style={styles.stepTitle}>Vyberte zákazníka</Text>

              {/* Hledání */}
              <View style={styles.searchBox}>
                <Text>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Hledat zákazníka..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Seznam zákazníků */}
              {filteredCustomers.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.customerItem, selectedCustomer?.id === c.id && styles.customerItemSelected]}
                  onPress={() => handleSelectCustomer(c)}
                >
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>{c.firstName[0]}{c.lastName[0]}</Text>
                  </View>
                  <View style={styles.customerItemInfo}>
                    <Text style={styles.customerItemName}>{c.firstName} {c.lastName}</Text>
                    <Text style={styles.customerItemAddr}>{c.street}, {c.city}</Text>
                    <Text style={styles.customerItemPhone}>{c.phone}</Text>
                  </View>
                  {selectedCustomer?.id === c.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}

              {/* Výběr adresy pokud je jich více */}
              {selectedCustomer && addresses.length > 1 && (
                <View style={styles.addressSection}>
                  <Text style={styles.sectionLabel}>VYBERTE ADRESU</Text>
                  {addresses.map(a => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.addrItem, selectedAddress?.id === a.id && styles.addrItemSelected]}
                      onPress={() => setSelectedAddress(a)}
                    >
                      <Text style={styles.addrItemText}>{a.street}, {a.city}</Text>
                      {a.applianceType && <Text style={styles.addrItemSub}>{a.applianceType}</Text>}
                      {selectedAddress?.id === a.id && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* KROK 2 - Termín */}
          {step === 'termin' && (
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              <Text style={styles.stepTitle}>Nastavte termín a typ zakázky</Text>

              {/* Vybraný zákazník - shrnutí */}
              {selectedCustomer && (
                <View style={styles.selectedSummary}>
                  <Text style={styles.summaryLabel}>Zákazník:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                    {selectedAddress ? ` — ${selectedAddress.street}, ${selectedAddress.city}` : ''}
                  </Text>
                </View>
              )}

              {/* Datum */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Datum zakázky</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Čas */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Čas</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="09:00"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>

              {/* Typ zakázky */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Typ zakázky</Text>
                <View style={styles.typeGrid}>
                  {ORDER_TYPES.map(t => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.typeBtn, orderType === t.key && styles.typeBtnActive]}
                      onPress={() => setOrderType(t.key)}
                    >
                      <Text style={[styles.typeBtnText, orderType === t.key && styles.typeBtnTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Poznámka */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Poznámka (volitelná)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Dodatečné informace k zakázce..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
          )}

          {/* KROK 3 - Potvrzení */}
          {step === 'potvrdit' && selectedCustomer && selectedAddress && (
            <View style={styles.body}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Shrnutí zakázky</Text>
                <SummaryRow label="Zákazník" value={`${selectedCustomer.firstName} ${selectedCustomer.lastName}`} />
                <SummaryRow label="Adresa" value={`${selectedAddress.street}, ${selectedAddress.city}`} />
                <SummaryRow label="Datum" value={date} />
                <SummaryRow label="Čas" value={time} />
                <SummaryRow label="Typ" value={ORDER_TYPES.find(t => t.key === orderType)?.label || ''} />
                {note ? <SummaryRow label="Poznámka" value={note} /> : null}
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnBack}
              onPress={() => {
                if (step === 'klient') onClose();
                else if (step === 'termin') setStep('klient');
                else setStep('termin');
              }}
            >
              <Text style={styles.btnBackText}>
                {step === 'klient' ? 'Zrušit' : '← Zpět'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnNext, (!selectedCustomer || !selectedAddress) && step === 'klient' && styles.btnDisabled]}
              onPress={() => {
                if (step === 'klient') {
                  if (!selectedCustomer || !selectedAddress) {
                    Alert.alert('Vyberte zákazníka a adresu');
                    return;
                  }
                  setStep('termin');
                } else if (step === 'termin') {
                  setStep('potvrdit');
                } else {
                  handleSave();
                }
              }}
              disabled={saving}
            >
              <Text style={styles.btnNextText}>
                {step === 'potvrdit'
                  ? (saving ? 'Ukládám...' : 'Vytvořit zakázku')
                  : 'Další →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
  },
  modal: {
    width: '75%', height: '85%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
    gap: Spacing.base,
    backgroundColor: Colors.surfaceElevated,
  },
  title: {
    color: Colors.textPrimary, fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  stepIndicator: {
    flex: 1, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 4,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepCircleDone: { backgroundColor: Colors.success },
  stepCircleText: { color: Colors.textTertiary, fontSize: Typography.xs, fontWeight: Typography.bold },
  stepCircleTextActive: { color: Colors.textPrimary },
  stepLabel: { color: Colors.textTertiary, fontSize: Typography.xs },
  stepLabelActive: { color: Colors.primary, fontWeight: Typography.semiBold },
  stepSep: { color: Colors.textTertiary, fontSize: Typography.xs },
  closeBtn: { padding: 8 },
  closeBtnText: { color: Colors.textSecondary, fontSize: 18 },

  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, gap: Spacing.md },
  stepTitle: {
    color: Colors.textPrimary, fontSize: Typography.lg,
    fontWeight: Typography.bold, marginBottom: Spacing.sm,
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    marginBottom: Spacing.sm, gap: 8,
  },
  searchInput: {
    flex: 1, color: Colors.textPrimary, fontSize: Typography.base,
    paddingVertical: Spacing.sm,
  },

  customerItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    marginBottom: 6,
  },
  customerItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary + '25',
    alignItems: 'center', justifyContent: 'center',
  },
  customerAvatarText: { color: Colors.primary, fontWeight: Typography.bold, fontSize: Typography.sm },
  customerItemInfo: { flex: 1 },
  customerItemName: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  customerItemAddr: { color: Colors.textSecondary, fontSize: Typography.xs },
  customerItemPhone: { color: Colors.textTertiary, fontSize: Typography.xs },
  checkmark: { color: Colors.success, fontSize: 18, fontWeight: Typography.bold },

  addressSection: { marginTop: Spacing.sm },
  sectionLabel: {
    color: Colors.textTertiary, fontSize: Typography.xs,
    fontWeight: Typography.semiBold, letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  addrItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder, marginBottom: 6,
  },
  addrItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  addrItemText: { color: Colors.textPrimary, fontSize: Typography.base, flex: 1 },
  addrItemSub: { color: Colors.textSecondary, fontSize: Typography.xs },

  selectedSummary: {
    flexDirection: 'row', gap: 8,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
    marginBottom: Spacing.sm,
  },
  summaryLabel: { color: Colors.primary, fontWeight: Typography.semiBold, fontSize: Typography.sm },
  summaryValue: { color: Colors.textPrimary, fontSize: Typography.sm, flex: 1 },

  inputSection: { gap: 4 },
  inputLabel: {
    color: Colors.textTertiary, fontSize: Typography.xs,
    fontWeight: Typography.semiBold, letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md, color: Colors.textPrimary,
    fontSize: Typography.base, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
  },
  textArea: { minHeight: 70, paddingTop: Spacing.sm },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '20' },
  typeBtnText: { color: Colors.textSecondary, fontWeight: Typography.medium },
  typeBtnTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },

  confirmCard: {
    margin: Spacing.xl,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  confirmTitle: {
    color: Colors.textPrimary, fontSize: Typography.xl,
    fontWeight: Typography.bold, marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  summaryRowLabel: { color: Colors.textSecondary, fontSize: Typography.base },
  summaryRowValue: { color: Colors.textPrimary, fontWeight: Typography.medium, fontSize: Typography.base },

  footer: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.base,
    borderTopWidth: 1, borderTopColor: Colors.surfaceBorder,
    backgroundColor: Colors.surfaceElevated,
  },
  btnBack: {
    flex: 1, borderWidth: 1, borderColor: Colors.surfaceBorder,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnBackText: { color: Colors.textSecondary, fontWeight: Typography.semiBold },
  btnNext: {
    flex: 2, backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md, paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnNextText: { color: Colors.textPrimary, fontWeight: Typography.bold, fontSize: Typography.md },
});
