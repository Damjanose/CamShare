import { useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/primitives/Button"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"
import { useEventsStore } from "@/stores/eventsStore"

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop"

export const CreateEventPage = () => {
  const navigate = useNavigate()
  const addEvent = useEventsStore((s) => s.addEvent)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverFilename, setCoverFilename] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [autoApprove, setAutoApprove] = useState(false)
  const [hiRes, setHiRes] = useState(true)
  const [liveSlideshow, setLiveSlideshow] = useState(false)
  const [photoLimitEnabled, setPhotoLimitEnabled] = useState(true)
  const [photoLimit, setPhotoLimit] = useState(50)
  const [fileSizeLimitEnabled, setFileSizeLimitEnabled] = useState(true)
  const [fileSize, setFileSize] = useState(25)

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCoverFilename(file.name)
    const reader = new FileReader()
    reader.onload = () => setCoverPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try {
      const created = await addEvent({
        title: name,
        description,
        eventDate: date || null,
        endDate: endDate || null,
        coverImageUrl: coverPreview ?? DEFAULT_COVER,
        maxPhotosPerUser: photoLimitEnabled ? photoLimit : undefined,
        maxFileSizeMb: fileSizeLimitEnabled ? fileSize : undefined,
      })
      navigate(`/events/${created.id}/invite`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 md:mb-16 text-center">
        <h1 className="font-headline-lg text-headline-lg md:text-display-lg md:font-display-lg text-on-surface mb-4">
          Curate a New Memory
        </h1>
        <p className="text-on-surface-variant font-body-lg max-w-xl mx-auto">
          Design a digital sanctuary for your event's most precious moments. Every detail is a
          bridge to nostalgia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Essentials */}
        <GlassPanel className="md:col-span-7 rounded-3xl p-8 ambient-glow">
          <div className="flex items-center gap-3 mb-8 text-primary">
            <Icon name="edit_note" />
            <h2 className="font-headline-md text-headline-md">Event Essentials</h2>
          </div>
          <div className="space-y-8">
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
                Event Title
              </label>
              <input
                type="text"
                className="form-underline font-headline-md text-headline-md"
                placeholder="e.g., The Miller Wedding"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest block mb-1">
                Description
              </label>
              <textarea
                rows={3}
                className="form-underline font-body-md text-body-md resize-none"
                placeholder="A brief narrative of the magic to come…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateCard
                label="Event Date"
                icon="event"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <DateCard
                label="End Date"
                icon="event_busy"
                value={endDate}
                min={date || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </GlassPanel>

        {/* Cover */}
        <GlassPanel className="md:col-span-5 rounded-3xl p-8 ambient-glow flex flex-col">
          <div className="flex items-center gap-3 mb-8 text-primary">
            <Icon name="image" />
            <h2 className="font-headline-md text-headline-md">Cover Aesthetic</h2>
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click()
            }}
            className="flex-grow border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:bg-primary-container/5 transition-all group"
          >
            <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Icon name="cloud_upload" filled className="text-4xl" />
            </div>
            <p className="font-headline-md text-headline-md text-on-surface mb-2">
              Upload Cover
            </p>
            <p className="text-on-surface-variant font-caption">
              Drag and drop high-res photography.
              <br />
              Recommended 16:9 ratio.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          {coverPreview && coverFilename && (
            <div className="mt-6 p-4 bg-surface-container rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white overflow-hidden shadow-sm">
                <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow">
                <p className="font-label-md text-on-surface text-xs">Current Selection</p>
                <p className="text-on-surface-variant font-caption truncate max-w-[160px]">
                  {coverFilename}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCoverPreview(null)
                  setCoverFilename(null)
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
                className="text-on-surface-variant hover:text-error transition-colors"
                aria-label="Clear cover"
              >
                <Icon name="close" />
              </button>
            </div>
          )}
        </GlassPanel>

        {/* Privacy & Settings */}
        <GlassPanel className="md:col-span-8 rounded-3xl p-8 ambient-glow">
          <div className="flex items-center gap-3 mb-8 text-primary">
            <Icon name="shield_person" />
            <h2 className="font-headline-md text-headline-md">Privacy &amp; Sophistication</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            <ToggleRow
              title="Auto-approve Uploads"
              description="Media appears instantly without moderator review."
              checked={autoApprove}
              onChange={setAutoApprove}
            />
            <ToggleRow
              title="High-resolution Storage"
              description="Preserve every pixel in original uncompressed format."
              checked={hiRes}
              onChange={setHiRes}
            />
            <ToggleRow
              title="Live Slideshow"
              description="Enable live projection mode for event screens."
              checked={liveSlideshow}
              onChange={setLiveSlideshow}
            />
          </div>
        </GlassPanel>

        {/* Limits */}
        <GlassPanel className="md:col-span-4 rounded-3xl p-8 ambient-glow">
          <div className="flex items-center gap-3 mb-8 text-primary">
            <Icon name="settings_input_component" />
            <h2 className="font-headline-md text-headline-md">Limits</h2>
          </div>
          <div className="space-y-8">
            <div>
              <ToggleRow
                title="Enable photo limit"
                description="Restrict how many photos each guest can upload."
                checked={photoLimitEnabled}
                onChange={setPhotoLimitEnabled}
              />
              {photoLimitEnabled && (
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <label className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                      Photos per Guest
                    </label>
                    <span className="text-primary font-bold">{photoLimit}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={200}
                    value={photoLimit}
                    onChange={(e) => setPhotoLimit(Number(e.target.value))}
                    className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}
            </div>
            <div>
              <ToggleRow
                title="Enable file size limit"
                description="Cap the maximum size of each uploaded photo."
                checked={fileSizeLimitEnabled}
                onChange={setFileSizeLimitEnabled}
              />
              {fileSizeLimitEnabled && (
                <div className="mt-4">
                  <div className="flex justify-between mb-2">
                    <label className="font-label-md text-label-md text-on-surface uppercase tracking-widest">
                      Max File Size
                    </label>
                    <span className="text-primary font-bold">{fileSize} MB</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={fileSize}
                    onChange={(e) => setFileSize(Number(e.target.value))}
                    className="w-full h-1 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}
            </div>
            <div className="pt-4 p-4 rounded-xl bg-secondary-container/20 border border-secondary-container/30">
              <div className="flex gap-3">
                <Icon name="info" className="text-secondary" />
                <p className="text-on-secondary-container font-caption">
                  Premium members enjoy unlimited uploads and archival-grade security.
                </p>
              </div>
            </div>
          </div>
        </GlassPanel>

        <div className="md:col-span-12 flex justify-center mt-12">
          <Button variant="gold" size="lg" type="submit" disabled={submitting} className="px-12 py-5 text-lg">
            <Icon name="qr_code_2" className="text-3xl" /> {submitting ? "Creating…" : "Generate Event & QR"}
          </Button>
        </div>
      </form>
    </div>
  )
}

const toDisplay = (ymd: string): string => {
  if (!ymd) return ""
  const [y, m, d] = ymd.split("-")
  return `${d} — ${m} — ${y}`
}

const DateCard = ({
  label,
  icon,
  value,
  min,
  onChange,
}: {
  label: string
  icon: string
  value: string
  min?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const ref = useRef<HTMLInputElement>(null)

  const open = () => {
    const el = ref.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") open() }}
      className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest/60 p-5 cursor-pointer group hover:border-primary/50 hover:bg-primary/[0.03] transition-all duration-200 select-none"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon name={icon} className="text-primary text-base" />
        <span className="font-label-md text-on-surface-variant uppercase tracking-widest text-xs">
          {label}
        </span>
      </div>
      {value ? (
        <p className="font-headline-md text-headline-md text-on-surface tracking-wide">
          {toDisplay(value)}
        </p>
      ) : (
        <p className="font-body-md text-on-surface-variant/50 italic text-sm">Select date</p>
      )}
      <div className="mt-3 h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
      <input
        ref={ref}
        type="date"
        required
        min={min}
        value={value}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) => {
  return (
    <div className="flex justify-between items-center gap-4">
      <div>
        <h3 className="font-label-md text-on-surface">{title}</h3>
        <p className="text-on-surface-variant font-caption mt-1">{description}</p>
      </div>
      <input
        type="checkbox"
        className="gold-toggle"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  )
}
