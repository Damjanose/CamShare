import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, NavTab } from '../components/navigation/BottomNav';
import { AtmosphericBackground } from '../components/primitives/AtmosphericBackground';
import { EventCard } from '../components/ui/EventCard';
import { PastMemoryCard } from '../components/ui/PastMemoryCard';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { TextStyles } from '../constants/typography';
import { eventsService } from '../services/events';
import type { Event } from '@camshare/types';

const { width } = Dimensions.get('window');
const MEMORY_CARD_SIZE = (width - Spacing.marginMain * 2 - Spacing.gutter) / 2;

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

  const activeEvents = events.filter((e) => e.isActive);
  const pastEvents = events.filter((e) => !e.isActive);

  function handleEventPress(event: Event) {
    navigation.navigate('Gallery', { eventId: event.id, eventTitle: event.title });
  }

  function handleMemoryPress(event: Event) {
    navigation.navigate('Gallery', { eventId: event.id, eventTitle: event.title });
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
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>YOUR EVENTS</Text>
            <Text style={styles.heading}>Moments</Text>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Active events */}
            <Text style={styles.sectionLabel}>UPCOMING</Text>
            <View style={styles.eventList}>
              {activeEvents.map((event) => (
                <EventCard key={event.id} event={event} onPress={handleEventPress} />
              ))}
            </View>

            {/* Past memories */}
            <Text style={[styles.sectionLabel, { marginTop: Spacing.stackLg }]}>MEMORIES</Text>
            <View style={styles.memoriesGrid}>
              {pastEvents.map((event) => (
                <PastMemoryCard
                  key={event.id}
                  event={event}
                  onPress={handleMemoryPress}
                  size={MEMORY_CARD_SIZE}
                />
              ))}
            </View>
          </>
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
  sectionLabel: {
    ...TextStyles.labelSm,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2.5,
    marginBottom: Spacing.stackSm,
  },
  eventList: {
    gap: Spacing.gutter,
  },
  memoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.gutter,
  },
});
