import { Link } from "react-router-dom";
import { BadgeCheck, Cpu, HeartHandshake } from "lucide-react";
import AuthGlassSurface from "./AuthGlassSurface.jsx";
import AuthPageShell, { AUTH_FORM_GLASS_PROPS } from "./AuthPageShell.jsx";
import BorderGlow from "../components/BorderGlow.jsx";
import FooterSocialLinks from "../components/FooterSocialLinks.jsx";
import GlowingMainLink from "../components/GlowingMainLink.jsx";
import SplitText from "../components/SplitText.jsx";
import { usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

const PILLARS = [
  {
    Icon: Cpu,
    title: "Specs you can trust",
    body: "Every listing is built around real attributes (wattage, sockets, form factors, and more) so you compare apples to apples, not marketing fluff.",
  },
  {
    Icon: BadgeCheck,
    title: "Curated, not chaotic",
    body: "We focus on parts and prebuilds we would use ourselves: clear compatibility, honest stock, and no mystery bundles.",
  },
  {
    Icon: HeartHandshake,
    title: "Here for your build",
    body: "Whether you are upgrading one component or planning a full rig, Roxy is built to help you decide faster and check out with confidence.",
  },
];

export default function AboutPage() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <AuthPageShell scrollable>
      <div className="mx-auto flex w-full max-w-[920px] flex-col gap-8 sm:gap-10">
        <header className="px-1 text-center">
          {reduceMotion ? (
            <h1 className="font-ui text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-[color:var(--vexo-text)]">
              Built for people who actually open the case
            </h1>
          ) : (
            <SplitText
              tag="h1"
              text="Built for people who actually open the case"
              splitType="words"
              delay={55}
              duration={0.85}
              ease="power3.out"
              from={{ opacity: 0, y: 28 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.25}
              rootMargin="-40px"
              className="font-ui text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-[color:var(--vexo-text)] max-w-[22ch] !inline-block"
              textAlign="center"
            />
          )}
          <p className="mx-auto mt-5 max-w-xl font-ui text-base leading-relaxed text-[color:var(--vexo-text-secondary)] sm:text-[17px]">
            Roxy is a demo storefront for genuine PC parts and builds, designed for clarity, speed, and a shopping experience that respects your time.
          </p>
        </header>

        <AuthGlassSurface
          {...AUTH_FORM_GLASS_PROPS}
          borderRadius={26}
          width="100%"
          height="auto"
          borderWidth={0.065}
          className="glass-surface--soft-inset w-full [&_.glass-surface__content]:!items-stretch [&_.glass-surface__content]:!justify-start [&_.glass-surface__content]:!p-0"
        >
          <div className="flex w-full flex-col gap-10 p-7 sm:p-10">
            <div className="space-y-4">
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--vexo-text-muted)]">Our story</p>
              <h2 className="font-ui text-2xl font-bold tracking-tight text-[color:var(--vexo-text)] sm:text-[1.65rem]">Why Roxy exists</h2>
              <div className="space-y-4 font-ui text-[15px] leading-[1.7] text-[color:var(--vexo-text-secondary)]">
                <p>
                  Shopping for hardware online too often means digging through vague listings, missing specs, and guesswork at checkout. We wanted the
                  opposite: a calm, focused place where the product is the hero and the details are easy to find.
                </p>
                <p>
                  From CPUs and GPUs to cases, cooling, and full systems, Roxy is structured so you can move from browse to cart without friction, with
                  imagery, pricing, and inventory presented honestly.
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-[color:color-mix(in_srgb,var(--vexo-text)_10%,transparent)]" aria-hidden />

            <div>
              <p className="mb-6 font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--vexo-text-muted)]">What we care about</p>
              <ul className="grid gap-5 sm:grid-cols-3 sm:gap-6">
                {PILLARS.map(({ Icon, title, body }) => (
                  <li
                    key={title}
                    className="rounded-2xl border border-[color:color-mix(in_srgb,var(--vexo-text)_12%,transparent)] bg-[color:color-mix(in_srgb,var(--vexo-card)_55%,transparent)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.45)_inset] dark:bg-[color:color-mix(in_srgb,var(--vexo-card)_35%,transparent)] dark:shadow-none"
                  >
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--vexo-text)_8%,transparent)] text-[color:var(--vexo-text)]">
                      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </span>
                    <h3 className="font-ui text-base font-semibold tracking-tight text-[color:var(--vexo-text)]">{title}</h3>
                    <p className="mt-2 font-ui text-sm leading-relaxed text-[color:var(--vexo-text-secondary)]">{body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </AuthGlassSurface>

        <BorderGlow
          className="w-full"
          backgroundColor="var(--vexo-card)"
          borderRadius={26}
          glowColor="172 42% 48%"
          glowRadius={36}
          glowIntensity={0.75}
          edgeSensitivity={26}
          coneSpread={22}
          animated={!reduceMotion}
          colors={["#5eead4", "#7dd3fc", "#c4b5fd"]}
          fillOpacity={0.42}
        >
          <div className="px-7 py-8 sm:px-10 sm:py-9">
            <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--vexo-text-muted)]">Promise</p>
            <p className="mt-3 max-w-2xl font-ui text-lg font-semibold leading-snug tracking-tight text-[color:var(--vexo-text)] sm:text-xl">
              We treat your build like our own: clear listings, respectful UX, and a path from discovery to delivery that feels intentional.
            </p>
            <p className="mt-4 max-w-2xl font-ui text-sm leading-relaxed text-[color:var(--vexo-text-secondary)]">
              Roxy is a demonstration project; values above reflect how we would run a real storefront. Questions?{" "}
              <Link to="/contact" className="font-medium text-[color:var(--vexo-text)] underline-offset-4 hover:underline">
                Say hello
              </Link>
              .
            </p>
          </div>
        </BorderGlow>

        <div className="flex flex-col items-center gap-6 px-1">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <GlowingMainLink to="/shop">Browse the shop</GlowingMainLink>
            <GlowingMainLink to="/contact" variant="secondary">
              Contact us
            </GlowingMainLink>
          </div>
          <div className="mt-2 flex w-full max-w-lg flex-col items-center border-t border-[color:var(--vexo-divider)] pt-8 [&_.site-footer__social-label]:text-center [&_.site-footer__social-list]:justify-center">
            <FooterSocialLinks />
          </div>
        </div>
      </div>
    </AuthPageShell>
  );
}
