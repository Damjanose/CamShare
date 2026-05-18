import { BlurView } from 'expo-blur';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';

export type NavTab = 'Home' | 'Gallery' | 'Scanner' | 'Favorites' | 'Profile';

type NavItem = {
  key: NavTab;
  icon: string;
  label: string;
  isCenter?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'Home', icon: '⌂', label: 'Home' },
  { key: 'Gallery', icon: '◫', label: 'Gallery' },
  { key: 'Scanner', icon: '⊡', label: 'Scan', isCenter: true },
  { key: 'Favorites', icon: '♡', label: 'Saved' },
  { key: 'Profile', icon: '◯', label: 'Profile' },
];

type Props = {
  active: NavTab;
  onPress: (tab: NavTab) => void;
};

export function BottomNav({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Spacing.navBottom);

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <BlurView
        intensity={40}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.blur}
      >
        <View style={styles.inner}>
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;

            if (item.isCenter) {
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => onPress(item.key)}
                  activeOpacity={0.85}
                  style={styles.centerBtnWrap}
                >
                  <View style={styles.centerBtn}>
                    <Text style={styles.centerIcon}>{item.icon}</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => onPress(item.key)}
                activeOpacity={0.8}
                style={styles.tab}
              >
                <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
                <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
                {isActive && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.marginMain,
    right: Spacing.marginMain,
    zIndex: 100,
  },
  blur: {
    borderRadius: Spacing.navRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(19,19,19,0.5)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
    minHeight: 48,
  },
  icon: {
    fontSize: 18,
    color: Colors.onSurfaceVariant,
  },
  iconActive: {
    color: Colors.primary,
  },
  label: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: Colors.primary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 2,
  },
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 22,
    color: Colors.onPrimary,
  },
});
