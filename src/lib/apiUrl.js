/**
 * API origin for fetch(). Empty string = same origin (Vite dev server proxies `/api` → backend).
 * Production: set `VITE_API_BASE_URL=https://api.yourdomain.com` if the API is on another host.
 */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || String(raw).trim() === '') return '';
  return String(raw).replace(/\/$/, '');
}

/** @param {string} path e.g. `/api/v1/auth/login` */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}
