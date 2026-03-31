import { useContext } from "react";
import { SiteConfigContext } from "./siteConfigContext.js";

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
}
