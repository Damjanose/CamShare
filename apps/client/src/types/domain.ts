export type User = {
  id: string
  fullName: string
  email: string
  avatarUrl: string
  tier: "Free" | "Premium Member"
}

export type Event = {
  id: string
  name: string
  date: string
  endDate?: string
  location: string
  coverUrl: string
  description: string
  privacy: "public" | "private"
  guestCount: number
  photoCount: number
  inviteCode: string
  ownerId: string
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
