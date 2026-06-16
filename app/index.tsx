import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors, Typography } from '../src/utils/theme';
import { getDatabase } from '../src/database/database';
import MainApp from '../src/components/MainApp';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initDb() {
      try {
        await getDatabase();
        setDbReady(true);
      } catch (e) {
        setError('Nepodařilo se inicializovat databázi.');
        console.error('DB init error:', e);
      }
    }
    initDb();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!dbReady) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>R</Text>
          </View>
          <Text style={styles.logoText}>REVEXA</Text>
        </View>
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
        <Text style={styles.loadingText}>Inicializace databáze...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.surface} />
      <MainApp />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: Typography.extraBold,
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: Typography.extraBold,
    letterSpacing: 4,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    marginTop: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.lg,
    textAlign: 'center',
  },
});
