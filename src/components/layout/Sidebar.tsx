import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, SIDEBAR_WIDTH } from '../../utils/theme';

export type TabKey = 'prehled' | 'zakazky' | 'kalendar' | 'zakaznici' | 'katalog' | 'statistiky' | 'nastaveni';

interface SidebarItem {
  key: TabKey;
  label: string;
  icon: string;
}

const ITEMS: SidebarItem[] = [
  { key: 'prehled', label: 'Přehled', icon: '⌂' },
  { key: 'zakazky', label: 'Zakázky', icon: '📋' },
  { key: 'kalendar', label: 'Kalendář', icon: '📅' },
  { key: 'zakaznici', label: 'Zákazníci', icon: '👥' },
  { key: 'katalog', label: 'Katalog', icon: '📖' },
  { key: 'statistiky', label: 'Statistiky', icon: '📊' },
  { key: 'nastaveni', label: 'Nastavení', icon: '⚙' },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>R</Text>
        </View>
        <Text style={styles.logoText}>REVEXA</Text>
      </View>

      {/* Navigace */}
      <View style={styles.nav}>
        {ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => onTabChange(item.key)}
              style={[styles.navItem, isActive && styles.navItemActive]}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.syncDot} />
        <Text style={styles.syncText}>Synchronizováno</Text>
        <Text style={styles.versionText}>Verze 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: Typography.extraBold,
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    letterSpacing: 2,
  },
  nav: {
    flex: 1,
    gap: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    gap: 12,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: Colors.primary + '20',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  navIcon: {
    fontSize: 18,
    opacity: 0.5,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  navLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.semiBold,
  },
  statusBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    gap: 4,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginBottom: 2,
  },
  syncText: {
    color: Colors.success,
    fontSize: Typography.xs,
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
  },
});
