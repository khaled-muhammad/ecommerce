import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../lib/apiUrl.js";
import { SiteConfigContext } from "./siteConfigContext.js";

export default function SiteConfigProvider({ children }) {
  const [social, setSocial] = useState({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/site/config"));
      if (!res.ok) throw new Error("config");
      const data = await res.json();
      setSocial(data?.social && typeof data.social === "object" ? data.social : {});
    } catch {
      setSocial({});
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      social,
      loaded,
      refresh,
    }),
    [social, loaded, refresh],
  );

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}
