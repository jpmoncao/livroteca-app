import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MenuMobile from '../../components/ui/menu-mobile';
import { useThemeColor } from '../../hooks/use-theme-color';

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const menuBackgroundColor = useThemeColor({}, 'menuBackground');
  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <MenuMobile />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tintColor,
          headerShown: false,
          tabBarButton: HapticTab,
          animation: 'fade',
        }}
      >
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
              backgroundColor: menuBackgroundColor,
              borderTopWidth: 1,
              borderTopColor: iconColor,
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
