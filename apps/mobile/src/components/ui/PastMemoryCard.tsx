import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';
import type { Event } from '@camshare/types';

type Props = {
  event: Event;
  onPress: (event: Event) => void;
  size: number;
};

export function PastMemoryCard({ event, onPress, size }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.88}
      style={[styles.container, { width: size, height: size }]}
    >
      <ImageBackground
        source={{ uri: event.coverImageUrl ?? undefined }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Dark overlay for desaturated/"memory" feel */}
        <View style={styles.darkOverlay} />

        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.80)']}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.year}>{(event.eventDate ?? '').split(',')[1]?.trim() ?? (event.eventDate ?? '')}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19,19,19,0.35)',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '35%',
  },
  content: {
    padding: 12,
    gap: 2,
  },
  title: {
    ...TextStyles.labelMd,
    color: Colors.onSurface,
    fontSize: 13,
  },
  year: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
});
