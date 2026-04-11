import { auth, database } from "@/services/connectionFirebase";
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { get, ref } from "firebase/database";
import { useEffect, useState } from 'react';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function PerfilScreen() {
  const { logout } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const user = auth.currentUser;
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserData(data);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

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

          {isLoading ? (
            <ThemedText type="subtitle" style={styles.subtitle}>
              Carregando dados...
            </ThemedText>
          ) : (
            <>
              <ThemedText type="subtitle" style={styles.subtitle}>
                Seus dados:
              </ThemedText>
              <ThemedText type="default" style={styles.subtitle}>
                <ThemedText type="defaultSemiBold">Nome:</ThemedText> {userData?.name}
              </ThemedText>
              <ThemedText type="default" style={styles.subtitle}>
                <ThemedText type="defaultSemiBold">Telefone:</ThemedText> {userData?.cellphone}
              </ThemedText>

              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor }, pressed && styles.buttonPressed]}>
                <ThemedText type="defaultSemiBold" style={{ color: buttonTextColor }}>
                  Sair
                </ThemedText>
              </Pressable>
            </>
          )}
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
