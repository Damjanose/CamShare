import { Link } from "react-router-dom"
import { MarketingShell } from "@/components/layout/MarketingShell"
import { Button } from "@/components/primitives/Button"
import { GlassPanel } from "@/components/primitives/GlassPanel"
import { Icon } from "@/components/primitives/Icon"
import { useAuth } from "@/auth/AuthContext"

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
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&h=1200&fit=crop",
  },
]

export const LandingPage = () => {
  const { user } = useAuth()
  const createEventPath = user ? "/events/new" : "/register"

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
              to={createEventPath}
              className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:-translate-y-0.5 px-10 py-4 text-label-md"
            >
              Create Event
            </Link>
            <span className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-label-md text-label-md text-muted-foreground border border-border">
              <Icon name="qr_code_scanner" /> Join Event (Scan QR)
            </span>
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
              fetchPriority="high"
              width={600}
              height={1100}
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
          <GlassPanel className="absolute top-20 right-0 p-4 rounded-2xl shadow-xl animate-float-soft z-30">
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
            <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
              ● Showcase
            </span>
            <h2 className="font-display-lg text-display-lg mb-6 leading-tight">
              Feel the pulse of your{" "}
              <span className="text-champagne-gold italic">celebration.</span>
            </h2>
            <div aria-hidden="true" className="w-10 h-1 bg-champagne-gold rounded-full mb-8" />
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
                {
                  title: "Live Guest Counter",
                  body: "See exactly who's uploading in real time.",
                },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-champagne-gold flex items-center justify-center flex-shrink-0 mt-1">
                    <Icon name="check" className="text-white text-sm" />
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
                <div className="bg-[#1a1a1a] p-8 border-b border-white/10 flex justify-between items-center">
                  <div>
                    <h5 className="font-headline-md text-headline-md text-white">
                      C &amp; J Wedding
                    </h5>
                    <p className="text-xs font-label-md uppercase text-gray-400">
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
                      <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" />
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
                loading="lazy"
                width={900}
                height={1200}
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

      {/* DOWNLOAD APP */}
      <section className="px-margin-mobile md:px-margin-desktop py-24 bg-surface-container-low/50">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <span className="block text-[10px] tracking-[4px] uppercase text-champagne-gold font-label-md mb-4">
              ● Mobile App
            </span>
            <h2 className="font-display-lg text-display-lg mb-6 leading-tight">
              Your memories,{" "}
              <span className="text-champagne-gold italic">in your pocket.</span>
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-md mx-auto lg:mx-0">
              Download CamShare to manage your events, browse live galleries, and capture every
              moment — wherever you are.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="https://apps.apple.com/il/app/camshare-event-photos/id6772641876"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-white/10 min-w-[180px]"
              >
                <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 814 1000" fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-113.5c-43.4-66.1-78.4-169.4-78.4-267 0-198.8 130.3-303.9 258.2-303.9 68.5 0 125.5 44.8 168.6 44.8 41.3 0 106.1-47.4 181.8-47.4zm-106.6-217.1c31.5-36.7 54.4-87.9 54.4-139 0-7.1-.6-14.3-1.9-20.1-51.6 1.9-112.9 34.5-149.1 75.7-29.6 32.8-57.6 84-57.6 136 0 7.7 1.3 15.5 1.9 18 3.2.6 8.4 1.3 13.6 1.3 46.5 0 102.8-30.8 138.7-71.9z" />
                </svg>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-label-md uppercase tracking-widest opacity-70">Download on the</span>
                  <span className="text-base font-bold">App Store</span>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.damjano.camshare"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-4 rounded-2xl hover:bg-gray-800 transition-colors duration-200 cursor-pointer border border-white/10 min-w-[180px]"
              >
                <svg className="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.37.2.8.2 1.2-.04l11.37-6.57L12.6 14l-9.42 9.76zM.5 1.27C.2 1.6 0 2.1 0 2.74v18.52c0 .64.2 1.14.51 1.47L.62 22.8l10.38-10.72V12L.62 1.27H.5zM19.37 9.26l-3.26-1.88-3.32 3.43 3.32 3.43 3.27-1.89c.93-.54.93-1.55-.01-2.09zM4.38.28L15.75 6.85l-3.14 3.25L3.18.28c.4-.24.83-.24 1.2 0z" />
                </svg>
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-label-md uppercase tracking-widest opacity-70">Get it on</span>
                  <span className="text-base font-bold">Google Play</span>
                </div>
              </a>
            </div>
          </div>
          <div className="flex-1 flex justify-center relative">
            <div className="relative w-56 h-[450px] bg-black rounded-[2.5rem] border-8 border-gray-900 shadow-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&h=800&fit=crop"
                alt="CamShare mobile app"
                loading="lazy"
                width={400}
                height={800}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-center">
                <p className="text-xs font-bold font-label-md uppercase tracking-widest text-champagne-gold mb-1">CamShare</p>
                <p className="text-[10px] text-white/60">Event photo sharing</p>
              </div>
            </div>
            <GlassPanel className="absolute -bottom-4 -left-4 px-4 py-3 rounded-2xl shadow-xl z-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-champagne-gold/20 flex items-center justify-center">
                  <Icon name="download" className="text-champagne-gold text-sm" />
                </div>
                <div>
                  <p className="text-xs font-bold">Free Download</p>
                  <p className="text-[10px] text-on-surface-variant">iOS &amp; Android</p>
                </div>
              </div>
            </GlassPanel>
          </div>
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
                to={createEventPath}
                className="inline-flex items-center justify-center gap-2 rounded-full font-label-md whitespace-nowrap transition-all duration-300 active:scale-95 bg-champagne-gold text-white shadow-lg shadow-champagne-gold/30 hover:shadow-xl hover:shadow-champagne-gold/40 hover:scale-[1.02] px-12 py-5 text-label-md"
              >
                {user ? "Create Event" : "Create Event Free"}
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
