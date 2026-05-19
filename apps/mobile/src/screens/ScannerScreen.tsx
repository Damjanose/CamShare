import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const joinMutation = useMutation<Event, Error, string>({
    mutationFn: (token) => eventsService.join({ token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  function handleBarcodeScanned({ data }: { type: string; data: string }) {
    setScanned(true);
    joinMutation.mutate(data);
  }

  function reset() {
    setScanned(false);
    joinMutation.reset();
  }

  // Permission loading state
  if (!permission) {
    return <View style={styles.root} />;
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
        </View>
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
            <GradientButton
              label="Go to Gallery"
              onPress={() =>
                navigation.navigate('Gallery', {
                  eventId: joinMutation.data.id,
                  eventTitle: joinMutation.data.title,
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
          <Text style={styles.hint}>Align the QR code within the frame</Text>
        )}
      </View>

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
    // Radial-style vignette via nested gradient not possible in RN — using semi-transparent overlay
    // The camera + scanner frame create sufficient depth
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
  errorText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
    marginBottom: 12,
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
