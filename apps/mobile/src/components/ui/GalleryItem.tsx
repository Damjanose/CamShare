import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { GalleryItem as GalleryItemType } from '../../data/gallery';

type Props = {
  item: GalleryItemType;
  width: number;
  onPress: (item: GalleryItemType) => void;
};

export function GalleryItem({ item, width, onPress }: Props) {
  const [pressed, setPressed] = useState(false);
  const height = width / item.aspectRatio;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => onPress(item)}
      style={[styles.container, { width, height }]}
    >
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Overlay on press */}
      {pressed && (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <BlurView
            intensity={8}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          {item.caption && (
            <View style={styles.captionWrap}>
              <Text style={styles.caption}>{item.caption}</Text>
              {item.photographer && (
                <Text style={styles.photographer}>{item.photographer}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  overlay: {
    borderRadius: 16,
    justifyContent: 'flex-end',
    padding: 12,
  },
  captionWrap: {
    gap: 2,
  },
  caption: {
    ...TextStyles.labelMd,
    color: Colors.onSurface,
  },
  photographer: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
});
