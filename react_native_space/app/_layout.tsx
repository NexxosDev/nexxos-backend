import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CatalogProvider } from '../src/contexts/CatalogContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { UnreadProvider } from '../src/contexts/UnreadContext';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import AnimatedSplash from '../src/components/AnimatedSplash';

// expo-notifications crashes Expo Go on SDK 53+; only import in dev builds / standalone
const isExpoGo = Constants.appOwnership === 'expo';
let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
  } catch {
    // silently ignore — notifications unavailable
  }
}

SplashScreen.preventAutoHideAsync().catch(() => {});

function NotificationNavigator() {
  const router = useRouter();
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !Notifications) return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (!data?.type) return;

      try {
        switch (data.type) {
          case 'NEW_REQUEST':
            router.push('/vendor/requests');
            break;
          case 'NEW_RESPONSE':
            if (data.requestId) router.push(`/request-detail?id=${data.requestId}`);
            break;
          case 'NEW_MESSAGE':
            if (data.chatId) router.push(`/chat?chatId=${data.chatId}`);
            break;
          case 'REQUEST_CLOSED':
            router.push('/vendor/requests');
            break;
          case 'RATING_RECEIVED':
            router.push('/vendor');
            break;
          case 'RATING_REMINDER':
            if (data.requestId) router.push(`/request-detail?id=${data.requestId}`);
            else router.push('/client/requests');
            break;
        }
      } catch (err) {
        console.error('Error navigating from notification:', err);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current?.remove?.();
      }
    };
  }, [router]);

  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function InnerLayout() {
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Font.loadAsync({
          'Montserrat-ExtraBold': require('../assets/fonts/Montserrat-ExtraBold.ttf'),
          'Montserrat-Black': require('../assets/fonts/Montserrat-Black.ttf'),
        });
        if (!cancelled) setFontLoaded(true);
      } catch (err) {
        console.warn('Font load failed, continuing with fallback:', err);
        if (!cancelled) setFontLoaded(true); // continue anyway with system font
      }
      // Hide native splash once our animated one is ready
      SplashScreen.hideAsync().catch(() => {});
    })();
    // Safety timeout: always hide native splash after 5s
    const safetyTimeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      if (!fontLoaded) setFontLoaded(true);
      setShowSplash(false);
    }, 5000);
    return () => { cancelled = true; clearTimeout(safetyTimeout); };
  }, []);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      <NotificationNavigator />
      <ThemedStatusBar />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="role-selection" options={{ gestureEnabled: false }} />
        <Stack.Screen name="client" options={{ gestureEnabled: false }} />
        <Stack.Screen name="vendor" options={{ gestureEnabled: false }} />
        <Stack.Screen name="create-request" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="request-detail" />
        <Stack.Screen name="vendor-request-detail" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="vendor-edit-profile" />
        <Stack.Screen name="about" />
        <Stack.Screen name="legal-document" />
        <Stack.Screen name="plans" />
        <Stack.Screen name="payment-info" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showSplash && (
        <AnimatedSplash onFinish={handleSplashFinish} fontLoaded={fontLoaded} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <NetworkProvider>
              <AuthProvider>
                <CatalogProvider>
                  <UnreadProvider>
                    <InnerLayout />
                  </UnreadProvider>
                </CatalogProvider>
              </AuthProvider>
            </NetworkProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
