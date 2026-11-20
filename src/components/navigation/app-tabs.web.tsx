import { MaterialIcons } from '@expo/vector-icons';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type TabButtonProps = TabTriggerSlotProps & {
  icon: keyof typeof MaterialIcons.glyphMap;
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home">Accueil</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="explore">Explorer</TabButton>
          </TabTrigger>
          <TabTrigger name="upload" href="/upload" asChild>
            <TabButton icon="cloud-upload">Déposer</TabButton>
          </TabTrigger>
          <TabTrigger name="favorites" href="/favorites" asChild>
            <TabButton icon="bookmark">Favoris</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="person">Profil</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={{ height: 'calc(100dvh - 72px)', minHeight: 0 }} />
    </Tabs>
  );
}

export function TabButton({
  children,
  icon,
  isFocused,
  onPress,
  onLongPress,
  accessibilityRole,
  accessibilityState,
}: TabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const activeColor = isFocused ? colors.primaryBright : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <MaterialIcons name={icon} size={18} color={activeColor} style={styles.tabIcon} />
        <ThemedText
          type="small"
          style={{ color: isFocused ? colors.text : colors.textSecondary, fontWeight: isFocused ? '800' : '600' }}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brandRow}>
          <MaterialIcons name="school" size={26} color={colors.primaryBright} />
          <ThemedText type="smallBold" style={styles.brandText}>
            Archivage Examen
          </ThemedText>
        </View>

        <View style={styles.tabsRow}>
          {props.children}
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'relative',
    height: 72,
    width: '100%',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    height: 72,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    maxWidth: 1200,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F1',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tabIcon: {
    marginRight: 6,
  },
});
