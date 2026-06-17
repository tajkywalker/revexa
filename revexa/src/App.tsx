import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDb } from './db/database';
import { C, F } from './theme';
import OrdersScreen from './screens/OrdersScreen';
import CalendarScreen from './screens/CalendarScreen';
import CustomersScreen from './screens/CustomersScreen';
import StatsScreen from './screens/StatsScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import InspectionScreen from './screens/InspectionScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  OrderDetail: { orderId: string };
  CustomerDetail: { customerId?: string };
  Inspection: { orderId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown:false, tabBarStyle:{backgroundColor:C.surface,borderTopColor:C.border,height:56}, tabBarActiveTintColor:C.primary, tabBarInactiveTintColor:C.textSecondary, tabBarLabelStyle:{fontSize:F.xs,marginBottom:4} }}>
      <Tab.Screen name="Zakázky" component={OrdersScreen} options={{tabBarIcon:({focused})=><Text style={{fontSize:20,opacity:focused?1:0.5}}>📋</Text>}} />
      <Tab.Screen name="Kalendář" component={CalendarScreen} options={{tabBarIcon:({focused})=><Text style={{fontSize:20,opacity:focused?1:0.5}}>📅</Text>}} />
      <Tab.Screen name="Zákazníci" component={CustomersScreen} options={{tabBarIcon:({focused})=><Text style={{fontSize:20,opacity:focused?1:0.5}}>👥</Text>}} />
      <Tab.Screen name="Statistiky" component={StatsScreen} options={{tabBarIcon:({focused})=><Text style={{fontSize:20,opacity:focused?1:0.5}}>📊</Text>}} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { try { initDb(); } catch(e) { console.warn(e); } setReady(true); }, []);
  if (!ready) return <View style={s.loading}><Text style={s.loadingText}>REVEXA</Text></View>;
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={{dark:true,colors:{primary:C.primary,background:C.bg,card:C.surface,text:C.textPrimary,border:C.border,notification:C.primary}}}>
        <Stack.Navigator screenOptions={{headerStyle:{backgroundColor:C.surface},headerTintColor:C.textPrimary,headerTitleStyle:{fontWeight:'bold'},cardStyle:{backgroundColor:C.bg}}}>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{headerShown:false}} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{title:'Detail zakázky'}} />
          <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} options={{title:'Zákazník'}} />
          <Stack.Screen name="Inspection" component={InspectionScreen} options={{headerShown:false}} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'},
  loadingText:{color:C.primary,fontSize:32,fontWeight:'bold',letterSpacing:4},
});
