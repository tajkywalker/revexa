import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S, R } from '../theme';
import { getObject, saveObject, deleteObject, ObjectRecord, getObjectInspections, ObjectInspection, InspResult } from '../db/database';
import { uid, nowISO, formatDate } from '../utils';

interface Props { objectId: string; onBack: () => void; onCreateInspection: (objectId: string) => void; }
type Tab = 'info' | 'kontrola' | 'mereni' | 'fotky' | 'dokumenty' | 'poznamky';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Info' }, { key: 'kontrola', label: 'Kontrola' },
  { key: 'mereni', label: 'Měření' }, { key: 'fotky', label: 'Fotky' },
  { key: 'dokumenty', label: 'Dokumenty' }, { key: 'poznamky', label: 'Poznámky' },
];
const RESULT_LABELS: Record<string, string> = {
  vyhovuje: 'VYHOVUJE', podminecne: 'PODMÍNEČNĚ', nevyhovuje: 'NEVYHOVUJE',
  vyhovuje_po_odstraneni: 'VYHOVUJE PO ODSTRANĚNÍ',
};
const RESULT_COLORS: Record<string, string> = {
  vyhovuje: C.success, podminecne: '#FF9F0A', nevyhovuje: C.error,
  vyhovuje_po_odstraneni: '#FF9F0A',
};

// ── Sdílené sub-komponenty (mimo ostatní komponenty!) ──────────────────────────
function InfoRow({ label, value }: { label: string; value: string | number }) {
  if (!value) return null;
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

// ── Hlavní komponenta ──────────────────────────────────────────────────────────
export default function ObjectDetailScreen({ objectId, onBack, onCreateInspection }: Props) {
  const [obj, setObj]                 = useState<ObjectRecord | null>(null);
  const [tab, setTab]                 = useState<Tab>('info');
  const [inspections, setInspections] = useState<ObjectInspection[]>([]);
  const [notes, setNotes]             = useState('');
  const [showEdit, setShowEdit]       = useState(false);

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
                <InfoRow label="Systém vytápění" value={obj.heatingSystem} />
                <InfoRow label="Kotel / značka" value={obj.boilerBrand} />
              </View>
            </View>
            <View style={{ flex: 1, gap: S.md }}>
              <View style={ds.card}>
                <Text style={ds.cardLabel}>SPALINOVÁ CESTA</Text>
                <InfoRow label="Typ" value={obj.flueType} />
                <InfoRow label="Výška" value={obj.flueHeight > 0 ? `${obj.flueHeight} m` : ''} />
                <InfoRow label="Průměr" value={obj.flueDiameter > 0 ? `${obj.flueDiameter} mm` : ''} />
                <InfoRow label="Počet spotřebičů" value={obj.numAppliances > 0 ? `${obj.numAppliances}×` : ''} />
                <InfoRow label="Umístění spotřebiče" value={obj.applianceLocation} />
                <InfoRow label="Vybírací dvířka" value={obj.cleaningDoorLocation} />
                <InfoRow label="Č. revizní zprávy" value={obj.revisionNumber} />
              </View>
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
              ? <View style={ds.empty}><Ionicons name="document-outline" size={40} color={C.textTertiary} /><Text style={ds.emptyText}>Žádné záznamy o kontrolách</Text></View>
              : inspections.map(ins => (
                <View key={ins.id} style={ds.inspCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.xs }}>
                    <Text style={ds.inspNum}>{ins.reportNumber}</Text>
                    <View style={[ds.resultBadge, { backgroundColor: (RESULT_COLORS[ins.result] ?? C.textTertiary) + '25' }]}>
                      <Text style={[ds.resultText, { color: RESULT_COLORS[ins.result] ?? C.textTertiary }]}>{RESULT_LABELS[ins.result] ?? ins.result}</Text>
                    </View>
                  </View>
                  <Text style={ds.inspDate}>📅 {formatDate(ins.inspectionDate)}</Text>
                  {ins.notes ? <Text style={ds.inspNotes}>{ins.notes}</Text> : null}
                </View>
              ))
            }
          </ScrollView>
        </View>
      )}

      {(tab === 'mereni' || tab === 'fotky') && (
        <View style={ds.empty}>
          <Ionicons name={tab === 'fotky' ? 'images-outline' : 'analytics-outline'} size={48} color={C.textTertiary} />
          <Text style={ds.emptyText}>{tab === 'fotky' ? 'Fotky' : 'Měření'} budou přidány v další verzi</Text>
        </View>
      )}

      {tab === 'dokumenty' && (
        <ScrollView contentContainerStyle={{ padding: S.base, gap: S.sm }}>
          {inspections.map(ins => (
            <View key={ins.id} style={[ds.card, { flexDirection: 'row', alignItems: 'center', gap: S.md }]}>
              <Ionicons name="document-text-outline" size={24} color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.textPrimary, fontWeight: '600', fontSize: F.sm }}>{ins.reportNumber}</Text>
                <Text style={{ color: C.textSecondary, fontSize: F.xs }}>{formatDate(ins.inspectionDate)}</Text>
              </View>
              <View style={[ds.resultBadge, { backgroundColor: (RESULT_COLORS[ins.result] ?? C.textTertiary) + '20' }]}>
                <Text style={[ds.resultText, { color: RESULT_COLORS[ins.result] ?? C.textTertiary }]}>{RESULT_LABELS[ins.result] ?? ins.result}</Text>
              </View>
            </View>
          ))}
          {inspections.length === 0 && <Text style={{ color: C.textTertiary, textAlign: 'center', paddingTop: 40 }}>Žádné dokumenty</Text>}
        </ScrollView>
      )}

      {tab === 'poznamky' && (
        <View style={{ flex: 1, padding: S.base }}>
          <TextInput style={ds.notesInput} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="Poznámky k objektu..." placeholderTextColor={C.textTertiary} />
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
            { text: 'Smazat', style: 'destructive', onPress: () => { deleteObject(obj.id); onBack(); } },
          ])}
        />
      )}
    </View>
  );
}

// ── Modal: Editace (EditField mimo EditModal!) ─────────────────────────────────
function EditModal({ obj, onSave, onClose, onDelete }: { obj: ObjectRecord; onSave: (o: ObjectRecord) => void; onClose: () => void; onDelete: () => void }) {
  const [form, setForm] = useState({ ...obj });
  const set = (k: keyof ObjectRecord, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Modal visible animationType="slide" transparent>
      <View style={ds.modalBg}>
        <View style={ds.modal}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.base }}>
            <Text style={ds.modalTitle}>Upravit objekt · {obj.oid}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={C.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={ds.editSection}>ADRESA OBJEKTU</Text>
            <EditField label="Ulice a číslo" value={String(form.street ?? '')} onChange={v => set('street', v)} />
            <EditField label="Město / obec" value={String(form.city ?? '')} onChange={v => set('city', v)} />
            <EditField label="PSČ" value={String(form.zip ?? '')} onChange={v => set('zip', v)} />
            <Text style={ds.editSection}>MAJITEL</Text>
            <EditField label="Jméno" value={String(form.ownerFirstName ?? '')} onChange={v => set('ownerFirstName', v)} />
            <EditField label="Příjmení" value={String(form.ownerLastName ?? '')} onChange={v => set('ownerLastName', v)} />
            <EditField label="Telefon" value={String(form.ownerPhone ?? '')} onChange={v => set('ownerPhone', v)} keyType="phone-pad" />
            <EditField label="Email" value={String(form.ownerEmail ?? '')} onChange={v => set('ownerEmail', v)} />
            <EditField label="Adresa majitele" value={String(form.ownerStreet ?? '')} onChange={v => set('ownerStreet', v)} />
            <EditField label="Město majitele" value={String(form.ownerCity ?? '')} onChange={v => set('ownerCity', v)} />
            <EditField label="PSČ majitele" value={String(form.ownerZip ?? '')} onChange={v => set('ownerZip', v)} />
            <Text style={ds.editSection}>INFORMACE O OBJEKTU</Text>
            <EditField label="Typ stavby" value={String(form.buildingType ?? '')} onChange={v => set('buildingType', v)} />
            <EditField label="Počet podlaží" value={String(form.buildingFloors ?? '')} onChange={v => set('buildingFloors', v)} />
            <EditField label="Systém vytápění" value={String(form.heatingSystem ?? '')} onChange={v => set('heatingSystem', v)} />
            <EditField label="Kotel / značka" value={String(form.boilerBrand ?? '')} onChange={v => set('boilerBrand', v)} />
            <Text style={ds.editSection}>SPALINOVÁ CESTA</Text>
            <EditField label="Typ" value={String(form.flueType ?? '')} onChange={v => set('flueType', v)} />
            <EditField label="Výška (m)" value={String(form.flueHeight ?? '')} onChange={v => set('flueHeight', v)} keyType="decimal-pad" />
            <EditField label="Průměr (mm)" value={String(form.flueDiameter ?? '')} onChange={v => set('flueDiameter', v)} keyType="number-pad" />
            <EditField label="Počet spotřebičů" value={String(form.numAppliances ?? '')} onChange={v => set('numAppliances', v)} keyType="number-pad" />
            <EditField label="Umístění spotřebiče" value={String(form.applianceLocation ?? '')} onChange={v => set('applianceLocation', v)} />
            <EditField label="Vybírací dvířka" value={String(form.cleaningDoorLocation ?? '')} onChange={v => set('cleaningDoorLocation', v)} />
            <EditField label="Číslo revizní zprávy" value={String(form.revisionNumber ?? '')} onChange={v => set('revisionNumber', v)} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: S.sm, marginTop: S.base }}>
            <TouchableOpacity style={ds.deleteBtnSm} onPress={onDelete}>
              <Ionicons name="trash-outline" size={16} color={C.error} />
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: S.md, borderRadius: R.md, borderWidth: 1, borderColor: C.border, alignItems: 'center' }} onPress={onClose}>
              <Text style={{ color: C.textSecondary }}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[ds.createBtn, { flex: 2 }]} onPress={() => onSave({ ...form, updatedAt: nowISO() })}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={ds.createBtnText}>Uložit změny</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  infoLabel: { color: C.textSecondary, fontSize: F.xs, width: 140 },
  infoValue: { color: C.textPrimary, fontSize: F.xs, flex: 1, fontWeight: '500' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.primary, borderRadius: R.md, paddingVertical: S.sm + 2, gap: 6 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  inspCard: { backgroundColor: C.surface, borderRadius: R.md, padding: S.md, borderWidth: 1, borderColor: C.border },
  inspNum: { color: C.textPrimary, fontWeight: 'bold', fontSize: F.sm },
  inspDate: { color: C.textSecondary, fontSize: F.xs, marginTop: 2 },
  inspNotes: { color: C.textSecondary, fontSize: F.xs, marginTop: S.xs, fontStyle: 'italic' },
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
});
