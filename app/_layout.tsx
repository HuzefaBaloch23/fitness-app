import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/db';
import { getProfile, seedDefaultPlanIfEmpty, seedFoodCatalogIfEmpty } from '../src/db/queries';
import { useNotificationActions } from '../src/hooks/useNotificationActions';
import { usePalette } from '../src/theme';

export default function RootLayout() {
  const p = usePalette();
  const [ready, setReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useNotificationActions();

  useEffect(() => {
    (async () => {
      try {
        await getDb();
        await seedDefaultPlanIfEmpty();
        // Seeding the food list is a convenience, never a reason to block the
        // app from opening.
        await seedFoodCatalogIfEmpty().catch((e) => console.warn('food seed failed', e));
        setNeedsSetup((await getProfile()) === null);
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: p.danger, textAlign: 'center' }}>Database failed to open{'\n'}{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={p.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        initialRouteName={needsSetup ? 'onboarding' : '(tabs)'}
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="add-food" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
