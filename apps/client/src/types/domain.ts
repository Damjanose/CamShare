export type User = {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  tier: "Free" | "Premium Member"
}

export type Event = {
  id: string
  ownerId: string
  title: string
  description: string | null
  eventDate: string | null
  endDate: string | null
  coverImageUrl: string | null
  isActive: boolean
  guestCount: number
  photoCount: number
  maxPhotosPerUser?: number | null
  maxFileSizeMb?: number | null
  defaultChannelId: string | null
  createdAt: string
  updatedAt: string
}

export type Photo = {
  id: string
  eventId: string
  url: string
  aspect: "tall" | "wide" | "square"
  uploaderName: string
  uploaderAvatarUrl: string
  takenAt: string
  favorited: boolean
  isVideo?: boolean
  videoDurationLabel?: string
}

export type Invite = {
  eventId: string
  code: string
  url: string
}

export type EventChannel = {
  id: string
  eventId: string
  name: string
  description: string | null
  sortOrder: number
  createdAt: string
}

export type EventPhoto = {
  id: string
  channelId: string
  uploaderId: string
  url: string
  caption: string | null
  isFinal: boolean
  createdAt: string
}

export type EventMemberWithName = {
  eventId: string
  userId: string
  joinedAt: string
  submittedAt: string | null
  fullName: string
}
