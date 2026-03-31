import { useSyncExternalStore } from "react";

function subscribe(query, callback) {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(query) {
  return window.matchMedia(query).matches;
}

function getServerSnapshot() {
  return false;
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => subscribe(query, cb),
    () => getSnapshot(query),
    getServerSnapshot,
  );
}

export function useMobileShell() {
  return useMediaQuery("(max-width: 809.98px)");
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
