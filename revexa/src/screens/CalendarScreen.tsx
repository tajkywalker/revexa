import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getOrdersByDate, Order } from '../db/database';
import { STATUS_COLORS, STATUS_LABELS } from '../utils';
import { RootStackParamList } from '../App';

type Nav = StackNavigationProp<RootStackParamList>;
const MONTH_NAMES = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const DAY_NAMES = ['Po','Út','St','Čt','Pá','So','Ne'];

function getDays(year:number,month:number): Date[] {
  const days:Date[]=[];
  const d = new Date(year,month,1);
  while(d.getMonth()===month){days.push(new Date(d));d.setDate(d.getDate()+1);}
  return days;
}

export default function CalendarScreen() {
  const nav = useNavigation<Nav>();
  const now = new Date();
  const [year,setYear] = useState(now.getFullYear());
  const [month,setMonth] = useState(now.getMonth());
  const [selectedDate,setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [dayOrders,setDayOrders] = useState<Order[]>([]);
  const [orderMap,setOrderMap] = useState<Record<string,number>>({});

  useFocusEffect(useCallback(()=>{
    const days = getDays(year,month);
    const map:Record<string,number>={};
    for(const d of days){const iso=d.toISOString().split('T')[0];const o=getOrdersByDate(iso);if(o.length>0)map[iso]=o.length;}
    setOrderMap(map);
    setDayOrders(getOrdersByDate(selectedDate));
  },[year,month,selectedDate]));

  const days = getDays(year,month);
  const firstDow = (days[0].getDay()+6)%7;
  const today = now.toISOString().split('T')[0];

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{padding:S.base,borderBottomWidth:1,borderBottomColor:C.border}}><Text style={{color:C.textPrimary,fontSize:F.xl,fontWeight:'bold',letterSpacing:2}}>KALENDÁŘ</Text></View>
      <ScrollView>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:S.base}}>
          <TouchableOpacity onPress={()=>month===0?[setMonth(11),setYear(y=>y-1)]:setMonth(m=>m-1)}><Text style={{color:C.primary,fontSize:28,fontWeight:'bold'}}>‹</Text></TouchableOpacity>
          <Text style={{color:C.textPrimary,fontSize:F.lg,fontWeight:'bold'}}>{MONTH_NAMES[month]} {year}</Text>
          <TouchableOpacity onPress={()=>month===11?[setMonth(0),setYear(y=>y+1)]:setMonth(m=>m+1)}><Text style={{color:C.primary,fontSize:28,fontWeight:'bold'}}>›</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row',paddingHorizontal:S.base}}>
          {DAY_NAMES.map(d=><Text key={d} style={{flex:1,textAlign:'center',color:C.textTertiary,fontSize:F.xs,paddingVertical:S.xs}}>{d}</Text>)}
        </View>
        <View style={{flexDirection:'row',flexWrap:'wrap',paddingHorizontal:S.base}}>
          {Array(firstDow).fill(null).map((_,i)=><View key={`e${i}`} style={{width:`${100/7}%`,aspectRatio:1}} />)}
          {days.map(d=>{
            const iso = d.toISOString().split('T')[0];
            const count = orderMap[iso]||0;
            const isToday = iso===today;
            const isSel = iso===selectedDate;
            return (
              <TouchableOpacity key={iso} style={{width:`${100/7}%`,aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:R.md,borderWidth:isToday?1:0,borderColor:isToday?C.primary:'transparent',backgroundColor:isSel?C.primary:'transparent'}} onPress={()=>setSelectedDate(iso)}>
                <Text style={{color:isSel?'#fff':C.textPrimary,fontSize:F.sm,fontWeight:isSel?'bold':'normal'}}>{d.getDate()}</Text>
                {count>0&&<View style={{backgroundColor:C.error,borderRadius:8,minWidth:16,height:16,alignItems:'center',justifyContent:'center',marginTop:1}}><Text style={{color:'#fff',fontSize:10,fontWeight:'bold'}}>{count}</Text></View>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{padding:S.base,gap:S.sm}}>
          <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.sm}}>{new Date(selectedDate).toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long'})}</Text>
          {dayOrders.length===0?<Text style={{color:C.textTertiary,textAlign:'center',paddingVertical:S.xl}}>Žádné zakázky</Text>:
            dayOrders.map(o=>(
              <TouchableOpacity key={o.id} style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}} onPress={()=>nav.navigate('OrderDetail',{orderId:o.id})}>
                <View style={{flexDirection:'row',alignItems:'center',gap:S.sm,flex:1}}>
                  <View style={{width:10,height:10,borderRadius:5,backgroundColor:STATUS_COLORS[o.status]}} />
                  <View><Text style={{color:C.textPrimary,fontSize:F.sm,fontWeight:'600'}}>{o.orderNumber} — {o.customerName}</Text><Text style={{color:C.textSecondary,fontSize:F.xs}}>{o.address}</Text></View>
                </View>
                <Text style={{fontSize:F.xs,fontWeight:'bold',color:STATUS_COLORS[o.status]}}>{STATUS_LABELS[o.status]}</Text>
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
