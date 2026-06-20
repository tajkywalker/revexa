import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, PanResponder, StyleSheet,
} from 'react-native';
import { C, F, S, R } from '../theme';
import {
  getOrder, saveOrder, Order,
  getCustomer, Customer,
  getChimneys, Chimney,
  getInspection, saveInspection, Inspection,
  CheckItem, DEFAULT_CHECK_ITEMS,
} from '../db/database';
import { formatDate, STATUS_LABELS, STATUS_COLORS, formatCurrency, nowISO, todayISO, uid } from '../utils';

// ─── Typy ────────────────────────────────────────────────────────────────────
interface Props {
  orderId: string;
  onBack: () => void;
  onSelectCustomer: (customerId: string) => void;
}

type CenterTab = 'kontrola' | 'poznamky' | 'fotky';

const CHECK_RESULTS: { key: CheckItem['result']; label: string; color: string }[] = [
  { key: 'vyhovuje',       label: '✓', color: C.success },
  { key: 'nevyhovuje',     label: '✗', color: C.error },
  { key: 'nelze_posoudit', label: '?', color: C.warning },
  { key: 'neuvedeno',      label: '○', color: C.textTertiary },
];

const OVERALL_RESULTS: { key: Inspection['overallResult']; label: string; color: string }[] = [
  { key: 'vyhovuje',    label: 'VYHOVUJE',    color: C.success },
  { key: 'podminecne',  label: 'PODMÍNEČNĚ',  color: C.warning },
  { key: 'nevyhovuje',  label: 'NEVYHOVUJE',  color: C.error },
];

const STATUSES: Order['status'][] = ['nova', 'probihajici', 'dokoncena', 'zrusena'];

// ─── Komponenta ───────────────────────────────────────────────────────────────
export default function OrderDetailScreen({ orderId, onBack, onSelectCustomer }: Props) {
  const [order, setOrder]         = useState<Order | null>(null);
  const [customer, setCustomer]   = useState<Customer | null>(null);
  const [chimneys, setChimneys]   = useState<Chimney[]>([]);
  const [tab, setTab]             = useState<CenterTab>('kontrola');

  // Inspekce – stav formuláře
  const [checkItems, setCheckItems]       = useState<CheckItem[]>(DEFAULT_CHECK_ITEMS.map(ci => ({ ...ci })));
  const [overallResult, setOverallResult] = useState<Inspection['overallResult']>('vyhovuje');
  const [coValue, setCoValue]             = useState('');
  const [notes, setNotes]                 = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [existingInspId, setExistingInspId]   = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);

  // Podpis
  const [sigPaths, setSigPaths]       = useState<{ x: number; y: number }[][]>([]);
  const [sigCurrent, setSigCurrent]   = useState<{ x: number; y: number }[]>([]);
  const [sigSaved, setSigSaved]       = useState(false);

  // Načtení dat
  const load = useCallback(() => {
    const o = getOrder(orderId);
    setOrder(o);
    if (!o) return;
    const c = getCustomer(o.customerId);
    setCustomer(c);
    if (c) setChimneys(getChimneys(c.id));
    const ins = getInspection(orderId);
    if (ins) {
      setExistingInspId(ins.id);
      setCheckItems(ins.checkItems);
      setOverallResult(ins.overallResult);
      setCoValue(ins.coMeasurement != null ? String(ins.coMeasurement) : '');
      setNotes(ins.notes ?? '');
      setRecommendations(ins.recommendations ?? '');
      if (ins.signatureBase64) setSigSaved(true);
    }
  }, [orderId]);

  // Spustit load při prvním renderu (bez useFocusEffect, jsme mimo react-navigation)
  React.useEffect(() => { load(); }, [load]);

  // ── PanResponder pro podpis ──
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setSigCurrent([{ x: locationX, y: locationY }]);
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setSigCurrent(p => [...p, { x: locationX, y: locationY }]);
    },
    onPanResponderRelease: () => {
      if (sigCurrent.length > 1) setSigPaths(p => [...p, sigCurrent]);
      setSigCurrent([]);
    },
  });

  function clearSignature() { setSigPaths([]); setSigCurrent([]); setSigSaved(false); }

  function updateCheckItem(id: string, result: CheckItem['result']) {
    setCheckItems(prev => prev.map(ci => ci.id === id ? { ...ci, result } : ci));
  }

  function changeStatus(status: Order['status']) {
    if (!order) return;
    const updated = { ...order, status, updatedAt: nowISO(), completedAt: status === 'dokoncena' ? nowISO() : order.completedAt };
    saveOrder(updated);
    setOrder(updated);
  }

  async function saveReport() {
    if (!order) return;
    setSaving(true);
    try {
      const inspection: Inspection = {
        id: existingInspId ?? uid(),
        orderId: order.id,
        chimneyId: order.chimneyId ?? '',
        reportNumber: `ZP-${order.orderNumber.replace('#', '')}`,
        inspectionDate: todayISO(),
        checkItems,
        overallResult,
        coMeasurement: coValue ? parseFloat(coValue) : undefined,
        notes,
        recommendations,
        signatureBase64: (sigPaths.length > 0 || sigSaved) ? 'signed' : undefined,
        createdAt: nowISO(),
      };
      saveInspection(inspection);
      setExistingInspId(inspection.id);
      if (order.status === 'nova') {
        const updated = { ...order, status: 'probihajici' as Order['status'], updatedAt: nowISO() };
        saveOrder(updated);
        setOrder(updated);
      }
      Alert.alert('✓ Uloženo', 'Zpráva z kontroly byla uložena.');
    } finally {
      setSaving(false);
    }
  }

  function completeOrder() {
    if (!order) return;
    Alert.alert('Dokončit zakázku?', 'Zakázka bude označena jako Dokončená.', [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Dokončit', onPress: () => changeStatus('dokoncena') },
    ]);
  }

  if (!order) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  const resultColor = OVERALL_RESULTS.find(r => r.key === overallResult)?.color ?? C.success;
  const resultLabel = OVERALL_RESULTS.find(r => r.key === overallResult)?.label ?? '—';
  const hasSignature = sigPaths.length > 0 || sigSaved;

  return (
    <View style={s.root}>

      {/* ═══════════════════════ LEVÝ SLOUPEC ═══════════════════════ */}
      <View style={s.leftCol}>
        {/* Zpět + hlavička */}
        <View style={s.leftHeader}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Text style={s.backText}>← Zakázky</Text>
          </TouchableOpacity>
          <Text style={s.orderNum}>{order.orderNumber}</Text>
          <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '30' }]}>
            <Text style={[s.statusText, { color: STATUS_COLORS[order.status] }]}>
              {STATUS_LABELS[order.status]}
            </Text>
          </View>
          <Text style={s.orderDate}>📅 {formatDate(order.scheduledDate)}</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: S.md, gap: S.md }}>
          {/* Zákazník */}
          {customer && (
            <View style={s.infoCard}>
              <Text style={s.cardLabel}>ZÁKAZNÍK</Text>
              <Text style={s.infoName}>{customer.firstName} {customer.lastName}</Text>
              {customer.street ? <Text style={s.infoLine}>{customer.street}</Text> : null}
              {(customer.zip || customer.city) ? (
                <Text style={s.infoLine}>{customer.zip} {customer.city}</Text>
              ) : null}
              <View style={{ height: 6 }} />
              {customer.phone ? <Text style={s.infoLine}>📞 {customer.phone}</Text> : null}
              {customer.email ? <Text style={s.infoLine}>✉️  {customer.email}</Text> : null}
              <TouchableOpacity style={s.linkBtn} onPress={() => onSelectCustomer(customer.id)}>
                <Text style={s.linkText}>Zobrazit zákazníka →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Spalinová cesta */}
          {chimneys.length > 0 && (
            <View style={s.infoCard}>
              <Text style={s.cardLabel}>SPALINOVÁ CESTA</Text>
              {chimneys.map(ch => (
                <View key={ch.id} style={{ marginBottom: S.xs }}>
                  <Text style={s.infoName}>{ch.label}</Text>
                  {ch.type ? <Text style={s.infoMuted}>Typ: {ch.type}</Text> : null}
                  {ch.fuel ? <Text style={s.infoMuted}>Palivo: {ch.fuel}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {/* Adresa zakázky */}
          {order.address ? (
            <View style={s.infoCard}>
              <Text style={s.cardLabel}>ADRESA ZAKÁZKY</Text>
              <Text style={s.infoLine}>📍 {order.address}</Text>
              {order.price > 0 ? <Text style={s.infoLine}>💰 {formatCurrency(order.price)}</Text> : null}
            </View>
          ) : null}

          {/* Stav zakázky */}
          <View style={s.infoCard}>
            <Text style={s.cardLabel}>STAV ZAKÁZKY</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: S.xs }}>
              {STATUSES.map(st => (
                <TouchableOpacity
                  key={st}
                  style={[s.statusBtn, order.status === st && { backgroundColor: STATUS_COLORS[st] + '25', borderColor: STATUS_COLORS[st] }]}
                  onPress={() => changeStatus(st)}
                >
                  <Text style={[s.statusBtnText, order.status === st && { color: STATUS_COLORS[st], fontWeight: 'bold' }]}>
                    {STATUS_LABELS[st]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ═══════════════════════ STŘEDNÍ SLOUPEC ═══════════════════════ */}
      <View style={s.centerCol}>
        {/* Záložky */}
        <View style={s.tabBar}>
          {([
            ['kontrola', 'Kontrola'],
            ['poznamky', 'Poznámky'],
            ['fotky',    'Fotky'],
          ] as [CenterTab, string][]).map(([key, label]) => (
            <TouchableOpacity key={key} style={[s.tabBtn, tab === key && s.tabBtnActive]} onPress={() => setTab(key)}>
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Záložka: Kontrola ── */}
        {tab === 'kontrola' && (
          <ScrollView contentContainerStyle={{ padding: S.base, gap: S.sm }}>
            <Text style={s.sectionLabel}>KONTROLNÍ BODY</Text>
            {checkItems.map(item => (
              <View key={item.id} style={s.checkRow}>
                <Text style={s.checkLabel}>{item.label}</Text>
                <View style={s.checkBtns}>
                  {CHECK_RESULTS.map(r => (
                    <TouchableOpacity
                      key={r.key}
                      style={[s.checkBtn, item.result === r.key && { backgroundColor: r.color + '30', borderColor: r.color }]}
                      onPress={() => updateCheckItem(item.id, r.key)}
                    >
                      <Text style={[s.checkBtnText, { color: item.result === r.key ? r.color : C.textTertiary }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <View style={s.divider} />

            {/* Měření CO */}
            <Text style={s.sectionLabel}>MĚŘENÍ CO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
              <TextInput
                style={[s.input, { width: 100 }]}
                value={coValue}
                onChangeText={setCoValue}
                keyboardType="numeric"
                placeholder="ppm"
                placeholderTextColor={C.textTertiary}
              />
              <Text style={{ color: C.textSecondary, fontSize: F.sm }}>ppm CO ve spalinách</Text>
            </View>

            <View style={s.divider} />

            {/* Celkový výsledek */}
            <Text style={s.sectionLabel}>CELKOVÝ VÝSLEDEK</Text>
            <View style={{ flexDirection: 'row', gap: S.sm }}>
              {OVERALL_RESULTS.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.overallBtn, overallResult === r.key && { backgroundColor: r.color + '25', borderColor: r.color, borderWidth: 2 }]}
                  onPress={() => setOverallResult(r.key)}
                >
                  <Text style={[s.overallText, { color: overallResult === r.key ? r.color : C.textSecondary }]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* ── Záložka: Poznámky ── */}
        {tab === 'poznamky' && (
          <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>
            <Text style={s.sectionLabel}>POZNÁMKY Z KONTROLY</Text>
            <TextInput
              style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Popis stavu komína, zjištěné závady..."
              placeholderTextColor={C.textTertiary}
            />
            <Text style={s.sectionLabel}>DOPORUČENÍ</Text>
            <TextInput
              style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
              value={recommendations}
              onChangeText={setRecommendations}
              multiline
              placeholder="Doporučení zákazníkovi, příští kontrola..."
              placeholderTextColor={C.textTertiary}
            />
          </ScrollView>
        )}

        {/* ── Záložka: Fotky (placeholder) ── */}
        {tab === 'fotky' && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 48 }}>📷</Text>
            <Text style={{ color: C.textTertiary, fontSize: F.md, marginTop: S.sm }}>Fotky přidáme v další verzi</Text>
          </View>
        )}
      </View>

      {/* ═══════════════════════ PRAVÝ SLOUPEC ═══════════════════════ */}
      <View style={s.rightCol}>
        <ScrollView contentContainerStyle={{ padding: S.md, gap: S.md }}>

          {/* Výsledek kontroly */}
          <View style={[s.resultCard, { borderColor: resultColor + '60', backgroundColor: resultColor + '15' }]}>
            <Text style={s.cardLabel}>VÝSLEDEK KONTROLY</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.xs }}>
              <View style={[s.resultIcon, { backgroundColor: resultColor + '30' }]}>
                <Text style={{ color: resultColor, fontSize: 20, fontWeight: 'bold' }}>
                  {overallResult === 'vyhovuje' ? '✓' : overallResult === 'nevyhovuje' ? '✗' : '!'}
                </Text>
              </View>
              <View>
                <Text style={[s.resultLabel, { color: resultColor }]}>{resultLabel}</Text>
                <Text style={s.resultSub}>
                  {overallResult === 'vyhovuje' ? 'Způsobilá k provozu' :
                   overallResult === 'nevyhovuje' ? 'Nezpůsobilá k provozu' :
                   'Podmínečně způsobilá'}
                </Text>
              </View>
            </View>
          </View>

          {/* Podpis zákazníka */}
          <View style={s.infoCard}>
            <Text style={s.cardLabel}>PODPIS ZÁKAZNÍKA</Text>
            {sigSaved && sigPaths.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: S.lg }}>
                <Text style={{ color: C.success, fontSize: F.lg, fontWeight: 'bold' }}>✓ Podpis uložen</Text>
                <TouchableOpacity style={s.clearBtn} onPress={clearSignature}>
                  <Text style={s.clearBtnText}>Podepsat znovu</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View
                  style={s.sigCanvas}
                  {...panResponder.panHandlers}
                >
                  {[...sigPaths, sigCurrent].map((path, pi) =>
                    path.slice(1).map((pt, i) => {
                      const prev = path[i];
                      const dx = pt.x - prev.x;
                      const dy = pt.y - prev.y;
                      const len = Math.sqrt(dx * dx + dy * dy);
                      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                      return (
                        <View
                          key={`${pi}-${i}`}
                          style={{
                            position: 'absolute', left: prev.x, top: prev.y - 1.5,
                            width: len, height: 3, backgroundColor: '#fff',
                            borderRadius: 2,
                            transform: [{ rotate: `${angle}deg` }],
                          }}
                        />
                      );
                    })
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
                  <TouchableOpacity style={s.clearBtn} onPress={clearSignature}>
                    <Text style={s.clearBtnText}>VYMAZAT</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Akce */}
          <View style={s.infoCard}>
            <Text style={s.cardLabel}>AKCE</Text>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.primary }]}
              onPress={saveReport}
              disabled={saving}
            >
              <Text style={s.actionBtnText}>{saving ? 'Ukládám...' : '✓  ULOŽIT ZPRÁVU'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: C.surfaceEl, marginTop: S.sm }]}
              onPress={completeOrder}
            >
              <Text style={[s.actionBtnText, { color: C.success }]}>◎  ULOŽIT A UZAVŘÍT</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

    </View>
  );
}

// ─── Styly ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },

  // Levý sloupec
  leftCol: { width: 250, borderRightWidth: 1, borderRightColor: C.border, flexDirection: 'column' },
  leftHeader: { padding: S.md, borderBottomWidth: 1, borderBottomColor: C.border, gap: 4 },
  backBtn: { marginBottom: 4 },
  backText: { color: C.textSecondary, fontSize: F.xs },
  orderNum: { color: C.primary, fontSize: F.xl, fontWeight: 'bold' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.xl },
  statusText: { fontSize: F.xs, fontWeight: 'bold' },
  orderDate: { color: C.textSecondary, fontSize: F.xs },
  infoCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.sm, borderWidth: 1, borderColor: C.border },
  cardLabel: { color: C.textTertiary, fontSize: F.xs - 1, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.xs },
  infoName: { color: C.textPrimary, fontSize: F.sm, fontWeight: '600' },
  infoLine: { color: C.textSecondary, fontSize: F.xs, marginTop: 2 },
  infoMuted: { color: C.textTertiary, fontSize: F.xs },
  linkBtn: { marginTop: S.sm },
  linkText: { color: C.primary, fontSize: F.xs },
  statusBtn: { paddingHorizontal: S.sm, paddingVertical: 4, borderRadius: R.sm, borderWidth: 1, borderColor: C.border },
  statusBtnText: { color: C.textSecondary, fontSize: F.xs },

  // Střední sloupec
  centerCol: { flex: 1, borderRightWidth: 1, borderRightColor: C.border },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  tabBtn: { paddingHorizontal: S.base, paddingVertical: S.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: C.primary },
  tabText: { color: C.textSecondary, fontSize: F.sm },
  tabTextActive: { color: C.primary, fontWeight: 'bold' },
  sectionLabel: { color: C.textTertiary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginTop: S.xs },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.xs, borderBottomWidth: 1, borderBottomColor: C.border + '80', gap: S.sm },
  checkLabel: { flex: 1, color: C.textPrimary, fontSize: F.sm },
  checkBtns: { flexDirection: 'row', gap: 4 },
  checkBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceEl },
  checkBtnText: { fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.sm },
  overallBtn: { flex: 1, paddingVertical: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', backgroundColor: C.surfaceEl },
  overallText: { fontSize: F.xs, fontWeight: 'bold' },
  input: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.sm, borderWidth: 1, borderColor: C.border },

  // Pravý sloupec
  rightCol: { width: 260 },
  resultCard: { borderRadius: R.lg, padding: S.md, borderWidth: 1 },
  resultIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { fontSize: F.lg, fontWeight: 'bold' },
  resultSub: { color: C.textSecondary, fontSize: F.xs, marginTop: 2 },
  sigCanvas: { height: 160, backgroundColor: C.surfaceEl, borderRadius: R.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  clearBtn: { paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  clearBtnText: { color: C.textSecondary, fontSize: F.xs },
  actionBtn: { borderRadius: R.md, paddingVertical: S.md, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
});
