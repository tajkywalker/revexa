import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { getCustomer, saveCustomer, deleteCustomer, Customer, getOrdersByCustomer, Order, saveObject, generateOID, ObjectRecord, getObjectsByCustomer } from '../db/database';
import { uid, nowISO, formatDate, STATUS_LABELS, STATUS_COLORS } from '../utils';

interface Props { customerId?: string; onBack: () => void; onSelectOrder: (id: string) => void; onSelectObject?: (id: string) => void; }

const FIELDS: [keyof Customer, string][] = [['firstName','Jméno *'],['lastName','Příjmení *'],['phone','Telefon'],['email','Email'],['street','Ulice a číslo'],['city','Město'],['zip','PSČ']];

export default function CustomerDetailScreen({ customerId, onBack, onSelectOrder, onSelectObject }: Props) {
  const isNew = !customerId;
  const [customer, setCustomer] = useState<Customer>({ id:uid(), firstName:'', lastName:'', phone:'', email:'', street:'', city:'', zip:'', note:'', createdAt:nowISO() });
  const [objects, setObjects] = useState<ObjectRecord[]>([]);
  const [orders, setOrders]   = useState<Order[]>([]);

  useEffect(() => {
    if (!isNew && customerId) {
      const c = getCustomer(customerId);
      if (c) {
        setCustomer(c);
        setObjects(getObjectsByCustomer(c.id));
        setOrders(getOrdersByCustomer(c.id));
      }
    }
  }, [customerId]);

  function save() {
    if (!customer.firstName || !customer.lastName) { Alert.alert('Chyba','Zadejte jméno a příjmení'); return; }
    saveCustomer(customer);
    if (isNew) {
      Alert.alert('Zákazník vytvořen', 'Chcete automaticky vytvořit propojený objekt se stejnou adresou?', [
        { text: 'Ne', onPress: () => onBack() },
        { text: 'Ano, vytvořit objekt', onPress: () => {
          const now = nowISO();
          const obj: ObjectRecord = {
            id: uid(), oid: generateOID(),
            street: customer.street, city: customer.city, zip: customer.zip,
            ownerFirstName: customer.firstName, ownerLastName: customer.lastName,
            ownerPhone: customer.phone, ownerEmail: customer.email,
            ownerStreet: customer.street, ownerCity: customer.city, ownerZip: customer.zip,
            buildingType: '', buildingFloors: '', heatingSystem: '', boilerBrand: '',
            flueType: '', flueHeight: 0, flueDiameter: 0, numAppliances: 0,
            applianceLocation: '', cleaningDoorLocation: '', revisionNumber: '',
            notes: '', customerId: customer.id, createdAt: now, updatedAt: now,
          };
          saveObject(obj);
          if (onSelectObject) onSelectObject(obj.id); else onBack();
        }},
      ]);
    } else Alert.alert('Uloženo','Informace byly uloženy.');
  }

  function createLinkedObject() {
    const now = nowISO();
    const obj: ObjectRecord = {
      id: uid(), oid: generateOID(),
      street: customer.street, city: customer.city, zip: customer.zip,
      ownerFirstName: customer.firstName, ownerLastName: customer.lastName,
      ownerPhone: customer.phone, ownerEmail: customer.email,
      ownerStreet: customer.street, ownerCity: customer.city, ownerZip: customer.zip,
      buildingType: '', buildingFloors: '', heatingSystem: '', boilerBrand: '',
      flueType: '', flueHeight: 0, flueDiameter: 0, numAppliances: 0,
      applianceLocation: '', cleaningDoorLocation: '', revisionNumber: '',
      notes: '', customerId: customer.id, createdAt: now, updatedAt: now,
    };
    saveObject(obj);
    setObjects(prev => [...prev, obj]);
    if (onSelectObject) onSelectObject(obj.id);
  }

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Zpět</Text></TouchableOpacity>
        <Text style={s.title}>{isNew ? 'Nový zákazník' : `${customer.firstName} ${customer.lastName}`}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding:S.base, gap:S.md }}>
        <View style={s.card}>
          <Text style={s.cardLabel}>OSOBNÍ ÚDAJE</Text>
          {FIELDS.map(([f,l]) => (
            <View key={f} style={{ marginBottom:S.sm }}>
              <Text style={s.label}>{l}</Text>
              <TextInput style={s.input} value={customer[f] as string} onChangeText={v => setCustomer(p=>({...p,[f]:v}))} placeholder={l.replace(' *','')} placeholderTextColor={C.textTertiary} keyboardType={f==='phone'?'phone-pad':f==='email'?'email-address':'default'} autoCapitalize={f==='email'?'none':'words'} />
            </View>
          ))}
          <Text style={s.label}>Poznámka</Text>
          <TextInput style={[s.input,{minHeight:64}]} value={customer.note} onChangeText={v => setCustomer(p=>({...p,note:v}))} multiline textAlignVertical="top" placeholder="Interní poznámky..." placeholderTextColor={C.textTertiary} />
        </View>
        <TouchableOpacity style={s.primaryBtn} onPress={save}><Text style={s.primaryBtnText}>{isNew ? '+ Vytvořit zákazníka' : '✓ Uložit změny'}</Text></TouchableOpacity>
        {!isNew && (
          <View style={s.card}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:S.sm }}>
              <Text style={s.cardLabel}>PROPOJENÉ OBJEKTY ({objects.length})</Text>
              <TouchableOpacity onPress={createLinkedObject} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
                <Ionicons name="add" size={14} color={C.primary} />
                <Text style={{ color:C.primary, fontSize:F.sm }}>Přidat objekt</Text>
              </TouchableOpacity>
            </View>
            {objects.length === 0
              ? <Text style={{ color:C.textTertiary, fontSize:F.sm, textAlign:'center', paddingVertical:S.md }}>
                  Žádné propojené objekty.{'\n'}Klikněte „Přidat objekt" pro vytvoření.
                </Text>
              : objects.map((obj, i) => (
                <TouchableOpacity key={obj.id} style={[s.chRow, i>0&&{borderTopWidth:1,borderTopColor:C.border}]} onPress={() => onSelectObject?.(obj.id)}>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:S.sm }}>
                      <View style={s.oidTag}><Text style={s.oidText}>{obj.oid}</Text></View>
                      <Text style={{ color:C.textPrimary, fontSize:F.sm, fontWeight:'600' }}>
                        {obj.city}{obj.street ? ` – ${obj.street}` : ''}
                      </Text>
                    </View>
                    {obj.buildingType ? <Text style={{ color:C.textTertiary, fontSize:F.xs, marginTop:2 }}>{obj.buildingType}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.textTertiary} />
                </TouchableOpacity>
              ))
            }
          </View>
        )}
        {!isNew && orders.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>HISTORIE ZAKÁZEK ({orders.length})</Text>
            {orders.map((o,i) => (
              <TouchableOpacity key={o.id} style={[s.orderRow, i>0&&{borderTopWidth:1,borderTopColor:C.border}]} onPress={() => onSelectOrder(o.id)}>
                <View style={[s.statusDot,{backgroundColor:STATUS_COLORS[o.status]}]} />
                <View style={{ flex:1 }}><Text style={{ color:C.textPrimary, fontSize:F.sm, fontWeight:'600' }}>{o.orderNumber} — {formatDate(o.scheduledDate)}</Text><Text style={{ color:C.textSecondary, fontSize:F.xs }}>{STATUS_LABELS[o.status]}</Text></View>
                <Text style={{ color:C.textTertiary, fontSize:F.xs }}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {!isNew && <TouchableOpacity style={s.deleteBtn} onPress={() => Alert.alert('Smazat zákazníka?','',[{text:'Zrušit',style:'cancel'},{text:'Smazat',style:'destructive',onPress:()=>{deleteCustomer(customer.id);onBack();}}])}><Text style={{ color:C.error, fontSize:F.sm }}>Smazat zákazníka</Text></TouchableOpacity>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:{ flexDirection:'row', alignItems:'center', gap:S.md, padding:S.base, borderBottomWidth:1, borderBottomColor:C.border },
  backText:{ color:C.textSecondary, fontSize:F.sm },
  title:{ color:C.textPrimary, fontSize:F.xl, fontWeight:'bold', flex:1 },
  card:{ backgroundColor:C.surface, borderRadius:R.lg, padding:S.md, borderWidth:1, borderColor:C.border },
  cardLabel:{ color:C.textTertiary, fontSize:F.xs, fontWeight:'bold', letterSpacing:1, textTransform:'uppercase', marginBottom:S.sm },
  label:{ color:C.textSecondary, fontSize:F.xs, marginBottom:S.xs },
  input:{ backgroundColor:C.surfaceEl, borderRadius:R.md, color:C.textPrimary, paddingHorizontal:S.md, paddingVertical:S.sm, fontSize:F.base, borderWidth:1, borderColor:C.border },
  inputSm:{ backgroundColor:C.bg, borderRadius:R.sm, color:C.textPrimary, paddingHorizontal:S.sm, paddingVertical:S.xs, fontSize:F.sm, borderWidth:1, borderColor:C.border },
  chRow:{ flexDirection:'row', alignItems:'center', paddingVertical:S.sm, gap:S.sm },
  orderRow:{ flexDirection:'row', alignItems:'center', paddingVertical:S.sm, gap:S.sm },
  statusDot:{ width:8, height:8, borderRadius:4 },
  primaryBtn:{ backgroundColor:C.primary, borderRadius:R.md, padding:S.md, alignItems:'center' },
  primaryBtnText:{ color:'#fff', fontWeight:'bold', fontSize:F.md },
  deleteBtn:{ borderRadius:R.md, padding:S.md, alignItems:'center', borderWidth:1, borderColor:C.error },
  oidTag:{ backgroundColor:C.primary+'20', borderRadius:R.sm, paddingHorizontal:S.xs, paddingVertical:1, borderWidth:1, borderColor:C.primary+'40' },
  oidText:{ color:C.primary, fontWeight:'bold', fontSize:F.xs, letterSpacing:0.5 },
});
