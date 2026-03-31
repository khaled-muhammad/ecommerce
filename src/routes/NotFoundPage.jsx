import { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import GlowingMainLink from "../components/GlowingMainLink.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";
import "./not-found-page.css";

const OUTLET_TOP_PAD =
  "pt-[max(7.25rem,calc(env(safe-area-inset-top,0px)+6rem))]";

export default function NotFoundPage() {
  const rootRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(my, [-0.5, 0.5], [9, -9]),
    { stiffness: 140, damping: 24, mass: 0.4 },
  );
  const rotateY = useSpring(
    useTransform(mx, [-0.5, 0.5], [-11, 11]),
    { stiffness: 140, damping: 24, mass: 0.4 },
  );
  const shiftX = useSpring(
    useTransform(mx, [-0.5, 0.5], [-10, 10]),
    { stiffness: 180, damping: 28, mass: 0.35 },
  );
  const shiftY = useSpring(
    useTransform(my, [-0.5, 0.5], [-8, 8]),
    { stiffness: 180, damping: 28, mass: 0.35 },
  );
  const orbitDriftY = useSpring(
    useTransform(my, [-0.5, 0.5], [5, -5]),
    { stiffness: 100, damping: 22, mass: 0.35 },
  );

  const onPointerMove = useCallback(
    (e) => {
      if (reduceMotion || !rootRef.current) return;
      const r = rootRef.current.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      mx.set(Math.max(-0.5, Math.min(0.5, nx)));
      my.set(Math.max(-0.5, Math.min(0.5, ny)));
    },
    [mx, my, reduceMotion],
  );

  const onPointerLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <main
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={`not-found-mind landing-home relative isolate flex min-h-[min(100%,calc(100svh-5rem))] w-full flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-4 pb-20 sm:pb-28 ${OUTLET_TOP_PAD}`}
    >
      <h1 className="sr-only">Page not found, error four oh four</h1>

      <div
        className="not-found-mind__grid pointer-events-none absolute inset-0 z-0"
        aria-hidden
      />
      <div
        className="not-found-mind__vortex pointer-events-none absolute left-1/2 top-[38%] z-0 h-[min(120vw,720px)] w-[min(120vw,720px)] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      />
      <div
        className="not-found-mind__scan pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[42%] z-[1] h-[min(95vw,560px)] w-[min(95vw,560px)] -translate-x-1/2 -translate-y-1/2"
        style={reduceMotion ? undefined : { x: shiftX, y: orbitDriftY }}
        aria-hidden
      >
        <div className="not-found-mind__orbit absolute inset-[8%] rounded-full" />
        <div className="not-found-mind__orbit absolute inset-[18%] rounded-full [animation-delay:-1.3s]" />
        <div className="not-found-mind__orbit absolute inset-[28%] rounded-full [animation-delay:-2.6s]" />
      </motion.div>

      <svg
        className="pointer-events-none absolute bottom-[12%] left-1/2 z-[1] w-[min(200px,45vw)] -translate-x-1/2 opacity-40 dark:opacity-50"
        viewBox="0 0 240 200"
        aria-hidden
      >
        <path
          className="not-found-mind__impossible"
          d="M120 12 L208 168 L32 168 Z M120 32 L88 148 L152 148 Z M120 52 L108 128 L132 128 Z"
        />
        <path
          className="not-found-mind__impossible [animation-direction:reverse]"
          style={{ animationDuration: "28s" }}
          d="M12 100 Q120 20 228 100 Q120 180 12 100"
        />
      </svg>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">

        <motion.div
          className="not-found-mind__404-wrap mb-2"
          style={
            reduceMotion
              ? undefined
              : {
                  rotateX,
                  rotateY,
                  transformPerspective: 1100,
                }
          }
        >
          <div className="not-found-mind__404-stack" aria-hidden>
            <span className="not-found-mind__404-layer not-found-mind__404-layer--magenta">
              404
            </span>
            <span className="not-found-mind__404-layer not-found-mind__404-layer--cyan">
              404
            </span>
            <span className="not-found-mind__404-layer">404</span>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="not-found-mind__card mt-8 w-full max-w-lg rounded-3xl px-7 py-8 sm:px-10 sm:py-10"
        >
          <p className="font-ui text-lg font-medium leading-snug text-[color:var(--vexo-text)] sm:text-xl">
            You opened a door the building forgot to build.
          </p>
          <p className="mt-4 font-ui text-sm leading-relaxed text-[color:var(--vexo-text-secondary)] sm:text-base">
            This URL isn’t on any floor plan. Maybe a typo, maybe a page that moved. Pick a wormhole below and
            we’ll pretend this never happened.
          </p>

          <div className="mt-9 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <GlowingMainLink to="/" variant="primary" className="w-full sm:w-auto">
              Snap back to home
            </GlowingMainLink>
            <Link
              to="/shop"
              className="font-ui text-center text-sm font-semibold text-[color:var(--vexo-text-secondary)] underline decoration-[color:var(--vexo-divider)] underline-offset-[6px] transition-colors hover:text-[color:var(--vexo-text)] sm:px-5"
            >
              Go to shop
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
