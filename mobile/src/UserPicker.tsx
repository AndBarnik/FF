import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { api, User } from './api';
import { Avatar } from './Avatar';
import { useTheme } from './theme';

export function UserPicker({ selected, onPress }: { selected?: number[]; onPress: (u: User) => void }) {
  const t = useTheme();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const id = setTimeout(() => api.searchUsers(q).then(setUsers).catch(() => {}), 250);
    return () => clearTimeout(id);
  }, [q]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <TextInput value={q} onChangeText={setQ} placeholder="Поиск по имени или email" placeholderTextColor={t.muted} autoCapitalize="none"
        style={{ margin: 12, padding: 12, borderRadius: 12, backgroundColor: t.card, color: t.text, fontSize: 16 }} />
      <FlatList data={users} keyExtractor={(u) => String(u.id)} keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable onPress={() => onPress(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Avatar name={item.name} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16 }}>{item.name}</Text>
              <Text style={{ color: t.muted, fontSize: 13 }}>{item.email}</Text>
            </View>
            {selected?.includes(item.id) && <Text style={{ color: t.accent, fontSize: 20 }}>✓</Text>}
          </Pressable>
        )} />
    </View>
  );
}
