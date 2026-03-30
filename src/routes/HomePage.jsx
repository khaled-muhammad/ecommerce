import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../landing/landing.css";
import HeroSection from "../landing/HeroSection.jsx";
import WorkoutShowcase from "../landing/WorkoutShowcase.jsx";
import TopGearSection from "../landing/TopGearSection.jsx";
import LevelUpSection from "../landing/LevelUpSection.jsx";
import ProductGrid from "../landing/ProductGrid.jsx";
import LookbookSection from "../landing/LookbookSection.jsx";
import LaserRevealSection from "../landing/LaserRevealSection.jsx";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.defaults({
        toggleActions: "play none none reverse",
        start: "top 80%",
      });

      const heroTl = gsap.timeline({
        onComplete: () => {
          gsap.set(".hero-btn", { clearProps: "transform" });
        },
      });
      heroTl
        .from(
          ".hero-btn",
          { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" },
          0.15,
        )
        .from(
          ".hero-image",
          {
            opacity: 0,
            duration: 0.9,
            ease: "power2.out",
            /**
             * Fade only — no scale. Scale on this node made the canvas layout drift when
             * `clearProps` removed `transform` (~0.9s), which read as a model “jump”.
             */
            clearProps: "opacity",
          },
          "-=0.6",
        )
        .from(".hero-left", { x: -40, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.5")
        .from(".hero-right", { x: 40, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.4");

      gsap.utils.toArray(".scroll-reveal").forEach((node) => {
        gsap.from(node, {
          y: 60,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: node },
        });
      });

      gsap.utils.toArray(".grid-stagger").forEach((container) => {
        const items = container.querySelectorAll(".grid-item");
        gsap.from(items, {
          y: 40,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: container, start: "top 85%" },
        });
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="landing-home min-h-screen bg-vexo-bg">
      <main>
        <HeroSection />
        <WorkoutShowcase />
        <TopGearSection />
        <LevelUpSection />
        <ProductGrid />
        <LookbookSection />
        <LaserRevealSection />
      </main>
    </div>
  );
}
