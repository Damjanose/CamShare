import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useFormik } from 'formik';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { ENV } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { GALLERY_ITEMS } from '../data/gallery';

WebBrowser.maybeCompleteAuthSession();

const loginSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Email is required'),
  password: Yup.string().required('Password is required'),
});

type Props = { navigation?: any };

export function LoginScreen({ navigation }: Props) {
  const { login, googleLogin, appleLogin } = useAuth();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: ENV.googleIosClientId || undefined,
    androidClientId: ENV.googleAndroidClientId || undefined,
  });

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const handleAppleLogin = async () => {
    setSocialLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setServerError('Apple sign-in failed. Please try again.');
        return;
      }
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || null;
      await appleLogin(credential.identityToken, fullName);
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setServerError('Apple sign-in failed. Please try again.');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const googleHandled = useRef(false);
  useEffect(() => {
    if (
      googleResponse?.type === 'success' &&
      (googleResponse.authentication?.idToken || googleResponse.authentication?.accessToken) &&
      !googleHandled.current
    ) {
      googleHandled.current = true;
      setSocialLoading(true);
      googleLogin(
        googleResponse.authentication.idToken ?? null,
        googleResponse.authentication.accessToken,
      ).catch((e: any) => {
        setServerError(e?.response?.data?.message ?? 'Google sign-in failed');
        googleHandled.current = false;
      }).finally(() => {
        setSocialLoading(false);
      });
    }
  }, [googleResponse, googleLogin]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await login(values);
      } catch (e: any) {
        setServerError(e?.response?.data?.message ?? e.message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const changeAndClear = (field: 'email' | 'password') => (text: string) => {
    formik.setFieldTouched(field, false, false);
    formik.handleChange(field)(text);
  };

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

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
      <View style={[styles.brandCluster, { paddingTop: insets.top + 40 }]}>
        <View style={styles.sparkleBadge}>
          <Text style={styles.sparkle}>✦</Text>
        </View>
        <Text style={styles.title}>Event Memories</Text>
        <Text style={styles.subtitle}>
          A private digital sanctuary for your most cherished life moments.
        </Text>
      </View>

      {/* CTA section */}
      <View style={[styles.ctaSection, { paddingTop: 32, paddingBottom: insets.bottom + 32 }]}>
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

        <TouchableOpacity
          onPress={() => formik.handleSubmit()}
          activeOpacity={0.85}
          disabled={formik.isSubmitting}
          style={[styles.signInButton, formik.isSubmitting && styles.signInButtonDisabled]}
        >
          {formik.isSubmitting && (
            <ActivityIndicator size="small" color={Colors.onPrimary} style={styles.spinner} />
          )}
          <Text style={styles.signInLabel}>
            {formik.isSubmitting ? 'Signing in…' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation?.navigate('Register')} activeOpacity={0.7}>
          <Text style={styles.createAccountLink}>New here? Create an account</Text>
        </TouchableOpacity>

        {/* Social login */}
        <View style={styles.optionalRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.optionalLabel}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* <View style={styles.socialRow}>
          <TouchableOpacity
            onPress={() => {
              googleHandled.current = false;
              googlePromptAsync();
            }}
            activeOpacity={0.8}
            style={[styles.socialButton, socialLoading && { opacity: 0.5 }]}
            disabled={!googleRequest || socialLoading}
          >
            <Ionicons name="logo-google" size={15} color={Colors.onSurface} />
            <Text style={styles.socialLabel}>Google</Text>
          </TouchableOpacity>

          {appleAvailable && (
            <TouchableOpacity
              onPress={handleAppleLogin}
              activeOpacity={0.8}
              style={[styles.socialButton, socialLoading && { opacity: 0.5 }]}
              disabled={socialLoading}
            >
              <Ionicons name="logo-apple" size={15} color={Colors.onSurface} />
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>
          )}
        </View> */}

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
  signInButton: {
    width: '100%',
    height: Spacing.buttonHeight,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.pillRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  spinner: {
    marginRight: 8,
  },
  signInLabel: {
    ...TextStyles.labelMd,
    color: Colors.onPrimary,
    letterSpacing: 0.6,
  },
  createAccountLink: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    textAlign: 'center',
    opacity: 0.85,
  },
  optionalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.outlineVariant,
  },
  optionalLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  socialButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: Colors.glassSurface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 12,
  },
  socialLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
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
  glassStrip: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    height: 110,
    marginTop: 4,
    opacity: 0.4,
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
