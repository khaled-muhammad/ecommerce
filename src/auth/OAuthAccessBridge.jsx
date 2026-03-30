import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "./useAuth.js";

/**
 * Google OAuth (and similar) redirects to the SPA with `?access_token=…`.
 * Persist token, strip query, reload session.
 */
export default function OAuthAccessBridge() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { consumeOAuthAccessToken } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const token = searchParams.get("access_token");
    if (!token) return;
    done.current = true;
    const welcome = searchParams.get("google_welcome") === "1";
    const adminSetup = searchParams.get("admin_setup") === "1";
    const next = new URLSearchParams(searchParams);
    next.delete("access_token");
    next.delete("google_welcome");
    next.delete("admin_setup");
    setSearchParams(next, { replace: true });
    void (async () => {
      await consumeOAuthAccessToken(token);
      if (welcome) {
        toast.success("Welcome! Your Google account is set up.");
      }
      if (adminSetup) {
        navigate("/admin/setup", { replace: true });
      }
    })();
  }, [searchParams, setSearchParams, consumeOAuthAccessToken, navigate]);

  return null;
}
