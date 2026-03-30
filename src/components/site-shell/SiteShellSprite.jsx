/** Inline SVG defs for <use href="#…"> — safe-area + nav corner shapes. */

export default function SiteShellSprite() {
  return (
    <div className="svg-sprite-defs" aria-hidden>
      <svg viewBox="0 0 52 52" id="def-safe-corner">
        <path
          fill="var(--paper, #fff)"
          d="M 0 12 L 16 12 C 16 25.255 26.745 36 40 36 L 40 52 L 0 52 Z"
        />
      </svg>
      <svg viewBox="0 0 26 42" id="def-nav-corner-l">
        <path
          fill="var(--paper, #fff)"
          d="M 26 42 L 0 42 L 0 0 C 0 14.359 11.641 26 26 26 Z"
        />
      </svg>
      <svg viewBox="0 0 43 26" id="def-nav-corner-r">
        <path
          fill="var(--paper, #fff)"
          d="M 0.5 0 L 16.5 0 C 16.5 14.359 28.141 26 42.5 26 L 0.5 26 Z"
        />
      </svg>
    </div>
  );
}
