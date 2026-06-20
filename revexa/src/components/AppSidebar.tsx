import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, F, S, R } from '../theme';

export type AppSection = 'orders' | 'calendar' | 'customers' | 'stats';

interface NavItem { id: AppSection | 'dashboard' | 'catalog' | 'settings'; label: string; icon: string; disabled?: boolean; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Přehled',    icon: '⊞', disabled: true },
  { id: 'orders',    label: 'Zakázky',    icon: '📋' },
  { id: 'calendar',  label: 'Kalendář',   icon: '📅' },
  { id: 'customers', label: 'Zákazníci',  icon: '👥' },
  { id: 'catalog',   label: 'Katalog',    icon: '📁', disabled: true },
  { id: 'stats',     label: 'Statistiky', icon: '📊' },
  { id: 'settings',  label: 'Nastavení',  icon: '⚙️', disabled: true },
];

interface Props { active: AppSection; onSelect: (section: AppSection) => void; }

export default function AppSidebar({ active, onSelect }: Props) {
  return (
    <View style={s.sidebar}>
      <View style={s.logo}>
        <View style={s.logoIcon}><Text style={s.logoIconText}>R</Text></View>
        <Text style={s.logoText}>REVEXA</Text>
      </View>
      <View style={s.navList}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          return (
            <TouchableOpacity key={item.id} style={[s.navItem, isActive && s.navItemActive, item.disabled && s.navItemDim]} onPress={() => !item.disabled && onSelect(item.id as AppSection)} activeOpacity={item.disabled ? 1 : 0.75}>
              {isActive && <View style={s.activeBar} />}
              <Text style={s.navIcon}>{item.icon}</Text>
              <Text style={[s.navLabel, isActive && s.navLabelActive, item.disabled && s.navLabelDim]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={s.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.xs }}><View style={s.syncDot} /><Text style={s.footerText}>Synchronizováno</Text></View>
        <Text style={s.footerText}>Verze 1.0.0</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: { width: 210, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border, flexDirection: 'column', paddingTop: 12, paddingBottom: 12 },
  logo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.base, paddingVertical: S.md, marginBottom: S.sm, gap: S.sm },
  logoIcon: { width: 30, height: 30, borderRadius: R.sm, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  logoText: { color: C.textPrimary, fontSize: F.lg, fontWeight: 'bold', letterSpacing: 3 },
  navList: { flex: 1, paddingHorizontal: S.sm },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: 11, borderRadius: R.md, marginBottom: 2, gap: S.sm, position: 'relative', overflow: 'hidden' },
  navItemActive: { backgroundColor: C.primary + '20' },
  navItemDim: { opacity: 0.3 },
  navIcon: { fontSize: 17, width: 24, textAlign: 'center' },
  navLabel: { color: C.textSecondary, fontSize: F.sm, flex: 1 },
  navLabelActive: { color: C.primary, fontWeight: '700' },
  navLabelDim: { color: C.textTertiary },
  activeBar: { position: 'absolute', left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2, backgroundColor: C.primary },
  footer: { paddingHorizontal: S.base, paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.border, gap: 3 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  footerText: { color: C.textTertiary, fontSize: F.xs },
});
