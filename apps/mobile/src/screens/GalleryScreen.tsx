import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { GalleryItem as GalleryItemComponent } from '../components/ui/GalleryItem';
import { LightboxModal } from '../components/ui/LightboxModal';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { GALLERY_ITEMS, GalleryItem } from '../data/gallery';

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

type Props = {
  navigation: any;
  route: any;
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
};

export function GalleryScreen({ navigation, route, activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();
  const eventTitle: string = route?.params?.eventTitle ?? 'Gallery';
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const [leftCol, rightCol] = buildColumns(GALLERY_ITEMS);

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

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {/* Left column */}
          <View style={[styles.column, { width: COL_WIDTH }]}>
            {leftCol.map((item) => (
              <View key={item.id} style={{ marginBottom: COL_GAP }}>
                <GalleryItemComponent item={item} width={COL_WIDTH} onPress={setLightboxItem} />
              </View>
            ))}
          </View>

          {/* Right column */}
          <View style={[styles.column, { width: COL_WIDTH }]}>
            {rightCol.map((item) => (
              <View key={item.id} style={{ marginBottom: COL_GAP }}>
                <GalleryItemComponent item={item} width={COL_WIDTH} onPress={setLightboxItem} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

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
});
