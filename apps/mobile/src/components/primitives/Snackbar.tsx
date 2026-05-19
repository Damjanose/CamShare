import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';

export type SnackbarVariant = 'error' | 'success' | 'warning' | 'info';

type Props = {
  message: string | null;
  variant?: SnackbarVariant;
  onDismiss: () => void;
  duration?: number;
};

const VARIANTS: Record<SnackbarVariant, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  error:   { icon: 'close-circle',        color: '#ef4444' },
  success: { icon: 'checkmark-circle',    color: '#22c55e' },
  warning: { icon: 'warning',             color: '#f59e0b' },
  info:    { icon: 'information-circle',  color: Colors.primary },
};

export function Snackbar({ message, variant = 'error', onDismiss, duration = 3500 }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 300,
        mass: 0.85,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [message]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 230, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 190, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  if (!message) return null;

  const v = VARIANTS[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, borderColor: v.color + '55', opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={v.icon} size={20} color={v.color} />
      <Text style={styles.text} numberOfLines={3}>{message}</Text>
      <TouchableOpacity onPress={dismiss} activeOpacity={0.6} style={styles.close} hitSlop={8}>
        <Ionicons name="close" size={14} color={Colors.onSurfaceVariant} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.marginMain,
    right: Spacing.marginMain,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#252525',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    ...TextStyles.bodyMd,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 20,
  },
  close: {
    padding: 4,
    opacity: 0.6,
  },
});
