import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../utils/theme';

interface BottomBarProps {
  onNewOrder: () => void;
  onSearch: () => void;
}

export default function BottomBar({ onNewOrder, onSearch }: BottomBarProps) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.item} onPress={onNewOrder}>
        <Text style={styles.icon}>＋</Text>
        <Text style={styles.label}>Nová zakázka</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={onSearch}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.label}>Vyhledat</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>⊞</Text>
        <Text style={styles.label}>Kód / QR</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item}>
        <Text style={styles.icon}>☁</Text>
        <Text style={styles.label}>Offline režim</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-around',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  icon: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
});
