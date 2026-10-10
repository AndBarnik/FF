import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../src/auth';
import { useTheme } from '../src/theme';

export default function Login() {
  const t = useTheme();
  const { signIn, signUp } = useAuth();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (register) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = { backgroundColor: t.card, color: t.text, borderRadius: 14, padding: 14, fontSize: 16, marginBottom: 12 };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: t.bg }}>
      <Text style={{ color: t.text, fontSize: 32, fontWeight: '700', marginBottom: 6 }}>FF Messenger</Text>
      <Text style={{ color: t.muted, marginBottom: 28 }}>{register ? 'Создайте аккаунт' : 'Войдите, чтобы продолжить'}</Text>
      {register && <TextInput style={input} placeholder="Имя" placeholderTextColor={t.muted} value={name} onChangeText={setName} />}
      <TextInput style={input} placeholder="Email" placeholderTextColor={t.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={input} placeholder="Пароль (от 6 символов)" placeholderTextColor={t.muted} secureTextEntry value={password} onChangeText={setPassword} />
      {!!error && <Text style={{ color: t.danger, marginBottom: 12 }}>{error}</Text>}
      <Pressable onPress={submit} disabled={busy} style={{ backgroundColor: t.accent, borderRadius: 14, padding: 15, alignItems: 'center' }}>
        {busy ? <ActivityIndicator color={t.onAccent} /> : <Text style={{ color: t.onAccent, fontSize: 16, fontWeight: '600' }}>{register ? 'Зарегистрироваться' : 'Войти'}</Text>}
      </Pressable>
      <Pressable onPress={() => { setRegister(!register); setError(''); }} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text style={{ color: t.accent }}>{register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
