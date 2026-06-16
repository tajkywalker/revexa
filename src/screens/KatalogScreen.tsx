import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../utils/theme';
import Card from '../components/common/Card';

export default function KatalogScreen() {
  const CATEGORIES = [
    {
      title: 'Typy komínů',
      items: [
        { name: 'Zděný komín', desc: 'Klasický komín z cihel nebo prefabrikátů' },
        { name: 'Kovový komín (nerezový)', desc: 'Jednoplášťový nebo dvojplášťový' },
        { name: 'Plastový komín', desc: 'Pro kondenzační kotle, teplota spalin do 120°C' },
        { name: 'Prefabrikovaný komín', desc: 'Systémový komín z prefabrikovaných dílů' },
      ]
    },
    {
      title: 'Typy paliv',
      items: [
        { name: 'Tuhá paliva', desc: 'Uhlí, dřevo, pelety, brikety' },
        { name: 'Zemní plyn', desc: 'Stlačený nebo zkapalnění zemní plyn' },
        { name: 'Topný olej', desc: 'Mazut, lehký topný olej' },
        { name: 'Biomasa', desc: 'Dřevní pelety, štěpka, sláma' },
      ]
    },
    {
      title: 'Kontrolní body',
      items: [
        { name: 'Průchodnost', desc: 'Průřez světlosti spalinové cesty' },
        { name: 'Spalinotěsnost', desc: 'Těsnost spárování a napojení' },
        { name: 'Stav tělesa', desc: 'Praskliny, výlomky, opadávání omítky' },
        { name: 'Sopouchy a dvířka', desc: 'Stav a těsnost čisticích otvorů' },
        { name: 'Připojení spotřebiče', desc: 'Průměr, délka, sklon kouřovodu' },
        { name: 'Tahové poměry', desc: 'Přirozený tah komína' },
        { name: 'Měření CO', desc: 'Koncentrace oxidu uhelnatého ve spalinách (ppm)' },
        { name: 'Větrání', desc: 'Přívod spalovacího vzduchu k spotřebiči' },
      ]
    },
    {
      title: 'Lhůty kontrol (dle vyhl. 34/2016 Sb.)',
      items: [
        { name: 'Tuhá paliva do 50 kW', desc: '3× ročně čištění, 1× ročně kontrola' },
        { name: 'Tuhá paliva nad 50 kW', desc: '4× ročně čištění, 1× ročně kontrola' },
        { name: 'Plynné/kapalné palivo do 50 kW', desc: '1× ročně čištění a kontrola' },
        { name: 'Plynné/kapalné palivo nad 50 kW', desc: '2× ročně čištění, 1× ročně kontrola' },
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Katalog</Text>
      <Text style={styles.pageSubtitle}>Referenční informace pro kominíky</Text>

      {CATEGORIES.map(cat => (
        <Card key={cat.title} style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>{cat.title}</Text>
          {cat.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.desc}</Text>
            </View>
          ))}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.md },
  pageTitle: { color: Colors.textPrimary, fontSize: Typography.xxl, fontWeight: Typography.bold },
  pageSubtitle: { color: Colors.textSecondary, fontSize: Typography.base, marginBottom: Spacing.sm },
  categoryCard: { gap: Spacing.sm },
  categoryTitle: {
    color: Colors.primary, fontSize: Typography.md,
    fontWeight: Typography.bold, marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder + '80' },
  itemName: { color: Colors.textPrimary, fontWeight: Typography.semiBold, fontSize: Typography.base },
  itemDesc: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 2 },
});
