import { useLayoutEffect, useRef } from "react";

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
