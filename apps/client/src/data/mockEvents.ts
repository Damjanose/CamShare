import type { Event } from "@/types/domain"

export const mockEvents: Event[] = [
  {
    id: "evt-sinclair",
    name: "The Sinclair Gala",
    date: "2024-10-24",
    location: "Grand Heritage Hall",
    coverUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1500&fit=crop",
    description:
      "An opulent black-tie evening celebrating two decades of patronage in the arts. Curated dining, chamber music, and a midnight reveal.",
    privacy: "private",
    guestCount: 42,
    photoCount: 452,
    inviteCode: "sinclair-gala-24",
    ownerId: "user-1",
  },
  {
    id: "evt-summer-soiree",
    name: "Summer Soirée 2024",
    date: "2024-08-12",
    location: "Villa Aurelia",
    coverUrl:
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=1200&h=1500&fit=crop",
    description:
      "A sun-drenched garden party with long tables, lavender cocktails, and an open-air string quartet at dusk.",
    privacy: "public",
    guestCount: 64,
    photoCount: 892,
    inviteCode: "summer-soiree-24",
    ownerId: "user-1",
  },
  {
    id: "evt-vanguard",
    name: "Vanguard Exhibit Opening",
    date: "2024-11-02",
    location: "The Mercer Gallery",
    coverUrl:
      "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&h=1500&fit=crop",
    description:
      "An intimate preview of contemporary works exploring memory, light, and architectural negative space.",
    privacy: "private",
    guestCount: 10,
    photoCount: 118,
    inviteCode: "vanguard-2024",
    ownerId: "user-1",
  },
  {
    id: "evt-clara-julian",
    name: "Clara & Julian · A Wedding",
    date: "2024-09-21",
    location: "Hidden Meadow Estate",
    coverUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=1500&fit=crop",
    description:
      "A golden-hour ceremony beneath olive trees, candlelit dinner under string lights, and dancing until the stars faded.",
    privacy: "private",
    guestCount: 128,
    photoCount: 1240,
    inviteCode: "clara-julian-wed",
    ownerId: "user-1",
  },
]
