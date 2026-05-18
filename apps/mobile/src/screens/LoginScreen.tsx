import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { GhostButton } from '../components/primitives/GhostButton';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { GALLERY_ITEMS } from '../data/gallery';

export function LoginScreen() {
  const { googleLogin, appleLogin } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      {/* Brand cluster — centered */}
      <View style={[styles.brandCluster, { paddingTop: insets.top + 40 }]}>
        {/* Sparkle badge */}
        <View style={styles.sparkleBadge}>
          <Text style={styles.sparkle}>✦</Text>
        </View>

        <Text style={styles.title}>Event Memories</Text>
        <Text style={styles.subtitle}>
          A private digital sanctuary for your most cherished life moments.
        </Text>
      </View>

      {/* CTA section — bottom */}
      <View style={[styles.ctaSection, { paddingBottom: insets.bottom + 32 }]}>
        {/* Google button — custom gradient */}
        <TouchableOpacity onPress={googleLogin} activeOpacity={0.85} style={styles.googleWrapper}>
          <View style={styles.googleGradient}>
            <Ionicons name="logo-google" size={20} color={Colors.onPrimary} />
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </View>
        </TouchableOpacity>

        {/* Apple button — ghost */}
        <GhostButton
          label="Continue with Apple"
          icon={<Ionicons name="logo-apple" size={20} color={Colors.onSurface} />}
          onPress={appleLogin}
          style={styles.appleWrapper}
        />

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>

        {/* Decorative photo strip */}
        <View style={styles.glassStrip}>
          <View style={[styles.photoPanel, { flex: 2 }]}>
            <Image source={{ uri: GALLERY_ITEMS[0].uri }} style={styles.panelImage} />
            <View style={styles.panelOverlay} />
          </View>
          <View style={[styles.photoPanel, { flex: 1, marginTop: -24 }]}>
            <Image source={{ uri: GALLERY_ITEMS[6].uri }} style={styles.panelImage} />
            <View style={styles.panelOverlay} />
          </View>
          <View style={[styles.photoPanel, { flex: 1.5 }]}>
            <Image source={{ uri: GALLERY_ITEMS[9].uri }} style={styles.panelImage} />
            <View style={styles.panelOverlay} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  brandCluster: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.marginMain,
  },
  sparkleBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  sparkle: {
    fontSize: 28,
    color: Colors.primary,
  },
  title: {
    ...TextStyles.headlineXl,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMain,
    gap: 12,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  googleWrapper: {
    width: '100%',
    maxWidth: 320,
  },
  googleGradient: {
    backgroundColor: Colors.primary,
    height: Spacing.buttonHeight,
    borderRadius: Spacing.pillRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  googleLabel: {
    ...TextStyles.labelMd,
    color: Colors.onPrimary,
    letterSpacing: 0.8,
  },
  appleWrapper: {
    width: '100%',
    maxWidth: 320,
    color: Colors.onSurface,
  },
  terms: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  glassStrip: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 320,
    height: 120,
    marginTop: 8,
    opacity: 0.45,
    overflow: 'hidden',
  },
  photoPanel: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  panelImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
