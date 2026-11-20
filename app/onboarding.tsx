import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui/app-button';
import { useTheme } from '@/hooks/use-theme';
import { useResponsive } from '@/hooks/use-responsive';

const panels = [
  ['Bibliothèque académique', 'Retrouvez les sujets, devoirs, examens et cours utiles à vos révisions.'],
  ['Recherche simplifiée', 'Explorez les ressources par matière, niveau, année, session et type.'],
  ['Partage collaboratif', 'Déposez vos documents et contribuez à une bibliothèque vérifiable.'],
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const theme = useTheme();
  const responsive = useResponsive();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}><Pressable onPress={() => router.replace('/auth/login')}><Text style={{ color: theme.primaryBright, fontWeight: '700' }}>Passer</Text></Pressable></View>
      <View style={styles.content}>
        <View style={[styles.visual, { backgroundColor: theme.backgroundSelected, width: responsive.isSmall ? 180 : responsive.isTablet ? 260 : 220, height: responsive.isSmall ? 180 : responsive.isTablet ? 260 : 220, borderRadius: responsive.isSmall ? 90 : responsive.isTablet ? 130 : 110 }]}>
          <Text style={[styles.number, { color: theme.primaryBright }]}>0{index + 1}</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{panels[index][0]}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{panels[index][1]}</Text>
        <View style={styles.dots}>{panels.map((_, dot) => <View key={dot} style={[styles.dot, dot === index && { backgroundColor: theme.primaryBright, width: 24 }]} />)}</View>
      </View>
      <View style={styles.actions}>
        {index > 0 ? <View style={{ flex: 1 }}><AppButton label="Précédent" variant="secondary" onPress={() => setIndex(index - 1)} /></View> : null}
        <View style={{ flex: 1 }}><AppButton label={index === 2 ? 'Commencer' : 'Suivant'} onPress={() => index === 2 ? router.replace('/auth/login') : setIndex(index + 1)} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'flex-end', padding: 20 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  visual: { width: 220, height: 220, borderRadius: 110, alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  number: { fontSize: 48, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  description: { marginTop: 12, maxWidth: 420, textAlign: 'center', lineHeight: 22, fontSize: 16 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 24 },
});
