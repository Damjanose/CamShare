import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { LightboxModal } from '../components/ui/LightboxModal';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { GalleryItem } from '../data/gallery';
import { useAuth } from '../context/AuthContext';
import { eventsService } from '../services/events';
import { photosService } from '../services/photos';
import { uploadPhoto } from '../services/upload';
import { ENV } from '../config/env';
import type { EventPhoto } from '@camshare/types';

const { width } = Dimensions.get('window');
const COL_GAP = 10;
const COL_WIDTH = (width - Spacing.marginMain * 2 - COL_GAP) / 2;

function buildColumns(photos: EventPhoto[]): [EventPhoto[], EventPhoto[]] {
  const left: EventPhoto[] = [];
  const right: EventPhoto[] = [];
  let leftH = 0;
  let rightH = 0;
  for (const photo of photos) {
    const h = COL_WIDTH + COL_GAP;
    if (leftH <= rightH) { left.push(photo); leftH += h; }
    else { right.push(photo); rightH += h; }
  }
  return [left, right];
}

// Rebase photo URL onto the configured API host so localhost URLs work on physical devices
function resolvePhotoUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const api = new URL(ENV.apiUrl);
    parsed.protocol = api.protocol;
    parsed.hostname = api.hostname;
    parsed.port = api.port;
    return parsed.toString();
  } catch {
    return url;
  }
}

function photoToGalleryItem(photo: EventPhoto): GalleryItem {
  return { id: photo.id, uri: resolvePhotoUrl(photo.url), aspectRatio: 1, caption: photo.caption ?? undefined };
}

type Props = {
  navigation: any;
  route: any;
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
};

export function GalleryScreen({ navigation, route, activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const eventId: string = route?.params?.eventId ?? '';
  const eventTitle: string = route?.params?.eventTitle ?? 'Gallery';
  const maxPhotosPerUser: number | null = route?.params?.maxPhotosPerUser ?? null;
  const maxFileSizeMb: number | null = route?.params?.maxFileSizeMb ?? null;
  const channelId: string | null = route?.params?.channelId ?? null;

  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const photosQueryKey = ['events', eventId, 'photos', 'mine', channelId];

  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: photosQueryKey,
    queryFn: () => photosService.list(eventId, channelId!, { uploaderId: user?.id }),
    enabled: !!eventId && !!channelId && !!user?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['events', eventId, 'members'],
    queryFn: () => eventsService.getMembers(eventId),
    enabled: !!eventId,
  });

  const myMember = members.find((m) => m.userId === user?.id);
  const isSubmitted = !!myMember?.submittedAt;

  const finalMutation = useMutation({
    mutationFn: ({ photoId, isFinal }: { photoId: string; isFinal: boolean }) =>
      photosService.setFinal(eventId, channelId!, photoId, isFinal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: photosQueryKey }),
  });

  const submitMutation = useMutation({
    mutationFn: () => eventsService.submit(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'members'] });
    },
  });

  function handleSubmit() {
    Alert.alert(
      'Submit your photos?',
      'You cannot change your selection after submitting.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => submitMutation.mutate(),
        },
      ],
    );
  }

  const myUploadCount = photos.length;
  const limitReached = maxPhotosPerUser !== null && myUploadCount >= maxPhotosPerUser;
  const [leftCol, rightCol] = buildColumns(photos);

  const handleUpload = async () => {
    if (limitReached || isSubmitted || !channelId) return;

    const remaining =
      maxPhotosPerUser !== null ? Math.max(0, maxPhotosPerUser - myUploadCount) : undefined;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: true,
      ...(remaining !== undefined && { selectionLimit: remaining }),
    });

    if (result.canceled || result.assets.length === 0) return;

    // Photos only — defensively drop anything that isn't an image (videos, live photos, etc.)
    let assets = result.assets.filter(
      (a) => a.type === undefined || a.type === 'image',
    );

    // Skip oversized files instead of aborting the whole batch
    let skippedCount = 0;
    if (maxFileSizeMb !== null) {
      const maxBytes = maxFileSizeMb * 1024 * 1024;
      const withinLimit = assets.filter(
        (a) => a.fileSize === undefined || a.fileSize <= maxBytes,
      );
      skippedCount = assets.length - withinLimit.length;
      assets = withinLimit;
    }

    if (assets.length === 0) {
      Alert.alert('Nothing to upload', `All selected photos exceed the ${maxFileSizeMb} MB limit.`);
      return;
    }

    setIsUploading(true);
    let failCount = 0;
    try {
      // Upload each photo independently so one failure doesn't abort the rest
      for (const asset of assets) {
        try {
          await uploadPhoto(asset.uri, asset.mimeType ?? undefined, eventId, channelId);
        } catch {
          failCount++;
        }
      }
      queryClient.invalidateQueries({ queryKey: photosQueryKey });

      const problems: string[] = [];
      if (failCount > 0) {
        problems.push(`${failCount} photo${failCount > 1 ? 's' : ''} could not be uploaded.`);
      }
      if (skippedCount > 0) {
        problems.push(
          `${skippedCount} photo${skippedCount > 1 ? 's' : ''} skipped (over the ${maxFileSizeMb} MB limit).`,
        );
      }
      if (problems.length > 0) {
        Alert.alert('Some photos were not uploaded', problems.join('\n'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const renderPhotoTile = (photo: EventPhoto) => (
    <View key={photo.id} style={{ marginBottom: COL_GAP }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setLightboxItem(photoToGalleryItem(photo))}
        style={[styles.tile, { width: COL_WIDTH, height: COL_WIDTH }]}
      >
        <Image source={{ uri: resolvePhotoUrl(photo.url) }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* is_final checkmark badge */}
        <TouchableOpacity
          style={[styles.checkBadge, photo.isFinal && styles.checkBadgeActive]}
          onPress={() => {
            if (!isSubmitted) {
              finalMutation.mutate({ photoId: photo.id, isFinal: !photo.isFinal });
            }
          }}
          disabled={isSubmitted || finalMutation.isPending}
          hitSlop={8}
        >
          <Text style={styles.checkIcon}>{photo.isFinal ? '✓' : '○'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>MY PHOTOS</Text>
          <Text style={styles.title} numberOfLines={1}>{eventTitle}</Text>
        </View>
        {!isSubmitted ? (
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitMutation.isPending || photos.length === 0}
          >
            {submitMutation.isPending
              ? <ActivityIndicator size="small" color={Colors.surface} />
              : <Text style={styles.submitBtnText}>Submit</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.submittedBadge}>
            <Text style={styles.submittedBadgeText}>✓ Sent</Text>
          </View>
        )}
      </View>

      {/* Event params banner */}
      {(maxPhotosPerUser !== null || maxFileSizeMb !== null) && (
        <View style={styles.paramsBanner}>
          {maxPhotosPerUser !== null && (
            <Text style={styles.paramsText}>Max {maxPhotosPerUser} photos</Text>
          )}
          {maxPhotosPerUser !== null && maxFileSizeMb !== null && (
            <Text style={styles.paramsDot}>·</Text>
          )}
          {maxFileSizeMb !== null && (
            <Text style={styles.paramsText}>Max {maxFileSizeMb} MB per file</Text>
          )}
        </View>
      )}

      {isSubmitted && (
        <View style={styles.submittedBanner}>
          <Text style={styles.submittedBannerText}>
            Your selection has been submitted and is now locked.
          </Text>
        </View>
      )}

      {photosLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !channelId ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Event not yet set up. Try again shortly.</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No photos yet — tap + to upload</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <View style={[styles.column, { width: COL_WIDTH }]}>
              {leftCol.map(renderPhotoTile)}
            </View>
            <View style={[styles.column, { width: COL_WIDTH }]}>
              {rightCol.map(renderPhotoTile)}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Upload FAB */}
      {!!eventId && !isSubmitted && (
        <View style={[styles.fabWrap, { bottom: Math.max(insets.bottom, Spacing.navBottom) + Spacing.navHeight + 16 }]}>
          {maxPhotosPerUser !== null && (
            <Text style={styles.uploadCounter}>
              {limitReached ? 'Limit reached' : `${myUploadCount} / ${maxPhotosPerUser}`}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.fab, (isUploading || limitReached) && styles.fabDisabled]}
            onPress={handleUpload}
            disabled={isUploading || limitReached}
            activeOpacity={0.8}
          >
            {isUploading
              ? <ActivityIndicator color={Colors.surface} size="small" />
              : <Text style={styles.fabIcon}>+</Text>}
          </TouchableOpacity>
        </View>
      )}

      <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
      <BottomNav active={activeTab} onPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMain,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  backIcon: { color: Colors.onSurface, fontSize: 24, lineHeight: 28 },
  titleWrap: { flex: 1 },
  eyebrow: { ...TextStyles.labelSm, color: Colors.primary, letterSpacing: 3 },
  title: { ...TextStyles.headlineLgMobile, color: Colors.onSurface },
  submitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  submitBtnText: { ...TextStyles.labelMd, color: Colors.onPrimary },
  submittedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  submittedBadgeText: { ...TextStyles.labelSm, color: Colors.onSurfaceVariant },
  paramsBanner: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Spacing.marginMain,
    paddingBottom: 10,
    alignItems: 'center',
  },
  paramsText: { ...TextStyles.labelSm, color: Colors.onSurfaceVariant },
  paramsDot: { ...TextStyles.labelSm, color: Colors.onSurfaceVariant },
  submittedBanner: {
    marginHorizontal: Spacing.marginMain,
    marginBottom: 10,
    backgroundColor: 'rgba(242,202,80,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242,202,80,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  submittedBannerText: { ...TextStyles.labelSm, color: Colors.primary, textAlign: 'center' },
  content: { paddingHorizontal: Spacing.marginMain },
  grid: { flexDirection: 'row', gap: COL_GAP },
  column: { flexDirection: 'column' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...TextStyles.bodyMd, color: Colors.onSurfaceVariant },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  checkBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkIcon: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
  },
  fabWrap: {
    position: 'absolute',
    right: Spacing.marginMain,
    alignItems: 'center',
    gap: 6,
  },
  uploadCounter: { ...TextStyles.labelSm, color: Colors.onSurfaceVariant, fontSize: 11 },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: { opacity: 0.5 },
  fabIcon: { color: Colors.surface, fontSize: 28, lineHeight: 32, fontWeight: '300' },
});
