import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBright,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundElement,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={24} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="explore" size={24} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="upload"
        options={{
          title: 'Déposer',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="cloud-upload" size={24} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bookmark" size={24} color={color as string} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={24} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
