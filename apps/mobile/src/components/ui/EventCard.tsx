import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';
import { Event } from '../../data/events';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Spacing.marginMain * 2;
const CARD_HEIGHT = CARD_WIDTH * (5 / 4); // 4:5 aspect ratio

type Props = {
  event: Event;
  onPress: (event: Event) => void;
};

export function EventCard({ event, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(event)}
      activeOpacity={0.92}
      style={styles.container}
    >
      <ImageBackground
        source={{ uri: event.coverUri }}
        style={styles.image}
        resizeMode="cover"
      >
        {/* Bottom gradient overlay for text legibility */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={styles.gradient}
        />

        {/* Tag chip (top right) */}
        <BlurView
          intensity={20}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={styles.tagChip}
        >
          <Text style={styles.tagText}>{event.tag.toUpperCase()}</Text>
        </BlurView>

        {/* Bottom content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.date}>{event.date}</Text>
          <Text style={styles.location} numberOfLines={1}>{event.location}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Spacing.cardRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  tagChip: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tagText: {
    ...TextStyles.labelSm,
    color: Colors.onSurface,
    letterSpacing: 1.5,
  },
  content: {
    padding: 20,
    gap: 4,
  },
  title: {
    ...TextStyles.headlineLgMobile,
    color: Colors.onSurface,
    marginBottom: 4,
  },
  date: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  location: {
    ...TextStyles.labelMd,
    color: Colors.onSurfaceVariant,
  },
});
