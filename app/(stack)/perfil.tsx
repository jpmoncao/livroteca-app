import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function PerfilScreen() {
  const { logout } = useAuth();

  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/home');
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenLayout>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Meu perfil
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            Gerencie sua conta e preferências
          </ThemedText>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor }, pressed && styles.buttonPressed]}>
            <ThemedText type="defaultSemiBold" style={{ color: buttonTextColor }}>
              Sair
            </ThemedText>
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
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
