import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, PanResponder } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getOrder, saveOrder, getInspection, saveInspection, Inspection, CheckItem, DEFAULT_CHECK_ITEMS } from '../db/database';
import { uid, nowISO, todayISO } from '../utils';
import { RootStackParamList } from '../App';

type Route = RouteProp<RootStackParamList,'Inspection'>;
type Nav = StackNavigationProp<RootStackParamList>;
type Step = 'checklist'|'signature'|'done';

const RESULTS: {key:CheckItem['result'];label:string;color:string}[] = [
  {key:'vyhovuje',label:'✓',color:C.success},
  {key:'nevyhovuje',label:'✗',color:C.error},
  {key:'nelze_posoudit',label:'?',color:C.warning},
  {key:'neuvedeno',label:'○',color:C.textTertiary},
];
const OVERALL: {key:Inspection['overallResult'];label:string;color:string}[] = [
  {key:'vyhovuje',label:'VYHOVUJE',color:C.success},
  {key:'podminecne',label:'PODMÍNEČNĚ',color:C.warning},
  {key:'nevyhovuje',label:'NEVYHOVUJE',color:C.error},
];

export default function InspectionScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [step, setStep] = useState<Step>('checklist');
  const [checkItems, setCheckItems] = useState<CheckItem[]>(DEFAULT_CHECK_ITEMS.map(ci=>({...ci})));
  const [overallResult, setOverallResult] = useState<Inspection['overallResult']>('vyhovuje');
  const [coValue, setCoValue] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [signatureDone, setSignatureDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderInfo, setOrderInfo] = useState('');
  const [paths, setPaths] = useState<{x:number;y:number}[][]>([]);
  const [currentPath, setCurrentPath] = useState<{x:number;y:number}[]>([]);

  useFocusEffect(useCallback(()=>{
    const order = getOrder(route.params.orderId);
    if (order) setOrderInfo(`${order.orderNumber} — ${order.customerName}`);
    const existing = getInspection(route.params.orderId);
    if (existing){setCheckItems(existing.checkItems);setOverallResult(existing.overallResult);setNotes(existing.notes);setRecommendations(existing.recommendations);if(existing.signatureBase64)setSignatureDone(true);}
  },[]));

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onMoveShouldSetPanResponder:()=>true,
    onPanResponderGrant:(e)=>{const{locationX,locationY}=e.nativeEvent;setCurrentPath([{x:locationX,y:locationY}]);},
    onPanResponderMove:(e)=>{const{locationX,locationY}=e.nativeEvent;setCurrentPath(p=>[...p,{x:locationX,y:locationY}]);},
    onPanResponderRelease:()=>{if(currentPath.length>1)setPaths(p=>[...p,currentPath]);setCurrentPath([]);},
  });

  function updateItem(id:string,result:CheckItem['result']){setCheckItems(prev=>prev.map(ci=>ci.id===id?{...ci,result}:ci));}

  async function saveReport() {
    setSaving(true);
    try {
      const order = getOrder(route.params.orderId);
      if (!order) return;
      const inspection: Inspection = {id:uid(),orderId:order.id,chimneyId:order.chimneyId||'',reportNumber:`ZP-${order.orderNumber.replace('#','')}`,inspectionDate:todayISO(),checkItems,overallResult,coMeasurement:coValue?parseFloat(coValue):undefined,notes,recommendations,signatureBase64:signatureDone?'signed':undefined,createdAt:nowISO()};
      saveInspection(inspection);
      saveOrder({...order,status:'dokoncena',completedAt:nowISO(),updatedAt:nowISO()});
      Alert.alert('Uloženo!','Zpráva z kontroly byla uložena.',[{text:'OK',onPress:()=>{nav.goBack();nav.goBack();}}]);
    } finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{flexDirection:'row',alignItems:'center',padding:S.md,borderBottomWidth:1,borderBottomColor:C.border,backgroundColor:C.surface,gap:S.md}}>
        <TouchableOpacity onPress={()=>step==='checklist'?nav.goBack():setStep(step==='signature'?'checklist':'signature')}>
          <Text style={{color:C.textSecondary,fontSize:F.sm}}>← Zpět</Text>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={{color:C.textPrimary,fontWeight:'bold',fontSize:F.md}}>{step==='checklist'?'Kontrola spalinové cesty':step==='signature'?'Podpis zákazníka':'Dokončení'}</Text>
          <Text style={{color:C.textSecondary,fontSize:F.xs}}>{orderInfo}</Text>
        </View>
        <View style={{flexDirection:'row',gap:6}}>
          {(['checklist','signature','done'] as Step[]).map((s,i)=>(
            <View key={s} style={{width:10,height:10,borderRadius:5,backgroundColor:step===s?C.primary:(step==='signature'&&i===0)||(step==='done'&&i<=1)?C.success:C.border}} />
          ))}
        </View>
      </View>

      {step==='checklist'&&(
        <ScrollView style={{flex:1}} contentContainerStyle={{padding:S.base}}>
          <View style={{flexDirection:'row',gap:S.lg}}>
            <View style={{flex:1}}>
              <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.md,letterSpacing:1}}>KONTROLNÍ BODY</Text>
              {checkItems.map(item=>(
                <View key={item.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:S.sm,borderBottomWidth:1,borderBottomColor:C.border,gap:S.sm}}>
                  <Text style={{flex:1,color:C.textPrimary,fontSize:F.sm}}>{item.label}</Text>
                  <View style={{flexDirection:'row',gap:4}}>
                    {RESULTS.map(r=>(
                      <TouchableOpacity key={r.key} style={{width:34,height:34,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:item.result===r.key?r.color:C.border,backgroundColor:item.result===r.key?r.color+'30':C.surfaceEl}} onPress={()=>updateItem(item.id,r.key)}>
                        <Text style={{color:item.result===r.key?r.color:C.textTertiary,fontSize:13,fontWeight:'bold'}}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
              <View style={{marginTop:S.lg}}>
                <Text style={{color:C.textTertiary,fontSize:F.xs,fontWeight:'bold',letterSpacing:1,marginBottom:S.sm}}>CELKOVÝ VÝSLEDEK</Text>
                <View style={{flexDirection:'row',gap:S.sm}}>
                  {OVERALL.map(o=>(
                    <TouchableOpacity key={o.key} style={{flex:1,paddingVertical:S.sm,borderRadius:R.md,borderWidth:overallResult===o.key?2:1,borderColor:overallResult===o.key?o.color:C.border,alignItems:'center',backgroundColor:overallResult===o.key?o.color+'20':C.surfaceEl}} onPress={()=>setOverallResult(o.key)}>
                      <Text style={{color:overallResult===o.key?o.color:C.textSecondary,fontSize:F.xs,fontWeight:'bold'}}>{o.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.md,letterSpacing:1}}>DOPLŇUJÍCÍ INFO</Text>
              <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs,textTransform:'uppercase'}}>Měření CO (ppm)</Text>
              <TextInput style={{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.sm,borderWidth:1,borderColor:C.border,marginBottom:S.md}} value={coValue} onChangeText={setCoValue} keyboardType="numeric" placeholder="např. 18" placeholderTextColor={C.textTertiary} />
              <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs,textTransform:'uppercase'}}>Poznámky</Text>
              <TextInput style={{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.sm,borderWidth:1,borderColor:C.border,minHeight:100,marginBottom:S.md}} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholder="Popis stavu komína..." placeholderTextColor={C.textTertiary} />
              <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs,textTransform:'uppercase'}}>Doporučení</Text>
              <TextInput style={{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.sm,borderWidth:1,borderColor:C.border,minHeight:100}} value={recommendations} onChangeText={setRecommendations} multiline textAlignVertical="top" placeholder="Doporučení..." placeholderTextColor={C.textTertiary} />
            </View>
          </View>
        </ScrollView>
      )}

      {step==='signature'&&(
        <View style={{flex:1,padding:S.base,gap:S.md}}>
          <Text style={{color:C.textSecondary,fontSize:F.lg,textAlign:'center'}}>Požádejte zákazníka o podpis</Text>
          {signatureDone?(
            <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:S.lg}}>
              <Text style={{color:C.success,fontSize:F.xxl,fontWeight:'bold'}}>✓ Podpis uložen</Text>
              <TouchableOpacity style={{paddingHorizontal:S.base,paddingVertical:S.sm,borderRadius:R.md,borderWidth:1,borderColor:C.border}} onPress={()=>{setPaths([]);setCurrentPath([]);setSignatureDone(false);}}>
                <Text style={{color:C.textSecondary}}>Podepsat znovu</Text>
              </TouchableOpacity>
            </View>
          ):(
            <>
              <View style={{flex:1,backgroundColor:C.surfaceEl,borderRadius:R.lg,borderWidth:1,borderColor:C.border,overflow:'hidden'}} {...panResponder.panHandlers}>
                {[...paths,currentPath].map((path,pi)=>
                  path.slice(1).map((pt,i)=>{
                    const prev=path[i];
                    const dx=pt.x-prev.x;const dy=pt.y-prev.y;
                    const len=Math.sqrt(dx*dx+dy*dy);
                    const angle=Math.atan2(dy,dx)*180/Math.PI;
                    return <View key={`${pi}-${i}`} style={{position:'absolute',left:prev.x,top:prev.y-1.5,width:len,height:3,backgroundColor:'#fff',borderRadius:1.5,transform:[{rotate:`${angle}deg`}]}} />;
                  })
                )}
              </View>
              <View style={{flexDirection:'row',gap:S.sm}}>
                <TouchableOpacity style={{paddingHorizontal:S.base,paddingVertical:S.sm,borderRadius:R.md,borderWidth:1,borderColor:C.border}} onPress={()=>{setPaths([]);setCurrentPath([]);}}>
                  <Text style={{color:C.textSecondary}}>Vymazat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{flex:1,paddingVertical:S.sm,borderRadius:R.md,backgroundColor:C.primary,alignItems:'center'}} onPress={()=>{if(paths.length===0){Alert.alert('Podpis je prázdný');return;}setSignatureDone(true);setStep('done');}}>
                  <Text style={{color:'#fff',fontWeight:'bold'}}>Uložit podpis</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      {step==='done'&&(
        <View style={{flex:1,alignItems:'center',justifyContent:'center',gap:S.lg,padding:S.xl}}>
          <View style={{width:100,height:100,borderRadius:50,alignItems:'center',justifyContent:'center',backgroundColor:overallResult==='vyhovuje'?C.success+'30':C.error+'30'}}>
            <Text style={{fontSize:48}}>{overallResult==='vyhovuje'?'✓':'✗'}</Text>
          </View>
          <Text style={{fontSize:F.xxxl,fontWeight:'bold',letterSpacing:2,color:overallResult==='vyhovuje'?C.success:C.error}}>{OVERALL.find(o=>o.key===overallResult)?.label}</Text>
          <Text style={{color:C.textSecondary,fontSize:F.md}}>{orderInfo}</Text>
          {signatureDone?<Text style={{color:C.success,fontSize:F.md}}>✓ Zákazník podepsal</Text>:<Text style={{color:C.warning,fontSize:F.md}}>⚠ Bez podpisu</Text>}
          <TouchableOpacity style={{backgroundColor:C.primary,borderRadius:R.md,paddingVertical:S.md,paddingHorizontal:S.xxl,marginTop:S.md}} onPress={saveReport} disabled={saving}>
            <Text style={{color:'#fff',fontWeight:'bold',fontSize:F.md}}>{saving?'Ukládám...':'✓ ULOŽIT A DOKONČIT'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{flexDirection:'row',padding:S.base,gap:S.md,borderTopWidth:1,borderTopColor:C.border,backgroundColor:C.surface}}>
        <TouchableOpacity style={{flex:1,borderWidth:1,borderColor:C.border,borderRadius:R.md,paddingVertical:S.md,alignItems:'center'}} onPress={()=>step==='checklist'?nav.goBack():setStep(step==='signature'?'checklist':'signature')}>
          <Text style={{color:C.textSecondary,fontWeight:'bold'}}>ZPĚT</Text>
        </TouchableOpacity>
        {step!=='done'&&(
          <TouchableOpacity style={{flex:2,backgroundColor:C.primary,borderRadius:R.md,paddingVertical:S.md,alignItems:'center'}} onPress={()=>setStep(step==='checklist'?'signature':'done')}>
            <Text style={{color:'#fff',fontWeight:'bold',fontSize:F.md}}>DALŠÍ →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
