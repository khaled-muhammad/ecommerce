import { useState } from "react";
import { Play, X } from "lucide-react";
import { Dialog } from "radix-ui";
import SplitText from "../components/SplitText.jsx";
import GlowingMainLink from "../components/GlowingMainLink.jsx";
import { landingImages } from "./imageUrls.js";
import HeroPCModel from "./HeroPCModel.jsx";

const HERO_YOUTUBE_ID = "m7b_nqXqOHA";
const HERO_YOUTUBE_THUMB = `https://img.youtube.com/vi/${HERO_YOUTUBE_ID}/mqdefault.jpg`;
const HERO_YOUTUBE_EMBED = `https://www.youtube.com/embed/${HERO_YOUTUBE_ID}?autoplay=1&rel=0`;

const heroHeadlineClass =
  "hero-title-line block w-full text-4xl font-extrabold leading-tight tracking-tight text-vexo-text sm:text-5xl lg:text-[56px]";

export default function HeroSection() {
  const { avatars } = landingImages;
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <section className="landing-hero-screen relative hero-gradient overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <svg
          className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <line x1="200" y1="100" x2="400" y2="300" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
          <line x1="400" y1="300" x2="200" y2="500" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
          <line x1="200" y1="500" x2="400" y2="700" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
          <line x1="1000" y1="100" x2="800" y2="300" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
          <line x1="800" y1="300" x2="1000" y2="500" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
          <line x1="1000" y1="500" x2="800" y2="700" stroke="var(--vexo-hero-line)" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid min-h-[calc(100svh-9rem)] grid-cols-1 items-center gap-8 sm:min-h-[calc(100svh-10rem)] lg:grid-cols-12 lg:items-stretch lg:gap-4">
          <div className="hero-left order-3 flex flex-col items-start gap-6 lg:order-none lg:col-span-1 lg:row-start-1 lg:self-center">
            <div className="flex -space-x-3">
              {avatars.map((src, index) => (
                <div
                  key={src}
                  className="h-10 w-10 overflow-hidden rounded-full border-2 shadow-md"
                  style={{
                    borderColor: "var(--vexo-avatar-ring)",
                    zIndex: avatars.length - index,
                  }}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" width={40} height={40} />
                </div>
              ))}
            </div>

            <p className="max-w-[180px] text-xs leading-relaxed text-vexo-text-secondary">
              Trusted by builders and IT teams. Genuine parts, clear specs, and stock you can actually add to cart.
            </p>
          </div>

          <div className="order-1 flex w-full min-w-0 flex-col items-center justify-center text-center lg:order-none lg:col-span-11 lg:row-start-1 lg:self-center">
            <h1 className="mb-6 flex flex-col items-center gap-1 sm:gap-0">
              <SplitText
                tag="span"
                text="BUILD YOUR RIG"
                className={heroHeadlineClass}
                delay={50}
                duration={1.25}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
              />
              <SplitText
                tag="span"
                text="WITHOUT COMPROMISE"
                className={heroHeadlineClass}
                delay={50}
                duration={1.25}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
              />
            </h1>

            <div className="mb-4 flex flex-wrap items-center justify-center gap-3 lg:mb-2">
              <GlowingMainLink to="/shop" variant="primary">
                SHOP NOW
              </GlowingMainLink>
              <GlowingMainLink to="/categories" variant="secondary">
                EXPLORE ALL
              </GlowingMainLink>
            </div>
          </div>

          <div className="order-2 w-full min-w-0 lg:order-none lg:col-span-12 lg:row-start-2">
            <div className="relative w-full pb-6 lg:pb-2">
              <HeroPCModel />

              {/* Desktop: vertically centered on the 3D card, to the right — same viewport band as the PC (no scroll) */}
              <div className="hero-right pointer-events-none mt-5 flex justify-end sm:mt-6 lg:absolute lg:right-0 lg:top-1/3 lg:z-20 lg:mt-0 lg:-translate-y-1/2 lg:pl-2 lg:-mr-2 xl:-mr-32">
                <div className="pointer-events-auto w-full max-w-[min(100%,280px)] sm:max-w-[300px] lg:w-[min(34vw,340px)] lg:max-w-none lg:shrink-0 xl:w-[min(32vw,360px)]">
                  <Dialog.Root open={videoOpen} onOpenChange={setVideoOpen}>
                    <Dialog.Trigger asChild>
                      <button
                        type="button"
                        className="group relative aspect-[2.35/1] w-full cursor-pointer overflow-hidden rounded-2xl border-0 bg-transparent p-0 shadow-xl ring-1 ring-black/10 img-zoom outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--vexo-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--vexo-bg)] dark:ring-white/10 max-lg:aspect-video"
                        aria-label="Play hero video on YouTube"
                      >
                        <img
                          src={HERO_YOUTUBE_THUMB}
                          alt=""
                          className="h-full w-full object-cover"
                          width={360}
                          height={153}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-110 sm:h-9 sm:w-9"
                            style={{ backgroundColor: "var(--vexo-play-bg)" }}
                          >
                            <Play
                              className="ml-px h-3.5 w-3.5 sm:h-4 sm:w-4"
                              fill="currentColor"
                              aria-hidden
                              style={{ color: "var(--vexo-play-icon)" }}
                            />
                          </div>
                        </div>
                      </button>
                    </Dialog.Trigger>

                    <Dialog.Portal>
                      <Dialog.Overlay className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[200] bg-black/75 backdrop-blur-[2px]" />
                      <Dialog.Content
                        className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-[201] w-[min(calc(100vw-1.5rem),960px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0a0a0a] p-2 shadow-2xl outline-none duration-200 sm:p-3"
                        onOpenAutoFocus={(e) => e.preventDefault()}
                      >
                        <div className="mb-2 flex items-center justify-between gap-3 px-1 pt-0.5 sm:px-2">
                          <Dialog.Title className="font-ui text-sm font-medium text-white/90">
                            Watch video
                          </Dialog.Title>
                          <Dialog.Close
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                            aria-label="Close video"
                          >
                            <X className="h-5 w-5" strokeWidth={2} />
                          </Dialog.Close>
                        </div>
                        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                          {videoOpen ? (
                            <iframe
                              title="YouTube video player"
                              src={HERO_YOUTUBE_EMBED}
                              className="h-full w-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : null}
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
