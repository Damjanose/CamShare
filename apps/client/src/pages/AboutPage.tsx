import { Link } from "react-router-dom"
import { MarketingShell } from "@/components/layout/MarketingShell"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"

const values = [
  {
    icon: "lock",
    title: "Privacy First",
    body: "Your event photos belong to you and your guests — not to advertisers. We never sell personal data or serve targeted ads.",
  },
  {
    icon: "bolt",
    title: "Frictionless by Design",
    body: "The best technology disappears. CamShare removes every barrier between your guests and the shared album — no downloads, no sign-ups, just a scan.",
  },
  {
    icon: "auto_stories",
    title: "Collective Memory",
    body: "Every event has dozens of perspectives. CamShare unites them into one living gallery so no moment is ever lost in someone's camera roll.",
  },
]

export const AboutPage = () => {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative px-margin-mobile md:px-margin-desktop py-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_60%)]"
        />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block font-label-md text-label-md uppercase tracking-widest text-primary mb-6">
            About CamShare
          </span>
          <h1 className="font-display-lg text-display-lg text-on-background mb-6 leading-tight">
            Every great event deserves a{" "}
            <span className="text-primary italic">shared story.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            CamShare was built on a simple belief: the best photos of any celebration are always on
            someone else's phone. We exist to fix that.
          </p>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 bg-surface-container-low/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-headline-lg text-headline-lg mb-6">
              The problem we set out to solve
            </h2>
            <p className="text-on-surface-variant mb-5 leading-relaxed">
              After every wedding, birthday, or company retreat, the same thing happens. Hundreds of
              candid shots — the real ones, the funny ones, the ones you'll treasure for decades —
              are scattered across WhatsApp threads, email attachments, and forgotten camera rolls.
            </p>
            <p className="text-on-surface-variant mb-5 leading-relaxed">
              The host sends a "please share your photos" message. A few people do. Most don't. The
              collective memory of the event slowly fades into fragmented JPEG files no one can
              find.
            </p>
            <p className="text-on-surface-variant leading-relaxed">
              We built CamShare to make that problem disappear — before it ever starts.
            </p>
          </div>
          <GlassPanel className="p-10 rounded-[2rem]">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Icon name="photo_library" className="text-on-surface-variant text-2xl mt-0.5" />
                <div>
                  <p className="font-medium line-through text-on-surface-variant">
                    47 guests. 47 camera rolls.
                  </p>
                  <p className="text-sm text-on-surface-variant/60 mt-1">
                    Scattered across apps, forgotten on devices.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="arrow_downward" className="text-primary text-sm" />
                </div>
                <span className="text-sm text-on-surface-variant">One QR code changes everything</span>
              </div>
              <div className="flex items-start gap-4">
                <Icon name="collections" className="text-primary text-2xl mt-0.5" />
                <div>
                  <p className="font-medium">One shared album. Every perspective.</p>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Live, beautiful, and yours forever.
                  </p>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display-lg text-display-lg mb-6 leading-tight">Our mission</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            To make collective memory effortless — so every perspective from every event is
            preserved in one beautiful, shared space, accessible to everyone who was there.
          </p>
          <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full mt-10" />
        </div>
      </section>

      {/* VALUES */}
      <section className="px-margin-mobile md:px-margin-desktop py-20 bg-surface-container-low/30">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg">What we stand for</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {values.map((v) => (
            <GlassPanel key={v.title} className="p-8 rounded-[2rem]">
              <Icon name={v.icon} className="text-primary text-3xl mb-5 block" />
              <h3 className="font-headline-md text-headline-md mb-3">{v.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{v.body}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="bg-primary-container/20 rounded-[3rem] p-12 md:p-16 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.18),transparent_70%)]"
          />
          <div className="relative z-10">
            <h2 className="font-headline-lg text-headline-lg mb-4">
              Ready to capture your next event?
            </h2>
            <p className="text-on-surface-variant mb-10 max-w-xl mx-auto">
              Join thousands of hosts using CamShare to preserve the moments that matter most.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] px-10 py-4 text-label-md"
            >
              Create Event Free
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
