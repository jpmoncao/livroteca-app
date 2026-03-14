import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function StackLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme === 'dark' ? 'dark' : 'light'].background;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, backgroundColor }}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="book/[id]" options={{ headerShown: false, title: 'Detalhes do livro' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="login" options={{ headerShown: false, title: 'Login' }} />
          <Stack.Screen name="registrar" options={{ headerShown: false, title: 'Cadastro' }} />
          <Stack.Screen name="perfil" options={{ headerShown: false, title: 'Perfil' }} />
        </Stack>
      </View>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
