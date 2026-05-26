import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { GlassCard } from '../components/primitives/GlassCard';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { useAuth } from '../context/AuthContext';

type SettingRow = {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
};

type Props = {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
};

export function ProfileScreen({ activeTab, onTabPress }: Props) {
  const { user, logout, deleteAccount } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ME';

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Your account will be scheduled for deletion. Log back in within 30 days to recover it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteAccount();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const settings: SettingRow[] = [
    // { label: 'Notifications', value: 'On' },
    // { label: 'Download Quality', value: 'High Res' },
    // { label: 'Privacy', value: 'Private' },
    // { label: 'Help & Support' },
    { label: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
    { label: 'Sign Out', onPress: logout, destructive: true },
  ];

  const legalRows: SettingRow[] = [
    { label: 'About CamShare', onPress: () => navigation.navigate('About') },
    { label: 'Privacy Policy', onPress: () => navigation.navigate('Privacy') },
    { label: 'Terms & Conditions', onPress: () => navigation.navigate('Terms') },
  ];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          </View>

          <Text style={styles.name}>{user?.fullName ?? 'Guest'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>

          {/* Stats row */}
          <GlassCard style={styles.statsCard} padding={16}>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>874</Text>
                <Text style={styles.statLabel}>Photos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Albums</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Settings list */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <GlassCard padding={0} style={styles.settingsCard}>
         {legalRows.map((row, i) => (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              activeOpacity={0.7}
              style={[
                styles.settingRow,
                i < legalRows.length - 1 && styles.settingBorder,
              ]}
            >
              <Text style={styles.settingLabel}>{row.label}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>



        {/* Legal & About */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Account</Text>
        <GlassCard padding={0} style={styles.settingsCard}>
          {settings.map((row, i) => {
            const isDeleteRow = row.label === 'Delete Account';
            const isDisabled = isDeleteRow && deleting;
            return (
            <TouchableOpacity
              key={row.label}
              onPress={row.onPress}
              activeOpacity={row.onPress ? 0.7 : 1}
              disabled={isDisabled}
              style={[
                styles.settingRow,
                i < settings.length - 1 && styles.settingBorder,
                isDisabled && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.settingLabel, row.destructive && styles.settingDestructive]}>
                {row.label}
              </Text>
              {row.value && <Text style={styles.settingValue}>{row.value}</Text>}
              {!row.value && row.onPress && (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
            );
          })}
        </GlassCard>
      </ScrollView>

      <BottomNav active={activeTab} onPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    paddingHorizontal: Spacing.marginMain,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.stackLg,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...TextStyles.headlineLgMobile,
    color: Colors.onSurface,
  },
  name: {
    ...TextStyles.headlineMd,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  email: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 20,
  },
  statsCard: {
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    ...TextStyles.headlineMd,
    color: Colors.onSurface,
  },
  statLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.outlineVariant,
    opacity: 0.3,
  },
  sectionLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2.5,
    marginBottom: Spacing.stackSm,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.cardPadding,
    paddingVertical: 16,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  settingLabel: {
    ...TextStyles.bodyMd,
    color: Colors.onSurface,
  },
  settingDestructive: {
    color: Colors.error,
  },
  settingValue: {
    ...TextStyles.labelMd,
    color: Colors.onSurfaceVariant,
  },
  chevron: {
    color: Colors.onSurfaceVariant,
    fontSize: 20,
  },
});
