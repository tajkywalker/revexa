import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDb, initObjectsTables, initChimneyTables } from './db/database';
import { C, F } from './theme';
import AppSidebar, { AppSection } from './components/AppSidebar';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import CustomersScreen from './screens/CustomersScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import ObjectsScreen from './screens/ObjectsScreen';
import ObjectDetailScreen from './screens/ObjectDetailScreen';
import InspectionFormScreen from './screens/InspectionFormScreen';

export type AppView =
  | { screen: 'orders_list' }
  | { screen: 'order_detail'; orderId: string }
  | { screen: 'customers_list' }
  | { screen: 'customer_detail'; customerId?: string }
  | { screen: 'objects_list' }
  | { screen: 'object_detail'; objectId: string }
  | { screen: 'inspection_form'; objectId: string };

function sectionOf(v: AppView): AppSection {
  if (v.screen === 'orders_list'    || v.screen === 'order_detail')    return 'orders';
  if (v.screen === 'customers_list' || v.screen === 'customer_detail') return 'customers';
  return 'objects';
}

export default function App() {
  const [ready, setReady]     = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView]       = useState<AppView>({ screen: 'orders_list' });

  useEffect(() => {
    try { initDb(); initObjectsTables(); initChimneyTables(); }
    catch (e: any) { setDbError(String(e?.message ?? e)); }
    finally { setReady(true); }
  }, []);

  function go(v: AppView) { setView(v); }
  function onSidebarSelect(section: AppSection) {
    if (section === 'orders')    go({ screen: 'orders_list' });
    if (section === 'customers') go({ screen: 'customers_list' });
    if (section === 'objects')   go({ screen: 'objects_list' });
  }

  if (dbError) return (
    <View style={[s.center, { padding: 24 }]}>
      <Text style={{ color: C.error, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Chyba při startu</Text>
      <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{dbError}</Text>
    </View>
  );
  if (!ready) return (
    <View style={s.center}>
      <Text style={s.loadingText}>REVEXA</Text>
      <Text style={{ color: C.textSecondary, fontSize: F.sm, marginTop: 8 }}>Načítání…</Text>
    </View>
  );

  // Formulář zprávy — celá obrazovka bez sidebaru
  if (view.screen === 'inspection_form') return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <InspectionFormScreen
          objectId={view.objectId}
          onBack={() => go({ screen: 'object_detail', objectId: view.objectId })}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={C.surface} />
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.root}>
            <AppSidebar active={sectionOf(view)} onSelect={onSidebarSelect} />
            <View style={s.content}>
              {view.screen === 'orders_list'     && <OrdersScreen onSelectOrder={(id) => go({ screen: 'order_detail', orderId: id })} />}
              {view.screen === 'order_detail'    && <OrderDetailScreen orderId={view.orderId} onBack={() => go({ screen: 'orders_list' })} onSelectCustomer={(id) => go({ screen: 'customer_detail', customerId: id })} />}
              {view.screen === 'customers_list'  && <CustomersScreen onSelectCustomer={(id) => go({ screen: 'customer_detail', customerId: id })} onNewCustomer={() => go({ screen: 'customer_detail' })} />}
              {view.screen === 'customer_detail' && <CustomerDetailScreen customerId={(view as any).customerId} onBack={() => go({ screen: 'customers_list' })} onSelectOrder={(id) => go({ screen: 'order_detail', orderId: id })} onSelectObject={(id) => go({ screen: 'object_detail', objectId: id })} />}
              {view.screen === 'objects_list'    && <ObjectsScreen onSelectObject={(id) => go({ screen: 'object_detail', objectId: id })} />}
              {view.screen === 'object_detail'   && <ObjectDetailScreen objectId={view.objectId} onBack={() => go({ screen: 'objects_list' })} onCreateInspection={(id) => go({ screen: 'inspection_form', objectId: id })} />}
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: C.primary, fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.bg },
  content: { flex: 1, backgroundColor: C.bg },
});
