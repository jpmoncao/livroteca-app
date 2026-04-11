import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { auth, database } from "@/services/connectionFirebase";
import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

interface User {
  name: string;
  email: string;
  cellphone: string;
  password: string;
}

export default function RegistrarScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');

  const handleRegistrar = async () => {
    if (!user || !user.cellphone || !user.email || !user.name || !user.password) {
      setErrorMessage('Preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);

      const userRef = ref(database, `users/${userCredential.user.uid}`);
      await set(userRef, {
        name: user.name,
        email: user.email,
        cellphone: user.cellphone,
      });

      router.replace('/login');
    } catch (error) {
      console.error(error);

      switch ((error as any).code) {
        case 'auth/email-already-in-use':
          setErrorMessage('E-mail já cadastrado');
          break;
        case 'auth/invalid-email':
          setErrorMessage('E-mail inválido');
          break;
        default:
          setErrorMessage('Erro ao cadastrar');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenLayout>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Criar conta
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Preencha os dados para se cadastrar
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Nome"
              placeholderTextColor={iconColor}
              autoCapitalize="words"
              value={user?.name}
              onChangeText={(text) => setUser({ ...user, name: text } as User)}
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="E-mail"
              placeholderTextColor={iconColor}
              keyboardType="email-address"
              autoCapitalize="none"
              value={user?.email}
              onChangeText={(text) => setUser({ ...user, email: text } as User)}
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Telefone"
              placeholderTextColor={iconColor}
              keyboardType="phone-pad"
              value={user?.cellphone}
              onChangeText={(text) => setUser({ ...user, cellphone: text } as User)}
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Senha"
              placeholderTextColor={iconColor}
              secureTextEntry
              value={user?.password}
              onChangeText={(text) => setUser({ ...user, password: text } as User)}
            />
            {errorMessage && <ThemedText type="default" style={{ color: 'red', marginBottom: 8 }}>{errorMessage}</ThemedText>}
          </View>

          <Pressable
            onPress={handleRegistrar}
            style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor, opacity: isLoading ? 0.5 : 1 }, pressed && styles.buttonPressed, isLoading && { opacity: 0.5 }]}>
            <ThemedText type="defaultSemiBold" style={[{ color: buttonTextColor }]}>
              {isLoading ? 'Carregando...' : 'Cadastrar'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <ThemedText type="default">Já tem uma conta? </ThemedText>
            <ThemedText type="link">Entrar</ThemedText>
          </Pressable>
        </View>
      </ScreenLayout>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.8,
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loginLink: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
