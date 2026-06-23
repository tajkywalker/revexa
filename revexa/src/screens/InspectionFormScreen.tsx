import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, PanResponder, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import {
  saveObjectInspection, ObjectInspection, InspResult,
  InspectionFormData, DEFAULT_FORM_DATA, generateReportNumber,
  getObjectInspections, getObjectChimneys, ObjectChimney,
  getSetting, addLog, getObject, YesNo, InspDefect,
} from '../db/database';
import { uid, nowISO, todayISO } from '../utils';

interface Props { objectId: string; onBack: () => void; }
type Tab = 'prehled' | 'komin' | 'kourovod' | 'spotrebic' | 'dodatky' | 'prace' | 'zavady' | 'zaver';

const TABS: { key: Tab; label: string }[] = [
  { key: 'prehled',   label: 'Přehled' },
  { key: 'komin',     label: 'Komín' },
  { key: 'kourovod',  label: 'Kouřovod' },
  { key: 'spotrebic', label: 'Spotřebič' },
  { key: 'dodatky',   label: 'Dodatky' },
  { key: 'prace',     label: 'Práce' },
  { key: 'zavady',    label: 'Závady' },
  { key: 'zaver',     label: 'Závěr' },
];

// ══════════════════════════════════════════════════════════════════════════════
// Formulářové komponenty – na úrovni modulu (klávesnice zůstane otevřená!)
// ══════════════════════════════════════════════════════════════════════════════

type Upd = (p: Partial<InspectionFormData>) => void;

function FRow({ children }: { children: React.ReactNode }) {
  return <View style={f.row}>{children}</View>;
}

interface FInputProps { label: string; value: string; onChange: (v: string) => void; unit?: string; keyType?: any; multiline?: boolean; placeholder?: string; flex?: number; }
function FInput({ label, value, onChange, unit, keyType = 'default', multiline, placeholder, flex = 1 }: FInputProps) {
  return (
    <View style={[f.field, { flex }]}>
      <Text style={f.label}>{label}</Text>
      <View style={f.inputWrap}>
        <TextInput style={[f.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]} value={value} onChangeText={onChange} keyboardType={keyType} multiline={multiline} placeholder={placeholder ?? ''} placeholderTextColor={C.textTertiary} />
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
        {[true, false].map(opt => (
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

// ANO/NE práce řádek s volitelným detailem
interface WorkRowProps { label: string; value: YesNo; onChange: (v: YesNo) => void; detail?: string; onDetail?: (v: string) => void; detailPlaceholder?: string; }
function WorkRow({ label, value, onChange, detail, onDetail, detailPlaceholder }: WorkRowProps) {
  return (
    <View style={f.workBlock}>
      <View style={f.workRow}>
        <Text style={f.workLabel}>{label}</Text>
        <View style={f.workBtns}>
          <TouchableOpacity style={[f.wb, value === 'ano' && f.wbYes]} onPress={() => onChange(value === 'ano' ? '' : 'ano')}>
            <Text style={[f.wbt, value === 'ano' && { color: '#fff', fontWeight: 'bold' }]}>ANO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[f.wb, value === 'ne' && f.wbNo]} onPress={() => onChange(value === 'ne' ? '' : 'ne')}>
            <Text style={[f.wbt, value === 'ne' && { color: '#fff', fontWeight: 'bold' }]}>NE</Text>
          </TouchableOpacity>
        </View>
      </View>
      {value === 'ano' && onDetail && (
        <TextInput style={f.workDetail} value={detail ?? ''} onChangeText={onDetail} placeholder={detailPlaceholder ?? 'Upřesnit…'} placeholderTextColor={C.textTertiary} multiline />
      )}
    </View>
  );
}

// ── Sekce Přehled ──────────────────────────────────────────────────────────────
interface PrehledProps { d: InspectionFormData; u: Upd; chimneys: ObjectChimney[]; onChimneySelect: (ch: ObjectChimney) => void; }
function TabPrehled({ d, u, chimneys, onChimneySelect }: PrehledProps) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="TECHNIK" />
      <FInput label="Aktuální technik" value={d.currentTechnicianName} onChange={v => u({ currentTechnicianName: v })} placeholder="Vyplněno z profilu – lze upravit" />

      <FSep title="IDENTIFIKACE ZPRÁVY" />
      <FRow>
        <FInput label="Číslo revizní zprávy" value={d.revisionReportNumber} onChange={v => u({ revisionReportNumber: v })} placeholder="Auto-generováno" />
        <FInput label="Číslo předchozí zprávy" value={d.prevReportNumber} onChange={v => u({ prevReportNumber: v })} placeholder="Vyplní se po výběru SC" />
      </FRow>

      <FSep title="SPALINOVÁ CESTA (nejprve vyberte, pak se formulář předvyplní)" />
      {chimneys.length > 0 ? (
        <View style={f.field}>
          <Text style={f.label}>Vyberte spalinovou cestu — data se načtou z předchozí zprávy té samé SC</Text>
          <View style={[f.pickRow, { flexWrap: 'wrap' }]}>
            {chimneys.map(ch => (
              <TouchableOpacity key={ch.id} style={[f.pickBtn, d.chimneyLabel === ch.label && f.pickBtnActive]} onPress={() => onChimneySelect(ch)}>
                <Text style={[f.pickText, d.chimneyLabel === ch.label && f.pickTextActive]}>{ch.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FInput label="Název spalinové cesty" value={d.chimneyLabel} onChange={v => u({ chimneyLabel: v })} placeholder="Např. Komín pro krbovou vložku…" />
      )}
    </ScrollView>
  );
}

// ── Sekce Komín ────────────────────────────────────────────────────────────────
function TabKomin({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FPick label="Typ komína" value={d.chimneyType} options={[{ key: 'systemovy', label: 'Systémový' }, { key: 'individualny', label: 'Individuální' }]} onChange={v => u({ chimneyType: v as any })} />
      {d.chimneyType === 'systemovy' && (<><FSep title="SYSTÉMOVÝ" /><FRow><FInput label="Výrobce" value={d.sysManufacturer} onChange={v => u({ sysManufacturer: v })} /><FInput label="Typ / model" value={d.sysModel} onChange={v => u({ sysModel: v })} /></FRow></>)}
      {d.chimneyType === 'individualny' && (<>
        <FSep title="MATERIÁL" />
        <FInput label="Těleso z?" value={d.bodyMaterial} onChange={v => u({ bodyMaterial: v })} placeholder="Pálené cihly, beton…" />
        <FToggle label="Izolovaný?" value={d.isInsulated} onChange={v => u({ isInsulated: v })} />
        {d.isInsulated && <FInput label="Typ izolace" value={d.insulationType} onChange={v => u({ insulationType: v })} />}
        <FToggle label="Vložkovaný?" value={d.isLined} onChange={v => u({ isLined: v })} />
        {d.isLined && <FInput label="Materiál vložky" value={d.liningMaterial} onChange={v => u({ liningMaterial: v })} />}
        <FSep title="ROZMĚRY" />
        <FRow>
          <FInput label="Celková výška" value={d.totalHeight} onChange={v => u({ totalHeight: v })} unit="m" keyType="decimal-pad" />
          <FInput label="Účinná výška" value={d.effectiveHeight} onChange={v => u({ effectiveHeight: v })} unit="m" keyType="decimal-pad" />
          <FInput label="Průměr" value={d.flueDiameter} onChange={v => u({ flueDiameter: v })} unit="mm" keyType="decimal-pad" />
        </FRow>
        <FSep title="T-KUS" />
        <FPick label="Typ T-Kusu" value={d.tPieceAngle} options={[{ key: '45', label: '45°' }, { key: '90', label: '90°' }]} onChange={v => u({ tPieceAngle: v as any })} />
        <FInput label="Materiál T-Kusu" value={d.tPieceMaterial} onChange={v => u({ tPieceMaterial: v })} />
      </>)}
    </ScrollView>
  );
}

// ── Sekce Kouřovod ─────────────────────────────────────────────────────────────
function TabKourovod({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="MATERIÁL A ROZMĚRY" />
      <FRow>
        <FInput label="Materiál" value={d.kMaterial} onChange={v => u({ kMaterial: v })} placeholder="Nerez, pozink, flex…" />
        <FInput label="Délka" value={d.kLength} onChange={v => u({ kLength: v })} unit="m" keyType="decimal-pad" />
        <FInput label="Průměr" value={d.kDiameter} onChange={v => u({ kDiameter: v })} unit="mm" keyType="decimal-pad" />
      </FRow>
      <FSep title="REDUKCE A KOLENA" />
      <FToggle label="Redukce?" value={d.kHasReduction} onChange={v => u({ kHasReduction: v })} />
      {d.kHasReduction && <FRow><FInput label="Kde" value={d.kReductionWhere} onChange={v => u({ kReductionWhere: v })} /><FInput label="Z" value={d.kReductionFrom} onChange={v => u({ kReductionFrom: v })} unit="mm" keyType="decimal-pad" /><FInput label="Na" value={d.kReductionTo} onChange={v => u({ kReductionTo: v })} unit="mm" keyType="decimal-pad" /></FRow>}
      <FRow><FInput label="Počet kolen" value={d.kElbowCount} onChange={v => u({ kElbowCount: v })} keyType="number-pad" /><FInput label="Typy kolen" value={d.kElbowTypes} onChange={v => u({ kElbowTypes: v })} placeholder="2× 45°, 1× 90°" flex={2} /></FRow>
      <FSep title="KO A IZOLACE" />
      <FToggle label="Kontrolní otvor (KO)?" value={d.kHasKO} onChange={v => u({ kHasKO: v })} />
      {d.kHasKO && <FInput label="Kde?" value={d.kKOWhere} onChange={v => u({ kKOWhere: v })} />}
      <FToggle label="Izolovaný?" value={d.kInsulated} onChange={v => u({ kInsulated: v })} />
    </ScrollView>
  );
}

// ── Sekce Spotřebič ────────────────────────────────────────────────────────────
function TabSpotrebic({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="IDENTIFIKACE" />
      <FRow><FInput label="Název / výrobce" value={d.appName} onChange={v => u({ appName: v })} placeholder="Dakon, Viadrus…" /><FInput label="Typ / model" value={d.appType} onChange={v => u({ appType: v })} /></FRow>
      <FRow><FInput label="Výrobní číslo" value={d.appSerialNumber} onChange={v => u({ appSerialNumber: v })} placeholder="Pokud je k dispozici" /></FRow>
      <FSep title="PARAMETRY" />
      <FRow><FInput label="Výkon" value={d.appPower} onChange={v => u({ appPower: v })} unit="kW" keyType="decimal-pad" /><FInput label="Průměr hrdla" value={d.appOutletDiameter} onChange={v => u({ appOutletDiameter: v })} unit="mm" keyType="decimal-pad" /></FRow>
      <FInput label="Info o hrdle" value={d.appOutletInfo} onChange={v => u({ appOutletInfo: v })} />
      <FInput label="Umístění spotřebiče" value={d.appLocation} onChange={v => u({ appLocation: v })} placeholder="Kotelna, obývák…" />
    </ScrollView>
  );
}

// ── Sekce Dodatky ──────────────────────────────────────────────────────────────
function TabDodatky({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="UMÍSTĚNÍ PRVKŮ" />
      <FRow><FInput label="Umístění spotřebiče" value={d.appRoomLocation} onChange={v => u({ appRoomLocation: v })} /><FInput label="Umístění KO" value={d.koLocation} onChange={v => u({ koLocation: v })} /></FRow>
      <FRow><FInput label="Vybírací dvířka" value={d.cleaningDoorLocation} onChange={v => u({ cleaningDoorLocation: v })} /><FInput label="Vymetací dvířka" value={d.sweepingDoorLocation} onChange={v => u({ sweepingDoorLocation: v })} /></FRow>
      <FSep title="PŘÍSTUP" />
      <FPick label="Přístup k vrcholu komína" value={d.roofAccess} options={[{ key: 'vylaz', label: 'Výlez' }, { key: 'pruchod', label: 'Procházení po střeše' }]} onChange={v => u({ roofAccess: v as any })} />
      <FToggle label="Nášlapy na střeše?" value={d.hasFoothold} onChange={v => u({ hasFoothold: v })} />
      <FToggle label="Kouřovod prochází jinou místností?" value={d.fluePassesRoom} onChange={v => u({ fluePassesRoom: v })} />
      {d.fluePassesRoom && <FInput label="Přes jakou místnost?" value={d.fluePassesRoomName} onChange={v => u({ fluePassesRoomName: v })} />}
      <FSep title="PŘÍVOD VZDUCHU" />
      <View style={f.field}>
        <Text style={f.label}>Typ přívodu vzduchu</Text>
        {[{ key: 'A', label: 'A — otevřený spotřebič, přívod z místnosti' }, { key: 'B', label: 'B — uzavřený spotřebič, přívod z místnosti' }, { key: 'C', label: 'C — uzavřený spotřebič, přívod z exteriéru' }].map(o => (
          <TouchableOpacity key={o.key} style={[f.abcBtn, d.airSupplyType === o.key && f.abcBtnActive]} onPress={() => u({ airSupplyType: o.key as any })}>
            <View style={[f.abcDot, d.airSupplyType === o.key && { backgroundColor: C.primary }]} />
            <Text style={[f.abcText, d.airSupplyType === o.key && { color: C.primary, fontWeight: '700' }]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FToggle label="Utěsněná okna a dveře?" value={d.sealedRoom} onChange={v => u({ sealedRoom: v })} />
    </ScrollView>
  );
}

// ── Sekce Práce ────────────────────────────────────────────────────────────────
function TabPrace({ d, u }: { d: InspectionFormData; u: Upd }) {
  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="PROHLÍDKY A SERVIS" />
      <WorkRow label="Prohlídka kamerou" value={d.workCamera as YesNo} onChange={v => u({ workCamera: v })} />
      <WorkRow label="Pravidelná vizuální kontrola" value={d.workVisualCheck as YesNo} onChange={v => u({ workVisualCheck: v })} />
      <WorkRow label="Servis spotřebiče / komínové vložky" value={d.workService as YesNo} onChange={v => u({ workService: v })} detail={d.workServiceDetail} onDetail={v => u({ workServiceDetail: v })} detailPlaceholder="Specifikujte provedený servis…" />

      <FSep title="ČISTĚNÍ" />
      <WorkRow label="Čistění komínového průduchu" value={d.workCleanChimneyDuct as YesNo} onChange={v => u({ workCleanChimneyDuct: v })} detail={d.workCleanChimneyDuctLevel} onDetail={v => u({ workCleanChimneyDuctLevel: v })} detailPlaceholder="Míra zanesení, rozsah (%, popis)…" />
      <WorkRow label="Čistění kouřovodu" value={d.workCleanFlue as YesNo} onChange={v => u({ workCleanFlue: v })} detail={d.workCleanFlueLevel} onDetail={v => u({ workCleanFlueLevel: v })} detailPlaceholder="Míra zanesení kouřovodu…" />
      <WorkRow label="Čistění spotřebiče" value={d.workCleanAppliance as YesNo} onChange={v => u({ workCleanAppliance: v })} />
      <WorkRow label="Vybírání sazí a popele" value={d.workRemoveSoot as YesNo} onChange={v => u({ workRemoveSoot: v })} />

      <FSep title="OSTATNÍ" />
      <WorkRow label="Jiná práce" value={d.workOther as YesNo} onChange={v => u({ workOther: v })} detail={d.workOtherDetail} onDetail={v => u({ workOtherDetail: v })} detailPlaceholder="Popište provedené práce…" />
    </ScrollView>
  );
}

// ── Sekce Závady ───────────────────────────────────────────────────────────────
interface ZavadyProps { d: InspectionFormData; u: Upd; }
function TabZavady({ d, u }: ZavadyProps) {
  const defects: InspDefect[] = d.defects ? JSON.parse(d.defects) : [];
  const [addMode, setAddMode] = useState(false);
  const [newDef, setNewDef]   = useState({ type: '', location: '', description: '' });

  function addDefect() {
    if (!newDef.type.trim()) { Alert.alert('Chyba', 'Zadejte typ závady'); return; }
    const updated = [...defects, { id: uid(), type: newDef.type, location: newDef.location, description: newDef.description }];
    u({ defects: JSON.stringify(updated) });
    setNewDef({ type: '', location: '', description: '' }); setAddMode(false);
  }

  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md }}>
        <Text style={f.sep}>ZJIŠTĚNÉ ZÁVADY ({defects.length})</Text>
        <TouchableOpacity style={f.addDefBtn} onPress={() => setAddMode(!addMode)}>
          <Ionicons name={addMode ? 'close' : 'add'} size={16} color={C.primary} />
          <Text style={{ color: C.primary, fontSize: F.sm }}>{addMode ? 'Zrušit' : 'Přidat závadu'}</Text>
        </TouchableOpacity>
      </View>

      {addMode && (
        <View style={f.defForm}>
          <Text style={[f.label, { marginBottom: S.sm, color: C.primary }]}>NOVÁ ZÁVADA</Text>
          <Text style={f.label}>Typ závady *</Text>
          <TextInput style={f.input} value={newDef.type} onChangeText={v => setNewDef(p => ({ ...p, type: v }))} placeholder="Nedodržení bezpečnostních vzdáleností od hořlavin, porucha hrdla, netěsnost…" placeholderTextColor={C.textTertiary} multiline />
          <Text style={[f.label, { marginTop: S.sm }]}>Kde? (lokalizace)</Text>
          <TextInput style={f.input} value={newDef.location} onChangeText={v => setNewDef(p => ({ ...p, location: v }))} placeholder="Půdní prostor u podlahy a krokví, kotelna, 1. NP…" placeholderTextColor={C.textTertiary} />
          <Text style={[f.label, { marginTop: S.sm }]}>Popis / poznámka</Text>
          <TextInput style={[f.input, { minHeight: 60 }]} value={newDef.description} onChangeText={v => setNewDef(p => ({ ...p, description: v }))} placeholder="Detailní popis závady…" placeholderTextColor={C.textTertiary} multiline />
          <TouchableOpacity style={[f.addDefBtn, { backgroundColor: C.primary, marginTop: S.sm, justifyContent: 'center' }]} onPress={addDefect}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Přidat závadu</Text>
          </TouchableOpacity>
        </View>
      )}

      {defects.length === 0 && !addMode && (
        <View style={{ alignItems: 'center', padding: S.xl, gap: S.sm }}>
          <Ionicons name="checkmark-circle-outline" size={40} color={C.success} />
          <Text style={{ color: C.textSecondary }}>Žádné závady</Text>
        </View>
      )}

      {defects.map((def, i) => (
        <View key={def.id} style={f.defCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: C.error, fontWeight: 'bold', fontSize: F.sm, flex: 1 }}>{def.type}</Text>
            <TouchableOpacity onPress={() => {
              const updated = defects.filter(d => d.id !== def.id);
              u({ defects: JSON.stringify(updated) });
            }}>
              <Ionicons name="close-circle" size={18} color={C.error} />
            </TouchableOpacity>
          </View>
          {def.location ? <Text style={{ color: C.textSecondary, fontSize: F.xs, marginTop: 2 }}>📍 {def.location}</Text> : null}
          {def.description ? <Text style={{ color: C.textTertiary, fontSize: F.xs, marginTop: 2, fontStyle: 'italic' }}>{def.description}</Text> : null}
        </View>
      ))}

      <FSep title="ZÁVADY ODSTRANĚNÉ NA MÍSTĚ" />
      <TextInput style={[f.input, { minHeight: 100, textAlignVertical: 'top' }]} value={d.defectsFixed} onChangeText={v => u({ defectsFixed: v })} multiline placeholder="Které závady byly odstraněny přímo při kontrole…" placeholderTextColor={C.textTertiary} />
    </ScrollView>
  );
}

// ── Sekce Závěr ────────────────────────────────────────────────────────────────
const CONCLUSIONS = [
  { key: 'vyhovuje',               label: 'VYHOVUJE',                        color: C.success },
  { key: 'vyhovuje_po_odstraneni', label: 'VYHOVUJE PO ODSTRANĚNÍ ZÁVAD',    color: '#FF9F0A' },
  { key: 'nevyhovuje',             label: 'NEVYHOVUJE',                      color: C.error },
];

interface ZaverProps { d: InspectionFormData; u: Upd; onSave: () => void; saving: boolean; }
function TabZaver({ d, u, onSave, saving }: ZaverProps) {
  const [sigPaths, setSigPaths]     = useState<{ x: number; y: number }[][]>([]);
  const [sigCurrent, setSigCurrent] = useState<{ x: number; y: number }[]>([]);

  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => { const { locationX, locationY } = e.nativeEvent; setSigCurrent([{ x: locationX, y: locationY }]); },
    onPanResponderMove: e => { const { locationX, locationY } = e.nativeEvent; setSigCurrent(p => [...p, { x: locationX, y: locationY }]); },
    onPanResponderRelease: () => { if (sigCurrent.length > 1) { setSigPaths(p => [...p, sigCurrent]); u({ customerSignature: 'signed' }); } setSigCurrent([]); },
  });

  function clearSig() { setSigPaths([]); setSigCurrent([]); u({ customerSignature: '' }); }

  return (
    <ScrollView contentContainerStyle={f.tabContent}>
      <FSep title="CELKOVÉ ROZHODNUTÍ" />
      {CONCLUSIONS.map(c => (
        <TouchableOpacity key={c.key} style={[f.conclusionBtn, d.conclusion === c.key && { backgroundColor: c.color + '20', borderColor: c.color, borderWidth: 2 }]} onPress={() => u({ conclusion: c.key as any })}>
          <View style={[f.conclusionDot, { backgroundColor: d.conclusion === c.key ? c.color : C.border }]} />
          <Text style={[f.conclusionText, { color: d.conclusion === c.key ? c.color : C.textSecondary }]}>{c.label}</Text>
          {d.conclusion === c.key && <Ionicons name="checkmark" size={18} color={c.color} />}
        </TouchableOpacity>
      ))}

      {/* Podpis zákazníka */}
      <FSep title="PODPIS ZÁKAZNÍKA" />
      <Text style={{ color: C.textSecondary, fontSize: F.xs, marginBottom: S.sm }}>
        Zákazník podepisuje, že je s výsledkem kontroly seznámen a souhlasí s ním.
      </Text>
      <View style={f.sigCanvas} {...pan.panHandlers}>
        {[...sigPaths, sigCurrent].map((path, pi) =>
          path.slice(1).map((pt, i) => {
            const prev = path[i];
            const dx = pt.x - prev.x; const dy = pt.y - prev.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return <View key={`${pi}-${i}`} style={{ position: 'absolute', left: prev.x, top: prev.y - 1.5, width: len, height: 3, backgroundColor: C.textPrimary, borderRadius: 2, transform: [{ rotate: `${angle}deg` }] }} />;
          })
        )}
        {sigPaths.length === 0 && sigCurrent.length === 0 && (
          <Text style={{ color: C.textTertiary, fontSize: F.sm, textAlign: 'center', position: 'absolute', top: '40%', left: 0, right: 0 }}>Zákazník se podepíše prstem nebo tužkou</Text>
        )}
      </View>
      {sigPaths.length > 0 && (
        <TouchableOpacity style={f.clearSigBtn} onPress={clearSig}>
          <Ionicons name="trash-outline" size={14} color={C.textSecondary} />
          <Text style={{ color: C.textSecondary, fontSize: F.xs }}>Vymazat podpis</Text>
        </TouchableOpacity>
      )}
      {d.customerSignature && <Text style={{ color: C.success, fontSize: F.xs, marginTop: S.xs }}>✓ Podpis zachycen</Text>}

      {/* Uložit */}
      {d.conclusion ? (
        <TouchableOpacity
          style={[f.saveBtn, { backgroundColor: CONCLUSIONS.find(c => c.key === d.conclusion)?.color ?? C.primary, marginTop: S.lg }]}
          onPress={onSave} disabled={saving}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={f.saveBtnText}>{saving ? 'Ukládám…' : 'Uložit zprávu z kontroly'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={[f.saveBtn, { backgroundColor: C.surfaceEl, marginTop: S.lg }]}>
          <Text style={{ color: C.textTertiary, fontWeight: 'bold' }}>Nejprve vyberte výsledek</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Hlavní komponenta
// ══════════════════════════════════════════════════════════════════════════════
export default function InspectionFormScreen({ objectId, onBack }: Props) {
  const [reportNumber]       = useState(() => generateReportNumber());
  const [tab, setTab]        = useState<Tab>('prehled');
  const [form, setForm]      = useState<InspectionFormData>({ ...DEFAULT_FORM_DATA });
  const [saving, setSaving]  = useState(false);
  const [chimneys, setChimneys] = useState<ObjectChimney[]>([]);

  useEffect(() => {
    // Načti komíny objektu
    const ch = getObjectChimneys(objectId);
    setChimneys(ch);
    // Technik z nastavení
    const tech = getSetting('firstName') && getSetting('lastName')
      ? `${getSetting('firstName')} ${getSetting('lastName')}`
      : getSetting('firstName') ?? getSetting('lastName') ?? '';
    // Jen základní init — NEdoplňuj data z předchozí zprávy dokud uživatel nevybere SC
    setForm(p => ({
      ...p,
      revisionReportNumber: reportNumber,
      inspectionDate: todayISO(),
      currentTechnicianName: tech,
    }));
  }, [objectId]);

  function upd(partial: Partial<InspectionFormData>) {
    setForm(p => ({ ...p, ...partial }));
  }

  /**
   * Volá se při výběru spalinové cesty v tab Přehled.
   * Dohledá poslední zprávu té samé SC (podle chimneyLabel) a předvyplní z ní.
   * Pokud žádná zpráva pro tuto SC neexistuje, formulář se nechá prázdný (jen SC label + technik + čísla).
   */
  function handleChimneySelect(chimney: ObjectChimney) {
    const tech = form.currentTechnicianName;
    // getObjectInspections vrací DESC — první shoda = nejnovější zpráva dané SC
    const allInsp = getObjectInspections(objectId);
    const prev = allInsp.find(ins => ins.formData?.chimneyLabel === chimney.label);
    if (prev?.formData) {
      setForm({
        ...prev.formData,
        revisionReportNumber: reportNumber,
        prevReportNumber: prev.reportNumber,
        inspectionDate: todayISO(),
        currentTechnicianName: tech,
        customerSignature: '',
        conclusion: '',
        defects: '[]',
        defectsFixed: '',
        chimneyLabel: chimney.label,
      });
    } else {
      // Žádná předchozí zpráva pro tuto SC — začni čistý formulář
      setForm({
        ...DEFAULT_FORM_DATA,
        revisionReportNumber: reportNumber,
        inspectionDate: todayISO(),
        currentTechnicianName: tech,
        chimneyLabel: chimney.label,
      });
    }
  }

  function save() {
    if (!form.conclusion) { Alert.alert('Chybí výsledek', 'Přejděte na záložku Závěr a vyberte výsledek.'); setTab('zaver'); return; }
    setSaving(true);
    try {
      const ins: ObjectInspection = {
        id: uid(), objectId, reportNumber,
        inspectionDate: todayISO(),
        result: form.conclusion as InspResult,
        notes: '',
        createdAt: nowISO(),
        formData: form,
      };
      saveObjectInspection(ins);
      // Log
      const obj = getObject(objectId);
      addLog(
        form.currentTechnicianName || 'Technik',
        objectId,
        obj ? `${obj.city}${obj.street ? '-' + obj.street : ''}` : objectId,
        'vytvoril/a', ins.id, reportNumber, ''
      );
      Alert.alert('✓ Zpráva uložena', `Číslo: ${reportNumber}`, [{ text: 'OK', onPress: onBack }]);
    } catch (e: any) {
      Alert.alert('Chyba', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  }

  const tabIdx = TABS.findIndex(t => t.key === tab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>
      <View style={f.header}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="arrow-back-outline" size={18} color={C.textSecondary} />
          <Text style={f.backText}>Zpět</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: S.md }}>
          <Text style={f.title}>Nová zpráva z kontroly</Text>
          <Text style={f.reportNum}>{reportNumber}</Text>
        </View>
        <View style={f.progress}><Text style={f.progressText}>{tabIdx + 1} / {TABS.length}</Text></View>
      </View>

      <View style={f.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S.sm }}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} style={[f.tab, tab === t.key && f.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[f.tabText, tab === t.key && f.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'prehled'   && <TabPrehled   d={form} u={upd} chimneys={chimneys} onChimneySelect={handleChimneySelect} />}
        {tab === 'komin'     && <TabKomin     d={form} u={upd} />}
        {tab === 'kourovod'  && <TabKourovod  d={form} u={upd} />}
        {tab === 'spotrebic' && <TabSpotrebic d={form} u={upd} />}
        {tab === 'dodatky'   && <TabDodatky   d={form} u={upd} />}
        {tab === 'prace'     && <TabPrace     d={form} u={upd} />}
        {tab === 'zavady'    && <TabZavady    d={form} u={upd} />}
        {tab === 'zaver'     && <TabZaver     d={form} u={upd} onSave={save} saving={saving} />}
      </View>

      <View style={f.footer}>
        <TouchableOpacity style={f.navBtn} onPress={() => tabIdx === 0 ? onBack() : setTab(TABS[tabIdx - 1].key)}>
          <Ionicons name="arrow-back" size={16} color={C.textSecondary} />
          <Text style={f.navBtnText}>{tabIdx === 0 ? 'Zrušit' : 'Zpět'}</Text>
        </TouchableOpacity>
        <View style={f.tabDots}>
          {TABS.map((t, i) => <View key={t.key} style={[f.dot, i === tabIdx && f.dotActive]} />)}
        </View>
        {tabIdx < TABS.length - 1
          ? <TouchableOpacity style={f.navBtn} onPress={() => setTab(TABS[tabIdx + 1].key)}>
              <Text style={[f.navBtnText, { color: C.primary }]}>Další</Text>
              <Ionicons name="arrow-forward" size={16} color={C.primary} />
            </TouchableOpacity>
          : <View style={f.navBtn} />
        }
      </View>
    </SafeAreaView>
  );
}

// ── Styly ──────────────────────────────────────────────────────────────────────
const f = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backText: { color: C.textSecondary, fontSize: F.sm },
  title: { color: C.textPrimary, fontSize: F.md, fontWeight: 'bold' },
  reportNum: { color: C.primary, fontSize: F.sm, fontWeight: '600', letterSpacing: 1 },
  progress: { backgroundColor: C.surfaceEl, borderRadius: R.md, paddingHorizontal: S.sm, paddingVertical: 3, borderWidth: 1, borderColor: C.border },
  progressText: { color: C.textSecondary, fontSize: F.xs },
  tabBar: { borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface, maxHeight: 44 },
  tab: { paddingHorizontal: S.md, paddingVertical: S.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { borderBottomColor: C.primary },
  tabText: { color: C.textSecondary, fontSize: F.sm },
  tabTextActive: { color: C.primary, fontWeight: '700' },
  tabContent: { padding: S.base, gap: S.sm },
  row: { flexDirection: 'row', gap: S.md },
  field: { flex: 1, marginBottom: S.xs },
  label: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  input: { flex: 1, backgroundColor: C.surface, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.sm, borderWidth: 1, borderColor: C.border },
  unit: { color: C.textSecondary, fontSize: F.sm, width: 32, textAlign: 'right' },
  pickRow: { flexDirection: 'row', gap: S.sm },
  pickBtn: { paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceEl },
  pickBtnActive: { backgroundColor: C.primary + '20', borderColor: C.primary },
  pickText: { color: C.textSecondary, fontSize: F.sm },
  pickTextActive: { color: C.primary, fontWeight: '700' },
  sep: { color: C.primary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.primary + '30', marginTop: S.md, marginBottom: S.xs },
  abcBtn: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, marginBottom: S.xs },
  abcBtnActive: { backgroundColor: C.primary + '15', borderColor: C.primary },
  abcDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.border },
  abcText: { color: C.textSecondary, fontSize: F.sm, flex: 1 },
  // WorkRow
  workBlock: { marginBottom: S.sm, backgroundColor: C.surface, borderRadius: R.md, padding: S.sm, borderWidth: 1, borderColor: C.border },
  workRow: { flexDirection: 'row', alignItems: 'center' },
  workLabel: { flex: 1, color: C.textPrimary, fontSize: F.sm },
  workBtns: { flexDirection: 'row', gap: 4 },
  wb: { paddingHorizontal: S.sm, paddingVertical: 5, borderRadius: R.sm, borderWidth: 1, borderColor: C.border, backgroundColor: C.surfaceEl, minWidth: 42, alignItems: 'center' },
  wbYes: { backgroundColor: C.success, borderColor: C.success },
  wbNo: { backgroundColor: C.error, borderColor: C.error },
  wbt: { color: C.textSecondary, fontSize: F.xs, fontWeight: '600' },
  workDetail: { backgroundColor: C.surfaceEl, borderRadius: R.sm, color: C.textPrimary, paddingHorizontal: S.sm, paddingVertical: S.xs, fontSize: F.xs, borderWidth: 1, borderColor: C.border, marginTop: S.xs },
  // Závady
  addDefBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: S.sm, paddingVertical: S.xs, borderRadius: R.md, borderWidth: 1, borderColor: C.primary },
  defForm: { backgroundColor: C.surfaceEl, borderRadius: R.lg, padding: S.md, marginBottom: S.md, borderWidth: 1, borderColor: C.primary + '40' },
  defCard: { backgroundColor: C.error + '10', borderRadius: R.md, padding: S.md, marginBottom: S.xs, borderWidth: 1, borderColor: C.error + '40' },
  // Závěr
  conclusionBtn: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, marginBottom: S.sm, backgroundColor: C.surface },
  conclusionDot: { width: 14, height: 14, borderRadius: 7 },
  conclusionText: { fontSize: F.sm, fontWeight: '600', flex: 1 },
  sigCanvas: { height: 160, backgroundColor: C.surfaceEl, borderRadius: R.lg, borderWidth: 2, borderColor: C.border, overflow: 'hidden', position: 'relative' },
  clearSigBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: S.sm, alignSelf: 'flex-start' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm, borderRadius: R.lg, paddingVertical: S.md + 4 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.lg },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.sm, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surface },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: S.md, paddingVertical: S.sm },
  navBtnText: { color: C.textSecondary, fontSize: F.sm },
  tabDots: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive: { backgroundColor: C.primary, width: 8, height: 8 },
});
