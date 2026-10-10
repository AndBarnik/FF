import { Pressable, Text, View } from 'react-native';
import { Avatar } from '../../src/Avatar';
import { useAuth } from '../../src/auth';
import { useTheme } from '../../src/theme';

export default function Profile() {
  const t = useTheme();
  const { user, signOut } = useAuth();
  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 32, backgroundColor: t.bg }}>
      <Avatar name={user?.name ?? '?'} size={96} />
      <Text style={{ color: t.text, fontSize: 22, fontWeight: '700', marginTop: 16 }}>{user?.name}</Text>
      <Text style={{ color: t.muted, marginTop: 4 }}>{user?.email}</Text>
      <Pressable onPress={signOut} style={{ marginTop: 40, padding: 14 }}>
        <Text style={{ color: t.danger, fontSize: 16 }}>Выйти</Text>
      </Pressable>
    </View>
  );
}
