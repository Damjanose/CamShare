import { Link } from "react-router-dom"
import { MarketingShell } from "@/components/layout/MarketingShell"
import { Button } from "@/components/primitives/Button"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"

const features = [
  {
    icon: "lock",
    title: "Private Albums",
    body: "Your content is secure. Control who sees and contributes with custom privacy settings.",
  },
  {
    icon: "sync",
    title: "Real-time Uploads",
    body: "Experience the event through every eye. Photos appear instantly in the live feed.",
  },
  {
    icon: "video_library",
    title: "Video Support",
    body: "Not just photos. Capture the laughter and music with high-quality video uploads.",
  },
  {
    icon: "shield_person",
    title: "Admin Control",
    body: "Moderate submissions and set upload caps to ensure a high-quality curation.",
  },
  {
    icon: "grid_view",
    title: "Beautiful Gallery",
    body: "A responsive masonry layout that makes every captured moment look editorial.",
  },
]

const useCases = [
  {
    label: "Weddings",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&h=1200&fit=crop",
  },
  {
    label: "Birthdays",
    image:
      "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=900&h=1200&fit=crop",
    pushDown: true,
  },
  {
    label: "Corporate",
    image:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=900&h=1200&fit=crop",
  },
  {
    label: "Parties",
    image:
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&h=1200&fit=crop",
    pushDown: true,
  },
  {
    label: "Graduation",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&h=1200&fit=crop",
  },
]

export const LandingPage = () => {
  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-margin-mobile md:px-margin-desktop py-20 gap-16 overflow-hidden min-h-[800px]">
        <div className="flex-1 z-10">
          <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
            ● The Platform
          </span>
          <h1 className="font-display-lg text-display-lg text-on-background mb-6 leading-tight">
            Collect memories from every event in{" "}
            <span className="text-primary italic">one shared album.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-xl">
            Create an event, share a QR code, and let guests upload photos and videos
            instantly. No app downloads, no account friction — just pure collective nostalgia.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:-translate-y-0.5 px-10 py-4 text-label-md"
            >
              Create Event
            </Link>
            <Button variant="ghost" size="lg">
              <Icon name="qr_code_scanner" /> Join Event (Scan QR)
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-8">
            {[
              { stat: "500+", label: "Events hosted" },
              { stat: "12k+", label: "Photos shared" },
              { stat: "∞",    label: "Memories made" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white border border-outline-variant/30 rounded-xl px-6 py-3 text-center"
              >
                <span className="block font-bold text-2xl text-champagne-gold">{item.stat}</span>
                <span className="text-xs text-on-surface-variant">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 relative w-full h-[600px] flex justify-center items-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl opacity-50 scale-150"
          />
          <div className="relative w-72 h-[580px] bg-black rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden z-20 group">
            <img
              src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=1100&fit=crop"
              alt="Event gallery preview"
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 text-white text-center mb-4">
                <Icon name="qr_code_2" filled className="text-4xl mb-2 block" />
                <p className="text-xs font-label-md uppercase tracking-widest">
                  Scanning QR…
                </p>
              </div>
            </div>
          </div>
          <GlassPanel className="absolute top-20 right-0 p-4 rounded-2xl shadow-xl animate-float-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="add_a_photo" className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold">New Upload</p>
                <p className="text-[10px] text-on-surface-variant">
                  Just added to "Summer Gala"
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 bg-surface-container-low/50">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg mb-4">
            The simplest way to curate
          </h2>
          <div className="w-24 h-1 bg-champagne-gold mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: "edit_calendar",
              title: "1. Create Event",
              body: "Name your memory, set upload limits, and customize your live gallery settings in seconds.",
              rotate: "-rotate-6",
            },
            {
              icon: "qr_code",
              title: "2. Share QR Code",
              body: "Print it on tables or show it on big screens. Guests scan and gain instant access to upload.",
              rotate: "rotate-6",
            },
            {
              icon: "auto_stories",
              title: "3. Collect Memories",
              body: "Watch as photos and videos stream into a beautiful, collaborative live album for everyone to enjoy.",
              rotate: "-rotate-6",
            },
          ].map((step) => (
            <div key={step.title} className="flex flex-col items-center text-center group">
              <div
                className={`w-20 h-20 rounded-3xl bg-surface-container-highest flex items-center justify-center mb-6 shadow-sm group-hover:shadow-xl group-hover:bg-primary/10 transition-all duration-500 transform group-hover:${step.rotate}`}
              >
                <Icon name={step.icon} className="text-4xl text-primary" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-3">{step.title}</h3>
              <p className="text-on-surface-variant">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-margin-mobile md:px-margin-desktop py-24">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
            ● Features
          </span>
          <h2 className="font-display-lg text-display-lg text-on-background mb-6">
            Built for moments that matter.
          </h2>
          <div aria-hidden="true" className="w-10 h-1 bg-champagne-gold rounded-full mx-auto" />
        </div>

        {/* Asymmetric grid: hero card left + supporting sub-grid right */}
        <div className="flex flex-col md:flex-row gap-8 md:items-stretch">
          {/* Hero card — QR-Based Access */}
          <div className="md:w-1/2 bg-[#1a1a1a] rounded-[2rem] p-10 flex flex-col justify-between min-h-[320px]">
            <div>
              <Icon name="bolt" className="text-champagne-gold mb-6 block text-6xl" />
              <h4 className="font-headline-lg text-headline-lg text-white mb-4">
                QR-Based Access
              </h4>
              <p className="text-gray-300 text-base leading-relaxed">
                No apps to download. No accounts to create. Just a simple scan to start the magic.
              </p>
            </div>
            <span className="inline-block bg-champagne-gold text-black text-xs font-bold px-4 py-1.5 rounded-full mt-8 self-start">
              Core feature
            </span>
          </div>

          {/* Supporting sub-grid — 5 cards in 2 columns */}
          <div className="md:w-1/2 grid grid-cols-2 gap-8">
            {features.slice(0, 4).map((feature) => (
              <GlassPanel
                key={feature.title}
                className="p-6 rounded-[2rem] hover:shadow-2xl transition-all duration-500"
              >
                <Icon name={feature.icon} className="text-primary mb-4 block text-3xl" />
                <h4 className="font-headline-md text-headline-md mb-2">{feature.title}</h4>
                <p className="text-on-surface-variant text-sm">{feature.body}</p>
              </GlassPanel>
            ))}
            {/* Beautiful Gallery — gold gradient, full width */}
            <div className="col-span-2 bg-gradient-to-br from-champagne-gold to-yellow-600 rounded-[2rem] p-6 hover:shadow-2xl transition-all duration-500">
              <Icon name={features[4].icon} className="text-white mb-4 block text-3xl" />
              <h4 className="font-headline-md text-headline-md mb-2 text-white">
                {features[4].title}
              </h4>
              <p className="text-white/80 text-sm">{features[4].body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE */}
      <section id="showcase" className="px-margin-mobile md:px-margin-desktop py-24 bg-surface-container-highest/20">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-3/5">
            <h2 className="font-display-lg text-display-lg mb-8 leading-tight">
              Feel the pulse of your celebration.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              The CamShare dashboard gives you a bird's-eye view of all incoming content. Watch
              your gallery grow in real-time and provide your guests with a collective space to
              share their unique perspectives.
            </p>
            <ul className="space-y-6">
              {[
                {
                  title: "Instant Masonry Layout",
                  body: "Photos of all sizes fit perfectly in our elegant grid.",
                },
                {
                  title: "Seamless Transitions",
                  body: "Smooth animations that feel like high-end editorial software.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon name="check" className="text-primary text-sm" />
                  </div>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-on-surface-variant">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full lg:w-2/5">
            <GlassPanel className="p-1 rounded-[3rem] shadow-2xl relative">
              <div className="bg-white rounded-[2.8rem] overflow-hidden">
                <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                  <div>
                    <h5 className="font-headline-md text-headline-md text-primary">
                      C &amp; J Wedding
                    </h5>
                    <p className="text-xs font-label-md uppercase text-on-surface-variant">
                      Live Event Feed
                    </p>
                  </div>
                  <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                    LIVE
                  </span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4 h-[420px] overflow-y-auto hide-scrollbar">
                  {[
                    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop",
                    "https://images.unsplash.com/photo-1530023367847-a683933f4172?w=600&h=900&fit=crop",
                    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&h=700&fit=crop",
                    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=750&fit=crop",
                  ].map((url, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden bg-gray-200"
                      style={{ height: i % 2 === 0 ? 180 : 220 }}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              <GlassPanel className="absolute -bottom-8 -right-8 w-44 h-44 p-4 rounded-3xl shadow-2xl flex flex-col items-center justify-center border border-white/50">
                <Icon name="qr_code_2" filled className="text-6xl text-primary" />
                <p className="text-[10px] font-bold mt-2 uppercase tracking-tighter">
                  Scan to Upload
                </p>
              </GlassPanel>
            </GlassPanel>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="px-margin-mobile md:px-margin-desktop py-24">
        <div className="text-center mb-16">
          <h2 className="font-headline-lg text-headline-lg">
            Made for your most precious moments
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {useCases.map((useCase) => (
            <div
              key={useCase.label}
              className={`relative aspect-[3/4] rounded-[2rem] overflow-hidden group cursor-pointer ${
                useCase.pushDown ? "md:mt-12" : ""
              }`}
            >
              <img
                src={useCase.image}
                alt={useCase.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <span className="text-white font-headline-md text-headline-md">
                  {useCase.label}
                </span>
              </div>
            </div>
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
            <h2 className="font-display-lg text-display-lg mb-6">
              Start your first event in minutes
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-12 max-w-2xl mx-auto">
              Join thousands of hosts who use CamShare to capture the moments that matter most.
              No credit card required to start your first album.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-6">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-primary text-on-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] px-12 py-5 text-label-md"
              >
                Create Event Free
              </Link>
              <Button variant="ghost" size="lg" className="px-12 py-5">
                Scan QR to try demo event
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
