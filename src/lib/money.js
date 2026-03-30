const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** @param {number} cents */
export function formatUsd(cents) {
  if (typeof cents !== "number" || Number.isNaN(cents)) return usd.format(0);
  return usd.format(cents / 100);
}

/** Parse user dollars string to integer cents, or null if invalid */
export function parseUsdToCents(value) {
  const s = String(value).trim().replace(/[$,]/g, "");
  if (s === "") return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}
