import React, { useEffect, useCallback, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as NavigationBar from 'expo-navigation-bar';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { ThemeProvider, useThemeContext } from '@/theme';
import { useAppStore } from '@/stores/useAppStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useFeatureFlagsStore } from '@/stores/useFeatureFlagsStore';
import { fetchFeatureFlags } from '@/features/feature-flags/api';
import { useServerStatus } from '@/hooks/useServerStatus';
import { ServiceUnavailableScreen } from '@/components/feedback/ServiceUnavailableScreen';
import { adManager } from '@/services/ads';
import { initializeFirebase } from '@/services/firebase';
import i18n from '@/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

function AppShell() {
  const { status, retry } = useServerStatus();

  if (status === 'checking' || status === 'unavailable') {
    return <ServiceUnavailableScreen status={status} onRetry={retry} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="game"
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: Platform.OS === 'ios' ? 'modal' : 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

function AndroidNavigationBar() {
  const { isDark } = useThemeContext();

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
    }
  }, [isDark]);

  return null;
}

const FEATURE_FLAGS_CACHE_TTL_MS = 5 * 60 * 1000;
const SPLASH_MAX_DURATION_MS = 2500;

export default function RootLayout() {
  const initializeDevice = useAppStore((s) => s.initializeDevice);
  const incrementLaunchCount = useAppStore((s) => s.incrementLaunchCount);

  const setFlags = useFeatureFlagsStore((s) => s.setFlags);
  const setFlagsLoading = useFeatureFlagsStore((s) => s.setLoading);
  const lastFetchedAt = useFeatureFlagsStore((s) => s.lastFetchedAt);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  const [dataReady, setDataReady] = useState(false);
  const splashHidden = useRef(false);

  const loadFeatureFlags = useCallback(async () => {
    if (lastFetchedAt && Date.now() - lastFetchedAt < FEATURE_FLAGS_CACHE_TTL_MS) {
      return;
    }
    setFlagsLoading(true);
    try {
      const flags = await fetchFeatureFlags();
      const flagsMap = Object.fromEntries(flags.map((f) => [f.key, f]));
      setFlags(flagsMap);
    } catch {
      // Graceful degradation: работаем с закэшированными или дефолтными флагами
    } finally {
      setFlagsLoading(false);
    }
  }, [lastFetchedAt, setFlags, setFlagsLoading]);

  // Load app data + enforce max splash duration
  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled) setDataReady(true);
    }, SPLASH_MAX_DURATION_MS);

    async function init() {
      initializeDevice();
      incrementLaunchCount();
      adManager.initialize();
      initializeFirebase();

      // Wait for feature flags
      await loadFeatureFlags().catch(() => {});

      // Wait for settings store hydration, then sync i18n
      if (!useSettingsStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsubscribe = useSettingsStore.persist.onFinishHydration(() => {
            unsubscribe();
            resolve();
          });
        });
      }

      const { language } = useSettingsStore.getState();
      i18n.changeLanguage(language);

      if (!cancelled) setDataReady(true);
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [initializeDevice, incrementLaunchCount, loadFeatureFlags]);

  // Hide splash when fonts loaded AND (data ready OR timed out)
  useEffect(() => {
    if (fontsLoaded && dataReady && !splashHidden.current) {
      splashHidden.current = true;
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dataReady]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AndroidNavigationBar />
            <AppShell />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
