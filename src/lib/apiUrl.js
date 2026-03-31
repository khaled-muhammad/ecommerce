/** `VITE_API_BASE_URL` for cross-origin API; empty = same origin (Vite proxies `/api`). */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || String(raw).trim() === '') return '';
  return String(raw).replace(/\/$/, '');
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}
