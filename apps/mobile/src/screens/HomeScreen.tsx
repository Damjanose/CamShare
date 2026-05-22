import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { EventCard } from '../components/ui/EventCard';
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

export function HomeScreen({ navigation, activeTab, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventsService.list,
  });

  // Sort by eventDate descending; events with no date go last
  const sorted = [...events].sort((a, b) => {
    if (!a.eventDate && !b.eventDate) return 0;
    if (!a.eventDate) return 1;
    if (!b.eventDate) return -1;
    return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
  });

  function handleEventPress(event: Event) {
    navigation.navigate('Gallery', {
      eventId: event.id,
      eventTitle: event.title,
      maxPhotosPerUser: event.maxPhotosPerUser ?? null,
      maxFileSizeMb: event.maxFileSizeMb ?? null,
      channelId: event.defaultChannelId ?? null,
    });
  }

  return (
    <View style={styles.root}>
      <AtmosphericBackground />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR EVENTS</Text>
            <Text style={styles.heading}>Moments</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No events yet.</Text>
            <Text style={styles.emptyHint}>Scan a QR code to join one.</Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {sorted.map((event) => (
              <TouchableOpacity key={event.id} onPress={() => handleEventPress(event)} activeOpacity={0.85}>
                <EventCard event={event} onPress={handleEventPress} />
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.stackMd,
  },
  eyebrow: {
    ...TextStyles.labelSm,
    color: Colors.primary,
    letterSpacing: 3,
    marginBottom: 4,
  },
  heading: {
    ...TextStyles.headlineLg,
    color: Colors.onSurface,
  },
  eventList: {
    gap: Spacing.gutter,
  },
  empty: {
    marginTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    ...TextStyles.bodyMd,
    color: Colors.onSurface,
  },
  emptyHint: {
    ...TextStyles.labelMd,
    color: Colors.onSurfaceVariant,
  },
});
