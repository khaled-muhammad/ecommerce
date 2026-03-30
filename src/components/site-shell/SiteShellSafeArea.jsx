const cornerWrap = {
  imageRendering: "pixelated",
  flexShrink: 0,
};

const corners = [
  { className: "site-safe-corner-tl", rotate: "-270deg" },
  { className: "site-safe-corner-tr", rotate: "-180deg" },
  { className: "site-safe-corner-bl", rotate: "-360deg" },
  { className: "site-safe-corner-br", rotate: "-90deg" },
];

function SafeCorner({ className, rotate }) {
  return (
    <div className={className} style={{ transform: `rotate(${rotate})` }}>
      <div
        className="site-safe-corner-svg embed-abs"
        style={cornerWrap}
        aria-hidden
      >
        <div
          className="svg-container"
          style={{ width: "100%", height: "100%", aspectRatio: "inherit" }}
        >
          <svg style={{ width: "100%", height: "100%" }}>
            <use href="#def-safe-corner" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function SiteShellSafeArea() {
  return (
    <div className="site-safe-area">
      <div className="site-safe-area-top" />
      <div className="site-safe-area-bottom" />
      <div className="site-safe-area-left" />
      <div className="site-safe-area-right" />
      {corners.map(({ className, rotate }) => (
        <SafeCorner key={className} className={className} rotate={rotate} />
      ))}
    </div>
  );
}
