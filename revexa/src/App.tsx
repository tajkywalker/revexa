import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDb } from './db/database';
import { C, F } from './theme';
import AppSidebar, { AppSection } from './components/AppSidebar';
import OrdersScreen from './screens/OrdersScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import CalendarScreen from './screens/CalendarScreen';
import CustomersScreen from './screens/CustomersScreen';
import CustomerDetailScreen from './screens/CustomerDetailScreen';
import StatsScreen from './screens/StatsScreen';

// ─── Navigační stav ───────────────────────────────────────────────────────────
export type AppView =
  | { screen: 'orders_list' }
  | { screen: 'order_detail'; orderId: string }
  | { screen: 'calendar' }
  | { screen: 'customers_list' }
  | { screen: 'customer_detail'; customerId?: string }
  | { screen: 'stats' };

function sectionOf(v: AppView): AppSection {
  if (v.screen === 'orders_list' || v.screen === 'order_detail') return 'orders';
  if (v.screen === 'calendar') return 'calendar';
  if (v.screen === 'customers_list' || v.screen === 'customer_detail') return 'customers';
  return 'stats';
}

// ─── Hlavní aplikace ──────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView] = useState<AppView>({ screen: 'orders_list' });

  useEffect(() => {
    try { initDb(); }
    catch (e: any) { setDbError(String(e?.message ?? e)); }
    finally { setReady(true); }
  }, []);

  function go(v: AppView) { setView(v); }

  function onSidebarSelect(section: AppSection) {
    if (section === 'orders')    go({ screen: 'orders_list' });
    if (section === 'calendar')  go({ screen: 'calendar' });
    if (section === 'customers') go({ screen: 'customers_list' });
    if (section === 'stats')     go({ screen: 'stats' });
  }

  // ── Loading / chyba ──
  if (dbError) return (
    <View style={[s.center, { padding: 24 }]}>
      <Text style={{ color: C.error, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Chyba při startu databáze</Text>
      <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center' }}>{dbError}</Text>
    </View>
  );
  if (!ready) return (
    <View style={s.center}>
      <Text style={s.loadingText}>REVEXA</Text>
      <Text style={{ color: C.textSecondary, fontSize: F.sm, marginTop: 8 }}>Načítání...</Text>
    </View>
  );

  // ── Hlavní layout ──
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={C.surface} />
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'bottom', 'left', 'right']}>
          <View style={s.root}>

            {/* Levý sidebar – vždy viditelný */}
            <AppSidebar active={sectionOf(view)} onSelect={onSidebarSelect} />

            {/* Hlavní obsah */}
            <View style={s.content}>
              {view.screen === 'orders_list' && (
                <OrdersScreen
                  onSelectOrder={(id) => go({ screen: 'order_detail', orderId: id })}
                />
              )}
              {view.screen === 'order_detail' && (
                <OrderDetailScreen
                  orderId={view.orderId}
                  onBack={() => go({ screen: 'orders_list' })}
                  onSelectCustomer={(id) => go({ screen: 'customer_detail', customerId: id })}
                />
              )}
              {view.screen === 'calendar' && (
                <CalendarScreen
                  onSelectOrder={(id) => go({ screen: 'order_detail', orderId: id })}
                />
              )}
              {view.screen === 'customers_list' && (
                <CustomersScreen
                  onSelectCustomer={(id) => go({ screen: 'customer_detail', customerId: id })}
                  onNewCustomer={() => go({ screen: 'customer_detail' })}
                />
              )}
              {view.screen === 'customer_detail' && (
                <CustomerDetailScreen
                  customerId={(view as any).customerId}
                  onBack={() => go({ screen: 'customers_list' })}
                  onSelectOrder={(id) => go({ screen: 'order_detail', orderId: id })}
                />
              )}
              {view.screen === 'stats' && <StatsScreen />}
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
