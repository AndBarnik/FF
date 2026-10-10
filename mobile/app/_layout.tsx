import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/auth';
import { useTheme } from '../src/theme';

function Gate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const t = useTheme();

  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!user && !onLogin) router.replace('/login');
    else if (user && onLogin) router.replace('/');
  }, [user, loading, segments]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color={t.accent} /></View>;
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ title: '' }} />
      <Stack.Screen name="new-chat" options={{ title: 'Новый чат', presentation: 'modal' }} />
      <Stack.Screen name="new-group" options={{ title: 'Новая группа', presentation: 'modal' }} />
    </Stack>
  );
}

export default function Root() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Gate />
    </AuthProvider>
  );
}
