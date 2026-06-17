import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, F, S, R } from '../theme';
import { getCustomer, saveCustomer, deleteCustomer, Customer, getChimneys, saveChimney, deleteChimney, Chimney } from '../db/database';
import { uid, nowISO } from '../utils';
import { RootStackParamList } from '../App';

type Route = RouteProp<RootStackParamList,'CustomerDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function CustomerDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const isNew = !route.params?.customerId;
  const [customer, setCustomer] = useState<Customer>({id:uid(),firstName:'',lastName:'',phone:'',email:'',street:'',city:'',zip:'',note:'',createdAt:nowISO()});
  const [chimneys, setChimneys] = useState<Chimney[]>([]);

  useFocusEffect(useCallback(()=>{
    if (!isNew&&route.params?.customerId) {
      const c = getCustomer(route.params.customerId);
      if (c){setCustomer(c);setChimneys(getChimneys(c.id));}
    }
  },[route.params?.customerId]));

  function update(field: keyof Customer, value: string) { setCustomer(p=>({...p,[field]:value})); }

  function save() {
    if (!customer.firstName||!customer.lastName){Alert.alert('Chyba','Zadejte jméno a příjmení');return;}
    saveCustomer(customer);
    if (isNew) nav.goBack(); else Alert.alert('Uloženo');
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <ScrollView contentContainerStyle={{padding:S.base,gap:S.md}}>
        <View style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border}}>
          <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold',marginBottom:S.sm}}>{isNew?'Nový zákazník':'Osobní údaje'}</Text>
          {([['firstName','Jméno *'],['lastName','Příjmení *'],['phone','Telefon'],['email','Email'],['street','Ulice'],['city','Město'],['zip','PSČ']] as [keyof Customer,string][]).map(([f,l])=>(
            <View key={f} style={{marginBottom:S.sm}}>
              <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs}}>{l}</Text>
              <TextInput style={{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.base,borderWidth:1,borderColor:C.border}} value={customer[f] as string} onChangeText={v=>update(f,v)} placeholderTextColor={C.textTertiary} />
            </View>
          ))}
          <Text style={{color:C.textSecondary,fontSize:F.xs,marginBottom:S.xs}}>Poznámka</Text>
          <TextInput style={{backgroundColor:C.surfaceEl,borderRadius:R.md,color:C.textPrimary,paddingHorizontal:S.md,paddingVertical:S.sm,fontSize:F.base,borderWidth:1,borderColor:C.border,minHeight:60}} value={customer.note} onChangeText={v=>update('note',v)} multiline placeholderTextColor={C.textTertiary} />
        </View>

        {!isNew&&(
          <View style={{backgroundColor:C.surface,borderRadius:R.lg,padding:S.md,borderWidth:1,borderColor:C.border}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:S.sm}}>
              <Text style={{color:C.textPrimary,fontSize:F.md,fontWeight:'bold'}}>Komíny ({chimneys.length})</Text>
              <TouchableOpacity onPress={()=>{const ch:Chimney={id:uid(),customerId:customer.id,label:`Komín č.${chimneys.length+1}`,type:'',fuel:'',note:''};saveChimney(ch);setChimneys([...chimneys,ch]);}}>
                <Text style={{color:C.primary}}>+ Přidat</Text>
              </TouchableOpacity>
            </View>
            {chimneys.map(ch=>(
              <View key={ch.id} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:S.sm,borderBottomWidth:1,borderBottomColor:C.border}}>
                <Text style={{color:C.textPrimary,fontSize:F.sm}}>{ch.label}</Text>
                <TouchableOpacity onPress={()=>Alert.alert('Smazat?','',[{text:'Zrušit',style:'cancel'},{text:'Smazat',style:'destructive',onPress:()=>{deleteChimney(ch.id);setChimneys(c=>c.filter(x=>x.id!==ch.id));}}])}><Text style={{color:C.error,fontSize:F.sm}}>Smazat</Text></TouchableOpacity>
              </View>
            ))}
            {chimneys.length===0&&<Text style={{color:C.textTertiary,fontSize:F.sm}}>Žádné komíny</Text>}
          </View>
        )}

        <TouchableOpacity style={{backgroundColor:C.primary,borderRadius:R.md,padding:S.md,alignItems:'center'}} onPress={save}>
          <Text style={{color:'#fff',fontWeight:'bold',fontSize:F.md}}>{isNew?'Vytvořit zákazníka':'Uložit změny'}</Text>
        </TouchableOpacity>

        {!isNew&&(
          <TouchableOpacity style={{borderRadius:R.md,padding:S.md,alignItems:'center',borderWidth:1,borderColor:C.error}} onPress={()=>Alert.alert('Smazat zákazníka?','',[{text:'Zrušit',style:'cancel'},{text:'Smazat',style:'destructive',onPress:()=>{deleteCustomer(customer.id);nav.goBack();}}])}>
            <Text style={{color:C.error}}>Smazat zákazníka</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
