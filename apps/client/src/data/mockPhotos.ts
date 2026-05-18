import type { Photo } from "@/types/domain"

const uploaders = [
  {
    name: "Marcus Chen",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Julianne V.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "Sarah Pell",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "David Lin",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
  },
  {
    name: "James Tan",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces",
  },
]

const sinclairUrls = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=1300&fit=crop",
  "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&h=1400&fit=crop",
  "https://images.unsplash.com/photo-1496843916299-590492c751f4?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=900&h=1400&fit=crop",
  "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&h=1300&fit=crop",
]

const summerUrls = [
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=900&h=1300&fit=crop",
  "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=900&h=1400&fit=crop",
  "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=900&h=900&fit=crop",
]

const vanguardUrls = [
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=900&h=1200&fit=crop",
  "https://images.unsplash.com/photo-1545987796-200677ee1011?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=900&h=1300&fit=crop",
]

const claraUrls = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=1400&fit=crop",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&h=900&fit=crop",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=900&h=1300&fit=crop",
  "https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&h=900&fit=crop",
]

const aspects: Photo["aspect"][] = ["tall", "wide", "square", "tall", "square", "wide"]

const buildPhotos = (eventId: string, urls: string[]): Photo[] =>
  urls.map((url, i) => {
    const uploader = uploaders[i % uploaders.length]
    return {
      id: `${eventId}-photo-${i + 1}`,
      eventId,
      url,
      aspect: aspects[i % aspects.length],
      uploaderName: uploader.name,
      uploaderAvatarUrl: uploader.avatar,
      takenAt: new Date(Date.now() - i * 3600_000).toISOString(),
      favorited: i % 4 === 0,
      isVideo: i === 2,
      videoDurationLabel: i === 2 ? "0:24" : undefined,
    }
  })

export const mockPhotos: Photo[] = [
  ...buildPhotos("evt-sinclair", sinclairUrls),
  ...buildPhotos("evt-summer-soiree", summerUrls),
  ...buildPhotos("evt-vanguard", vanguardUrls),
  ...buildPhotos("evt-clara-julian", claraUrls),
]
