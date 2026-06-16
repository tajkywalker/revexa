import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, TextInput, TouchableOpacity, Text, FlatList } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../utils/theme';
import { useAppStore } from '../store/appStore';
import { TabKey } from './layout/Sidebar';
import Sidebar from './layout/Sidebar';
import BottomBar from './layout/BottomBar';

// Screens
import PrehledScreen from '../screens/PrehledScreen';
import ZakazkyScreen from '../screens/ZakazkyScreen';
import KalendarScreen from '../screens/KalendarScreen';
import ZakaznicScreen from '../screens/ZakaznicScreen';
import KatalogScreen from '../screens/KatalogScreen';
import StatistikyScreen from '../screens/StatistikyScreen';
import NastaveniScreen from '../screens/NastaveniScreen';

// Modals
import NewOrderModal from './orders/NewOrderModal';

export default function MainApp() {
  const {
    activeTab, setActiveTab,
    showNewOrderModal, setShowNewOrderModal,
    setOrders,
  } = useAppStore();

  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');

  const handleTabChange = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'prehled': return <PrehledScreen />;
      case 'zakazky': return <ZakazkyScreen />;
      case 'kalendar': return <KalendarScreen />;
      case 'zakaznici': return <ZakaznicScreen />;
      case 'katalog': return <KatalogScreen />;
      case 'statistiky': return <StatistikyScreen />;
      case 'nastaveni': return <NastaveniScreen />;
      default: return <PrehledScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Levá navigace (sidebar) */}
      <Sidebar
        activeTab={activeTab as TabKey}
        onTabChange={handleTabChange}
      />

      {/* Hlavní obsah */}
      <View style={styles.main}>
        {/* Obsah */}
        <View style={styles.content}>
          {renderScreen()}
        </View>

        {/* Spodní lišta */}
        <BottomBar
          onNewOrder={() => setShowNewOrderModal(true)}
          onSearch={() => setShowSearch(true)}
        />
      </View>

      {/* Modal - Nová zakázka */}
      {showNewOrderModal && (
        <NewOrderModal
          onClose={() => setShowNewOrderModal(false)}
          onSaved={() => {
            setShowNewOrderModal(false);
            // Refresh dat
            import('../database/database').then(db => {
              db.getAllOrders().then(orders => setOrders(orders));
            });
          }}
        />
      )}

      {/* Modal - Vyhledávání */}
      {showSearch && (
        <Modal visible transparent animationType="fade">
          <View style={styles.searchOverlay}>
            <View style={styles.searchModal}>
              <View style={styles.searchInputRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Hledat zákazníky, zakázky, adresy..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
                <TouchableOpacity onPress={() => { setShowSearch(false); setSearchText(''); }}>
                  <Text style={styles.closeSearch}>✕</Text>
                </TouchableOpacity>
              </View>
              {!searchText && (
                <Text style={styles.searchHint}>
                  Zadejte jméno zákazníka, adresu nebo číslo zakázky...
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
  searchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  searchModal: {
    width: '70%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    paddingVertical: Spacing.sm,
  },
  closeSearch: {
    color: Colors.textSecondary,
    fontSize: 18,
    padding: 8,
  },
  searchHint: {
    color: Colors.textTertiary,
    fontSize: Typography.sm,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});
