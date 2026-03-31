import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { landingImages } from "./imageUrls.js";

gsap.registerPlugin(ScrollTrigger);

const sideLeftStyle = {
  transform: "perspective(1200px) rotateY(16deg) scale(0.9) translateZ(-24px)",
  transformOrigin: "100% 50%",
};

const sideRightStyle = {
  transform: "perspective(1200px) rotateY(-16deg) scale(0.9) translateZ(-24px)",
  transformOrigin: "0% 50%",
};

export default function LevelUpSection() {
  const sectionRef = useRef(null);
  const watermarkRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const watermark = watermarkRef.current;
      if (watermark) {
        gsap.to(watermark, {
          x: "5%",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      const stack = section.querySelector(".levelup-stack");
      const card = stack?.querySelector(".levelup-card");
      const sides = stack?.querySelectorAll(".levelup-card-side") ?? [];
      const texts = card?.querySelectorAll(".levelup-text") ?? [];

      if (stack && card && texts.length) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stack,
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        });

        if (sides.length) {
          tl.from([...sides], {
            opacity: 0,
            scale: 0.88,
            duration: 0.55,
            stagger: 0.06,
            ease: "power2.out",
          });
        }

        tl.from(
          card,
          {
            scale: 0.94,
            opacity: 0,
            duration: 0.7,
            ease: "power2.out",
          },
          sides.length ? "-=0.32" : "+=0",
        ).from(
          texts,
          {
            y: 16,
            opacity: 0,
            duration: 0.42,
            stagger: 0.07,
            ease: "power2.out",
          },
          "-=0.38",
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-bg relative overflow-hidden py-20 lg:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 w-[200%] -translate-y-1/2 select-none">
        <div ref={watermarkRef} className="whitespace-nowrap" style={{ marginLeft: "-20%" }}>
          <span className="watermark-text font-black">NEW GEAR FOR YOUR NEXT BUILD</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div
          className="levelup-stack flex items-center justify-center min-[900px]:[perspective:1400px]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="levelup-card-side pointer-events-none relative z-0 hidden min-[900px]:block min-[900px]:-mr-[clamp(4.25rem,12vw,7.5rem)] min-[900px]:w-[min(34vw,340px)] min-[900px]:shrink-0">
            <div className="will-change-transform" style={sideLeftStyle}>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-xl [box-shadow:0_22px_44px_-14px_rgb(0_0_0/0.48)]">
                <img
                  src={landingImages.levelUpLeft}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25" />
              </div>
            </div>
          </div>

          <div className="levelup-card relative z-20 aspect-[3/4] w-full max-w-[450px] shrink-0 overflow-hidden rounded-3xl shadow-2xl">
            <img src={landingImages.levelUp} alt="" className="h-full w-full object-cover" />

            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30" />

            <div className="absolute left-0 right-0 top-8 text-center">
              <span className="levelup-text mb-2 block text-sm font-medium tracking-[0.2em] text-white/80">ROXY</span>
              <span className="levelup-text mb-4 block text-xs font-medium tracking-wider text-white/60">UPGRADE</span>
              <h3 className="levelup-text px-8 text-xl font-bold leading-tight text-white lg:text-2xl">
                WITH THE LATEST
                <br />
                PC HARDWARE
              </h3>
            </div>
          </div>

          <div className="levelup-card-side pointer-events-none relative z-0 hidden min-[900px]:block min-[900px]:-ml-[clamp(4.25rem,12vw,7.5rem)] min-[900px]:w-[min(34vw,340px)] min-[900px]:shrink-0">
            <div className="will-change-transform" style={sideRightStyle}>
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-xl [box-shadow:0_22px_44px_-14px_rgb(0_0_0/0.48)]">
                <img
                  src={landingImages.levelUpRight}
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/25" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
