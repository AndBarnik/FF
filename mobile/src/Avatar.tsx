import { Text, View } from 'react-native';
import { useTheme } from './theme';

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.onAccent, fontWeight: '700', fontSize: size * 0.4 }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}
