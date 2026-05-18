import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';

type Props = {
  label?: string;
  icon?: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
};

export function GhostButton({ label, icon, onPress, style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <BlurView
        intensity={20}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.blur}
      >
        {icon}
        {label && <Text style={styles.label}>{label}</Text>}
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  blur: {
    height: Spacing.buttonHeight,
    borderRadius: Spacing.pillRadius,
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 28,
    gap: 10,
    overflow: 'hidden',
  },
  label: {
    ...TextStyles.labelMd,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
});
