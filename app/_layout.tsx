import { Stack } from 'expo-router';

import { AuthProvider } from '@/contexts/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(stack)" />
      </Stack>
    </AuthProvider>
  );
}
