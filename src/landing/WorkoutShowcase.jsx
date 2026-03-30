import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { landingImages } from "./imageUrls.js";

gsap.registerPlugin(ScrollTrigger);

export default function WorkoutShowcase() {
  const sectionRef = useRef(null);
  const watermarkRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const watermark = watermarkRef.current;
      if (watermark) {
        gsap.to(watermark, {
          x: "-10%",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      const images = section.querySelectorAll(".workout-image");
      images.forEach((img, index) => {
        gsap.from(img, {
          y: 60,
          opacity: 0,
          scale: 0.95,
          duration: 0.8,
          delay: index * 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: img,
            start: "top 85%",
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const workoutImages = landingImages.workout.map((src, i) => ({
    src,
    alt: `Hardware and workspace ${i + 1}`,
  }));

  return (
    <section ref={sectionRef} className="section-bg relative overflow-hidden py-20 lg:py-32">
      <div className="pointer-events-none absolute left-0 top-1/2 w-[200%] -translate-y-1/2 select-none">
        <div ref={watermarkRef}>
          <span className="watermark-text font-black italic">hardware</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="scroll-reveal lg:col-span-2">
            <p className="text-sm leading-relaxed text-vexo-text-secondary">
              CPUs, boards, memory, and storage, curated for stable clocks and clean cable runs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 lg:col-span-8 lg:gap-6">
            <div className="workout-image col-span-1">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg img-zoom">
                <img src={workoutImages[0].src} alt={workoutImages[0].alt} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="workout-image col-span-1 -mt-8">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl img-zoom">
                <img src={workoutImages[1].src} alt={workoutImages[1].alt} className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="workout-image col-span-1 mt-8">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-lg img-zoom">
                <img src={workoutImages[2].src} alt={workoutImages[2].alt} className="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <div className="scroll-reveal lg:col-span-2 lg:text-right">
            <p className="text-sm leading-relaxed text-vexo-text-secondary">
              Cases, cooling, and power that scale from compact SFF towers to full liquid workstations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
