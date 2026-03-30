import { useLayoutEffect, useRef } from "react";

/**
 * HomePage GSAP fades `.hero-image`; clear any stray inline transform/opacity on mount
 * so the canvas measures a neutral box (e.g. after fast navigation remounts).
 */
export default function HeroImageShell({ children }) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    el.style.removeProperty("transform");
    el.style.removeProperty("opacity");
  }, []);

  return (
    <div ref={rootRef} className="hero-image relative mx-auto mt-4 w-full lg:mt-0">
      {children}
    </div>
  );
}
