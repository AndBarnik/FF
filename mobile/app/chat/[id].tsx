import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { api, Message, onSocketEvent } from '../../src/api';
import { useAuth } from '../../src/auth';
import { useTheme } from '../../src/theme';

export default function ChatScreen() {
  const t = useTheme();
  const { user } = useAuth();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const chatId = Number(id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const list = useRef<FlatList<Message>>(null);

  useEffect(() => {
    api.messages(chatId).then(setMessages).catch(() => {});
    api.markRead(chatId).catch(() => {});
    return onSocketEvent((e) => {
      if (e.type === 'message' && e.message?.chatId === chatId) {
        setMessages((p) => (p.some((m) => m.id === e.message!.id) ? p : [...p, e.message!]));
        api.markRead(chatId).catch(() => {});
      }
    });
  }, [chatId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    try {
      const m = await api.send(chatId, value);
      setMessages((p) => (p.some((x) => x.id === m.id) ? p : [...p, m]));
    } catch { setText(value); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ title: title ?? 'Чат' }} />
      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 12, gap: 6 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return (
            <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', backgroundColor: mine ? t.bubbleMine : t.bubbleTheirs, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ color: mine ? t.textMine : t.text, fontSize: 16 }}>{item.text}</Text>
              <Text style={{ color: mine ? '#D6E6FF' : t.muted, fontSize: 11, alignSelf: 'flex-end', marginTop: 2 }}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: t.border }}>
        <TextInput value={text} onChangeText={setText} placeholder="Сообщение" placeholderTextColor={t.muted} multiline
          style={{ flex: 1, maxHeight: 120, backgroundColor: t.card, color: t.text, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 }} />
        <Pressable onPress={send} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="send" size={18} color={t.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
