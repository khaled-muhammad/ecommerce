/** Demo catalog (USD cents). Replace with API in production. */

import { CATEGORIES } from "./categories.js";

const I = {
  cpu: "https://images.unsplash.com/photo-1555689868-c00f5adf9b59?w=800&auto=format&fit=crop&q=80",
  gpu: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80",
  mb: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop&q=80",
  ram: "https://images.unsplash.com/photo-1562976540-1502c2145185?w=800&auto=format&fit=crop&q=80",
  ssd: "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=800&auto=format&fit=crop&q=80",
  psu: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&auto=format&fit=crop&q=80",
  case: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
  cool: "https://images.unsplash.com/photo-1624706306573-3cf34d9e3f93?w=800&auto=format&fit=crop&q=80",
  desk: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
};

/** @typedef {{
 *   id: string,
 *   slug: string,
 *   name: string,
 *   categoryId: string,
 *   brand: string,
 *   priceCents: number,
 *   compareAtCents?: number,
 *   shortDescription: string,
 *   description: string,
 *   specs: Record<string, string>,
 *   stock: number,
 *   image: string,
 *   images?: string[],
 *   badge?: string,
 *   featuredRank: number,
 * }} ShopProduct */

/** @type {ShopProduct[]} */
export const PRODUCTS = [
  {
    id: "p-101",
    slug: "amd-ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    categoryId: "cpus",
    brand: "AMD",
    priceCents: 38499,
    compareAtCents: 42999,
    shortDescription: "8C/16T gaming CPU with 3D V-Cache - top pick for high-FPS titles.",
    description:
      "Zen 4 architecture with stacked L3 for exceptional frame times in CPU-bound games. Efficient under load and drop-in compatible with AM5 boards and DDR5 memory.",
    specs: {
      Cores: "8",
      Threads: "16",
      Socket: "AM5",
      "Base / boost": "4.2 / 5.0 GHz",
      TDP: "120W",
    },
    stock: 22,
    image: I.cpu,
    images: [I.cpu, I.desk],
    badge: "Best seller",
    featuredRank: 1,
  },
  {
    id: "p-102",
    slug: "intel-core-i7-14700k",
    name: "Intel Core i7-14700K",
    categoryId: "cpus",
    brand: "Intel",
    priceCents: 34999,
    shortDescription: "Hybrid architecture - strong all-rounder for work and play.",
    description:
      "Performance and Efficient cores give you flexibility for streaming, compiling, and gaming. Pair with a Z790 board and quality cooling for best results.",
    specs: {
      Cores: "20 (8P + 12E)",
      Threads: "28",
      Socket: "LGA1700",
      "P-core boost": "up to 5.6 GHz",
      TDP: "125W",
    },
    stock: 18,
    image: I.cpu,
    featuredRank: 5,
  },
  {
    id: "p-103",
    slug: "amd-ryzen-5-7600",
    name: "AMD Ryzen 5 7600",
    categoryId: "cpus",
    brand: "AMD",
    priceCents: 19999,
    shortDescription: "Solid AM5 entry - great for 1080p/1440p builds on a budget.",
    description:
      "Six fast Zen 4 cores with integrated RDNA 2 graphics for troubleshooting or light use without a discrete GPU.",
    specs: { Cores: "6", Threads: "12", Socket: "AM5", "Max boost": "5.1 GHz", TDP: "65W" },
    stock: 40,
    image: I.cpu,
    featuredRank: 12,
  },
  {
    id: "p-201",
    slug: "nvidia-rtx-5070-12gb",
    name: "NVIDIA GeForce RTX 5070 12GB",
    categoryId: "gpus",
    brand: "NVIDIA",
    priceCents: 54999,
    compareAtCents: 59999,
    shortDescription: "Ray tracing and DLSS for smooth 1440p with headroom.",
    description:
      "Blackwell-class efficiency with 12GB VRAM for modern titles. Ideal for high-refresh QHD monitors and content creation workloads.",
    specs: {
      VRAM: "12GB GDDR7",
      "Bus width": "192-bit",
      Outputs: "3× DisplayPort 2.1, 1× HDMI 2.1",
      Power: "220W (board partner may vary)",
    },
    stock: 9,
    image: I.gpu,
    badge: "New",
    featuredRank: 2,
  },
  {
    id: "p-202",
    slug: "amd-radeon-rx-9070-xt",
    name: "AMD Radeon RX 9070 XT",
    categoryId: "gpus",
    brand: "AMD",
    priceCents: 52999,
    shortDescription: "Competitive raster performance and strong 1440p value.",
    description:
      "RDNA 4 features with FSR support. Excellent choice for builders who want high bandwidth and display flexibility.",
    specs: { VRAM: "16GB", Outputs: "2× DP 2.1, 1× HDMI 2.1", Power: "~304W" },
    stock: 11,
    image: I.gpu,
    featuredRank: 6,
  },
  {
    id: "p-203",
    slug: "nvidia-rtx-5060-ti-8gb",
    name: "NVIDIA GeForce RTX 5060 Ti 8GB",
    categoryId: "gpus",
    brand: "NVIDIA",
    priceCents: 37999,
    shortDescription: "Efficient 1080p/1440p card for compact cases.",
    description: "Lower power draw with full RTX feature set - great for SFF and first-time builders.",
    specs: { VRAM: "8GB", Power: "~180W", Slot: "Dual-slot" },
    stock: 25,
    image: I.gpu,
    featuredRank: 15,
  },
  {
    id: "p-301",
    slug: "asus-rog-strix-b650e-f",
    name: "ASUS ROG Strix B650E-F Gaming WiFi",
    categoryId: "motherboards",
    brand: "ASUS",
    priceCents: 25999,
    shortDescription: "AM5 ATX with PCIe 5.0 M.2, WiFi 6E, and robust VRM.",
    description:
      "Premium power delivery and cooling for Ryzen 7000/9000. BIOS flashback, Q-LED, and polished ROG software stack.",
    specs: { Socket: "AM5", "Form factor": "ATX", Memory: "DDR5 (max 128GB)", "M.2": "3× (1× PCIe 5.0)" },
    stock: 14,
    image: I.mb,
    featuredRank: 8,
  },
  {
    id: "p-302",
    slug: "msi-pro-z790-p-wifi",
    name: "MSI PRO Z790-P WiFi",
    categoryId: "motherboards",
    brand: "MSI",
    priceCents: 18999,
    shortDescription: "Intel 12th–14th Gen ATX board with DDR5 and WiFi.",
    description: "Stable PRO series layout, plenty of USB, and dual PCIe 4.0 M.2 slots for fast storage.",
    specs: { Socket: "LGA1700", "Form factor": "ATX", Memory: "DDR5", WiFi: "WiFi 6E" },
    stock: 20,
    image: I.mb,
    featuredRank: 18,
  },
  {
    id: "p-303",
    slug: "gigabyte-b650m-aorus-elite",
    name: "Gigabyte B650M AORUS Elite",
    categoryId: "motherboards",
    brand: "Gigabyte",
    priceCents: 15999,
    shortDescription: "Micro-ATX AM5 - compact without cutting essentials.",
    description: "Strong VRM for 8-core CPUs, PCIe 4.0 GPU slot, and dual M.2 for NVMe builds.",
    specs: { Socket: "AM5", "Form factor": "Micro-ATX", Memory: "DDR5" },
    stock: 30,
    image: I.mb,
    featuredRank: 22,
  },
  {
    id: "p-401",
    slug: "gskill-trident-z5-ddr5-32gb-6000",
    name: "G.Skill Trident Z5 RGB DDR5-6000 32GB (2×16GB)",
    categoryId: "ram",
    brand: "G.Skill",
    priceCents: 11499,
    shortDescription: "CL30 kit tuned for AMD EXPO / Intel XMP 3.0.",
    description: "Low-latency DDR5 with aluminum heatspreaders and diffused RGB. Ideal for AM5 gaming rigs.",
    specs: { Capacity: "32GB (2×16GB)", Speed: "6000 MT/s", Timings: "CL30-40-40", Voltage: "1.35V" },
    stock: 45,
    image: I.ram,
    badge: "Popular",
    featuredRank: 4,
  },
  {
    id: "p-402",
    slug: "corsair-vengeance-ddr5-64gb-5600",
    name: "Corsair Vengeance DDR5-5600 64GB (2×32GB)",
    categoryId: "ram",
    brand: "Corsair",
    priceCents: 17999,
    shortDescription: "High-capacity kit for creators and heavy multitasking.",
    description: "Reliable Vengeance line with black heatspreaders - great for workstations and RAM-hungry builds.",
    specs: { Capacity: "64GB (2×32GB)", Speed: "5600 MT/s", Voltage: "1.25V" },
    stock: 16,
    image: I.ram,
    featuredRank: 20,
  },
  {
    id: "p-501",
    slug: "samsung-990-pro-2tb",
    name: "Samsung 990 PRO 2TB NVMe SSD",
    categoryId: "storage",
    brand: "Samsung",
    priceCents: 16999,
    compareAtCents: 19999,
    shortDescription: "PCIe 4.0 flagship speeds for OS, games, and scratch disks.",
    description: "High endurance and consistent sustained writes - a favorite for primary drives and laptops (check form factor).",
    specs: { Interface: "PCIe 4.0 ×4", "Form factor": "M.2 2280", "Seq. read / write": "~7450 / 6900 MB/s" },
    stock: 35,
    image: I.ssd,
    featuredRank: 3,
  },
  {
    id: "p-502",
    slug: "wd-black-sn850x-1tb",
    name: "WD_BLACK SN850X 1TB NVMe SSD",
    categoryId: "storage",
    brand: "Western Digital",
    priceCents: 8999,
    shortDescription: "Fast PCIe 4.0 drive with heatsink option for PS5/PC.",
    description: "Great game-load performance and a trusted firmware track record.",
    specs: { Interface: "PCIe 4.0 ×4", Capacity: "1TB", "Est. endurance": "600 TBW" },
    stock: 50,
    image: I.ssd,
    featuredRank: 14,
  },
  {
    id: "p-503",
    slug: "crucial-t500-500gb",
    name: "Crucial T500 500GB NVMe SSD",
    categoryId: "storage",
    brand: "Crucial",
    priceCents: 5499,
    shortDescription: "Budget-friendly boot drive with DRAMless efficiency.",
    description: "Perfect secondary drive or budget primary for a lightweight OS + essential apps.",
    specs: { Interface: "PCIe 4.0 ×4", Capacity: "500GB" },
    stock: 60,
    image: I.ssd,
    featuredRank: 28,
  },
  {
    id: "p-601",
    slug: "corsair-rm850e-gold",
    name: "Corsair RM850e 850W 80+ Gold",
    categoryId: "psu",
    brand: "Corsair",
    priceCents: 11999,
    shortDescription: "Fully modular, quiet fan curve, ATX 3.0 friendly.",
    description: "Reliable RM platform for mid/high GPUs - includes native 12VHPWR options on partner revisions.",
    specs: { Wattage: "850W", Efficiency: "80+ Gold", Modular: "Full" },
    stock: 28,
    image: I.psu,
    featuredRank: 10,
  },
  {
    id: "p-602",
    slug: "seasonic-focus-gx-750",
    name: "Seasonic FOCUS GX-750 750W 80+ Gold",
    categoryId: "psu",
    brand: "Seasonic",
    priceCents: 10999,
    shortDescription: "Compact ATX PSU with tight voltage regulation.",
    description: "Seasonic quality for long-term stability - ideal for efficient single-GPU builds.",
    specs: { Wattage: "750W", Efficiency: "80+ Gold", Modular: "Full" },
    stock: 24,
    image: I.psu,
    featuredRank: 24,
  },
  {
    id: "p-701",
    slug: "fractal-design-north-mesh",
    name: "Fractal Design North Mesh (Charcoal)",
    categoryId: "cases",
    brand: "Fractal",
    priceCents: 13999,
    shortDescription: "Airflow-focused mid-tower with wood accent front.",
    description: "Premium fit and finish with excellent GPU thermals. Tool-free panels and thoughtful cable management.",
    specs: { "Form factor": "Mid-tower ATX", "GPU clearance": "~355mm", "Front fans": "3× 140mm included" },
    stock: 12,
    image: I.case,
    featuredRank: 7,
  },
  {
    id: "p-702",
    slug: "lian-li-o11-dynamic-evo",
    name: "Lian Li O11 Dynamic EVO (Black)",
    categoryId: "cases",
    brand: "Lian Li",
    priceCents: 18999,
    shortDescription: "Dual-chamber showcase case - radiator friendly.",
    description: "Dual tempered glass panels and flexible motherboard tray orientation for custom loops or AIOs.",
    specs: { "Form factor": "Full ATX", "Radiator support": "Top/side/bottom", Material: "Aluminum + glass" },
    stock: 8,
    image: I.case,
    featuredRank: 11,
  },
  {
    id: "p-801",
    slug: "arctic-liquid-freezer-iii-360",
    name: "ARCTIC Liquid Freezer III 360 AIO",
    categoryId: "cooling",
    brand: "ARCTIC",
    priceCents: 11999,
    shortDescription: "360mm AIO with integrated VRM fan - excellent value.",
    description: "Strong cooling per dollar, low noise profile, and wide socket support including AM5/LGA1700.",
    specs: { Size: "360mm", Fans: "3× ARCTIC P14", Pump: "Integrated in radiator" },
    stock: 19,
    image: I.cool,
    badge: "Staff pick",
    featuredRank: 9,
  },
  {
    id: "p-802",
    slug: "noctua-nh-d15-chromax",
    name: "Noctua NH-D15 chromax.black",
    categoryId: "cooling",
    brand: "Noctua",
    priceCents: 10999,
    shortDescription: "Twin-tower air cooler - whisper quiet under load.",
    description: "Industry reference for air cooling clearance and acoustic performance. Includes NT-H2 paste.",
    specs: { Type: "Dual-tower air", Fans: "2× NF-A15 PWM", Height: "165mm" },
    stock: 15,
    image: I.cool,
    featuredRank: 16,
  },
  {
    id: "p-803",
    slug: "thermalright-assassin-spirit-120",
    name: "Thermalright Assassin Spirit 120",
    categoryId: "cooling",
    brand: "Thermalright",
    priceCents: 2499,
    shortDescription: "Budget tower cooler - great for 65W CPUs.",
    description: "Single-tower design with PWM fan. Easy install and solid thermals for entry builds.",
    specs: { Type: "Single-tower", Height: "~154mm", TDP: "~225W (mfg)" },
    stock: 42,
    image: I.cool,
    featuredRank: 30,
  },
];

const bySlug = new Map(PRODUCTS.map((p) => [p.slug, p]));
const byId = new Map(PRODUCTS.map((p) => [p.id, p]));

/** @param {string} slug */
export function getProductBySlug(slug) {
  return bySlug.get(slug) ?? null;
}

/** @param {string} id */
export function getProductById(id) {
  return byId.get(id) ?? null;
}

/**
 * Category + search + price only (used for facet counts and as the first stage of filtering).
 * @param {ShopProduct[]} products
 * @param {{ category?: string, q?: string, minPrice?: string, maxPrice?: string }} f
 */
export function matchShopBaseFilters(products, { category, q, minPrice, maxPrice }) {
  let list = [...products];

  if (category && category !== "all") {
    list = list.filter((p) => p.categoryId === category);
  }

  const query = q?.trim().toLowerCase();
  if (query) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.shortDescription.toLowerCase().includes(query),
    );
  }

  const minC = minPrice != null && String(minPrice).trim() !== "" ? Math.round(Number(minPrice) * 100) : null;
  if (minC != null && !Number.isNaN(minC)) {
    list = list.filter((p) => p.priceCents >= minC);
  }

  const maxC = maxPrice != null && String(maxPrice).trim() !== "" ? Math.round(Number(maxPrice) * 100) : null;
  if (maxC != null && !Number.isNaN(maxC)) {
    list = list.filter((p) => p.priceCents <= maxC);
  }

  return list;
}

/**
 * Sidebar facet counts. Availability split uses category/search/price only.
 * Brand counts use the same base plus optional availability (so they stay accurate when "In stock" is on).
 * Does not apply brand filter to counts.
 * @param {ShopProduct[]} products
 * @param {{ category?: string, q?: string, minPrice?: string, maxPrice?: string }} f
 * @param {{ availability?: string }} [opts]
 */
export function getShopFacetCounts(products, f, opts = {}) {
  const base = matchShopBaseFilters(products, f);
  const inStock = base.filter((p) => p.stock > 0).length;
  const outOfStock = base.filter((p) => p.stock <= 0).length;

  let brandSource = base;
  if (opts.availability === "in-stock") {
    brandSource = base.filter((p) => p.stock > 0);
  } else if (opts.availability === "out-of-stock") {
    brandSource = base.filter((p) => p.stock <= 0);
  }

  const brandMap = new Map();
  for (const p of brandSource) {
    const name = p.brand;
    brandMap.set(name, (brandMap.get(name) ?? 0) + 1);
  }
  const brands = [...brandMap.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { inStock, outOfStock, brands, baseTotal: base.length };
}

/**
 * @param {ShopProduct[]} products
 * @param {{
 *   category?: string,
 *   q?: string,
 *   minPrice?: string,
 *   maxPrice?: string,
 *   sort?: string,
 *   availability?: string,
 *   brands?: string[],
 * }} filters
 */
export function filterProducts(products, { category, q, minPrice, maxPrice, sort, availability, brands }) {
  let list = matchShopBaseFilters(products, { category, q, minPrice, maxPrice });

  if (availability === "in-stock") {
    list = list.filter((p) => p.stock > 0);
  } else if (availability === "out-of-stock") {
    list = list.filter((p) => p.stock <= 0);
  }

  const brandList = brands?.filter(Boolean) ?? [];
  if (brandList.length > 0) {
    const set = new Set(brandList.map((b) => b.toLowerCase()));
    list = list.filter((p) => set.has(p.brand.toLowerCase()));
  }

  switch (sort) {
    case "price-asc":
      list.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      list.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      list.sort((a, b) => a.featuredRank - b.featuredRank || a.name.localeCompare(b.name));
  }

  return list;
}

/** @param {string} categoryId @param {string} excludeId */
export function getRelatedProducts(categoryId, excludeId, limit = 4) {
  return PRODUCTS.filter((p) => p.categoryId === categoryId && p.id !== excludeId)
    .sort((a, b) => a.featuredRank - b.featuredRank || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Category ids that have products, in the same order as `CATEGORIES` */
const _catalogIds = new Set(PRODUCTS.map((p) => p.categoryId));
export const SHOP_CATEGORY_IDS = CATEGORIES.map((c) => c.id).filter((id) => _catalogIds.has(id));
