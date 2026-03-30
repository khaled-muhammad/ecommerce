import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PixelTransition from "../components/PixelTransition.jsx";
import GlassSurface from "../components/GlassSurface.jsx";
import { landingImages } from "./imageUrls.js";

gsap.registerPlugin(ScrollTrigger);

const lookbookItems = [
  {
    image: landingImages.lookbook[0],
    title: "ATX CASE & 850W PSU",
    date: "IN STOCK · SHIPS 24H",
    season: "WORKSTATION / 2025",
    tags: ["CASE", "POWER"],
  },
  {
    image: landingImages.lookbook[1],
    title: "GPU & PCIE RISER KIT",
    date: "IN STOCK · SHIPS 24H",
    season: "GAMING / 2025",
    tags: ["GPU", "ACCESSORY"],
  },
  {
    image: landingImages.lookbook[2],
    title: "DDR5 KIT & CPU COOLER",
    date: "IN STOCK · SHIPS 24H",
    season: "PERFORMANCE / 2025",
    tags: ["RAM", "COOLING"],
  },
  {
    image: landingImages.lookbook[3],
    title: "NVME SSD & THERMAL PAD",
    date: "IN STOCK · SHIPS 24H",
    season: "STORAGE / 2025",
    tags: ["SSD", "THERMAL"],
  },
];

const slideImgStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const lookbookGlassProps = {
  displace: 0.25,
  distortionScale: -95,
  redOffset: 0,
  greenOffset: 8,
  blueOffset: 14,
  brightness: 78,
  opacity: 0.8,
  mixBlendMode: "normal",
  backgroundOpacity: 0.38,
  saturation: 1.06,
  blur: 9,
};

export default function LookbookSection() {
  const n = lookbookItems.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const sectionRef = useRef(null);
  const cardRef = useRef(null);
  const pixelRef = useRef(null);

  const currentItem = lookbookItems[currentIndex];
  const nextItem = lookbookItems[(currentIndex + 1) % n];

  const handleRevealComplete = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % n);
    requestAnimationFrame(() => pixelRef.current?.reset());
  }, [n]);

  useEffect(() => {
    const section = sectionRef.current;
    const card = cardRef.current;
    if (!section || !card) return;

    const ctx = gsap.context(() => {
      gsap.from(card, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      pixelRef.current?.playForward();
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const goToSlide = (index) => {
    pixelRef.current?.reset();
    setCurrentIndex(index);
  };

  const marqueeStrip = (suffix) =>
    [0, 1, 2, 3].map((i) => (
      <span
        key={`${suffix}-${i}`}
        className="watermark-text mx-8 font-black"
        style={{ fontSize: "clamp(60px, 12vw, 140px)" }}
      >
        GREAT HARDWARE GREAT BUILDS
      </span>
    ));

  return (
    <section ref={sectionRef} className="section-bg relative overflow-hidden py-20 lg:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 w-full -translate-y-1/2 overflow-hidden">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          <div className="flex shrink-0">{marqueeStrip("a")}</div>
          <div className="flex shrink-0" aria-hidden>
            {marqueeStrip("b")}
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <div
            ref={cardRef}
            className="relative aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-3xl bg-neutral-700 shadow-2xl"
          >
            <PixelTransition
              ref={pixelRef}
              fillParent
              interactive={false}
              gridSize={8}
              pixelColor="#ffffff"
              animationStepDuration={0.4}
              once={false}
              className="!absolute inset-0 !w-full !max-w-none rounded-3xl !border-0 !shadow-none"
              style={{ position: "absolute", inset: 0 }}
              onRevealComplete={handleRevealComplete}
              firstContent={
                <img src={currentItem.image} alt="" style={slideImgStyle} width={800} height={1067} />
              }
              secondContent={
                <img src={nextItem.image} alt="" style={slideImgStyle} width={800} height={1067} />
              }
            />

            <div
              className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-b from-black/55 via-black/15 to-black/65"
              aria-hidden
            />

            <div className="pointer-events-none absolute left-6 right-6 top-6 z-[5] flex items-start justify-between gap-2">
              <GlassSurface
                {...lookbookGlassProps}
                borderRadius={18}
                width="max-content"
                height="auto"
                className="pointer-events-none max-w-[min(100%,14rem)] shrink !justify-start sm:max-w-[min(100%,18rem)]"
                style={{ minHeight: 0 }}
              >
                <p className="w-full px-1 py-0.5 text-left text-[10px] font-bold uppercase leading-snug tracking-wider text-white">
                  {currentItem.title}
                </p>
              </GlassSurface>
              <GlassSurface
                {...lookbookGlassProps}
                borderRadius={18}
                width="max-content"
                height="auto"
                className="pointer-events-none shrink-0 !justify-end"
              >
                <p className="px-2 py-1 text-right text-[10px] font-bold tracking-wider text-white">
                  {currentItem.date}
                </p>
              </GlassSurface>
            </div>

            <div className="pointer-events-none absolute bottom-6 left-6 right-6 z-[5] flex items-end justify-between gap-2">
              <GlassSurface
                {...lookbookGlassProps}
                borderRadius={18}
                width="max-content"
                height="auto"
                className="pointer-events-none shrink-0 !justify-start"
              >
                <p className="px-2 py-1 text-left text-[10px] font-bold tracking-wider text-white">
                  {currentItem.season}
                </p>
              </GlassSurface>
              <GlassSurface
                {...lookbookGlassProps}
                borderRadius={18}
                width="max-content"
                height="auto"
                className="pointer-events-none !justify-end"
              >
                <div className="flex items-center gap-2 px-2 py-1">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-white" />
                  <p className="text-[10px] font-bold tracking-wider text-white">{currentItem.tags.join(" ")}</p>
                </div>
              </GlassSurface>
            </div>

            <div className="absolute bottom-6 left-1/2 z-[5] flex -translate-x-1/2 gap-2">
              {lookbookItems.map((_, index) => (
                <button
                  key={lookbookItems[index].title}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? "w-4 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
