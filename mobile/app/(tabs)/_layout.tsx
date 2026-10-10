import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const t = useTheme();
  const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} color={color} size={size} />;
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: t.accent, tabBarInactiveTintColor: t.muted,
      tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.border },
      headerStyle: { backgroundColor: t.bg }, headerTintColor: t.text,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Чаты', tabBarIcon: icon('chatbubbles') }} />
      <Tabs.Screen name="calls" options={{ title: 'Звонки', tabBarIcon: icon('call') }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarIcon: icon('person') }} />
    </Tabs>
  );
}
