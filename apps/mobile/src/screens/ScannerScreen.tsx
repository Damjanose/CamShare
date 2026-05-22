import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { GlassCard } from '../components/primitives/GlassCard';
import { GradientButton } from '../components/primitives/GradientButton';
import { ScannerFrame } from '../components/ui/ScannerFrame';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { eventsService } from '../services/events';
import type { Event } from '@camshare/types';

type Props = {
  navigation: any;
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
};

export function ScannerScreen({ navigation, activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const joinMutation = useMutation<Event, Error, string>({
    mutationFn: (token) => eventsService.join({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  function extractToken(raw: string): string {
    try {
      const url = new URL(raw);
      const parts = url.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('invite');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
      return parts[parts.length - 1] ?? raw;
    } catch {
      return raw.trim();
    }
  }

  function handleBarcodeScanned({ data }: { type: string; data: string }) {
    setScanned(true);
    joinMutation.mutate(extractToken(data));
  }

  function handleLinkJoin() {
    const token = extractToken(linkValue);
    if (!token) {
      Alert.alert('Invalid link', 'Please paste a valid invite link.');
      return;
    }
    setShowLinkModal(false);
    setScanned(true);
    joinMutation.mutate(token);
  }

  function openLinkModal() {
    setLinkValue('');
    setShowLinkModal(true);
  }

  function reset() {
    setScanned(false);
    setLinkValue('');
    joinMutation.reset();
  }

  const LinkModal = (
    <Modal
      visible={showLinkModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLinkModal(false)}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLinkModal(false)} />
        <View style={[styles.modalCard, { marginBottom: insets.bottom + 24 }]}>
          <Text style={styles.resultLabel}>PASTE INVITE LINK</Text>
          <TextInput
            value={linkValue}
            onChangeText={setLinkValue}
            placeholder="https://…/invite/…"
            placeholderTextColor={Colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            style={styles.linkInput}
          />
          <View style={styles.linkActions}>
            <TouchableOpacity onPress={() => setShowLinkModal(false)} style={styles.scanAgainBtn}>
              <Text style={styles.scanAgainText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLinkJoin} style={styles.joinLinkBtn}>
              <Text style={styles.joinLinkBtnText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Permission loading state
  if (!permission) {
    return <View style={styles.root}>{LinkModal}</View>;
  }

  // Permission not granted
  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(211,188,252,0.12)', 'transparent']}
          style={[StyleSheet.absoluteFill, { top: 0 }]}
        />
        <View style={[styles.permissionContent, { paddingTop: insets.top + 48 }]}>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionBody}>
            Allow camera access to scan event QR codes and join memories.
          </Text>
          <GradientButton
            label="Grant Permission"
            onPress={requestPermission}
            style={{ marginTop: 24 }}
          />
          <TouchableOpacity onPress={openLinkModal} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Join via link instead</Text>
          </TouchableOpacity>
        </View>
        {LinkModal}
        <BottomNav active={activeTab} onPress={onTabPress} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Full-bleed camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Dark vignette overlay */}
      <View style={styles.vignette} pointerEvents="none" />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.scanTitle}>Scan QR Code</Text>
        <Text style={styles.scanSubtitle}>Point at an event QR code to join</Text>
      </View>

      {/* Scanner frame centered */}
      <View style={styles.frameWrap} pointerEvents="none">
        <ScannerFrame />
      </View>

      {/* Bottom hint or result */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 96 }]}>
        {joinMutation.isPending && (
          <GlassCard style={styles.resultCard}>
            <ActivityIndicator color={Colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.resultLabel}>JOINING EVENT…</Text>
          </GlassCard>
        )}

        {joinMutation.isSuccess && (
          <GlassCard style={styles.resultCard}>
            <Text style={styles.resultLabel}>JOINED</Text>
            <Text style={styles.resultText}>{joinMutation.data.title}</Text>
            {(joinMutation.data.maxPhotosPerUser !== null || joinMutation.data.maxFileSizeMb !== null) && (
              <Text style={styles.eventParams}>
                {[
                  joinMutation.data.maxPhotosPerUser !== null && `Max ${joinMutation.data.maxPhotosPerUser} photos`,
                  joinMutation.data.maxFileSizeMb !== null && `Max ${joinMutation.data.maxFileSizeMb} MB/file`,
                ].filter(Boolean).join(' · ')}
              </Text>
            )}
            <GradientButton
              label="Go to Gallery"
              onPress={() =>
                navigation.navigate('Gallery', {
                  eventId: joinMutation.data.id,
                  eventTitle: joinMutation.data.title,
                  maxPhotosPerUser: joinMutation.data.maxPhotosPerUser ?? null,
                  maxFileSizeMb: joinMutation.data.maxFileSizeMb ?? null,
                  channelId: joinMutation.data.defaultChannelId ?? null,
                })
              }
              style={{ marginTop: 4, marginBottom: 8 }}
            />
            <TouchableOpacity onPress={reset} style={styles.scanAgainBtn}>
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {joinMutation.isError && (
          <GlassCard style={styles.resultCard}>
            <Text style={styles.resultLabel}>FAILED TO JOIN</Text>
            <Text style={styles.errorText}>
              {joinMutation.error.message || 'Invalid or expired QR code'}
            </Text>
            <TouchableOpacity onPress={reset} style={styles.scanAgainBtn}>
              <Text style={styles.scanAgainText}>Try Again</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {!scanned && (
          <>
            <Text style={styles.hint}>Align the QR code within the frame</Text>
            <TouchableOpacity onPress={openLinkModal} style={styles.linkButton}>
              <Text style={styles.linkButtonText}>Join via link instead</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {LinkModal}
      <BottomNav active={activeTab} onPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.marginMain,
    paddingBottom: 16,
    alignItems: 'center',
    zIndex: 10,
  },
  scanTitle: {
    ...TextStyles.headlineMd,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  scanSubtitle: {
    ...TextStyles.labelMd,
    color: Colors.onSurfaceVariant,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.marginMain,
    right: Spacing.marginMain,
    alignItems: 'center',
    zIndex: 10,
  },
  hint: {
    ...TextStyles.labelMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 8,
  },
  resultCard: {
    width: '100%',
    marginBottom: 8,
  },
  resultLabel: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  resultText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurface,
    marginBottom: 16,
  },
  scanAgainBtn: {
    alignSelf: 'flex-start',
  },
  scanAgainText: {
    ...TextStyles.labelMd,
    color: Colors.secondary,
  },
  eventParams: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  errorText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
  },
  linkButton: {
    marginTop: 8,
  },
  linkButtonText: {
    ...TextStyles.labelMd,
    color: Colors.primary,
    textAlign: 'center',
    opacity: 0.85,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(242,202,80,0.15)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
    marginHorizontal: 0,
  },
  linkInput: {
    ...TextStyles.bodyMd,
    color: Colors.onSurface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.outlineVariant,
    paddingVertical: 8,
    marginBottom: 20,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinLinkBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinLinkBtnText: {
    ...TextStyles.labelMd,
    color: Colors.onPrimary,
  },
  // Permission screen
  permissionContent: {
    flex: 1,
    paddingHorizontal: Spacing.marginMain,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTitle: {
    ...TextStyles.headlineLgMobile,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionBody: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
  },
});
