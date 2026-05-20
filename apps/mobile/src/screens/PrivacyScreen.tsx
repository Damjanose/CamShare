import { useNavigation } from '@react-navigation/native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { GlassCard } from '../components/primitives/GlassCard';

type Section = { title: string; body: string | string[] };

const sections: Section[] = [
  {
    title: '1. Information We Collect',
    body: [
      'Account Data — your full name, email address, and a securely hashed password.',
      'Event Data — event names, dates, descriptions, and configuration settings you provide as a host.',
      'User Content — photos, videos, and thumbnails uploaded to any event album.',
      'Technical Data — IP addresses, device type, operating system, and usage logs collected automatically.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'Service delivery — to create accounts, manage events, and display uploads (legal basis: contract).',
      'Security & fraud prevention — to detect and prevent abuse (legal basis: legitimate interests).',
      'Service improvement — to analyse aggregate usage patterns and fix bugs (legal basis: legitimate interests).',
      'Communications — transactional emails and, with your consent, product updates.',
    ],
  },
  {
    title: '3. Sharing Your Information',
    body: [
      'We do not sell your personal data.',
      'Service providers — cloud hosting and email partners under strict data processing agreements.',
      'Event participants — photos within an album are visible to other participants who have access to that event.',
      'Legal requirements — if required by court order or applicable law.',
    ],
  },
  {
    title: '4. Data Retention',
    body: [
      'Account data is retained while your account is active and deleted within 30 days of a closure request.',
      'Event content is retained for 12 months after the event date, or until the host deletes it.',
      'Backup copies are purged within 90 days following deletion.',
    ],
  },
  {
    title: '5. Your Rights (GDPR / CCPA)',
    body: [
      'EU/UK users: right to access, rectify, erase, restrict, port, and object to processing. Lodge complaints with your supervisory authority.',
      'California users: right to know what is collected, request deletion, correct inaccuracies, and opt out of sale (we do not sell data).',
      'To exercise any right, email privacy@camshare.io.',
    ],
  },
  {
    title: '6. Cookies & Tracking',
    body: [
      'Essential cookies — required for authentication and core functionality.',
      'Analytics cookies — privacy-respecting, IP-anonymised analytics. Opt out via your browser\'s Do Not Track setting.',
      'We do not use advertising cookies or cross-site tracking networks.',
    ],
  },
  {
    title: '7. Children\'s Privacy',
    body: 'The Service is not directed to children under 13. We do not knowingly collect personal data from children under 13. Contact privacy@camshare.io if you believe a child has provided data.',
  },
  {
    title: '8. Changes to This Policy',
    body: 'We will notify registered users by email at least 30 days before material changes take effect and update the effective date above.',
  },
  {
    title: '9. Contact Us',
    body: 'CamShare, Inc. · privacy@camshare.io · Registered in Delaware, USA.',
  },
];

export function PrivacyScreen() {
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>LEGAL</Text>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Effective: May 20, 2026</Text>
        </View>

        {/* Intro */}
        <GlassCard style={styles.card} padding={20}>
          <Text style={styles.introText}>
            CamShare, Inc. operates the CamShare platform. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information. By using the Service, you
            agree to the practices described here.
          </Text>
        </GlassCard>

        {/* Sections */}
        {sections.map((s) => (
          <GlassCard key={s.title} style={styles.card} padding={20}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            {Array.isArray(s.body) ? (
              s.body.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.bodyText}>{s.body}</Text>
            )}
          </GlassCard>
        ))}
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
  header: {
    marginBottom: 24,
  },
  eyebrow: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  title: {
    ...TextStyles.headlineLg,
    color: Colors.onSurface,
    marginBottom: 6,
  },
  subtitle: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  card: {
    marginBottom: 12,
  },
  introText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 25,
  },
  sectionTitle: {
    ...TextStyles.labelMd,
    color: Colors.primary,
    marginBottom: 14,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    color: Colors.primary,
    fontSize: 14,
    lineHeight: 23,
    flexShrink: 0,
  },
  bulletText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 23,
    flex: 1,
  },
  bodyText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 25,
  },
});
