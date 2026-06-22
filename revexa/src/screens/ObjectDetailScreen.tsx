import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S, R } from '../theme';
import {
  getObject, saveObject, deleteObject, ObjectRecord,
  getObjectInspections, ObjectInspection, InspResult, InspectionFormData,
  getObjectChimneys, saveObjectChimney, deleteObjectChimney, ObjectChimney,
  getObjectAppliances, saveObjectAppliance, deleteObjectAppliance, ObjectAppliance,
} from '../db/database';
import { uid, nowISO, formatDate } from '../utils';

function getExpiryDate(inspectionDate: string): string {
  try {
    const d = new Date(inspectionDate + 'T12:00:00');
    d.setFullYear(d.getFullYear() + 1);
    return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function isExpired(inspectionDate: string): boolean {
  try { return new Date(inspectionDate + 'T12:00:00') < new Date(new Date().setFullYear(new Date().getFullYear() - 1)); }
  catch { return false; }
}

interface Props { objectId: string; onBack: () => void; onCreateInspection: (id: string) => void; }
type Tab = 'info' | 'komin' | 'kontrola' | 'fotky' | 'dokumenty' | 'poznamky';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info',      label: 'Info' },
  { key: 'komin',     label: 'Komíny' },
  { key: 'kontrola',  label: 'Kontroly' },
  { key: 'fotky',     label: 'Fotky' },
  { key: 'dokumenty', label: 'Dokumenty' },
  { key: 'poznamky',  label: 'Poznámky' },
];

const RESULT_LABELS: Record<string,string> = { vyhovuje:'VYHOVUJE', podminecne:'PODMÍNEČNĚ', nevyhovuje:'NEVYHOVUJE', vyhovuje_po_odstraneni:'VYHOVUJE PO ODSTRANĚNÍ' };
const RESULT_COLORS: Record<string,string> = { vyhovuje:C.success, podminecne:'#FF9F0A', nevyhovuje:C.error, vyhovuje_po_odstraneni:'#FF9F0A' };

// ── Sdílené sub-komponenty (mimo ostatní!) ────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string|number }) {
  if (!value && value !== 0) return null;
  return (
    <View style={ds.infoRow}>
      <Text style={ds.infoLabel}>{label}</Text>
      <Text style={ds.infoValue}>{String(value)}</Text>
    </View>
  );
}
interface EditFieldProps { label: string; value: string; onChange: (v: string) => void; keyType?: any; }
function EditField({ label, value, onChange, keyType = 'default' }: EditFieldProps) {
  return (
    <View style={{ marginBottom: S.sm }}>
      <Text style={ds.editLabel}>{label}</Text>
      <TextInput style={ds.editInput} value={value} onChangeText={onChange} keyboardType={keyType} placeholderTextColor={C.textTertiary} />
    </View>
  );
}

// ── Detail zprávy z kontroly ──────────────────────────────────────────────────
function InspReportDetail({ ins, onClose }: { ins: ObjectInspection; onClose: () => void }) {
  const d = ins.formData;
  const rc = RESULT_COLORS[ins.result] ?? C.textTertiary;

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={{ marginBottom: S.md }}>
        <Text style={ds.detailSection}>{title}</Text>
        {children}
      </View>
    );
  }
  function Row({ label, value }: { label: string; value: string | boolean | undefined }) {
    if (!value && value !== false) return null;
    const display = typeof value === 'boolean' ? (value ? 'Ano' : 'Ne') : value;
    return (
      <View style={ds.detailRow}>
        <Text style={ds.detailLabel}>{label}</Text>
        <Text style={ds.detailValue}>{display}</Text>
      </View>
    );
  }

  return (
    <Modal visible animationType="slide" transparent>
      <View style={ds.detailModalBg}>
        <View style={ds.detailModal}>
          {/* Hlavička */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.base, gap: S.md }}>
            <View style={{ flex: 1 }}>
              <Text style={ds.detailTitle}>{ins.reportNumber}</Text>
              <Text style={{ color: C.textSecondary, fontSize: F.sm }}>📅 {formatDate(ins.inspectionDate)}</Text>
            </View>
            <View style={[ds.resultBig, { backgroundColor: rc + '20', borderColor: rc }]}>
              <Text style={[ds.resultBigText, { color: rc }]}>{RESULT_LABELS[ins.result] ?? ins.result}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: S.sm }}>
              <Ionicons name="close" size={24} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {!d ? <Text style={{ color: C.textTertiary, textAlign: 'center', padding: S.xl }}>Formulář nebyl vyplněn</Text> : (
              <>
                {(d.currentTechnicianName || d.revisionReportNumber || d.inspectorName || d.prevReportNumber) && (
                  <Section title="PŘEHLED">
                    <Row label="Aktuální technik" value={d.currentTechnicianName} />
                    <Row label="Č. revizní zprávy" value={d.revisionReportNumber} />
                    <Row label="Č. předchozí zprávy" value={d.prevReportNumber} />
                    <Row label="Technik (starší)" value={d.inspectorName} />
                  </Section>
                )}
                {d.chimneyType && (
                  <Section title="KOMÍN">
                    <Row label="Typ" value={d.chimneyType === 'systemovy' ? 'Systémový' : 'Individuální'} />
                    <Row label="Výrobce" value={d.sysManufacturer} />
                    <Row label="Model" value={d.sysModel} />
                    <Row label="Materiál tělesa" value={d.bodyMaterial} />
                    <Row label="Izolovaný" value={d.isInsulated ? `Ano — ${d.insulationType}` : undefined} />
                    <Row label="Vložkovaný" value={d.isLined ? `Ano — ${d.liningMaterial}` : undefined} />
                    <Row label="Celková délka" value={d.totalHeight ? `${d.totalHeight} m` : undefined} />
                    <Row label="Účinná výška" value={d.effectiveHeight ? `${d.effectiveHeight} m` : undefined} />
                    <Row label="Průměr průduchu" value={d.flueDiameter ? `${d.flueDiameter} mm` : undefined} />
                    <Row label="T-Kus" value={d.tPieceAngle ? `${d.tPieceAngle}° — ${d.tPieceMaterial}` : undefined} />
                  </Section>
                )}
                {d.kMaterial && (
                  <Section title="KOUŘOVOD">
                    <Row label="Materiál" value={d.kMaterial} />
                    <Row label="Délka" value={d.kLength ? `${d.kLength} m` : undefined} />
                    <Row label="Průměr" value={d.kDiameter ? `${d.kDiameter} mm` : undefined} />
                    <Row label="Redukce" value={d.kHasReduction ? `Ano — ${d.kReductionWhere} (${d.kReductionFrom}→${d.kReductionTo} mm)` : 'Ne'} />
                    <Row label="Kolena" value={d.kElbowCount ? `${d.kElbowCount}× (${d.kElbowTypes})` : undefined} />
                    <Row label="Kontrolní otvor" value={d.kHasKO ? `Ano — ${d.kKOWhere}` : 'Ne'} />
                    <Row label="Izolovaný" value={d.kInsulated ? 'Ano' : 'Ne'} />
                  </Section>
                )}
                {d.appName && (
                  <Section title="SPOTŘEBIČ">
                    <Row label="Název / výrobce" value={d.appName} />
                    <Row label="Typ / model" value={d.appType} />
                    <Row label="Výkon" value={d.appPower ? `${d.appPower} kW` : undefined} />
                    <Row label="Průměr hrdla" value={d.appOutletDiameter ? `${d.appOutletDiameter} mm` : undefined} />
                    <Row label="Info o hrdle" value={d.appOutletInfo} />
                    <Row label="Umístění" value={d.appLocation} />
                  </Section>
                )}
                {(d.roofAccess || d.airSupplyType || d.appRoomLocation) && (
                  <Section title="DODATKY">
                    <Row label="Umístění spotřebiče" value={d.appRoomLocation} />
                    <Row label="Přístup ke komínu" value={d.roofAccess === 'vylaz' ? 'Výlez' : d.roofAccess === 'pruchod' ? 'Procházení po střeše' : undefined} />
                    <Row label="Nášlapy na střeše" value={d.hasFoothold ? 'Ano' : undefined} />
                    <Row label="Kouřovod prochází přes" value={d.fluePassesRoom ? d.fluePassesRoomName : undefined} />
                    <Row label="Přívod vzduchu" value={d.airSupplyType ? `Typ ${d.airSupplyType}` : undefined} />
                    <Row label="Utěsněné otvory" value={d.sealedRoom ? 'Ano' : undefined} />
                    <Row label="KO — umístění" value={d.koLocation} />
                    <Row label="Vybírací dvířka" value={d.cleaningDoorLocation} />
                    <Row label="Vymetací dvířka" value={d.sweepingDoorLocation} />
                  </Section>
                )}
                {(d.defectsFound || d.defectsFixed) && (
                  <Section title="ZÁVADY">
                    <Row label="Nalezené závady" value={d.defectsFound} />
                    <Row label="Odstraněno na místě" value={d.defectsFixed} />
                  </Section>
                )}
                {ins.notes ? <Section title="POZNÁMKY"><Text style={{ color: C.textSecondary, fontSize: F.sm }}>{ins.notes}</Text></Section> : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Záložka Komíny ─────────────────────────────────────────────────────────────
function KominyTab({ objectId }: { objectId: string }) {
  const [chimneys, setChimneys]       = useState<ObjectChimney[]>([]);
  const [appliances, setAppliances]   = useState<ObjectAppliance[]>([]);
  const [addCh, setAddCh]             = useState(false);
  const [expandedCh, setExpandedCh]   = useState<Set<string>>(new Set());
  const [expandedApp, setExpandedApp] = useState<Set<string>>(new Set());
  const [newCh, setNewCh]   = useState({ label: '', type: '', material: '', diameter: '', totalHeight: '', effectiveHeight: '', notes: '' });
  const [addApp, setAddApp] = useState<string | null>(null);
  const [newApp, setNewApp] = useState({ label: '', name: '', type: '', power: '', location: '', notes: '' });

  function load() { setChimneys(getObjectChimneys(objectId)); setAppliances(getObjectAppliances(objectId)); }
  useEffect(() => { load(); }, [objectId]);

  function toggleCh(id: string) { setExpandedCh(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function toggleApp(id: string) { setExpandedApp(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function saveCh() {
    if (!newCh.label.trim()) { Alert.alert('Chyba', 'Zadejte název'); return; }
    const ch: ObjectChimney = { id: uid(), objectId, label: newCh.label, type: newCh.type, manufacturer: '', model: '', material: newCh.material, isLined: false, liningMaterial: '', totalHeight: parseFloat(newCh.totalHeight) || 0, effectiveHeight: parseFloat(newCh.effectiveHeight) || 0, diameter: parseInt(newCh.diameter) || 0, tPieceAngle: '', tPieceMaterial: '', notes: newCh.notes, sortOrder: chimneys.length, createdAt: nowISO() };
    saveObjectChimney(ch); setNewCh({ label: '', type: '', material: '', diameter: '', totalHeight: '', effectiveHeight: '', notes: '' }); setAddCh(false); load();
  }

  function saveApp(chimneyId: string) {
    if (!newApp.label.trim()) { Alert.alert('Chyba', 'Zadejte název spotřebiče'); return; }
    const app: ObjectAppliance = { id: uid(), objectId, chimneyId, label: newApp.label, name: newApp.name, type: newApp.type, power: parseFloat(newApp.power) || 0, outletDiameter: 0, location: newApp.location, notes: newApp.notes, sortOrder: appliances.filter(a => a.chimneyId === chimneyId).length, createdAt: nowISO() };
    saveObjectAppliance(app); setNewApp({ label: '', name: '', type: '', power: '', location: '', notes: '' }); setAddApp(null); load();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>
      <TouchableOpacity style={ds.createBtn} onPress={() => setAddCh(!addCh)}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={ds.createBtnText}>{addCh ? 'Zrušit' : 'Přidat komín / spalinovou cestu'}</Text>
      </TouchableOpacity>

      {addCh && (
        <View style={[ds.card, { backgroundColor: C.surfaceEl }]}>
          <Text style={ds.cardLabel}>NOVÁ SPALINOVÁ CESTA</Text>
          {([['label','Název *','Komín č.1, Kouřovod…'],['type','Typ','Systémový, individuální, kouřovod…'],['material','Materiál','Pálené cihly, nerez…'],['diameter','Průměr (mm)','150'],['totalHeight','Celková výška (m)','12'],['effectiveHeight','Účinná výška (m)','10'],['notes','Poznámka','']] as [string,string,string][]).map(([k,l,p]) => (
            <View key={k} style={{ marginBottom: S.sm }}>
              <Text style={ds.editLabel}>{l}</Text>
              <TextInput style={ds.editInput} value={(newCh as any)[k]} onChangeText={v => setNewCh(prev => ({...prev,[k]:v}))} placeholder={p} placeholderTextColor={C.textTertiary} keyboardType={['diameter','totalHeight','effectiveHeight'].includes(k) ? 'decimal-pad' : 'default'} />
            </View>
          ))}
          <TouchableOpacity style={[ds.createBtn, { marginTop: S.sm }]} onPress={saveCh}>
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={ds.createBtnText}>Uložit komín</Text>
          </TouchableOpacity>
        </View>
      )}

      {chimneys.length === 0 && !addCh && (
        <View style={ds.empty}><Ionicons name="flame-outline" size={40} color={C.textTertiary} /><Text style={ds.emptyText}>Žádné spalinové cesty</Text></View>
      )}

      {chimneys.map(ch => {
        const chApps = appliances.filter(a => a.chimneyId === ch.id);
        const chExpanded = expandedCh.has(ch.id);
        return (
          <View key={ch.id} style={ds.card}>
            {/* Hlavička komínu — kliknutelná */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }} onPress={() => toggleCh(ch.id)}>
              <Ionicons name={chExpanded ? 'chevron-down' : 'chevron-forward'} size={16} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.primary, fontWeight: 'bold', fontSize: F.md }}>{ch.label}</Text>
                <View style={{ flexDirection: 'row', gap: S.md, marginTop: 2 }}>
                  {ch.type ? <Text style={ds.metaText}>{ch.type}</Text> : null}
                  {ch.diameter > 0 ? <Text style={ds.metaText}>⌀ {ch.diameter} mm</Text> : null}
                  {ch.totalHeight > 0 ? <Text style={ds.metaText}>↕ {ch.totalHeight} m</Text> : null}
                </View>
              </View>
              <View style={[ds.chipTag, { backgroundColor: C.primary + '20' }]}>
                <Text style={{ color: C.primary, fontSize: F.xs, fontWeight: 'bold' }}>{chApps.length} spotřebič{chApps.length !== 1 ? 'e/ů' : ''}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Smazat?', `"${ch.label}"`, [
                { text: 'Zrušit', style: 'cancel' },
                { text: 'Smazat', style: 'destructive', onPress: () => { deleteObjectChimney(ch.id); load(); } }
              ])}>
                <Ionicons name="trash-outline" size={16} color={C.error} />
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Detail komínu — rozbalený */}
            {chExpanded && (
              <View style={{ marginTop: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.border }}>
                <View style={ds.detailGrid}>
                  {ch.material ? <><Text style={ds.dLabel}>Materiál</Text><Text style={ds.dValue}>{ch.material}</Text></> : null}
                  {ch.totalHeight > 0 ? <><Text style={ds.dLabel}>Celková výška</Text><Text style={ds.dValue}>{ch.totalHeight} m</Text></> : null}
                  {ch.effectiveHeight > 0 ? <><Text style={ds.dLabel}>Účinná výška</Text><Text style={ds.dValue}>{ch.effectiveHeight} m</Text></> : null}
                  {ch.diameter > 0 ? <><Text style={ds.dLabel}>Průměr průduchu</Text><Text style={ds.dValue}>{ch.diameter} mm</Text></> : null}
                  {ch.tPieceAngle ? <><Text style={ds.dLabel}>T-Kus</Text><Text style={ds.dValue}>{ch.tPieceAngle}° — {ch.tPieceMaterial}</Text></> : null}
                  {ch.isLined ? <><Text style={ds.dLabel}>Vložka</Text><Text style={ds.dValue}>Ano — {ch.liningMaterial}</Text></> : null}
                  {ch.notes ? <><Text style={ds.dLabel}>Poznámka</Text><Text style={ds.dValue}>{ch.notes}</Text></> : null}
                </View>

                {/* Spotřebiče */}
                <Text style={[ds.cardLabel, { marginTop: S.sm, marginBottom: S.xs }]}>SPOTŘEBIČE ({chApps.length})</Text>
                {chApps.map(app => {
                  const appExpanded = expandedApp.has(app.id);
                  return (
                    <View key={app.id} style={ds.appCard}>
                      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }} onPress={() => toggleApp(app.id)}>
                        <Ionicons name={appExpanded ? 'chevron-down' : 'chevron-forward'} size={14} color={C.textSecondary} />
                        <Ionicons name="flame" size={14} color={C.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: C.textPrimary, fontSize: F.sm, fontWeight: '600' }}>{app.label}</Text>
                          <Text style={ds.metaText}>{[app.name, app.type].filter(Boolean).join(' · ')}{app.power > 0 ? ` · ${app.power} kW` : ''}</Text>
                        </View>
                        <TouchableOpacity onPress={() => Alert.alert('Smazat spotřebič?', `"${app.label}"`, [
                          { text: 'Zrušit', style: 'cancel' },
                          { text: 'Smazat', style: 'destructive', onPress: () => { deleteObjectAppliance(app.id); load(); } }
                        ])}>
                          <Ionicons name="close-circle-outline" size={16} color={C.error} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      {appExpanded && (
                        <View style={[ds.detailGrid, { marginTop: S.xs, paddingTop: S.xs, borderTopWidth: 1, borderTopColor: C.border + '50' }]}>
                          {app.name ? <><Text style={ds.dLabel}>Výrobce</Text><Text style={ds.dValue}>{app.name}</Text></> : null}
                          {app.type ? <><Text style={ds.dLabel}>Typ / model</Text><Text style={ds.dValue}>{app.type}</Text></> : null}
                          {app.power > 0 ? <><Text style={ds.dLabel}>Výkon</Text><Text style={ds.dValue}>{app.power} kW</Text></> : null}
                          {app.location ? <><Text style={ds.dLabel}>Umístění</Text><Text style={ds.dValue}>{app.location}</Text></> : null}
                          {app.notes ? <><Text style={ds.dLabel}>Poznámka</Text><Text style={ds.dValue}>{app.notes}</Text></> : null}
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Přidat spotřebič */}
                {addApp === ch.id ? (
                  <View style={{ backgroundColor: C.surfaceEl, borderRadius: R.md, padding: S.sm, marginTop: S.sm }}>
                    <Text style={[ds.cardLabel, { marginBottom: S.sm }]}>NOVÝ SPOTŘEBIČ</Text>
                    {([['label','Název *','Kotel, kamna, krb…'],['name','Výrobce','Dakon, Viadrus…'],['type','Typ / model','DOR 25…'],['power','Výkon (kW)','24'],['location','Umístění','Kotelna, obývák…'],['notes','Poznámka','']] as [string,string,string][]).map(([k,l,p]) => (
                      <View key={k} style={{ marginBottom: S.xs }}>
                        <Text style={ds.editLabel}>{l}</Text>
                        <TextInput style={ds.editInput} value={(newApp as any)[k]} onChangeText={v => setNewApp(prev => ({...prev,[k]:v}))} placeholder={p} placeholderTextColor={C.textTertiary} keyboardType={k === 'power' ? 'decimal-pad' : 'default'} />
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.sm }}>
                      <TouchableOpacity style={{ flex: 1, padding: S.sm, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={() => setAddApp(null)}>
                        <Text style={{ color: C.textSecondary }}>Zrušit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[ds.createBtn, { flex: 2 }]} onPress={() => saveApp(ch.id)}>
                        <Ionicons name="save-outline" size={14} color="#fff" />
                        <Text style={ds.createBtnText}>Přidat spotřebič</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={ds.addAppBtn} onPress={() => setAddApp(addApp === ch.id ? null : ch.id)}>
                    <Ionicons name="add" size={14} color={C.primary} />
                    <Text style={{ color: C.primary, fontSize: F.xs }}>Přidat spotřebič</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Tlačítko editace (EditField je mimo - bezpečné pro klávesnici) ──────────
function EditModal({ obj, onSave, onClose, onDelete }: { obj: ObjectRecord; onSave: (o: ObjectRecord) => void; onClose: () => void; onDelete: () => void }) {
  const [form, setForm] = useState({ ...obj });
  const set = (k: keyof ObjectRecord, v: string) => setForm(p => ({ ...p, [k]: v }));
  return (
    <Modal visible animationType="slide" transparent>
      <View style={ds.modalBg}>
        <View style={ds.modal}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.base }}>
            <Text style={ds.modalTitle}>Upravit · {obj.oid}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={ds.editSection}>ADRESA OBJEKTU</Text>
            <EditField label="Ulice a číslo" value={String(form.street??'')} onChange={v=>set('street',v)} />
            <EditField label="Město" value={String(form.city??'')} onChange={v=>set('city',v)} />
            <EditField label="PSČ" value={String(form.zip??'')} onChange={v=>set('zip',v)} />
            <Text style={ds.editSection}>MAJITEL</Text>
            <EditField label="Jméno" value={String(form.ownerFirstName??'')} onChange={v=>set('ownerFirstName',v)} />
            <EditField label="Příjmení" value={String(form.ownerLastName??'')} onChange={v=>set('ownerLastName',v)} />
            <EditField label="Telefon" value={String(form.ownerPhone??'')} onChange={v=>set('ownerPhone',v)} keyType="phone-pad" />
            <EditField label="Email" value={String(form.ownerEmail??'')} onChange={v=>set('ownerEmail',v)} />
            <EditField label="Adresa majitele" value={String(form.ownerStreet??'')} onChange={v=>set('ownerStreet',v)} />
            <EditField label="Město majitele" value={String(form.ownerCity??'')} onChange={v=>set('ownerCity',v)} />
            <EditField label="PSČ majitele" value={String(form.ownerZip??'')} onChange={v=>set('ownerZip',v)} />
            <Text style={ds.editSection}>OBJEKT</Text>
            <EditField label="Typ stavby" value={String(form.buildingType??'')} onChange={v=>set('buildingType',v)} />
            <EditField label="Podlaží" value={String(form.buildingFloors??'')} onChange={v=>set('buildingFloors',v)} />
            <EditField label="Vytápění" value={String(form.heatingSystem??'')} onChange={v=>set('heatingSystem',v)} />
            <EditField label="Kotel / značka" value={String(form.boilerBrand??'')} onChange={v=>set('boilerBrand',v)} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.base }}>
            <TouchableOpacity style={ds.deleteBtnSm} onPress={onDelete}><Ionicons name="trash-outline" size={16} color={C.error} /></TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={onClose}><Text style={{ color: C.textSecondary }}>Zrušit</Text></TouchableOpacity>
            <TouchableOpacity style={[ds.createBtn, { flex: 2 }]} onPress={() => onSave({ ...form, updatedAt: nowISO() })}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={ds.createBtnText}>Uložit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Hlavní komponenta ──────────────────────────────────────────────────────────
export default function ObjectDetailScreen({ objectId, onBack, onCreateInspection }: Props) {
  const [obj, setObj]                   = useState<ObjectRecord | null>(null);
  const [tab, setTab]                   = useState<Tab>('info');
  const [inspections, setInspections]   = useState<ObjectInspection[]>([]);
  const [notes, setNotes]               = useState('');
  const [showEdit, setShowEdit]         = useState(false);
  const [selectedInsp, setSelectedInsp] = useState<ObjectInspection | null>(null);

  function load() {
    const o = getObject(objectId); setObj(o);
    if (o) { setNotes(o.notes ?? ''); setInspections(getObjectInspections(objectId)); }
  }
  useEffect(() => { load(); }, [objectId]);

  function saveNotes() {
    if (!obj) return;
    const updated = { ...obj, notes, updatedAt: nowISO() };
    saveObject(updated); setObj(updated); Alert.alert('Uloženo');
  }

  if (!obj) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  return (
    <View style={ds.root}>
      <View style={ds.header}>
        <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="arrow-back-outline" size={20} color={C.textSecondary} />
          <Text style={ds.backText}>Objekty</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: S.md }}>
          <Text style={ds.oid}>{obj.oid}</Text>
          <Text style={ds.headerAddr}>{obj.city}{obj.street ? ` – ${obj.street}` : ''}</Text>
        </View>
        <TouchableOpacity style={ds.gearBtn} onPress={() => setShowEdit(true)}>
          <Ionicons name="settings-outline" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={ds.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[ds.tab, tab === t.key && ds.tabActive]} onPress={() => setTab(t.key)}>
            <Text style={[ds.tabText, tab === t.key && ds.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Info */}
      {tab === 'info' && (
        <ScrollView contentContainerStyle={{ padding: S.base, gap: S.md }}>
          <View style={ds.twoCol}>
            <View style={{ flex: 1, gap: S.md }}>
              <View style={ds.card}>
                <Text style={ds.cardLabel}>MAJITEL</Text>
                <InfoRow label="Jméno" value={`${obj.ownerFirstName} ${obj.ownerLastName}`.trim()} />
                <InfoRow label="Telefon" value={obj.ownerPhone} />
                <InfoRow label="Email" value={obj.ownerEmail} />
                <InfoRow label="Adresa" value={obj.ownerStreet} />
                <InfoRow label="Město" value={`${obj.ownerZip} ${obj.ownerCity}`.trim()} />
              </View>
              <View style={ds.card}>
                <Text style={ds.cardLabel}>INFORMACE O OBJEKTU</Text>
                <InfoRow label="Typ stavby" value={obj.buildingType} />
                <InfoRow label="Podlaží" value={obj.buildingFloors} />
                <InfoRow label="Vytápění" value={obj.heatingSystem} />
                <InfoRow label="Kotel" value={obj.boilerBrand} />
              </View>
            </View>
            <View style={{ flex: 1, gap: S.md }}>
              <View style={ds.card}>
                <Text style={ds.cardLabel}>ADRESA OBJEKTU</Text>
                <InfoRow label="Ulice" value={obj.street} />
                <InfoRow label="Město" value={obj.city} />
                <InfoRow label="PSČ" value={obj.zip} />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Komíny */}
      {tab === 'komin' && <KominyTab objectId={objectId} />}

      {/* Kontrola */}
      {tab === 'kontrola' && (
        <View style={{ flex: 1 }}>
          <View style={{ padding: S.base, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <TouchableOpacity style={ds.createBtn} onPress={() => onCreateInspection(objectId)}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={ds.createBtnText}>Vytvořit zprávu o kontrole</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: S.base, gap: S.sm }}>
            {inspections.length === 0
              ? <View style={ds.empty}><Ionicons name="document-outline" size={40} color={C.textTertiary} /><Text style={ds.emptyText}>Žádné záznamy</Text></View>
              : inspections.map(ins => (
                <TouchableOpacity key={ins.id} style={ds.inspCard} onPress={() => setSelectedInsp(ins)}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={ds.inspNum}>{ins.reportNumber}</Text>
                      <Text style={ds.inspDate}>📅 {formatDate(ins.inspectionDate)}</Text>
                      {ins.formData?.currentTechnicianName ? <Text style={ds.inspDate}>👤 {ins.formData.currentTechnicianName}</Text> : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.sm }}>
                      {/* Datum expirace */}
                      <View style={[ds.expiryBadge, isExpired(ins.inspectionDate) && { backgroundColor: C.error + '20' }]}>
                        <Text style={[ds.expiryText, isExpired(ins.inspectionDate) && { color: C.error }]}>
                          Platí do: {getExpiryDate(ins.inspectionDate)}
                        </Text>
                      </View>
                      {/* Výsledek */}
                      <View style={[ds.resultBadge, { backgroundColor: (RESULT_COLORS[ins.result]??C.textTertiary) + '25' }]}>
                        <Text style={[ds.resultText, { color: RESULT_COLORS[ins.result]??C.textTertiary }]}>{RESULT_LABELS[ins.result]??ins.result}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
                    </View>
                  </View>
                  {ins.notes ? <Text style={ds.inspNotes} numberOfLines={1}>{ins.notes}</Text> : null}
                </TouchableOpacity>
              ))
            }
          </ScrollView>
        </View>
      )}

      {(tab === 'fotky') && (
        <View style={ds.empty}><Ionicons name="images-outline" size={48} color={C.textTertiary} /><Text style={ds.emptyText}>Fotky přijdou v další verzi</Text></View>
      )}

      {tab === 'dokumenty' && (
        <ScrollView contentContainerStyle={{ padding: S.base, gap: S.sm }}>
          {inspections.map(ins => (
            <TouchableOpacity key={ins.id} style={[ds.card, { flexDirection: 'row', alignItems: 'center', gap: S.md }]} onPress={() => setSelectedInsp(ins)}>
              <Ionicons name="document-text-outline" size={24} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.textPrimary, fontWeight: '600', fontSize: F.sm }}>{ins.reportNumber}</Text>
                <Text style={{ color: C.textSecondary, fontSize: F.xs }}>{formatDate(ins.inspectionDate)}</Text>
              </View>
              <View style={[ds.resultBadge, { backgroundColor: (RESULT_COLORS[ins.result]??C.textTertiary) + '20' }]}>
                <Text style={[ds.resultText, { color: RESULT_COLORS[ins.result]??C.textTertiary }]}>{RESULT_LABELS[ins.result]??ins.result}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {inspections.length === 0 && <Text style={{ color: C.textTertiary, textAlign: 'center', paddingTop: 40 }}>Žádné dokumenty</Text>}
        </ScrollView>
      )}

      {tab === 'poznamky' && (
        <View style={{ flex: 1, padding: S.base }}>
          <TextInput style={ds.notesInput} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="Poznámky k objektu…" placeholderTextColor={C.textTertiary} />
          <TouchableOpacity style={[ds.createBtn, { marginTop: S.md }]} onPress={saveNotes}>
            <Ionicons name="save-outline" size={16} color="#fff" />
            <Text style={ds.createBtnText}>Uložit poznámky</Text>
          </TouchableOpacity>
        </View>
      )}

      {showEdit && (
        <EditModal
          obj={obj}
          onSave={(updated) => { saveObject(updated); setObj(updated); setShowEdit(false); }}
          onClose={() => setShowEdit(false)}
          onDelete={() => Alert.alert('Smazat objekt?', `OID: ${obj.oid}`, [
            { text: 'Zrušit', style: 'cancel' },
            { text: 'Smazat', style: 'destructive', onPress: () => { deleteObject(obj.id); onBack(); } }
          ])}
        />
      )}

      {selectedInsp && <InspReportDetail ins={selectedInsp} onClose={() => setSelectedInsp(null)} />}
    </View>
  );
}

const ds = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  backText: { color: C.textSecondary, fontSize: F.sm },
  oid: { color: C.primary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 1.5 },
  headerAddr: { color: C.textSecondary, fontSize: F.sm },
  gearBtn: { padding: 6, borderRadius: R.md, borderWidth: 1, borderColor: C.border },
  tabBar: { flexDirection: 'row', backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  tab: { paddingHorizontal: S.md, paddingVertical: S.sm + 2, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.primary },
  tabText: { color: C.textSecondary, fontSize: F.sm },
  tabTextActive: { color: C.primary, fontWeight: 'bold' },
  twoCol: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  card: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  cardLabel: { color: C.textTertiary, fontSize: F.xs - 1, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: S.sm },
  infoRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border + '50' },
  infoLabel: { color: C.textSecondary, fontSize: F.xs, width: 130 },
  infoValue: { color: C.textPrimary, fontSize: F.xs, flex: 1, fontWeight: '500' },
  metaText: { color: C.textTertiary, fontSize: F.xs },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, paddingVertical: S.xs, borderTopWidth: 1, borderTopColor: C.border + '60' },
  addAppBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: S.sm, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.border + '60' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, borderRadius: R.md, paddingVertical: S.sm + 2, gap: 6 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  inspCard: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border },
  inspNum: { color: C.textPrimary, fontWeight: 'bold', fontSize: F.sm },
  inspDate: { color: C.textSecondary, fontSize: F.xs, marginTop: 2 },
  inspNotes: { color: C.textSecondary, fontSize: F.xs, marginTop: S.xs, fontStyle: 'italic' },
  expiryBadge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.xl, backgroundColor: C.success + '20' },
  expiryText: { fontSize: F.xs, fontWeight: '600', color: C.success },
  resultBadge: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.xl },
  resultText: { fontSize: F.xs, fontWeight: 'bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: S.sm },
  emptyText: { color: C.textSecondary, fontSize: F.md },
  notesInput: { flex: 1, backgroundColor: C.surface, borderRadius: R.md, color: C.textPrimary, padding: S.md, fontSize: F.base, borderWidth: 1, borderColor: C.border },
  modalBg: { flex: 1, backgroundColor: '#000b', justifyContent: 'center', padding: S.lg },
  modal: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, maxHeight: '90%' },
  modalTitle: { color: C.textPrimary, fontSize: F.lg, fontWeight: 'bold' },
  editSection: { color: C.primary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase', marginTop: S.md, marginBottom: S.sm, borderBottomWidth: 1, borderBottomColor: C.primary + '30', paddingBottom: 4 },
  editLabel: { color: C.textSecondary, fontSize: F.xs, marginBottom: S.xs },
  editInput: { backgroundColor: C.surfaceEl, borderRadius: R.md, color: C.textPrimary, paddingHorizontal: S.md, paddingVertical: S.sm, fontSize: F.sm, borderWidth: 1, borderColor: C.border },
  deleteBtnSm: { padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.error, alignItems: 'center', justifyContent: 'center' },
  chipTag: { paddingHorizontal: S.sm, paddingVertical: 2, borderRadius: R.xl },
  appCard: { backgroundColor: C.surfaceEl, borderRadius: R.md, padding: S.sm, marginBottom: S.xs, borderWidth: 1, borderColor: C.border + '60' },
  detailGrid: { gap: 2 },
  dLabel: { color: C.textSecondary, fontSize: F.xs, marginTop: 3, minWidth: 130 },
  dValue: { color: C.textPrimary, fontSize: F.xs, fontWeight: '500' },
  detailModalBg: { flex: 1, backgroundColor: '#000c', justifyContent: 'center', padding: S.md },
  detailModal: { backgroundColor: C.surface, borderRadius: R.xl, padding: S.lg, maxHeight: '92%' },
  detailTitle: { color: C.primary, fontSize: F.xl, fontWeight: 'bold', letterSpacing: 1 },
  detailSection: { color: C.primary, fontSize: F.xs, fontWeight: 'bold', letterSpacing: 1.2, textTransform: 'uppercase', borderBottomWidth: 1, borderBottomColor: C.primary + '30', paddingBottom: 4, marginBottom: S.sm, marginTop: S.sm },
  detailRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border + '40' },
  detailLabel: { color: C.textSecondary, fontSize: F.sm, width: 160 },
  detailValue: { color: C.textPrimary, fontSize: F.sm, flex: 1, fontWeight: '500' },
  resultBig: { paddingHorizontal: S.md, paddingVertical: S.xs, borderRadius: R.md, borderWidth: 2 },
  resultBigText: { fontWeight: 'bold', fontSize: F.sm },
});
