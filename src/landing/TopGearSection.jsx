import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CardSwap, { Card } from "../components/CardSwap.jsx";
import { landingImages } from "./imageUrls.js";

gsap.registerPlugin(ScrollTrigger);

export default function TopGearSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const row = section.querySelector(".top-gear-row");
      if (!row) return;
      gsap.from(row, {
        y: 48,
        opacity: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: {
          trigger: row,
          start: "top 85%",
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const gearCards = [
    {
      image: landingImages.gearWinter,
      season: "01 / WORKSTATION 2025",
      title: "HIGH-CORE CPUs AND WORKSTATION-GRADE SILICON.",
      tag: "TOP SELLING PARTS",
      bgPos: "center 40%",
    },
    {
      image: landingImages.gearSummer,
      season: "02 / PLATFORMS",
      title: "MOTHERBOARDS SPECCED FOR STABLE, LONG RUNS.",
      tag: "IN STOCK",
      bgPos: "center",
    },
    {
      image: landingImages.gearFeaturedWide,
      season: "03 / GAMING 2025",
      title: "CASES, AIRFLOW, AND POWER READY TO INSTALL.",
      tag: "NEW BUILDS",
      bgPos: "center 45%",
    },
  ];

  const isMobile = windowWidth < 768;
  const swapWidth = isMobile ? 320 : 520;
  const swapHeight = isMobile ? 340 : 400;

  return (
    <section ref={sectionRef} className="section-bg section-padding">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="top-gear-row flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-14">
          <div className="max-w-xl shrink-0 lg:max-w-[min(100%,26rem)] xl:max-w-md">
            <span className="mb-3 block text-xs font-medium uppercase tracking-wider text-vexo-text-muted">
              FEATURED HARDWARE
            </span>
            <h2 className="text-3xl font-bold leading-[1.08] tracking-tight text-vexo-text lg:text-[42px]">
              PARTS THAT KEEP
              <br />
              YOUR PC RUNNING STRONG
            </h2>
            <p className="mt-6 max-w-[22rem] border-t border-[color:var(--vexo-divider)] pt-6 text-left text-sm leading-relaxed text-vexo-text-secondary">
              From first-time builds to rack deployments, components tested, specced, and ready to ship.
            </p>
          </div>

          <div
            className="top-gear-card-swap relative flex w-full min-w-0 flex-1 items-center justify-center"
            style={{ height: isMobile ? "440px" : "600px", position: "relative" }}
          >
            <CardSwap
              width={swapWidth}
              height={swapHeight}
              cardDistance={60}
              verticalDistance={70}
              delay={5000}
              pauseOnHover={false}
            >
              {gearCards.map((card) => (
                <Card
                  key={card.season}
                  className="top-gear-swap-card !border-[color:var(--vexo-divider)] shadow-xl"
                  style={{
                    backgroundImage: `url(${card.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: card.bgPos,
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-t from-black/78 via-black/25 to-black/10" />
                  <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/80 sm:text-xs">
                      {card.season}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <h3 className="mb-3 max-w-[20rem] text-base font-bold leading-snug text-white sm:mb-4 sm:text-lg lg:max-w-[22rem]">
                      {card.title}
                    </h3>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-3 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="text-[10px] font-medium tracking-wider text-white sm:text-xs">
                        {card.tag}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </section>
  );
}
