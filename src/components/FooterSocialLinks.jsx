import { SocialIcon } from "react-social-icons";
import { useSiteConfig } from "../context/useSiteConfig.js";
import { useTheme } from "../theme/useTheme.js";

const ITEMS = [
  { key: "twitter", label: "X (Twitter)" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "github", label: "GitHub" },
  { key: "discord", label: "Discord" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
];

export default function FooterSocialLinks({ className = "" }) {
  const { theme } = useTheme();
  const { social, loaded } = useSiteConfig();
  const isDark = theme === "dark";

  /** Muted pills that match the footer; icon glyphs read clearly on top */
  const bgColor = isDark ? "#3a4a52" : "#d5dde2";
  const fgColor = isDark ? "#e8f0ec" : "#0e220e";

  const entries = ITEMS.filter(({ key }) => {
    const u = social[key];
    return typeof u === "string" && u.trim().length > 0;
  });

  if (!loaded || entries.length === 0) return null;

  return (
    <div className={["site-footer__social", className].filter(Boolean).join(" ")}>
      <p className="site-footer__social-label">Follow us</p>
      <ul className="site-footer__social-list" role="list">
        {entries.map(({ key, label }) => (
          <li key={key} className="site-footer__social-item">
            <SocialIcon
              url={social[key]}
              bgColor={bgColor}
              fgColor={fgColor}
              label={label}
              className="site-footer__social-icon"
              style={{ width: 44, height: 44 }}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
