import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { auth } from '../../services/connectionFirebase';

interface Login {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const { login } = useAuth();

  const [loginData, setLoginData] = useState<Login | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');

  const handleLogin = async () => {
    if (!loginData || !loginData.email || !loginData.password) {
      setErrorMessage('Preencha todos os campos');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);

      if (userCredential.user) {
        login();
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error(error);

      switch ((error as any).code) {
        case 'auth/invalid-email':
          setErrorMessage('E-mail inválido');
          break;
        case 'auth/user-not-found':
          setErrorMessage('Usuário não encontrado');
          break;
        case 'auth/invalid-credential':
          setErrorMessage('Credenciais inválidas');
          break;
        default:
          setErrorMessage('Erro ao fazer login');
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
            Entrar
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Faça login para acessar sua biblioteca e salvar avaliações
          </ThemedText>

          <View style={styles.form}>
            <TextInput
              style={[{ ...styles.input, borderColor }, { color: textColor }]}
              placeholder="E-mail"
              placeholderTextColor={iconColor}
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginData?.email}
              onChangeText={(text) => setLoginData({ ...loginData, email: text } as Login)}
            />
            <TextInput
              style={[{ ...styles.input, borderColor }, { color: textColor }]}
              placeholder="Senha"
              placeholderTextColor={iconColor}
              secureTextEntry
              value={loginData?.password}
              onChangeText={(text) => setLoginData({ ...loginData, password: text } as Login)}
            />
            {errorMessage && <ThemedText type="default" style={{ color: 'red', marginBottom: 8 }}>{errorMessage}</ThemedText>}
          </View>


          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor, opacity: isLoading ? 0.5 : 1 }, pressed && styles.buttonPressed, isLoading && { opacity: 0.5 }]}>
            <ThemedText type="defaultSemiBold" style={[{ color: buttonTextColor }]}>
              {isLoading ? 'Carregando...' : 'Entrar'}
            </ThemedText>
          </Pressable>

          <Pressable onPress={() => router.push('/registrar')} style={styles.registerLink}>
            <ThemedText type="default">Não tem uma conta? </ThemedText>
            <ThemedText type="link">Cadastrar-se</ThemedText>
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
  registerLink: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
