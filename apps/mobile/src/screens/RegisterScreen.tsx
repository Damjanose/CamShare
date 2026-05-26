import { Ionicons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Yup from 'yup';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { Snackbar } from '../components/primitives/Snackbar';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

const registerSchema = Yup.object({
  fullName: Yup.string().required('Full name is required'),
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirm: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});

type Props = { navigation?: any };

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { fullName: '', email: '', password: '', confirm: '' },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await register({ fullName: values.fullName.trim(), email: values.email, password: values.password });
      } catch (e: any) {
        setServerError(e?.response?.data?.message ?? e.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const changeAndClear = (field: 'fullName' | 'email' | 'password' | 'confirm') => (text: string) => {
    formik.setFieldTouched(field, false, false);
    formik.handleChange(field)(text);
  };

  const passwordMismatch =
    formik.touched.confirm && !!formik.errors.confirm;

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
        {/* Full Name field */}
        <View style={styles.fieldGroup}>
          <View style={[styles.inputCard, formik.touched.fullName && !!formik.errors.fullName && styles.inputCardError]}>
            <TextInput
              placeholder="Full Name"
              placeholderTextColor={Colors.onSurfaceVariant}
              autoCapitalize="words"
              value={formik.values.fullName}
              onChangeText={changeAndClear('fullName')}
              onBlur={formik.handleBlur('fullName')}
              style={styles.input}
            />
          </View>
          {formik.touched.fullName && formik.errors.fullName && (
            <Text style={styles.fieldError}>{formik.errors.fullName}</Text>
          )}
        </View>

        {/* Email field */}
        <View style={styles.fieldGroup}>
          <View style={[styles.inputCard, formik.touched.email && !!formik.errors.email && styles.inputCardError]}>
            <TextInput
              placeholder="Email"
              placeholderTextColor={Colors.onSurfaceVariant}
              autoCapitalize="none"
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={changeAndClear('email')}
              onBlur={formik.handleBlur('email')}
              style={styles.input}
            />
          </View>
          {formik.touched.email && formik.errors.email && (
            <Text style={styles.fieldError}>{formik.errors.email}</Text>
          )}
        </View>

        {/* Password field */}
        <View style={styles.fieldGroup}>
          <View style={[styles.inputCard, formik.touched.password && !!formik.errors.password && styles.inputCardError]}>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Password"
                placeholderTextColor={Colors.onSurfaceVariant}
                secureTextEntry={!showPassword}
                value={formik.values.password}
                onChangeText={changeAndClear('password')}
                onBlur={formik.handleBlur('password')}
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
          </View>
          {formik.touched.password && formik.errors.password && (
            <Text style={styles.fieldError}>{formik.errors.password}</Text>
          )}
        </View>

        {/* Confirm Password field */}
        <View style={styles.fieldGroup}>
          <View style={[styles.inputCard, passwordMismatch && styles.inputCardError]}>
            <View style={styles.inputRow}>
              <TextInput
                placeholder="Confirm Password"
                placeholderTextColor={passwordMismatch ? Colors.error : Colors.onSurfaceVariant}
                secureTextEntry={!showConfirm}
                value={formik.values.confirm}
                onChangeText={changeAndClear('confirm')}
                onBlur={formik.handleBlur('confirm')}
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
            <Text style={styles.fieldError}>{formik.errors.confirm}</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={() => formik.handleSubmit()}
          activeOpacity={0.85}
          disabled={formik.isSubmitting}
          style={[styles.createButton, formik.isSubmitting && styles.createButtonDisabled]}
        >
          {formik.isSubmitting && (
            <ActivityIndicator size="small" color={Colors.onPrimary} style={styles.spinner} />
          )}
          <Text style={styles.createLabel}>
            {formik.isSubmitting ? 'Creating…' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={styles.signInLink}>Already have an account? Sign in</Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://camshare.app/terms')}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.termsLink} onPress={() => Linking.openURL('https://camshare.app/privacy')}>
            Privacy Policy
          </Text>
          .
        </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar message={serverError} onDismiss={() => setServerError(null)} />
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
    flexGrow: 1,
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
  fieldGroup: {
    width: '100%',
    gap: 6,
  },
  inputCard: {
    width: '100%',
    backgroundColor: Colors.glassSurface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputCardError: {
    borderColor: Colors.error,
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
  fieldError: {
    ...TextStyles.labelSm,
    color: Colors.error,
    paddingLeft: 4,
  },
  createButton: {
    width: '100%',
    height: Spacing.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.pillRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: 8,
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
  termsLink: {
    color: Colors.primary,
    opacity: 1,
    textDecorationLine: 'underline',
  },
});
