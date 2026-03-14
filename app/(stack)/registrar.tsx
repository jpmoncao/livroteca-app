import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function RegistrarScreen() {
  const { login } = useAuth();
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const buttonPrimaryColor = useThemeColor({}, 'primary');

  const handleRegistrar = () => {
    // TODO: Implementar cadastro real
    login();
    router.replace('/(tabs)/home');
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
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="E-mail"
              placeholderTextColor={iconColor}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Telefone"
              placeholderTextColor={iconColor}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, { color: textColor, borderColor }]}
              placeholder="Senha"
              placeholderTextColor={iconColor}
              secureTextEntry
            />
          </View>

          <Pressable
            onPress={handleRegistrar}
            style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor }, pressed && styles.buttonPressed]}>
            <ThemedText type="defaultSemiBold" style={{ color: textColor }}>
              Cadastrar
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
