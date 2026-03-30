/**
 * Preferred spec fields per category slug (matches seeded catalog categories).
 * Stored in DB as flat { [key]: value } — keys are the labels shoppers see on the product page.
 */

/** @typedef {{ key: string; label: string; placeholder?: string }} SpecFieldDef */

/** @type {Record<string, { title: string; fields: SpecFieldDef[] }>} */
export const CATEGORY_SPEC_BLUEPRINTS = {
  cases: {
    title: "PC case",
    fields: [
      { key: "Form", label: "Form factor", placeholder: "e.g. Mid-tower ATX" },
      { key: "Fans", label: "Fan support", placeholder: "e.g. Up to 6x 120mm" },
      { key: "Radiator", label: "Radiator support", placeholder: "e.g. 360mm top/front" },
      { key: "GPU", label: "GPU max length", placeholder: "e.g. 400mm max" },
      { key: "CPU cooler", label: "CPU cooler clearance", placeholder: "e.g. 170mm" },
      { key: "PSU", label: "PSU support", placeholder: "e.g. ATX, bottom mount" },
    ],
  },
  cpus: {
    title: "Processor",
    fields: [
      { key: "Cores", label: "Cores", placeholder: "8" },
      { key: "Threads", label: "Threads", placeholder: "16" },
      { key: "Socket", label: "Socket", placeholder: "AM5" },
      { key: "Base/boost", label: "Clock speeds", placeholder: "4.2 / 5.0 GHz" },
      { key: "TDP", label: "TDP", placeholder: "120W" },
      { key: "Architecture", label: "Architecture", placeholder: "Zen 4" },
    ],
  },
  gpus: {
    title: "Graphics card",
    fields: [
      { key: "VRAM", label: "VRAM", placeholder: "24 GB GDDR6X" },
      { key: "CUDA", label: "CUDA cores", placeholder: "16384" },
      { key: "Boost", label: "Boost clock", placeholder: "2520 MHz" },
      { key: "TDP", label: "TDP", placeholder: "450W" },
      { key: "Interface", label: "Interface", placeholder: "PCIe 4.0 x16" },
    ],
  },
  motherboards: {
    title: "Motherboard",
    fields: [
      { key: "Socket", label: "Socket", placeholder: "AM5" },
      { key: "Chipset", label: "Chipset", placeholder: "B650E" },
      { key: "Form", label: "Form factor", placeholder: "ATX" },
      { key: "Memory", label: "Memory", placeholder: "DDR5 up to 6400" },
      { key: "PCIe", label: "PCIe slots", placeholder: "2x PCIe 5.0 x16" },
    ],
  },
  ram: {
    title: "Memory",
    fields: [
      { key: "Capacity", label: "Capacity", placeholder: "32 GB (2×16)" },
      { key: "Speed", label: "Speed", placeholder: "DDR5-6000" },
      { key: "Latency", label: "Latency", placeholder: "CL30" },
      { key: "Voltage", label: "Voltage", placeholder: "1.35V" },
      { key: "Type", label: "Type", placeholder: "DDR5" },
    ],
  },
  storage: {
    title: "Storage",
    fields: [
      { key: "Capacity", label: "Capacity", placeholder: "2 TB" },
      { key: "Interface", label: "Interface", placeholder: "PCIe 4.0 x4 NVMe" },
      { key: "Read", label: "Read speed", placeholder: "7450 MB/s" },
      { key: "Write", label: "Write speed", placeholder: "6900 MB/s" },
      { key: "Form factor", label: "Form factor", placeholder: "M.2 2280" },
    ],
  },
  psu: {
    title: "Power supply",
    fields: [
      { key: "Wattage", label: "Wattage", placeholder: "1000W" },
      { key: "Efficiency", label: "Efficiency", placeholder: "80+ Gold" },
      { key: "Modular", label: "Modular", placeholder: "Fully modular" },
      { key: "Warranty", label: "Warranty", placeholder: "10 years" },
    ],
  },
  cooling: {
    title: "Cooling",
    fields: [
      { key: "Type", label: "Type", placeholder: "Dual-tower air" },
      { key: "TDP", label: "Rated TDP", placeholder: "250W" },
      { key: "Fans", label: "Fans", placeholder: "2× NF-A15" },
      { key: "Noise", label: "Noise", placeholder: "24.6 dB(A)" },
      { key: "Socket", label: "Socket support", placeholder: "AM5, LGA1700…" },
    ],
  },
  peripherals: {
    title: "Peripheral",
    fields: [
      { key: "Type", label: "Type", placeholder: "Mechanical keyboard" },
      { key: "Connectivity", label: "Connectivity", placeholder: "USB-C, 2.4 GHz" },
      { key: "Features", label: "Features", placeholder: "RGB, hot-swap" },
    ],
  },
};

const EMPTY_BLUEPRINT = { title: "Product", fields: [] };

/**
 * @param {string | undefined} categorySlug
 */
export function getCategorySpecBlueprint(categorySlug) {
  if (!categorySlug) return EMPTY_BLUEPRINT;
  return CATEGORY_SPEC_BLUEPRINTS[categorySlug] ?? EMPTY_BLUEPRINT;
}

/**
 * Split stored specs into blueprint field values + extra rows (unknown keys).
 * @param {Record<string, string> | null | undefined} specs
 * @param {string | undefined} categorySlug
 */
export function specsToFormParts(specs, categorySlug) {
  const { fields } = getCategorySpecBlueprint(categorySlug);
  const schemaKeys = new Set(fields.map((f) => f.key));
  /** @type {Record<string, string>} */
  const schemaValues = {};
  for (const f of fields) schemaValues[f.key] = "";

  /** @type {{ id: string; label: string; value: string }[]} */
  const customRows = [];

  if (specs && typeof specs === "object" && !Array.isArray(specs)) {
    for (const [k, v] of Object.entries(specs)) {
      const str = v == null ? "" : String(v);
      if (schemaKeys.has(k)) schemaValues[k] = str;
      else if (k.trim()) {
        customRows.push({
          id: `${k}-${Math.random().toString(36).slice(2, 9)}`,
          label: k,
          value: str,
        });
      }
    }
  }

  return { schemaValues, customRows };
}

/**
 * @param {Record<string, string>} schemaValues
 * @param {{ label: string; value: string }[]} customRows
 * @param {string | undefined} categorySlug
 */
export function formPartsToSpecs(schemaValues, customRows, categorySlug) {
  const { fields } = getCategorySpecBlueprint(categorySlug);
  /** @type {Record<string, string>} */
  const out = {};
  for (const f of fields) {
    const val = (schemaValues[f.key] ?? "").trim();
    if (val) out[f.key] = val;
  }
  for (const row of customRows) {
    const lab = (row.label ?? "").trim();
    const val = (row.value ?? "").trim();
    if (lab && val) out[lab] = val;
  }
  return Object.keys(out).length > 0 ? out : null;
}
