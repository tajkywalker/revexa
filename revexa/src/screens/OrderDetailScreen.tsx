import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getOrder, saveOrder, deleteOrder, Order } from '../db/database';
import { formatDate, formatCurrency, STATUS_LABELS, STATUS_COLORS, nowISO } from '../utils';
import { RootStackParamList } from '../App';

type Route = RouteProp<RootStackParamList,'OrderDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;
const STATUSES: Order['status'][] = ['nova','probihajici','dokoncena','zrusena'];

export default function OrderDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [order, setOrder] = useState<Order|null>(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({address:'',note:'',price:'',scheduledDate:''});

  useFocusEffect(useCallback(()=>{
    const o = getOrder(route.params.orderId);
    setOrder(o);
    if (o) setEdit({address:o.address,note:o.note,price:String(o.price),scheduledDate:o.scheduledDate});
  },[route.params.orderId]));

  if (!order) return <View style={{flex:1,backgroundColor:C.bg}} />;

  function changeStatus(status: Order['status']) {
    if (!order) return;
    const updated = {...order,status,updatedAt:nowISO(),completedAt:status==='dokoncena'?nowISO():order.completedAt};
    saveOrder(updated); setOrder(updated);
  }

  function saveEdits() {
    if (!order) return;
    const updated = {...order,address:edit.address,note:edit.note,price:parseFloat(edit.price)||0,scheduledDate:edit.scheduledDate,updatedAt:nowISO()};
    saveOrder(updated); setOrder(updated); setEditing(false);
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <ScrollView contentContainerStyle={{padding:S.base,gap:S.md}}>
        <View style={s.card}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.xs}}>
            <Text style={{color:C.primary,fontSize:F.xl,fontWeight:'bold'}}>{order.orderNumber}</Text>
            <View style={{paddingHorizontal:S.sm,paddingVertical:2,borderRadius:R.xl,backgroundColor:STATUS_COLORS[order.status]+'30'}}>
              <Text style={{fontSize:F.xs,fontWeight:'bold',color:STATUS_COLORS[order.status]}}>{STATUS_LABELS[order.status]}</Text>
            </View>
          </View>
          <Text style={{color:C.textPrimary,fontSize:F.lg,fontWeight:'600'}}>{order.customerName}</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Změnit stav</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:S.sm}}>
            {STATUSES.map(st=>(
              <TouchableOpacity key={st} style={[{paddingHorizontal:S.sm,paddingVertical:S.xs,borderRadius:R.md,borderWidth:1,borderColor:C.border},order.status===st&&{backgroundColor:STATUS_COLORS[st]+'30',borderColor:STATUS_COLORS[st]}]} onPress={()=>changeStatus(st)}>
                <Text style={[{color:C.textSecondary,fontSize:F.sm},order.status===st&&{color:STATUS_COLORS[st]}]}>{STATUS_LABELS[st]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={s.card}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.sm}}>
            <Text style={s.cardTitle}>Detaily</Text>
            <TouchableOpacity onPress={()=>setEditing(!editing)}><Text style={{color:C.primary,fontSize:F.sm}}>{editing?'Zrušit':'Upravit'}</Text></TouchableOpacity>
          </View>
          {editing ? (
            <>
              {['scheduledDate','address','price','note'].map(f=>(
                <View key={f} style={{marginBottom:S.sm}}>
                  <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs}}>{f==='scheduledDate'?'Datum':f==='address'?'Adresa':f==='price'?'Cena':'Poznámka'}</Text>
                  <TextInput style={s.input} value={(edit as any)[f]} onChangeText={t=>setEdit(p=>({...p,[f]:t}))} keyboardType={f==='price'?'numeric':'default'} multiline={f==='note'} placeholderTextColor={C.textTertiary} />
                </View>
              ))}
              <TouchableOpacity style={{backgroundColor:C.primary,borderRadius:R.md,padding:S.md,alignItems:'center',marginTop:S.md}} onPress={saveEdits}><Text style={{color:'#fff',fontWeight:'bold'}}>Uložit</Text></TouchableOpacity>
            </>
          ) : (
            <>
              {[['Datum',formatDate(order.scheduledDate)],['Adresa',order.address],order.price>0?['Cena',formatCurrency(order.price)]:null,order.note?['Poznámka',order.note]:null].filter(Boolean).map(([l,v])=>(
                <View key={l as string} style={{flexDirection:'row',justifyContent:'space-between',paddingVertical:S.xs,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <Text style={{color:C.textSecondary,fontSize:F.sm}}>{l as string}</Text>
                  <Text style={{color:C.textPrimary,fontSize:F.sm,flex:1,textAlign:'right'}}>{v as string}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <TouchableOpacity style={{backgroundColor:C.surfaceEl,borderRadius:R.lg,padding:S.md,alignItems:'center',borderWidth:1,borderColor:C.primary}} onPress={()=>nav.navigate('Inspection',{orderId:order.id})}>
          <Text style={{color:C.primary,fontSize:F.md,fontWeight:'bold'}}>📋 Kontrola spalinové cesty</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{borderRadius:R.md,padding:S.md,alignItems:'center',borderWidth:1,borderColor:C.error}} onPress={()=>Alert.alert('Smazat zakázku?','',[{text:'Zrušit',style:'cancel'},{text:'Smazat',style:'destructive',onPress:()=>{deleteOrder(order.id);nav.goBack();}}])}>
          <Text style={{color:C.error,fontSize:F.sm}}>Smazat zakázku</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  card:{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border},
  cardTitle:{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.sm},
  input:{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.base,borderWidth:1,borderColor:C.border},
});
