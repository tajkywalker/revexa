import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, PanResponder, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';
import { getOrder, saveOrder, deleteOrder, Order, getCustomer, Customer, getChimneys, Chimney, getInspection, saveInspection, Inspection, CheckItem, DEFAULT_CHECK_ITEMS } from '../db/database';
import { formatDate, formatCurrency, STATUS_LABELS, STATUS_COLORS, nowISO, todayISO, uid } from '../utils';

interface Props { orderId: string; onBack: () => void; onSelectCustomer: (id: string) => void; }
type Tab = 'kontrola' | 'poznamky' | 'fotky';

const CHECK_RESULTS: {key: CheckItem['result']; label: string; color: string}[] = [
  {key:'vyhovuje',label:'✓',color:C.success},{key:'nevyhovuje',label:'✗',color:C.error},{key:'nelze_posoudit',label:'?',color:C.warning},{key:'neuvedeno',label:'○',color:C.textTertiary},
];
const OVERALL: {key: Inspection['overallResult']; label: string; color: string}[] = [
  {key:'vyhovuje',label:'VYHOVUJE',color:C.success},{key:'podminecne',label:'PODMÍNEČNĚ',color:C.warning},{key:'nevyhovuje',label:'NEVYHOVUJE',color:C.error},
];
const STATUSES: Order['status'][] = ['nova','probihajici','dokoncena','zrusena'];

export default function OrderDetailScreen({ orderId, onBack, onSelectCustomer }: Props) {
  const [order, setOrder] = useState<Order|null>(null);
  const [customer, setCustomer] = useState<Customer|null>(null);
  const [chimneys, setChimneys] = useState<Chimney[]>([]);
  const [tab, setTab] = useState<Tab>('kontrola');
  const [checkItems, setCheckItems] = useState<CheckItem[]>(DEFAULT_CHECK_ITEMS.map(ci=>({...ci})));
  const [overallResult, setOverallResult] = useState<Inspection['overallResult']>('vyhovuje');
  const [coValue, setCoValue] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [existingId, setExistingId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [sigPaths, setSigPaths] = useState<{x:number;y:number}[][]>([]);
  const [sigCurrent, setSigCurrent] = useState<{x:number;y:number}[]>([]);
  const [sigSaved, setSigSaved] = useState(false);

  const load = useCallback(() => {
    const o = getOrder(orderId); setOrder(o);
    if (!o) return;
    const c = getCustomer(o.customerId); setCustomer(c);
    if (c) setChimneys(getChimneys(c.id));
    const ins = getInspection(orderId);
    if (ins) { setExistingId(ins.id); setCheckItems(ins.checkItems); setOverallResult(ins.overallResult); setCoValue(ins.coMeasurement!=null?String(ins.coMeasurement):''); setNotes(ins.notes??''); setRecommendations(ins.recommendations??''); if(ins.signatureBase64)setSigSaved(true); }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder:()=>true, onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:(e)=>{ const{locationX,locationY}=e.nativeEvent; setSigCurrent([{x:locationX,y:locationY}]); },
    onPanResponderMove:(e)=>{ const{locationX,locationY}=e.nativeEvent; setSigCurrent(p=>[...p,{x:locationX,y:locationY}]); },
    onPanResponderRelease:()=>{ if(sigCurrent.length>1)setSigPaths(p=>[...p,sigCurrent]); setSigCurrent([]); },
  });

  function changeStatus(status: Order['status']) {
    if(!order) return;
    const u={...order,status,updatedAt:nowISO(),completedAt:status==='dokoncena'?nowISO():order.completedAt};
    saveOrder(u); setOrder(u);
  }

  async function saveReport() {
    if(!order) return; setSaving(true);
    try {
      const ins: Inspection = { id:existingId??uid(), orderId:order.id, chimneyId:order.chimneyId??'', reportNumber:`ZP-${order.orderNumber.replace('#','')}`, inspectionDate:todayISO(), checkItems, overallResult, coMeasurement:coValue?parseFloat(coValue):undefined, notes, recommendations, signatureBase64:(sigPaths.length>0||sigSaved)?'signed':undefined, createdAt:nowISO() };
      saveInspection(ins); setExistingId(ins.id);
      if(order.status==='nova'){const u={...order,status:'probihajici' as Order['status'],updatedAt:nowISO()};saveOrder(u);setOrder(u);}
      Alert.alert('✓ Uloženo','Zpráva z kontroly byla uložena.');
    } finally { setSaving(false); }
  }

  if(!order) return <View style={{flex:1,backgroundColor:C.bg}} />;
  const rc=OVERALL.find(r=>r.key===overallResult)?.color??C.success;
  const rl=OVERALL.find(r=>r.key===overallResult)?.label??'—';

  return (
    <View style={s.root}>
      {/* ══ LEVÝ SLOUPEC ══ */}
      <View style={s.left}>
        <View style={s.leftHead}>
          <TouchableOpacity onPress={onBack}><Text style={s.backText}>← Zakázky</Text></TouchableOpacity>
          <Text style={s.orderNum}>{order.orderNumber}</Text>
          <View style={[s.badge,{backgroundColor:STATUS_COLORS[order.status]+'30'}]}><Text style={[s.badgeText,{color:STATUS_COLORS[order.status]}]}>{STATUS_LABELS[order.status]}</Text></View>
          <Text style={s.orderDate}>📅 {formatDate(order.scheduledDate)}</Text>
        </View>
        <ScrollView contentContainerStyle={{padding:S.md,gap:S.md}}>
          {customer&&<View style={s.card}><Text style={s.cl}>ZÁKAZNÍK</Text><Text style={s.cv}>{customer.firstName} {customer.lastName}</Text>{customer.street?<Text style={s.cs}>{customer.street}</Text>:null}{customer.city?<Text style={s.cs}>{customer.zip} {customer.city}</Text>:null}{customer.phone?<Text style={s.cs}>📞 {customer.phone}</Text>:null}{customer.email?<Text style={s.cs}>✉️  {customer.email}</Text>:null}<TouchableOpacity style={{marginTop:S.sm}} onPress={()=>onSelectCustomer(customer.id)}><Text style={{color:C.primary,fontSize:F.xs}}>Zobrazit zákazníka →</Text></TouchableOpacity></View>}
          {chimneys.length>0&&<View style={s.card}><Text style={s.cl}>SPALINOVÁ CESTA</Text>{chimneys.map(ch=><View key={ch.id} style={{marginBottom:S.xs}}><Text style={s.cv}>{ch.label}</Text>{ch.type?<Text style={s.cm}>Typ: {ch.type}</Text>:null}{ch.fuel?<Text style={s.cm}>Palivo: {ch.fuel}</Text>:null}</View>)}</View>}
          {order.address?<View style={s.card}><Text style={s.cl}>ADRESA</Text><Text style={s.cs}>📍 {order.address}</Text>{order.price>0?<Text style={s.cs}>💰 {formatCurrency(order.price)}</Text>:null}</View>:null}
          <View style={s.card}>
            <Text style={s.cl}>STAV ZAKÁZKY</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:S.xs}}>
              {STATUSES.map(st=><TouchableOpacity key={st} style={[s.stBtn,order.status===st&&{backgroundColor:STATUS_COLORS[st]+'25',borderColor:STATUS_COLORS[st]}]} onPress={()=>changeStatus(st)}><Text style={[s.stBtnText,order.status===st&&{color:STATUS_COLORS[st],fontWeight:'bold'}]}>{STATUS_LABELS[st]}</Text></TouchableOpacity>)}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* ══ STŘEDNÍ SLOUPEC ══ */}
      <View style={s.center}>
        <View style={s.tabs}>
          {([['kontrola','Kontrola'],['poznamky','Poznámky'],['fotky','Fotky']] as [Tab,string][]).map(([k,l])=>(
            <TouchableOpacity key={k} style={[s.tab,tab===k&&s.tabActive]} onPress={()=>setTab(k)}><Text style={[s.tabText,tab===k&&s.tabTextActive]}>{l}</Text></TouchableOpacity>
          ))}
        </View>
        {tab==='kontrola'&&<ScrollView contentContainerStyle={{padding:S.base,gap:S.sm}}>
          <Text style={s.cl}>KONTROLNÍ BODY</Text>
          {checkItems.map(item=>(
            <View key={item.id} style={s.chkRow}>
              <Text style={s.chkLabel}>{item.label}</Text>
              <View style={{flexDirection:'row',gap:4}}>
                {CHECK_RESULTS.map(r=><TouchableOpacity key={r.key} style={[s.chkBtn,item.result===r.key&&{backgroundColor:r.color+'30',borderColor:r.color}]} onPress={()=>setCheckItems(p=>p.map(ci=>ci.id===item.id?{...ci,result:r.key}:ci))}><Text style={[s.chkBtnText,{color:item.result===r.key?r.color:C.textTertiary}]}>{r.label}</Text></TouchableOpacity>)}
              </View>
            </View>
          ))}
          <View style={{height:1,backgroundColor:C.border,marginVertical:S.sm}} />
          <Text style={s.cl}>MĚŘENÍ CO</Text>
          <View style={{flexDirection:'row',alignItems:'center',gap:S.sm}}><TextInput style={[s.input,{width:100}]} value={coValue} onChangeText={setCoValue} keyboardType="numeric" placeholder="ppm" placeholderTextColor={C.textTertiary} /><Text style={{color:C.textSecondary,fontSize:F.sm}}>ppm CO ve spalinách</Text></View>
          <View style={{height:1,backgroundColor:C.border,marginVertical:S.sm}} />
          <Text style={s.cl}>CELKOVÝ VÝSLEDEK</Text>
          <View style={{flexDirection:'row',gap:S.sm}}>
            {OVERALL.map(r=><TouchableOpacity key={r.key} style={[s.ovBtn,overallResult===r.key&&{backgroundColor:r.color+'25',borderColor:r.color,borderWidth:2}]} onPress={()=>setOverallResult(r.key)}><Text style={[s.ovText,{color:overallResult===r.key?r.color:C.textSecondary}]}>{r.label}</Text></TouchableOpacity>)}
          </View>
        </ScrollView>}
        {tab==='poznamky'&&<ScrollView contentContainerStyle={{padding:S.base,gap:S.md}}>
          <Text style={s.cl}>POZNÁMKY</Text>
          <TextInput style={[s.input,{minHeight:120,textAlignVertical:'top'}]} value={notes} onChangeText={setNotes} multiline placeholder="Popis stavu, závady..." placeholderTextColor={C.textTertiary} />
          <Text style={s.cl}>DOPORUČENÍ</Text>
          <TextInput style={[s.input,{minHeight:100,textAlignVertical:'top'}]} value={recommendations} onChangeText={setRecommendations} multiline placeholder="Doporučení zákazníkovi..." placeholderTextColor={C.textTertiary} />
        </ScrollView>}
        {tab==='fotky'&&<View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:48}}>📷</Text><Text style={{color:C.textTertiary,fontSize:F.md,marginTop:S.sm}}>Fotky přijdou v další verzi</Text></View>}
      </View>

      {/* ══ PRAVÝ SLOUPEC ══ */}
      <View style={s.right}>
        <ScrollView contentContainerStyle={{padding:S.md,gap:S.md}}>
          <View style={[s.card,{borderColor:rc+'60',backgroundColor:rc+'15'}]}>
            <Text style={s.cl}>VÝSLEDEK KONTROLY</Text>
            <View style={{flexDirection:'row',alignItems:'center',gap:S.sm,marginTop:S.xs}}>
              <View style={{width:44,height:44,borderRadius:22,backgroundColor:rc+'30',alignItems:'center',justifyContent:'center'}}><Text style={{color:rc,fontSize:20,fontWeight:'bold'}}>{overallResult==='vyhovuje'?'✓':overallResult==='nevyhovuje'?'✗':'!'}</Text></View>
              <View><Text style={{fontSize:F.lg,fontWeight:'bold',color:rc}}>{rl}</Text><Text style={{color:C.textSecondary,fontSize:F.xs,marginTop:2}}>{overallResult==='vyhovuje'?'Způsobilá k provozu':overallResult==='nevyhovuje'?'Nezpůsobilá k provozu':'Podmínečně způsobilá'}</Text></View>
            </View>
          </View>
          <View style={s.card}>
            <Text style={s.cl}>PODPIS ZÁKAZNÍKA</Text>
            {sigSaved&&sigPaths.length===0
              ?<View style={{alignItems:'center',paddingVertical:S.lg}}><Text style={{color:C.success,fontSize:F.lg,fontWeight:'bold'}}>✓ Podpis uložen</Text><TouchableOpacity style={s.clearBtn} onPress={()=>{setSigPaths([]);setSigCurrent([]);setSigSaved(false);}}><Text style={s.clearBtnText}>Podepsat znovu</Text></TouchableOpacity></View>
              :<><View style={s.sigCanvas} {...panResponder.panHandlers}>
                {[...sigPaths,sigCurrent].map((path,pi)=>path.slice(1).map((pt,i)=>{const prev=path[i];const dx=pt.x-prev.x;const dy=pt.y-prev.y;const len=Math.sqrt(dx*dx+dy*dy);const angle=Math.atan2(dy,dx)*180/Math.PI;return <View key={`${pi}-${i}`} style={{position:'absolute',left:prev.x,top:prev.y-1.5,width:len,height:3,backgroundColor:'#fff',borderRadius:2,transform:[{rotate:`${angle}deg`}]}} />;}))}
              </View><TouchableOpacity style={[s.clearBtn,{marginTop:S.sm}]} onPress={()=>{setSigPaths([]);setSigCurrent([]);setSigSaved(false);}}><Text style={s.clearBtnText}>VYMAZAT</Text></TouchableOpacity></>
            }
          </View>
          <View style={s.card}>
            <Text style={s.cl}>AKCE</Text>
            <TouchableOpacity style={[s.actionBtn,{backgroundColor:C.primary}]} onPress={saveReport} disabled={saving}><Text style={s.actionBtnText}>{saving?'Ukládám...':'✓  ULOŽIT ZPRÁVU'}</Text></TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,{backgroundColor:C.surfaceEl,marginTop:S.sm}]} onPress={()=>Alert.alert('Dokončit zakázku?','',[{text:'Zrušit',style:'cancel'},{text:'Dokončit',onPress:()=>changeStatus('dokoncena')}])}><Text style={[s.actionBtnText,{color:C.success}]}>◎  ULOŽIT A UZAVŘÍT</Text></TouchableOpacity>
            <TouchableOpacity style={[s.actionBtn,{backgroundColor:C.error+'20',marginTop:S.sm,borderWidth:1,borderColor:C.error}]} onPress={()=>Alert.alert('Smazat zakázku?','Tato akce je nevratná.',[{text:'Zrušit',style:'cancel'},{text:'Smazat',style:'destructive',onPress:()=>{deleteOrder(order.id);onBack();}}])}><Text style={[s.actionBtnText,{color:C.error}]}>🗑  SMAZAT ZAKÁZKU</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,flexDirection:'row',backgroundColor:C.bg},
  left:{width:250,borderRightWidth:1,borderRightColor:C.border,flexDirection:'column'},
  leftHead:{padding:S.md,borderBottomWidth:1,borderBottomColor:C.border,gap:4},
  backText:{color:C.textSecondary,fontSize:F.xs},
  orderNum:{color:C.primary,fontSize:F.xl,fontWeight:'bold'},
  badge:{alignSelf:'flex-start',paddingHorizontal:S.sm,paddingVertical:2,borderRadius:R.xl},
  badgeText:{fontSize:F.xs,fontWeight:'bold'},
  orderDate:{color:C.textSecondary,fontSize:F.xs},
  card:{backgroundColor:C.surface,borderRadius:R.lg,padding:S.sm,borderWidth:1,borderColor:C.border},
  cl:{color:C.textTertiary,fontSize:F.xs-1,fontWeight:'bold',letterSpacing:1,textTransform:'uppercase',marginBottom:S.xs},
  cv:{color:C.textPrimary,fontSize:F.sm,fontWeight:'600'},
  cs:{color:C.textSecondary,fontSize:F.xs,marginTop:2},
  cm:{color:C.textTertiary,fontSize:F.xs},
  stBtn:{paddingHorizontal:S.sm,paddingVertical:4,borderRadius:R.sm,borderWidth:1,borderColor:C.border},
  stBtnText:{color:C.textSecondary,fontSize:F.xs},
  center:{flex:1,borderRightWidth:1,borderRightColor:C.border},
  tabs:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:C.border,backgroundColor:C.surface},
  tab:{paddingHorizontal:S.base,paddingVertical:S.sm+2,borderBottomWidth:2,borderBottomColor:'transparent'},
  tabActive:{borderBottomColor:C.primary},
  tabText:{color:C.textSecondary,fontSize:F.sm},
  tabTextActive:{color:C.primary,fontWeight:'bold'},
  chkRow:{flexDirection:'row',alignItems:'center',paddingVertical:S.xs,borderBottomWidth:1,borderBottomColor:C.border+'80',gap:S.sm},
  chkLabel:{flex:1,color:C.textPrimary,fontSize:F.sm},
  chkBtn:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border,backgroundColor:C.surfaceEl},
  chkBtnText:{fontSize:14,fontWeight:'bold'},
  ovBtn:{flex:1,paddingVertical:S.sm,borderRadius:R.md,borderWidth:1,borderColor:C.border,alignItems:'center',backgroundColor:C.surfaceEl},
  ovText:{fontSize:F.xs,fontWeight:'bold'},
  input:{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.sm,borderWidth:1,borderColor:C.border},
  right:{width:260},
  sigCanvas:{height:160,backgroundColor:C.surfaceEl,borderRadius:R.md,borderWidth:1,borderColor:C.border,overflow:'hidden'},
  clearBtn:{paddingHorizontal:S.md,paddingVertical:S.xs,borderRadius:R.md,borderWidth:1,borderColor:C.border,alignSelf:'flex-start'},
  clearBtnText:{color:C.textSecondary,fontSize:F.xs},
  actionBtn:{borderRadius:R.md,paddingVertical:S.md,alignItems:'center'},
  actionBtnText:{color:'#fff',fontWeight:'bold',fontSize:F.sm},
});
