import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';

interface ScreenLayoutProps {
  children: React.ReactNode;
  /** Exibe o header com botão Voltar. Padrão: true */
  showHeader?: boolean;
}

export function ScreenLayout({ children, showHeader = true }: ScreenLayoutProps) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      {showHeader && (
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push(`/(tabs)/home`);
              }
            }}
            style={({ pressed, hovered }) => [
              styles.backButton,
              (pressed || hovered) && styles.backButtonHover,
            ]}
            hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={textColor} />
            <ThemedText type="default">Voltar</ThemedText>
          </Pressable>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '100%',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
  },
  backButtonHover: {
    opacity: 0.8,
    backgroundColor: '#ffffff11',
  },
});
