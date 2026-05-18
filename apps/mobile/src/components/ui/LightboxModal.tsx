import { BlurView } from 'expo-blur';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';
import { GalleryItem } from '../../data/gallery';

type Props = {
  item: GalleryItem | null;
  onClose: () => void;
};

export function LightboxModal({ item, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={!!item}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop blur */}
      <BlurView
        intensity={60}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        {/* Close button */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>

        {/* Image */}
        {item && (
          <>
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Caption */}
            {(item.caption || item.photographer) && (
              <View style={styles.meta}>
                {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
                {item.photographer && (
                  <Text style={styles.photographer}>{item.photographer.toUpperCase()}</Text>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.marginMain,
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 56,
    right: Spacing.marginMain,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    zIndex: 10,
  },
  closeX: {
    color: Colors.onSurface,
    fontSize: 16,
  },
  imageWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  meta: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  caption: {
    ...TextStyles.headlineMd,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  photographer: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
});
