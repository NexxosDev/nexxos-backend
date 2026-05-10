import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../src/contexts/AuthContext';
import { CatalogProvider } from '../src/contexts/CatalogContext';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { UnreadProvider } from '../src/contexts/UnreadContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

SplashScreen.preventAutoHideAsync().catch(() => {});

function NotificationNavigator() {
  const router = useRouter();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
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
        }
      } catch (err) {
        console.error('Error navigating from notification:', err);
      }
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);
    return () => clearTimeout(timeout);
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
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <CatalogProvider>
                <UnreadProvider>
                  <InnerLayout />
                </UnreadProvider>
              </CatalogProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
