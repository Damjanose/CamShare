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
    title: '1. Acceptance of Terms',
    body: 'By creating an account, uploading content, or accessing any event album — including as a guest via QR code — you confirm that you are at least 13 years old and accept these Terms in full.',
  },
  {
    title: '2. Description of Service',
    body: 'CamShare is a cloud-based platform that enables event hosts to create shared photo and video albums accessible to guests via QR code, with real-time uploads and administrative controls.',
  },
  {
    title: '3. Account Registration',
    body: [
      'Provide accurate information when registering.',
      'Keep your credentials confidential and notify us of any unauthorised access at legal@camshare.io.',
      'You are responsible for all activity that occurs under your account.',
      'We may suspend or terminate accounts that violate these Terms.',
    ],
  },
  {
    title: '4. User Content',
    body: [
      'Ownership — you retain full ownership of all photos, videos, and content you upload.',
      'License — you grant CamShare a worldwide, non-exclusive, royalty-free licence to host, store, and display your content solely to operate the Service.',
      'Responsibility — you are solely responsible for your content and warrant that it does not infringe any third-party rights.',
    ],
  },
  {
    title: '5. Acceptable Use',
    body: [
      'No illegal content under applicable law.',
      'No copyright or intellectual property infringement.',
      'Absolutely no child sexual abuse material (CSAM) — reported to NCMEC and law enforcement.',
      'No harassment, defamation, or threats.',
      'No malware, phishing, or malicious code.',
      'No unauthorised scraping or data extraction.',
    ],
  },
  {
    title: '6. Privacy',
    body: 'Your use of the Service is governed by our Privacy Policy, which is incorporated into these Terms by reference.',
  },
  {
    title: '7. Disclaimers',
    body: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not warrant uninterrupted, error-free operation. We are not responsible for User Content posted by other users.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'CamShare\'s total liability shall not exceed the greater of fees you paid in the preceding 12 months or USD $100. We are not liable for indirect, incidental, or consequential damages.',
  },
  {
    title: '9. Indemnification',
    body: 'You agree to indemnify and hold CamShare harmless from any claims arising out of your violation of these Terms, your User Content, or your use of the Service.',
  },
  {
    title: '10. Governing Law',
    body: 'These Terms are governed by the laws of the State of Delaware, USA. EU/UK consumers retain the protection of mandatory local consumer laws.',
  },
  {
    title: '11. Dispute Resolution',
    body: [
      'Contact us first at legal@camshare.io to seek informal resolution.',
      'Unresolved disputes shall be settled by binding arbitration under AAA Consumer Arbitration Rules in Delaware, USA.',
      'Class action and representative proceedings are waived.',
    ],
  },
  {
    title: '12. Changes to Terms',
    body: 'We will give registered users at least 30 days\' notice of material changes via email. Continued use after the effective date constitutes acceptance.',
  },
  {
    title: '13. Contact Us',
    body: 'CamShare, Inc. · legal@camshare.io · Registered in Delaware, USA.',
  },
];

export function TermsScreen() {
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
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>Effective: May 20, 2026</Text>
        </View>

        {/* Intro */}
        <GlassCard style={styles.card} padding={20}>
          <Text style={styles.introText}>
            Please read these Terms carefully before using CamShare. By accessing or using the
            Service, you agree to be bound by these Terms. If you do not agree, do not use the
            Service.
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
