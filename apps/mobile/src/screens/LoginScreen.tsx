import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GhostButton } from '../components/primitives/GhostButton';
import { GradientButton } from '../components/primitives/GradientButton';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login, googleLogin, appleLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.eyebrow}>WELCOME TO</Text>
            <Text style={styles.title}>Event{'\n'}Memories</Text>
            <Text style={styles.subtitle}>Your moments, curated beautifully.</Text>
          </View>

          {/* OAuth buttons */}
          <View style={styles.oauthSection}>
            <GhostButton
              label="Continue with Google"
              onPress={googleLogin}
              style={styles.oauthBtn}
            />
            <GhostButton
              label="Continue with Apple"
              onPress={appleLogin}
              style={styles.oauthBtn}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email / password fields */}
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="your@email.com"
                placeholderTextColor={Colors.outlineVariant}
                autoCapitalize="none"
                keyboardType="email-address"
                keyboardAppearance="dark"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <TextInput
                style={[styles.input, passwordFocused && styles.inputFocused]}
                placeholder="••••••••"
                placeholderTextColor={Colors.outlineVariant}
                secureTextEntry
                keyboardAppearance="dark"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton
              label="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.signInBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.marginMain,
    flexGrow: 1,
  },
  header: {
    marginBottom: Spacing.stackLg,
  },
  eyebrow: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 12,
  },
  title: {
    ...TextStyles.headlineXl,
    color: Colors.onSurface,
    marginBottom: 12,
  },
  subtitle: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  oauthSection: {
    gap: 12,
    marginBottom: Spacing.stackMd,
  },
  oauthBtn: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.stackMd,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.4,
  },
  dividerText: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  form: {
    gap: 20,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  input: {
    color: Colors.onSurface,
    fontSize: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  inputFocused: {
    borderBottomColor: Colors.primary,
  },
  error: {
    ...TextStyles.labelMd,
    color: Colors.error,
    marginTop: -8,
  },
  signInBtn: {
    marginTop: 8,
  },
});
