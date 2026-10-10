import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Platform, Pressable, Text, View } from 'react-native';
import { api, Chat, onSocketEvent } from '../../src/api';
import { Avatar } from '../../src/Avatar';
import { useTheme } from '../../src/theme';

const preview = (c: Chat) => (c.lastMessage ? c.lastMessage.text ?? 'Вложение' : 'Нет сообщений');
const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Chats() {
  const t = useTheme();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);

  const load = useCallback(() => { api.chats().then(setChats).catch(() => {}); }, []);
  useFocusEffect(load);
  useEffect(() => onSocketEvent(load), [load]);

  const add = () => {
    const go = (i: number) => router.push(i === 0 ? '/new-chat' : '/new-group');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: ['Личный чат', 'Группа', 'Отмена'], cancelButtonIndex: 2 }, (i) => i < 2 && go(i));
    } else {
      Alert.alert('Создать', undefined, [
        { text: 'Личный чат', onPress: () => go(0) }, { text: 'Группа', onPress: () => go(1) }, { text: 'Отмена', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={chats}
        keyExtractor={(c) => String(c.id)}
        ListEmptyComponent={<Text style={{ color: t.muted, textAlign: 'center', marginTop: 80 }}>Чатов пока нет.{'\n'}Нажмите «+», чтобы начать.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, title: item.title } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Avatar name={item.title} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
              <Text numberOfLines={1} style={{ color: t.muted, marginTop: 2 }}>{preview(item)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              {item.lastMessage && <Text style={{ color: t.muted, fontSize: 12 }}>{time(item.lastMessage.createdAt)}</Text>}
              {item.unread > 0 && (
                <View style={{ backgroundColor: t.accent, borderRadius: 10, minWidth: 20, paddingHorizontal: 6, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: t.onAccent, fontSize: 12, fontWeight: '700' }}>{item.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
      <Pressable onPress={add} style={{ position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', elevation: 4 }}>
        <Ionicons name="add" size={30} color={t.onAccent} />
      </Pressable>
    </View>
  );
}
