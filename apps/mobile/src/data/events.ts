export type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  coverUri: string;
  tag: string;
  photoCount: number;
  isActive: boolean;
};

export const ACTIVE_EVENTS: Event[] = [
  {
    id: 'ev-1',
    title: 'The Wentworth Wedding',
    date: 'June 14, 2025',
    location: 'Château de Lumière, Provence',
    coverUri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    tag: 'Wedding',
    photoCount: 0,
    isActive: true,
  },
  {
    id: 'ev-2',
    title: 'Midsummer Gala',
    date: 'June 21, 2025',
    location: 'The Grand Pavilion, Monaco',
    coverUri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    tag: 'Gala',
    photoCount: 0,
    isActive: true,
  },
];

export const PAST_MEMORIES: Event[] = [
  {
    id: 'mem-1',
    title: 'New Year Soirée',
    date: 'Dec 31, 2024',
    location: 'Paris, FR',
    coverUri: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&q=80',
    tag: "New Year's",
    photoCount: 142,
    isActive: false,
  },
  {
    id: 'mem-2',
    title: 'Autumn Harvest Ball',
    date: 'Oct 12, 2024',
    location: 'Napa Valley, CA',
    coverUri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    tag: 'Ball',
    photoCount: 87,
    isActive: false,
  },
  {
    id: 'mem-3',
    title: "Sofia's Quinceañera",
    date: 'Aug 3, 2024',
    location: 'Miami Beach, FL',
    coverUri: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
    tag: 'Quinceañera',
    photoCount: 204,
    isActive: false,
  },
  {
    id: 'mem-4',
    title: 'Garden Party 2024',
    date: 'May 18, 2024',
    location: 'Cotswolds, UK',
    coverUri: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80',
    tag: 'Garden Party',
    photoCount: 61,
    isActive: false,
  },
];
