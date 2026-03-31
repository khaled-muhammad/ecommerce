import GlassSurface from "../components/GlassSurface.jsx";
import { useMobileShell, usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

export default function AuthGlassSurface(props) {
  const mobile = useMobileShell();
  const reduceMotion = usePrefersReducedMotion();
  return <GlassSurface {...props} performant={mobile || reduceMotion} />;
}
