import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { GalleryItem as GalleryItemComponent } from '../components/ui/GalleryItem';
import { LightboxModal } from '../components/ui/LightboxModal';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { GalleryItem } from '../data/gallery';
import { channelsService } from '../services/channels';
import { photosService } from '../services/photos';
import { uploadPhoto } from '../services/upload';
import type { EventPhoto } from '@camshare/types';

const { width } = Dimensions.get('window');
const COL_GAP = 10;
const COL_WIDTH = (width - Spacing.marginMain * 2 - COL_GAP) / 2;

/** Distribute items into two columns using greedy column-height balancing */
function buildColumns(items: GalleryItem[]): [GalleryItem[], GalleryItem[]] {
  const left: GalleryItem[] = [];
  const right: GalleryItem[] = [];
  let leftH = 0;
  let rightH = 0;

  for (const item of items) {
    const h = COL_WIDTH / item.aspectRatio + COL_GAP;
    if (leftH <= rightH) {
      left.push(item);
      leftH += h;
    } else {
      right.push(item);
      rightH += h;
    }
  }
  return [left, right];
}

function photoToItem(photo: EventPhoto): GalleryItem {
  return {
    id: photo.id,
    uri: photo.url,
    aspectRatio: 1,
    caption: photo.caption ?? undefined,
  };
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
  const eventId: string = route?.params?.eventId ?? '';
  const eventTitle: string = route?.params?.eventTitle ?? 'Gallery';
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['events', eventId, 'channels'],
    queryFn: () => channelsService.list(eventId),
    enabled: !!eventId,
  });

  const photoQueries = useQueries({
    queries: channels.map((channel) => ({
      queryKey: ['events', eventId, 'channels', channel.id, 'photos'],
      queryFn: () => photosService.list(eventId, channel.id),
    })),
  });

  const photosLoading = channelsLoading || photoQueries.some((q) => q.isLoading);
  const allPhotos: GalleryItem[] = photoQueries
    .flatMap((q) => q.data ?? [])
    .map(photoToItem);

  const [leftCol, rightCol] = buildColumns(allPhotos);

  const handleUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const channel = channels[0];
    if (!channel) return;

    const asset = result.assets[0];
    setIsUploading(true);
    try {
      await uploadPhoto(asset.uri, asset.mimeType ?? undefined, eventId, channel.id);
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'channels', channel.id, 'photos'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      Alert.alert('Upload failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      {/* Back button + title */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>GALLERY</Text>
          <Text style={styles.title} numberOfLines={1}>{eventTitle}</Text>
        </View>
      </View>

      {photosLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : allPhotos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No photos yet</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: 16, paddingBottom: 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <View style={[styles.column, { width: COL_WIDTH }]}>
              {leftCol.map((item) => (
                <View key={item.id} style={{ marginBottom: COL_GAP }}>
                  <GalleryItemComponent item={item} width={COL_WIDTH} onPress={setLightboxItem} />
                </View>
              ))}
            </View>
            <View style={[styles.column, { width: COL_WIDTH }]}>
              {rightCol.map((item) => (
                <View key={item.id} style={{ marginBottom: COL_GAP }}>
                  <GalleryItemComponent item={item} width={COL_WIDTH} onPress={setLightboxItem} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.fab, (isUploading || channels.length === 0) && styles.fabDisabled]}
        onPress={handleUpload}
        disabled={isUploading || channels.length === 0}
        activeOpacity={0.8}
      >
        {isUploading
          ? <ActivityIndicator color={Colors.surface} size="small" />
          : <Text style={styles.fabIcon}>+</Text>}
      </TouchableOpacity>

      <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />

      <BottomNav active={activeTab} onPress={onTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.marginMain,
    paddingBottom: 16,
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
  backIcon: {
    color: Colors.onSurface,
    fontSize: 24,
    lineHeight: 28,
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 3,
  },
  title: {
    ...TextStyles.headlineLgMobile,
    color: Colors.onSurface,
  },
  content: {
    paddingHorizontal: Spacing.marginMain,
  },
  grid: {
    flexDirection: 'row',
    gap: COL_GAP,
  },
  column: {
    flexDirection: 'column',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: Spacing.marginMain,
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
  fabDisabled: {
    opacity: 0.5,
  },
  fabIcon: {
    color: Colors.surface,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '300',
  },
});
