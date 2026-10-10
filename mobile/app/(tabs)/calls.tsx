import { Text, View } from 'react-native';
import { useTheme } from '../../src/theme';

export default function Calls() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <Text style={{ color: t.muted }}>Звонки появятся на этапе 4</Text>
    </View>
  );
}
