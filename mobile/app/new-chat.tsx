import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { api } from '../src/api';
import { UserPicker } from '../src/UserPicker';

export default function NewChat() {
  const router = useRouter();
  return (
    <UserPicker onPress={async (u) => {
      try {
        const { id } = await api.createDirect(u.id);
        router.replace({ pathname: '/chat/[id]', params: { id, title: u.name } });
      } catch (e) { Alert.alert('Ошибка', (e as Error).message); }
    }} />
  );
}
