import { auth, database } from "@/services/connectionFirebase";
import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { get, ref, update } from "firebase/database";
import { useEffect, useState } from 'react';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function PerfilScreen() {
  const { logout } = useAuth();

  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const buttonPrimaryColor = useThemeColor({}, 'primary');
  const buttonTextColor = useThemeColor({}, 'onPrimary');
  const buttonSecondaryColor = useThemeColor({}, 'secondary');

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [name, setName] = useState('');
  const [cellphone, setCellphone] = useState('');

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

  useEffect(() => {
    if (userData) {
      setName(userData.name);
      setCellphone(userData.cellphone);
    }
  }, [isEditing]);

  const handleLogout = () => {
    logout();
    router.replace('/(tabs)/home');
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    try {
      setIsLoading(true);
      const snapshot = ref(database, `users/${auth.currentUser?.uid}`);
      update(snapshot, {
        name,
        cellphone,
      });

      setUserData({
        name,
        cellphone,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar dados do usuário:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenLayout>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.title}>
              Meu perfil
            </ThemedText>
            {!isLoading && !isEditing && (
              <Pressable
                onPress={handleEdit}
                style={({ pressed }) => [
                  styles.editIconButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityLabel="Editar perfil"
                hitSlop={12}
              >
                <MaterialIcons name="edit" size={22} color={iconColor} />
              </Pressable>
            )}
          </View>
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
                {isEditing ? "Editar dados" : "Seus dados:"}
              </ThemedText>
              {isEditing ? (
                <View style={styles.form}>
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Nome"
                    placeholderTextColor={iconColor}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={(text) =>
                      setName(text)
                    }
                  />
                  <TextInput
                    style={[styles.input, { color: textColor, borderColor }]}
                    placeholder="Telefone"
                    placeholderTextColor={iconColor}
                    keyboardType="phone-pad"
                    value={cellphone}
                    onChangeText={(text) =>
                      setCellphone(text)
                    }
                  />

                  <Pressable
                    onPress={handleSave}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      {
                        ...styles.button,
                        backgroundColor: buttonPrimaryColor,
                        opacity: isLoading ? 0.5 : 1,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold" style={{ color: buttonTextColor }}>
                      {isLoading ? 'Salvando...' : 'Salvar'}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleCancel}
                    disabled={isLoading}
                    style={({ pressed }) => [
                      {
                        ...styles.button,
                        backgroundColor: buttonSecondaryColor,
                        opacity: isLoading ? 0.5 : 1,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <ThemedText type="defaultSemiBold" style={{ color: buttonTextColor }}>
                      Cancelar
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                <>
                  <ThemedText type="default" style={styles.subtitle}>
                    <ThemedText type="defaultSemiBold">Nome:</ThemedText> {userData?.name}
                  </ThemedText>
                  <ThemedText type="default" style={styles.subtitle}>
                    <ThemedText type="defaultSemiBold">Telefone:</ThemedText> {userData?.cellphone}
                  </ThemedText>

                  <Pressable
                    onPress={handleLogout}
                    disabled={isLoading || isEditing}
                    style={({ pressed }) => [{ ...styles.button, backgroundColor: buttonPrimaryColor, opacity: isLoading || isEditing ? 0.5 : 1 }, pressed && styles.buttonPressed]}>
                    <ThemedText type="defaultSemiBold" style={{ color: buttonTextColor }}>
                      Sair
                    </ThemedText>
                  </Pressable>
                </>
              )}
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginBottom: 0,
  },
  editIconButton: {
    padding: 6,
    marginTop: 2,
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
  buttonPressed: {
    opacity: 0.8,
  },
});
