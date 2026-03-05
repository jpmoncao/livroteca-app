import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MenuMobile from '../../components/ui/menu-mobile';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1 }}>
      <MenuMobile />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
            title: 'Início',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'Início',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Pesquisar',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="search.fill" color={color} />,
            tabBarStyle: {
              backgroundColor: Colors[colorScheme ?? 'light'].menuBackground,
              borderTopWidth: 1,
              borderTopColor: Colors[colorScheme ?? 'light'].icon,
            },
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Minha biblioteca',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
