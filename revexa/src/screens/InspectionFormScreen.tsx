import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import {
  saveObjectInspection, ObjectInspection, InspResult,
  InspectionFormData, DEFAULT_FORM_DATA, generateReportNumber,
} from '../db/database';
import { uid, nowISO, todayISO } from '../utils';

interface Props { objectId: string; onBack: () => void; }
type Tab = 'prehled' | 'komin' | 'kourovod' | 'spotrebic' | 'dodatky' | 'zavady' | 'zaver';

const TABS: { key: Tab; label: string }[] = [
  { key: 'prehled',   label: 'Přehled' },
  { key: 'komin',     label: 'Komín' },
  { key: 'kourovod',  label: 'Kouřovod' },
  { key: 'spotrebic', label: 'Spotřebič' },
  { key: 'dodatky',   label: 'Dodatky' },
  { key: 'zavady',    label: 'Závady' },
  { key: 'zaver',     label: 'Závěr' },
];

// ══════════════════════════════════════════════════════════════════════════════
// Formulářové komponenty – MUSÍ být na úrovni modulu (jinak klávesnice mizí!)
// ══════════════════════════════════════════════════════════════════════════════

function FRow({ children }: { children: React.ReactNode }) {
  return <View style={f.row}>{children}</View>;
}

interface FInputProps {
  label: string; value: string; onChange: (v: string) => void;
  unit?: string; keyType?: any; multiline?: boolean;
  placeholder?: string; flex?: number;
}
function FInput({ label, value, onChange, unit, keyType = 'default', multiline, placeholder, flex = 1 }: FInputProps) {
  return (
    <View style={[f.field, { flex }]}>
      <Text style={f.label}>{label}</Text>
      <View style={f.inputWrap}>
        <TextInput
          style={[f.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
          value={value} onChangeText={onChange}
          keyboardType={keyType} multiline={multiline}
          placeholder={placeholder ?? ''} placeholderTextColor={C.textTertiary}
        />
        {unit ? <Text style={f.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

interface FPickProps { label: string; options: { key: string; label: string }[]; value: string; onChange: (v: string) => void; }
function FPick({ label, options, value, onChange }: FPickProps) {
  return (
    <View style={f.field}>
      <Text style={f.label}>{label}</Text>
      <View style={f.pickRow}>
        {options.map(o => (
          <TouchableOpacity key={o.key} style={[f.pickBtn, value === o.key && f.pickBtnActive]} onPress={() => onChange(o.key)}>
            <Text style={[f.pickText, value === o.key && f.pickTextActive]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

interface FToggleProps { label: string; value: boolean; onChange: (v: boolean) => void; }
function FToggle({ label, value, onChange }: FToggleProps) {
  return (
    <View style={f.field}>
      <Text style={f.label}>{label}</Text>
      <View style={f.pickRow}>
        {([true, false] as boolean[]).map(opt => (
          <TouchableOpacity key={String(opt)} style={[f.pickBtn, value === opt && f.pickBtnActive]} onPress={() => onChange(opt)}>
            <Text style={[f.pickText, value === opt && f.pickTextActive]}>{opt ? 'Ano' : 'Ne'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FSep({ title }: { title: string }) {
  return <Text style={f.sep}>{title}</Text>;
}

// ══════════════════════════════════════════════════════════════════════════════
// Sekce – také na úrovni modulu
// ══════════════════════════════════════════════════════════════════════════════

type Upd = (p: Partial<InspectionFormData>) => void;

function TabPrehled({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="TECHNIK" />
      <FInput label="Aktuální technik (kdo vyplňuje tuto zprávu)" value={d.currentTechnicianName} onChange={v => u({ currentTechnicianName: v })} placeholder="Jméno a příjmení" />
      <FSep title="IDENTIFIKACE ZPRÁVY" />
      <FRow>
        <FInput label="Číslo revizní zprávy" value={d.revisionReportNumber} onChange={v => u({ revisionReportNumber: v })} placeholder="Např. RZ-2026-001" />
        <FInput label="Číslo předchozí zprávy" value={d.prevReportNumber} onChange={v => u({ prevReportNumber: v })} placeholder="Pokud existuje" />
      </FRow>
    </ScrollView>
  );
}

function TabKomin({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FPick label="Typ komína" value={d.chimneyType}
        options={[{ key: 'systemovy', label: 'Systémový' }, { key: 'individualny', label: 'Individuální' }]}
        onChange={v => u({ chimneyType: v as any })} />

      {d.chimneyType === 'systemovy' && (
        <>
          <FSep title="SYSTÉMOVÝ KOMÍN" />
          <FRow>
            <FInput label="Název / výrobce" value={d.sysManufacturer} onChange={v => u({ sysManufacturer: v })} placeholder="např. Schiedel, Heluz…" />
            <FInput label="Typ / model" value={d.sysModel} onChange={v => u({ sysModel: v })} placeholder="např. Uni Plus" />
          </FRow>
        </>
      )}

      {d.chimneyType === 'individualny' && (
        <>
          <FSep title="MATERIÁL TĚLESA" />
          <FInput label="Z čeho je postaveno komínové těleso?" value={d.bodyMaterial} onChange={v => u({ bodyMaterial: v })} placeholder="např. pálené cihly, beton, šamot…" />
        </>
      )}

      {d.chimneyType !== '' && (
        <>
          <FSep title="IZOLACE A VLOŽKA" />
          <FToggle label="Je komín izolovaný?" value={d.isInsulated} onChange={v => u({ isInsulated: v })} />
          {d.isInsulated && <FInput label="Jak je izolovaný?" value={d.insulationType} onChange={v => u({ insulationType: v })} placeholder="např. minerální vata, pěnový beton…" />}
          <FToggle label="Je komín vložkovaný?" value={d.isLined} onChange={v => u({ isLined: v })} />
          {d.isLined && <FInput label="Čím je vložkovaný?" value={d.liningMaterial} onChange={v => u({ liningMaterial: v })} placeholder="např. silnostěný šamot, nerezová vložka…" />}

          <FSep title="ROZMĚRY" />
          <FRow>
            <FInput label="Celková délka" value={d.totalHeight} onChange={v => u({ totalHeight: v })} unit="m" keyType="decimal-pad" placeholder="např. 12" />
            <FInput label="Účinná výška" value={d.effectiveHeight} onChange={v => u({ effectiveHeight: v })} unit="m" keyType="decimal-pad" placeholder="např. 10" />
            <FInput label="Průměr průduchu" value={d.flueDiameter} onChange={v => u({ flueDiameter: v })} unit="mm" keyType="decimal-pad" placeholder="např. 150" />
          </FRow>

          <FSep title="T-KUS" />
          <FPick label="Typ T-Kusu" value={d.tPieceAngle}
            options={[{ key: '45', label: '45°' }, { key: '90', label: '90°' }]}
            onChange={v => u({ tPieceAngle: v as any })} />
          <FInput label="Materiál T-Kusu" value={d.tPieceMaterial} onChange={v => u({ tPieceMaterial: v })} placeholder="např. keramika, nerez, ocel…" />
        </>
      )}
    </ScrollView>
  );
}

function TabKourovod({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="MATERIÁL A ROZMĚRY" />
      <FRow>
        <FInput label="Materiál kouřovodu" value={d.kMaterial} onChange={v => u({ kMaterial: v })} placeholder="např. nerez, pozink, flex…" />
        <FInput label="Délka" value={d.kLength} onChange={v => u({ kLength: v })} unit="m" keyType="decimal-pad" placeholder="např. 3,5" />
        <FInput label="Průměr" value={d.kDiameter} onChange={v => u({ kDiameter: v })} unit="mm" keyType="decimal-pad" placeholder="např. 150" />
      </FRow>

      <FSep title="REDUKCE" />
      <FToggle label="Obsahuje redukci?" value={d.kHasReduction} onChange={v => u({ kHasReduction: v })} />
      {d.kHasReduction && (
        <FRow>
          <FInput label="Kde je redukce?" value={d.kReductionWhere} onChange={v => u({ kReductionWhere: v })} placeholder="např. za kotlem" />
          <FInput label="Z průměru" value={d.kReductionFrom} onChange={v => u({ kReductionFrom: v })} unit="mm" keyType="decimal-pad" />
          <FInput label="Na průměr" value={d.kReductionTo} onChange={v => u({ kReductionTo: v })} unit="mm" keyType="decimal-pad" />
        </FRow>
      )}

      <FSep title="KOLENA" />
      <FRow>
        <FInput label="Počet kolen" value={d.kElbowCount} onChange={v => u({ kElbowCount: v })} keyType="number-pad" placeholder="např. 2" />
        <FInput label="Typy kolen (úhly)" value={d.kElbowTypes} onChange={v => u({ kElbowTypes: v })} placeholder="např. 2× 45°, 1× 90°" flex={2} />
      </FRow>

      <FSep title="KONTROLNÍ OTVORY A IZOLACE" />
      <FToggle label="Má kouřovod kontrolní otvor(y) (KO)?" value={d.kHasKO} onChange={v => u({ kHasKO: v })} />
      {d.kHasKO && <FInput label="Kde jsou KO?" value={d.kKOWhere} onChange={v => u({ kKOWhere: v })} placeholder="např. za kotlem, před komínem…" />}
      <FToggle label="Je kouřovod izolovaný?" value={d.kInsulated} onChange={v => u({ kInsulated: v })} />
    </ScrollView>
  );
}

function TabSpotrebic({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="IDENTIFIKACE" />
      <FRow>
        <FInput label="Název / výrobce" value={d.appName} onChange={v => u({ appName: v })} placeholder="např. Dakon, Viadrus, Protherm…" />
        <FInput label="Typ / model" value={d.appType} onChange={v => u({ appType: v })} placeholder="např. DOR 25, Hercules…" />
      </FRow>

      <FSep title="PARAMETRY" />
      <FRow>
        <FInput label="Výkon" value={d.appPower} onChange={v => u({ appPower: v })} unit="kW" keyType="decimal-pad" placeholder="např. 24" />
        <FInput label="Průměr hrdla spotřebiče" value={d.appOutletDiameter} onChange={v => u({ appOutletDiameter: v })} unit="mm" keyType="decimal-pad" placeholder="např. 150" />
      </FRow>
      <FInput label="Info o hrdle (typ, materiál…)" value={d.appOutletInfo} onChange={v => u({ appOutletInfo: v })} placeholder="např. pevné hrdlo, flexibilní napojení…" />
      <FInput label="Kde je spotřebič umístěn?" value={d.appLocation} onChange={v => u({ appLocation: v })} placeholder="např. kotelna, 1. PP; technická místnost…" />
    </ScrollView>
  );
}

function TabDodatky({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="UMÍSTĚNÍ PRVKŮ" />
      <FRow>
        <FInput label="Umístění spotřebiče" value={d.appRoomLocation} onChange={v => u({ appRoomLocation: v })} placeholder="místnost, patro…" />
        <FInput label="Umístění kontrolních otvorů" value={d.koLocation} onChange={v => u({ koLocation: v })} placeholder="místnost, výška…" />
      </FRow>
      <FRow>
        <FInput label="Vybírací dvířka – kde?" value={d.cleaningDoorLocation} onChange={v => u({ cleaningDoorLocation: v })} placeholder="místnost, výška…" />
        <FInput label="Vymetací dvířka – kde?" value={d.sweepingDoorLocation} onChange={v => u({ sweepingDoorLocation: v })} placeholder="místnost, výška…" />
      </FRow>

      <FSep title="PŘÍSTUP A BEZPEČNOST" />
      <FPick label="Způsob přístupu k nejvyšší části komína"
        value={d.roofAccess}
        options={[{ key: 'vylaz', label: 'Výlez na střechu' }, { key: 'pruchod', label: 'Procházení po střeše' }]}
        onChange={v => u({ roofAccess: v as any })} />
      <FToggle label="Jsou na střeše nášlapy / lávka?" value={d.hasFoothold} onChange={v => u({ hasFoothold: v })} />
      <FToggle label="Prochází kouřovod jinou místností než je spotřebič?" value={d.fluePassesRoom} onChange={v => u({ fluePassesRoom: v })} />
      {d.fluePassesRoom && <FInput label="Přes jakou místnost?" value={d.fluePassesRoomName} onChange={v => u({ fluePassesRoomName: v })} placeholder="např. koupelna, ložnice…" />}

      <FSep title="PŘÍVOD VZDUCHU" />
      <View style={f.field}>
        <Text style={f.label}>Typ přívodu vzduchu (A / B / C)</Text>
        {[
          { key: 'A', label: 'A — otevřený spotřebič, přívod vzduchu z místnosti' },
          { key: 'B', label: 'B — uzavřený spotřebič, přívod vzduchu z místnosti' },
          { key: 'C', label: 'C — uzavřený spotřebič, přívod vzduchu z exteriéru' },
        ].map(o => (
          <TouchableOpacity key={o.key} style={[f.abcBtn, d.airSupplyType === o.key && f.abcBtnActive]} onPress={() => u({ airSupplyType: o.key as any })}>
            <View style={[f.abcDot, d.airSupplyType === o.key && { backgroundColor: C.primary }]} />
            <Text style={[f.abcText, d.airSupplyType === o.key && { color: C.primary, fontWeight: '700' }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FToggle label="Jsou okna a dveře místnosti se spotřebičem utěsněna?" value={d.sealedRoom} onChange={v => u({ sealedRoom: v })} />
    </ScrollView>
  );
}

function TabZavady({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="ZÁVADY NALEZENÉ NA MÍSTĚ" />
      <TextInput
        style={[f.input, { minHeight: 120, textAlignVertical: 'top' }]}
        value={d.defectsFound}
        onChangeText={v => u({ defectsFound: v })}
        multiline
        placeholder="Vypište zjištěné závady a nedostatky…"
        placeholderTextColor={C.textTertiary}
      />
      <FSep title="ZÁVADY ODSTRANĚNÉ NA MÍSTĚ" />
      <TextInput
        style={[f.input, { minHeight: 120, textAlignVertical: 'top' }]}
        value={d.defectsFixed}
        onChangeText={v => u({ defectsFixed: v })}
        multiline
        placeholder="Vypište závady, které byly odstraněny přímo při kontrole…"
        placeholderTextColor={C.textTertiary}
      />
    </ScrollView>
  );
}

const CONCLUSIONS = [
  { key: 'vyhovuje',               label: 'VYHOVUJE',                              color: C.success,  icon: 'checkmark-circle-outline' as const },
  { key: 'vyhovuje_po_odstraneni', label: 'VYHOVUJE PO ODSTRANĚNÍ ZÁVAD',          color: '#FF9F0A',   icon: 'warning-outline' as const },
  { key: 'nevyhovuje',             label: 'NEVYHOVUJE',                            color: C.error,    icon: 'close-circle-outline' as const },
];

function TabZaver({ d, u, onSave, saving }: { d: InspectionFormData; u: Upd; onSave: () => void; saving: boolean }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="CELKOVÉ ROZHODNUTÍ" />
      {CONCLUSIONS.map(c => (
        <TouchableOpacity
          key={c.key}
          style={[f.conclusionBtn, d.conclusion === c.key && { backgroundColor: c.color + '20', borderColor: c.color, borderWidth: 2 }]}
          onPress={() => u({ conclusion: c.key as any })}
        >
          <Ionicons name={c.icon} size={28} color={d.conclusion === c.key ? c.color : C.textTertiary} />
          <Text style={[f.conclusionText, { color: d.conclusion === c.key ? c.color : C.textSecondary }]}>{c.label}</Text>
          {d.conclusion === c.key && <Ionicons name="checkmark" size={20} color={c.color} />}
        </TouchableOpacity>
      ))}

      {d.conclusion && (
        <TouchableOpacity
          style={[f.saveBtn, { backgroundColor: CONCLUSIONS.find(c => c.key === d.conclusion)?.color ?? C.primary }]}
          onPress={onSave}
          disabled={saving}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={f.saveBtnText}>{saving ? 'Ukládám…' : 'Uložit zprávu z kontroly'}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Hlavní komponenta
// ══════════════════════════════════════════════════════════════════════════════

export default function InspectionFormScreen({ objectId, onBack }: Props) {
  const [reportNumber]         = useState(() => generateReportNumber());
  const [tab, setTab]          = useState<Tab>('prehled');
  const [form, setForm]        = useState<InspectionFormData>({ ...DEFAULT_FORM_DATA });
  const [saving, setSaving]    = useState(false);

  function upd(partial: Partial<InspectionFormData>) {
    setForm(p => ({ ...p, ...partial }));
  }

  function save() {
    if (!form.conclusion) {
      Alert.alert('Chybí výsledek', 'Přejděte na záložku Závěr a vyberte výsledek kontroly.');
      setTab('zaver');
      return;
    }
    setSaving(true);
    try {
      const ins: ObjectInspection = {
        id: uid(), objectId, reportNumber,
        inspectionDate: todayISO(),
        result: form.conclusion as InspResult,
        notes: [form.defectsFound, form.defectsFixed].filter(Boolean).join('\n'),
        createdAt: nowISO(),
        formData: form,
      };
      saveObjectInspection(ins);
      Alert.alert('✓ Zpráva uložena', `Číslo: ${reportNumber}`, [{ text: 'OK', onPress: onBack }]);
    } catch (e: any) {
      Alert.alert('Chyba', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const tabIdx = TABS.findIndex(t => t.key === tab);
  const hasPrev = tabIdx > 0;
  const hasNext = tabIdx < TABS.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>

      {/* ── Hlavička ── */}
      <View style={f.header}>
        <TouchableOpacity onPress={onBack} style={f.backBtn}>
          <Ionicons name="arrow-back-outline" size={20} color={C.textSecondary} />
          <Text style={f.backText}>Zpět</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: S.md }}>
          <Text style={f.title}>Nová zpráva z kontroly</Text>
          <Text style={f.reportNum}>{reportNumber}</Text>
        </View>
        <TouchableOpacity style={f.quickSaveBtn} onPress={save} disabled={saving}>
          <Ionicons name="save-outline" size={16} color={form.conclusion ? '#fff' : C.textTertiary} />
          <Text style={[f.quickSaveTxt, form.conclusion && { color: '#fff' }]}>Uložit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Záložkové menu ── */}
      <View style={f.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.sm }}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={t.key} style={[f.tab, tab === t.key && f.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[f.tabText, tab === t.key && f.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Obsah záložky ── */}
      <View style={{ flex: 1 }}>
        {tab === 'prehled'   && <TabPrehled   d={form} u={upd} />}
        {tab === 'komin'     && <TabKomin     d={form} u={upd} />}
        {tab === 'kourovod'  && <TabKourovod  d={form} u={upd} />}
        {tab === 'spotrebic' && <TabSpotrebic d={form} u={upd} />}
        {tab === 'dodatky'   && <TabDodatky   d={form} u={upd} />}
        {tab === 'zavady'    && <TabZavady    d={form} u={upd} />}
        {tab === 'zaver'     && <TabZaver     d={form} u={upd} onSave={save} saving={saving} />}
      </View>

      {/* ── Navigace Zpět / Další ── */}
      <View style={f.footer}>
        <TouchableOpacity style={[f.navBtn, !hasPrev && f.navBtnDisabled]} onPress={() => hasPrev ? setTab(TABS[tabIdx - 1].key) : onBack()}>
          <Ionicons name="arrow-back" size={16} color={C.textSecondary} />
          <Text style={f.navBtnText}>{tabIdx === 0 ? 'Zrušit' : 'Zpět'}</Text>
        </TouchableOpacity>
        <View style={f.tabDots}>
          {TABS.map((t, i) => (
            <View key={t.key} style={[f.dot, i === tabIdx && f.dotActive]} />
          ))}
        </View>
        {hasNext
          ? <TouchableOpacity style={[f.navBtn, f.navBtnNext]} onPress={() => setTab(TABS[tabIdx + 1].key)}>
              <Text style={[f.navBtnText, { color: C.primary }]}>Další</Text>
              <Ionicons name="arrow-forward" size={16} color={C.primary} />
            </TouchableOpacity>
          : <View style={f.navBtn} />
        }
      </View>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Styly
// ══════════════════════════════════════════════════════════════════════════════
const f = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: C.textSecondary, fontSize: F.sm },
  title: { color: C.textPrimary, fontSize: F.md, fontWeight: 'bold' },
  reportNum: { color: C.primary, fontSize: F.sm, fontWeight: '600', letterSpacing: 1 },
  quickSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.surfaceEl, borderRadius: R.md, paddingHorizontal: S.sm, paddingVertical: S.xs, borderWidth: 1, borderColor: C.border },
  quickSaveTxt: { color: C.textTertiary, fontSize: F.xs, fontWeight: '600' },
  tabBar: { borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  tab: { paddingHorizontal: S.md, paddingVertical: S.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: C.primary },
  tabText: { color: C.textSecondary, fontSize: F.sm },
  tabTextActive: { color: C.primary, fontWeight: 'bold' },
  tabContent: { padding: S.base, gap: S.sm },
  row: { flexDirection: 'row', gap: S.md },
  field: { flex: 1, marginBottom: S.xs },
  label: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  input: { flex: 1, backgroundColor: C.surface, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.sm, borderWidth: 1, borderColor: C.border },
  unit: { color: C.textSecondary, fontSize: F.sm, width: 32, textAlign: 'right' },
  pickRow: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  pickBtn: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceEl },
  pickBtnActive: { backgroundColor: C.primary + '20', borderColor: C.primary },
  pickText: { color: C.textSecondary, fontSize: F.sm },
  pickTextActive: { color: C.primary, fontWeight: '700' },
  sep: { color: C.primary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.primary + '30', marginTop: S.md, marginBottom: S.xs },
  abcBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  abcBtnActive: { backgroundColor: C.primary + '15', borderColor: C.primary },
  abcDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  abcText: { color: C.textSecondary, fontSize: F.sm, flex: 1 },
  conclusionBtn: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, marginBottom: S.sm, backgroundColor: C.surface },
  conclusionText: { fontSize: F.md, fontWeight: '600', flex: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, borderRadius: R.lg, paddingVertical: S.md + 4, marginTop: S.lg },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.lg },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.sm, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: S.md, paddingVertical: S.sm },
  navBtnNext: {},
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: C.textSecondary, fontSize: F.sm },
  tabDots: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 8, height: 8 },
  sectionNote: { color: C.textTertiary, fontSize: F.sm, textAlign: 'center', paddingVertical: S.lg, fontStyle: 'italic' },
});
