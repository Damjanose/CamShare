import { QRCodeSVG } from "qrcode.react"
import { GlassPanel } from "@/components/primitives/GlassPanel"

export const QrCard = ({
  value,
  title = "Scan to Join the Memory",
  subtitle = "Unique invite code for the private gallery.",
}: {
  value: string
  title?: string
  subtitle?: string
}) => {
  return (
    <GlassPanel
      variant="floating"
      className="p-12 rounded-[40px] shadow-2xl shadow-primary/5 flex flex-col items-center w-full max-w-lg"
    >
      <div className="bg-white p-8 rounded-3xl shadow-inner border border-surface-variant">
        <div className="w-64 h-64 bg-on-surface flex items-center justify-center rounded-xl p-4">
          <QRCodeSVG
            value={value}
            size={224}
            bgColor="#1b1c1c"
            fgColor="#FAF9F6"
            level="M"
          />
        </div>
      </div>
      <div className="text-center mt-8">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant max-w-xs mx-auto">{subtitle}</p>
      </div>
    </GlassPanel>
  )
}
