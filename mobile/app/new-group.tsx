import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { api } from '../src/api';
import { useTheme } from '../src/theme';
import { UserPicker } from '../src/UserPicker';

export default function NewGroup() {
  const t = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [ids, setIds] = useState<number[]>([]);

  const create = async () => {
    try {
      const { id } = await api.createGroup(title, ids);
      router.replace({ pathname: '/chat/[id]', params: { id, title } });
    } catch (e) { Alert.alert('Ошибка', (e as Error).message); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerRight: () => (
        <Pressable onPress={create}><Text style={{ color: t.accent, fontSize: 16, fontWeight: '600' }}>Создать</Text></Pressable>) }} />
      <TextInput value={title} onChangeText={setTitle} placeholder="Название группы" placeholderTextColor={t.muted}
        style={{ margin: 12, marginBottom: 0, padding: 12, borderRadius: 12, backgroundColor: t.card, color: t.text, fontSize: 16 }} />
      <UserPicker selected={ids} onPress={(u) => setIds((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))} />
    </View>
  );
}
