import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, F, S, R } from '../theme';

export type AppSection = 'orders' | 'customers' | 'objects' | 'settings';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface NavItem {
  id: AppSection | 'dashboard' | 'calendar' | 'catalog' | 'stats' | 'settings';
  label: string;
  icon: IoniconName;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Přehled',    icon: 'grid-outline',      disabled: true },
  { id: 'orders',    label: 'Zakázky',    icon: 'clipboard-outline' },
  { id: 'calendar',  label: 'Kalendář',   icon: 'calendar-outline',  disabled: true },
  { id: 'customers', label: 'Zákazníci',  icon: 'people-outline' },
  { id: 'objects',   label: 'Objekty',    icon: 'business-outline' },
  { id: 'catalog',   label: 'Katalog',    icon: 'book-outline',      disabled: true },
  { id: 'stats',     label: 'Statistiky', icon: 'bar-chart-outline', disabled: true },
  { id: 'settings',  label: 'Nastavení',  icon: 'settings-outline' },
];

interface Props {
  active: AppSection;
  onSelect: (section: AppSection) => void;
}

export default function AppSidebar({ active, onSelect }: Props) {
  return (
    <View style={s.sidebar}>
      {/* Logo */}
      <View style={s.logo}>
        <View style={s.logoIcon}><Text style={s.logoIconText}>R</Text></View>
        <Text style={s.logoText}>REVEXA</Text>
      </View>

      {/* Navigace */}
      <View style={s.navList}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active;
          const dim = !!item.disabled;
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.navItem, isActive && s.navItemActive, dim && s.navItemDim]}
              onPress={() => !dim && onSelect(item.id as AppSection)}
              activeOpacity={dim ? 1 : 0.75}
            >
              {isActive && <View style={s.activeBar} />}
              <Ionicons
                name={item.icon}
                size={18}
                color={isActive ? C.primary : dim ? C.textTertiary : C.textSecondary}
              />
              <Text style={[s.navLabel, isActive && s.navLabelActive, dim && s.navLabelDim]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: S.xs }}>
          <View style={s.syncDot} />
          <Text style={s.footerText}>Synchronizováno</Text>
        </View>
        <Text style={s.footerText}>Verze 1.0.0</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: {
    width: 188,
    backgroundColor: C.surface,
    borderRightWidth: 1,
    borderRightColor: C.border,
    flexDirection: 'column',
    paddingTop: 10,
    paddingBottom: 10,
  },
  logo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginBottom: S.xs, gap: 8 },
  logoIcon: { width: 28, height: 28, borderRadius: 6, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  logoIconText: { color: '#fff', fontWeight: 'bold', fontSize: F.sm },
  logoText: { color: C.textPrimary, fontSize: F.md, fontWeight: 'bold', letterSpacing: 3 },
  navList: { flex: 1, paddingHorizontal: 6 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: R.md,
    marginBottom: 1,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: { backgroundColor: C.primary + '1A' },
  navItemDim:    { opacity: 0.28 },
  activeBar: { position: 'absolute', left: 0, top: 7, bottom: 7, width: 3, borderRadius: 2, backgroundColor: C.primary },
  navLabel:      { color: C.textSecondary, fontSize: F.sm - 1, flex: 1 },
  navLabelActive:{ color: C.primary, fontWeight: '700' },
  navLabelDim:   { color: C.textTertiary },
  footer: { paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border, gap: 2 },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  footerText: { color: C.textTertiary, fontSize: 10 },
});
