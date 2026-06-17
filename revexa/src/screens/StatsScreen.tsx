import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getStats, getOrders } from '../db/database';
import { formatCurrency, STATUS_COLORS, STATUS_LABELS } from '../utils';

export default function StatsScreen() {
  const [stats, setStats] = useState({total:0,done:0,revenue:0,monthDone:0});
  const [statusCounts, setStatusCounts] = useState<Record<string,number>>({});

  useFocusEffect(useCallback(()=>{
    setStats(getStats());
    const orders = getOrders();
    const counts:Record<string,number>={};
    for(const o of orders) counts[o.status]=(counts[o.status]||0)+1;
    setStatusCounts(counts);
  },[]));

  const doneRate = stats.total>0?Math.round((stats.done/stats.total)*100):0;

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{padding:S.base,borderBottomWidth:1,borderBottomColor:C.border}}><Text style={{color:C.textPrimary,fontSize:F.xl,fontWeight:'bold',letterSpacing:2}}>STATISTIKY</Text></View>
      <ScrollView contentContainerStyle={{padding:S.base,gap:S.md}}>
        <View style={{flexDirection:'row',gap:S.md}}>
          {[{label:'Celkem zakázek',value:String(stats.total),color:C.primary},{label:'Dokončených',value:String(stats.done),color:C.success}].map(({label,value,color})=>(
            <View key={label} style={{flex:1,backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:color+'50',alignItems:'center'}}>
              <Text style={{fontSize:F.xxl,fontWeight:'bold',color,marginBottom:S.xs}}>{value}</Text>
              <Text style={{color:C.textSecondary,fontSize:F.xs,textAlign:'center'}}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={{flexDirection:'row',gap:S.md}}>
          {[{label:'Tento měsíc',value:String(stats.monthDone),color:C.warning},{label:'Tržby celkem',value:formatCurrency(stats.revenue),color:C.success}].map(({label,value,color})=>(
            <View key={label} style={{flex:1,backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:color+'50',alignItems:'center'}}>
              <Text style={{fontSize:F.xl,fontWeight:'bold',color,marginBottom:S.xs}}>{value}</Text>
              <Text style={{color:C.textSecondary,fontSize:F.xs,textAlign:'center'}}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border}}>
          <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.md}}>Úspěšnost zakázek</Text>
          <View style={{height:12,backgroundColor:C.surfaceEl,borderRadius:R.xl,overflow:'hidden'}}>
            <View style={{height:'100%',width:`${doneRate}%`,backgroundColor:C.success,borderRadius:R.xl}} />
          </View>
          <Text style={{color:C.textSecondary,fontSize:F.sm,marginTop:S.sm,textAlign:'center'}}>{doneRate}% dokončeno</Text>
        </View>

        <View style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border}}>
          <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.md}}>Přehled stavů</Text>
          {Object.entries(STATUS_LABELS).map(([key,label])=>{
            const count = statusCounts[key]||0;
            const pct = Math.round((count/(stats.total||1))*100);
            return (
              <View key={key} style={{flexDirection:'row',alignItems:'center',marginBottom:S.sm}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:S.sm,width:110}}>
                  <View style={{width:10,height:10,borderRadius:5,backgroundColor:STATUS_COLORS[key]}} />
                  <Text style={{color:C.textSecondary,fontSize:F.sm}}>{label}</Text>
                </View>
                <View style={{flex:1,height:8,backgroundColor:C.surfaceEl,borderRadius:R.xl,overflow:'hidden',marginHorizontal:S.sm}}>
                  <View style={{height:'100%',width:`${pct}%`,backgroundColor:STATUS_COLORS[key],borderRadius:R.xl}} />
                </View>
                <Text style={{color:C.textPrimary,fontSize:F.sm,width:24,textAlign:'right'}}>{count}</Text>
              </View>
            );
          })}
        </View>

        <View style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.lg,alignItems:'center',borderWidth:1,borderColor:C.border}}>
          <Text style={{color:C.primary,fontSize:F.xl,fontWeight:'bold',letterSpacing:3}}>REVEXA v1.0</Text>
          <Text style={{color:C.textSecondary,fontSize:F.sm,marginTop:S.xs}}>Správa spalinových cest</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
