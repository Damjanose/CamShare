import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { GlassCard } from '../components/primitives/GlassCard';

const values = [
  {
    emoji: '🔒',
    title: 'Privacy First',
    body: 'Your event photos belong to you and your guests — not to advertisers. We never sell personal data.',
  },
  {
    emoji: '⚡',
    title: 'Frictionless by Design',
    body: 'No app downloads, no account friction. Guests scan a QR code and start uploading in seconds.',
  },
  {
    emoji: '📖',
    title: 'Collective Memory',
    body: 'Every event has dozens of perspectives. CamShare unites them into one living gallery so no moment is lost.',
  },
];

export function AboutScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backRow}
        >
          <Text style={styles.backArrow}>‹</Text>
          <Text style={styles.backLabel}>Profile</Text>
        </TouchableOpacity>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>ABOUT CAMSHARE</Text>
          <Text style={styles.headline}>
            Every great event deserves a{' '}
            <Text style={styles.headlineAccent}>shared story.</Text>
          </Text>
          <Text style={styles.subheadline}>
            CamShare was built on a simple belief: the best photos of any celebration are always on
            someone else's phone. We exist to fix that.
          </Text>
        </View>

        {/* The Problem */}
        <GlassCard style={styles.card} padding={24}>
          <Text style={styles.cardTitle}>The problem we set out to solve</Text>
          <Text style={styles.cardBody}>
            After every wedding, birthday, or company retreat, the same thing happens. Hundreds of
            candid shots — the real ones, the funny ones, the ones you'll treasure for decades —
            are scattered across WhatsApp threads, email attachments, and forgotten camera rolls.
          </Text>
          <Text style={[styles.cardBody, { marginTop: 12 }]}>
            The host sends a "please share your photos" message. A few people do. Most don't. The
            collective memory of the event fades into fragmented files no one can find.
          </Text>
          <Text style={[styles.cardBody, { marginTop: 12 }]}>
            We built CamShare to make that problem disappear — before it ever starts.
          </Text>
        </GlassCard>

        {/* Mission */}
        <GlassCard style={styles.card} padding={24}>
          <Text style={styles.cardTitle}>Our mission</Text>
          <Text style={styles.missionText}>
            To make collective memory effortless — so every perspective from every event is
            preserved in one beautiful, shared space.
          </Text>
          <View style={styles.divider} />
        </GlassCard>

        {/* Values */}
        <Text style={styles.sectionLabel}>WHAT WE STAND FOR</Text>
        {values.map((v) => (
          <GlassCard key={v.title} style={styles.valueCard} padding={20}>
            <Text style={styles.valueEmoji}>{v.emoji}</Text>
            <Text style={styles.valueTitle}>{v.title}</Text>
            <Text style={styles.valueBody}>{v.body}</Text>
          </GlassCard>
        ))}

        {/* Version badge */}
        <Text style={styles.version}>CamShare · Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.marginMain,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  backArrow: {
    fontSize: 28,
    color: Colors.primary,
    lineHeight: 32,
    marginTop: -2,
  },
  backLabel: {
    ...TextStyles.labelMd,
    color: Colors.primary,
  },
  hero: {
    marginBottom: 32,
  },
  eyebrow: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  headline: {
    ...TextStyles.headlineLg,
    color: Colors.onSurface,
    marginBottom: 16,
  },
  headlineAccent: {
    color: Colors.primary,
  },
  subheadline: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 26,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    ...TextStyles.headlineMd,
    color: Colors.onSurface,
    marginBottom: 14,
    fontSize: 20,
  },
  cardBody: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 25,
  },
  missionText: {
    ...TextStyles.bodyLg,
    color: Colors.onSurface,
    lineHeight: 30,
    fontStyle: 'italic',
  },
  divider: {
    height: 2,
    width: 48,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 20,
    opacity: 0.7,
  },
  sectionLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2.5,
    marginBottom: 12,
    marginTop: 8,
  },
  valueCard: {
    marginBottom: 12,
  },
  valueEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  valueTitle: {
    ...TextStyles.labelMd,
    color: Colors.onSurface,
    marginBottom: 6,
    fontSize: 15,
  },
  valueBody: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 23,
  },
  version: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 32,
    opacity: 0.5,
  },
});
