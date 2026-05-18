import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
  padding?: number;
};

export function GlassCard({ children, style, intensity = 24, padding = Spacing.cardPadding }: Props) {
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={[styles.blur, { borderRadius: Spacing.cardRadius }, style]}
    >
      <View style={[styles.inner, { padding, borderRadius: Spacing.cardRadius }]}>
        {children}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inner: {
    backgroundColor: Colors.glassOverlay,
  },
});
