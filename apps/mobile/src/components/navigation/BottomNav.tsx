import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export type NavTab = 'Events' | 'Scanner' | 'Profile';

type NavItem = {
  key: NavTab;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'Events', iconActive: 'sparkles', iconInactive: 'sparkles-outline' },
  { key: 'Scanner', iconActive: 'qr-code', iconInactive: 'qr-code-outline', isCenter: true },
  { key: 'Profile', iconActive: 'person', iconInactive: 'person-outline' },
];

type Props = {
  active: NavTab;
  onPress: (tab: NavTab) => void;
};

export function BottomNav({ active, onPress }: Props) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, Spacing.navBottom);
  const isScannerActive = active === 'Scanner';

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
              return <View key={item.key} style={styles.centerPlaceholder} />;
            }

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => onPress(item.key)}
                activeOpacity={0.8}
                style={styles.tab}
              >
                <Ionicons
                  name={isActive ? item.iconActive : item.iconInactive}
                  size={22}
                  color={isActive ? Colors.primary : Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>

      <TouchableOpacity
        onPress={() => onPress('Scanner')}
        activeOpacity={0.85}
        style={styles.centerBtnWrap}
      >
        <LinearGradient
          colors={['#fa94b6', '#f2ca50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.centerBtn}
        >
          <Ionicons
            name={isScannerActive ? 'qr-code' : 'qr-code-outline'}
            size={28}
            color={Colors.onPrimary}
          />
        </LinearGradient>
      </TouchableOpacity>
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
    minHeight: 48,
  },
  centerPlaceholder: {
    flex: 1,
    minHeight: 48,
  },
  centerBtnWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: 0,
    transform: [{ translateY: -15 }],
  },
  centerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fa94b6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
});
