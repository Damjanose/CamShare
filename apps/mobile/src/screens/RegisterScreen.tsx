import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { Snackbar } from '../components/primitives/Snackbar';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

type Props = { navigation?: any };

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    try {
      setLoading(true);
      await register({ fullName: fullName.trim(), email, password });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation?.goBack()}
        activeOpacity={0.7}
        style={[styles.backButton, { top: insets.top + 16 }]}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.onSurfaceVariant} />
      </TouchableOpacity>

      {/* Brand cluster */}
      <View style={[styles.brandCluster, { paddingTop: insets.top + 64 }]}>
        <View style={styles.sparkleBadge}>
          <Text style={styles.sparkle}>✦</Text>
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join and start preserving your event memories.
        </Text>
      </View>

      {/* Form */}
      <View style={[styles.ctaSection, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.inputCard}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={Colors.onSurfaceVariant}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
          <View style={styles.inputSeparator} />
          <TextInput
            placeholder="Email"
            placeholderTextColor={Colors.onSurfaceVariant}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <View style={styles.inputSeparator} />
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={Colors.onSurfaceVariant}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.inputFlex}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              activeOpacity={0.7}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputSeparator, passwordMismatch && styles.inputSeparatorError]} />
          <View style={styles.inputRow}>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor={passwordMismatch ? Colors.error : Colors.onSurfaceVariant}
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              style={[styles.inputFlex, passwordMismatch && styles.inputError]}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              activeOpacity={0.7}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={passwordMismatch ? Colors.error : Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {passwordMismatch && (
          <Text style={styles.mismatchError}>Passwords do not match</Text>
        )}

        <TouchableOpacity
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={loading}
          style={[styles.createButton, loading && styles.createButtonDisabled]}
        >
          <Text style={styles.createLabel}>
            {loading ? 'Creating…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={styles.signInLink}>Already have an account? Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <Snackbar message={error} onDismiss={() => setError(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.marginMain,
    zIndex: 10,
    padding: 8,
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
    maxWidth: 260,
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMain,
    gap: 12,
    width: '100%',
    alignSelf: 'center',
  },
  inputCard: {
    width: '100%',
    backgroundColor: Colors.glassSurface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
  },
  input: {
    color: Colors.onSurface,
    height: 52,
    paddingHorizontal: 18,
    ...TextStyles.bodyMd,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  inputFlex: {
    flex: 1,
    color: Colors.onSurface,
    height: 52,
    paddingLeft: 18,
    paddingRight: 4,
    ...TextStyles.bodyMd,
  },
  inputError: {
    color: Colors.error,
  },
  eyeButton: {
    paddingHorizontal: 14,
    height: 52,
    justifyContent: 'center',
  },
  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: 18,
  },
  inputSeparatorError: {
    backgroundColor: Colors.error,
    opacity: 0.5,
  },
  mismatchError: {
    ...TextStyles.labelSm,
    color: Colors.error,
    alignSelf: 'flex-start',
    paddingLeft: 4,
  },
  createButton: {
    width: '100%',
    height: Spacing.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.pillRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createLabel: {
    ...TextStyles.labelMd,
    color: Colors.onPrimary,
    letterSpacing: 0.6,
  },
  signInLink: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    textAlign: 'center',
    opacity: 0.85,
  },
  terms: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.5,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
});
