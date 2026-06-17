import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getCustomers, Customer } from '../db/database';
import { RootStackParamList } from '../App';

type Nav = StackNavigationProp<RootStackParamList>;

export default function CustomersScreen() {
  const nav = useNavigation<Nav>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(()=>{ load(); },[search]));

  function load() {
    let list = getCustomers();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c=>`${c.firstName} ${c.lastName}`.toLowerCase().includes(q)||c.city.toLowerCase().includes(q)||c.phone.includes(q));
    }
    setCustomers(list);
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:S.base,borderBottomWidth:1,borderBottomColor:C.border}}>
        <Text style={{color:C.textPrimary,fontSize:F.xl,fontWeight:'bold',letterSpacing:2}}>ZÁKAZNÍCI</Text>
        <TouchableOpacity style={{backgroundColor:C.primary,paddingHorizontal:S.base,paddingVertical:S.sm,borderRadius:R.md}} onPress={()=>nav.navigate('CustomerDetail',{})}>
          <Text style={{color:'#fff',fontWeight:'bold',fontSize:F.sm}}>+ Nový</Text>
        </TouchableOpacity>
      </View>
      <View style={{padding:S.base,paddingBottom:S.sm}}>
        <TextInput style={{backgroundColor:C.surface,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.base,borderWidth:1,borderColor:C.border}} value={search} onChangeText={t=>{setSearch(t);setTimeout(load,100);}} placeholder="Hledat..." placeholderTextColor={C.textTertiary} />
      </View>
      <FlatList data={customers} keyExtractor={c=>c.id} contentContainerStyle={{padding:S.base,gap:S.sm}}
        renderItem={({item})=>(
          <TouchableOpacity style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border,flexDirection:'row',alignItems:'center',gap:S.md}} onPress={()=>nav.navigate('CustomerDetail',{customerId:item.id})}>
            <View style={{width:48,height:48,borderRadius:24,backgroundColor:C.primaryDim,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.primary}}>
              <Text style={{color:C.primary,fontWeight:'bold',fontSize:F.md}}>{item.firstName[0]}{item.lastName[0]}</Text>
            </View>
            <View style={{flex:1}}>
              <Text style={{color:C.textPrimary,fontWeight:'600',fontSize:F.md}}>{item.firstName} {item.lastName}</Text>
              <Text style={{color:C.textSecondary,fontSize:F.sm}}>{item.street}, {item.city}</Text>
              {item.phone?<Text style={{color:C.textTertiary,fontSize:F.xs,marginTop:2}}>📞 {item.phone}</Text>:null}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={{alignItems:'center',paddingTop:60}}><Text style={{color:C.textTertiary,fontSize:F.lg}}>Žádní zákazníci</Text></View>}
      />
    </SafeAreaView>
  );
}
