export type GalleryItem = {
  id: string;
  uri: string;
  aspectRatio: number; // width / height
  caption?: string;
  photographer?: string;
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g-1',
    uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    aspectRatio: 0.75, // 3:4 portrait
    caption: 'First dance',
    photographer: 'Emma L.',
  },
  {
    id: 'g-2',
    uri: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
    aspectRatio: 1.5, // 3:2 landscape
    caption: 'Ceremony',
    photographer: 'James R.',
  },
  {
    id: 'g-3',
    uri: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
    aspectRatio: 0.8, // 4:5 portrait
    caption: 'The rings',
    photographer: 'Sarah K.',
  },
  {
    id: 'g-4',
    uri: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80',
    aspectRatio: 1.2, // slightly landscape
    caption: 'Floral arch',
    photographer: 'Emma L.',
  },
  {
    id: 'g-5',
    uri: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
    aspectRatio: 0.67, // 2:3 portrait
    caption: 'Bridal party',
    photographer: 'James R.',
  },
  {
    id: 'g-6',
    uri: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=600&q=80',
    aspectRatio: 1.0, // square
    caption: 'Table setting',
    photographer: 'Sarah K.',
  },
  {
    id: 'g-7',
    uri: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&q=80',
    aspectRatio: 0.75,
    caption: 'Champagne toast',
    photographer: 'Emma L.',
  },
  {
    id: 'g-8',
    uri: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80',
    aspectRatio: 1.33,
    caption: 'Reception hall',
    photographer: 'James R.',
  },
  {
    id: 'g-9',
    uri: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80',
    aspectRatio: 0.8,
    caption: 'Bouquet toss',
    photographer: 'Sarah K.',
  },
  {
    id: 'g-10',
    uri: 'https://images.unsplash.com/photo-1595257841889-eca2678454e2?w=600&q=80',
    aspectRatio: 1.0,
    caption: 'Sunset portraits',
    photographer: 'Emma L.',
  },
];
