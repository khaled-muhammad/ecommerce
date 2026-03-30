import "dotenv/config";
import { db } from "../db/index.js";
import { categories, brands, products } from "../db/schema/catalog.js";
import { roles, permissions, rolePermissions } from "../db/schema/user.js";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "../services/auth.js";

// ── Seed data from frontend static catalog ──

const CATEGORIES = [
  { slug: "cpus", title: "Processors", description: "The brain of your machine. High-performance CPUs for gaming and work.", image: "/categories/cpu_category_image_1774714070121.png", sortOrder: 1 },
  { slug: "gpus", title: "Graphics Cards", description: "Ultimate visual performance. Next-gen GPUs for realistic rendering.", image: "/categories/gpu_category_image_1774714165482.png", sortOrder: 2 },
  { slug: "motherboards", title: "Motherboards", description: "The foundation of your build. High-quality boards with rich connectivity.", image: "/categories/motherboard_category_image_1774714188158.png", sortOrder: 3 },
  { slug: "ram", title: "Memory", description: "Fast and reliable RAM. Boost your multitasking and gaming speed.", image: "/categories/ram_category_image_1774714288271.png", sortOrder: 4 },
  { slug: "storage", title: "Storage", description: "Lightning-fast SSDs. Store your games and data with maximum efficiency.", image: "/categories/storage_category_image_1774714302660.png", sortOrder: 5 },
  { slug: "psu", title: "Power Supplies", description: "Stable and efficient power. Keep your components running safely.", image: "/categories/psu_category_image_1774714365106.png", sortOrder: 6 },
  { slug: "cases", title: "Cases", description: "Airflow, aesthetics, and room for your components.", image: "/categories/storage_category_image_1774714302660.png", sortOrder: 7 },
  { slug: "cooling", title: "Cooling", description: "Keep your hardware cool under load with premium air and liquid solutions.", image: "/categories/storage_category_image_1774714302660.png", sortOrder: 8 },
  { slug: "peripherals", title: "Peripherals", description: "Keyboards, monitors, and accessories to complete your setup.", image: "/categories/storage_category_image_1774714302660.png", sortOrder: 9 },
];

const BRANDS = [
  { name: "AMD", slug: "amd" },
  { name: "Intel", slug: "intel" },
  { name: "NVIDIA", slug: "nvidia" },
  { name: "ASUS", slug: "asus" },
  { name: "MSI", slug: "msi" },
  { name: "Gigabyte", slug: "gigabyte" },
  { name: "Western Digital", slug: "western-digital" },
  { name: "Corsair", slug: "corsair" },
  { name: "Samsung", slug: "samsung" },
  { name: "Noctua", slug: "noctua" },
];

const PRODUCTS = [
  { slug: "amd-ryzen-7-7800x3d", name: "AMD Ryzen 7 7800X3D", categoryId: "cpus", brand: "AMD", priceCents: 38499, compareAtCents: 42999, shortDescription: "8C/16T gaming CPU with 3D V-Cache — top pick for high-FPS titles.", description: "Zen 4 architecture with stacked L3 for exceptional frame times in CPU-bound games.", specs: { Cores: "8", Threads: "16", Socket: "AM5", "Base/boost": "4.2 / 5.0 GHz", TDP: "120W" }, stock: 22, image: "https://images.unsplash.com/photo-1555689868-c00f5adf9b59?w=800&auto=format&fit=crop&q=80", badge: "Best seller", featuredRank: 1 },
  { slug: "intel-core-i7-14700k", name: "Intel Core i7-14700K", categoryId: "cpus", brand: "Intel", priceCents: 34999, shortDescription: "Hybrid architecture — strong all-rounder for work and play.", description: "Performance and Efficient cores give you flexibility for streaming, compiling, and gaming.", specs: { Cores: "20 (8P + 12E)", Threads: "28", Socket: "LGA1700", "P-core boost": "up to 5.6 GHz", TDP: "125W" }, stock: 15, image: "https://images.unsplash.com/photo-1555689868-c00f5adf9b59?w=800&auto=format&fit=crop&q=80", featuredRank: 2 },
  { slug: "nvidia-rtx-4090", name: "NVIDIA GeForce RTX 4090", categoryId: "gpus", brand: "NVIDIA", priceCents: 159999, shortDescription: "Flagship GPU with 24 GB GDDR6X — best 4K gaming and content creation.", description: "Ada Lovelace with DLSS 3, ray tracing, and 24 GB memory for the most demanding titles.", specs: { "VRAM": "24 GB GDDR6X", CUDA: "16384", Boost: "2520 MHz", TDP: "450W" }, stock: 8, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80", badge: "Premium", featuredRank: 3 },
  { slug: "msi-rtx-4070-ti-super", name: "MSI RTX 4070 Ti SUPER", categoryId: "gpus", brand: "MSI", priceCents: 79999, shortDescription: "Sweet-spot 1440p gaming with 16 GB VRAM.", description: "Great value for high-refresh 1440p gaming with DLSS 3 frame generation.", specs: { "VRAM": "16 GB GDDR6X", CUDA: "8448", Boost: "2610 MHz", TDP: "285W" }, stock: 18, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80", featuredRank: 4 },
  { slug: "corsair-ddr5-32gb", name: "Corsair Vengeance DDR5 32 GB", categoryId: "ram", brand: "Corsair", priceCents: 11999, shortDescription: "32 GB (2x16) DDR5-6000 CL30 — excellent for AM5 builds.", description: "Low-latency DDR5 kit with custom heatspreader for reliable high-speed operation.", specs: { Capacity: "32 GB (2x16)", Speed: "DDR5-6000", Latency: "CL30", Voltage: "1.35V" }, stock: 30, image: "https://images.unsplash.com/photo-1562976540-1502c2145185?w=800&auto=format&fit=crop&q=80", featuredRank: 5 },
  { slug: "samsung-990-pro-2tb", name: "Samsung 990 PRO 2 TB", categoryId: "storage", brand: "Samsung", priceCents: 17999, shortDescription: "PCIe 4.0 NVMe SSD — 7450 MB/s read, built for heavy workloads.", description: "Flagship NVMe with power-efficient controller and sustained write performance.", specs: { Capacity: "2 TB", Interface: "PCIe 4.0 x4 NVMe", Read: "7450 MB/s", Write: "6900 MB/s" }, stock: 25, image: "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=800&auto=format&fit=crop&q=80", featuredRank: 6 },
  { slug: "corsair-rm1000x", name: "Corsair RM1000x", categoryId: "psu", brand: "Corsair", priceCents: 18999, shortDescription: "1000W 80+ Gold fully modular — quiet and reliable.", description: "Premium fully modular PSU with zero-RPM fan mode and 10-year warranty.", specs: { Wattage: "1000W", Efficiency: "80+ Gold", Modular: "Fully", Warranty: "10 years" }, stock: 12, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&auto=format&fit=crop&q=80", featuredRank: 7 },
  { slug: "asus-rog-strix-b650e", name: "ASUS ROG Strix B650E-F", categoryId: "motherboards", brand: "ASUS", priceCents: 29999, shortDescription: "AM5 ATX with PCIe 5.0, DDR5, and robust VRM for overclocking.", description: "Feature-rich AM5 board with Wi-Fi 6E, USB4, and premium audio.", specs: { Socket: "AM5", Chipset: "B650E", Form: "ATX", Memory: "DDR5 up to 6400" }, stock: 10, image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&auto=format&fit=crop&q=80", featuredRank: 8 },
  { slug: "noctua-nh-d15", name: "Noctua NH-D15", categoryId: "cooling", brand: "Noctua", priceCents: 10999, shortDescription: "Dual-tower air cooler — near-AIO performance in silence.", description: "Iconic cooler with two NF-A15 fans and SecuFirm2 mounting for all platforms.", specs: { Type: "Dual-tower air", TDP: "250W", Fans: "2x NF-A15", Noise: "24.6 dB(A)" }, stock: 20, image: "https://images.unsplash.com/photo-1624706306573-3cf34d9e3f93?w=800&auto=format&fit=crop&q=80", featuredRank: 9 },
  { slug: "corsair-4000d-airflow", name: "Corsair 4000D Airflow", categoryId: "cases", brand: "Corsair", priceCents: 10499, shortDescription: "Mid-tower with perforated front panel — maximum airflow.", description: "Clean aesthetic with room for 360mm radiators and excellent cable management.", specs: { Form: "Mid-tower ATX", Fans: "Up to 6x 120mm", Radiator: "360mm top/front", GPU: "400mm max" }, stock: 14, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80", featuredRank: 10 },
  { slug: "wd-black-sn850x-1tb", name: "WD Black SN850X 1 TB", categoryId: "storage", brand: "Western Digital", priceCents: 8999, compareAtCents: 10999, shortDescription: "PCIe 4.0 gaming SSD — 7300 MB/s read.", description: "WD's gaming-focused NVMe with出色的散热设计.", specs: { Capacity: "1 TB", Interface: "PCIe 4.0 x4", Read: "7300 MB/s", Write: "6600 MB/s" }, stock: 0, image: "https://images.unsplash.com/photo-1597872200969-cb565ebd4a7f?w=800&auto=format&fit=crop&q=80", badge: "Sale" },
  { slug: "gigabyte-rtx-4070-windforce", name: "Gigabyte RTX 4070 Windforce", categoryId: "gpus", brand: "Gigabyte", priceCents: 54999, shortDescription: "12 GB 1440p performer with efficient WINDFORCE cooling.", description: "Good value for 1440p gaming with DLSS 3 support.", specs: { "VRAM": "12 GB GDDR6X", CUDA: "5888", Boost: "2475 MHz", TDP: "200W" }, stock: 5, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80" },
];

const ROLES_AND_PERMISSIONS = [
  { role: "owner", permissions: ["*"] },
  { role: "admin", permissions: ["products:read", "products:create", "products:update", "products:delete", "orders:read", "orders:update", "customers:read", "staff:manage", "analytics:read", "coupons:manage", "settings:manage"] },
  { role: "manager", permissions: ["products:read", "products:create", "products:update", "orders:read", "orders:update", "customers:read", "analytics:read", "coupons:manage"] },
  { role: "fulfillment", permissions: ["orders:read", "orders:update"] },
  { role: "support", permissions: ["orders:read", "customers:read", "orders:refund"] },
  { role: "content_editor", permissions: ["products:read", "products:create", "products:update"] },
  { role: "analyst", permissions: ["analytics:read", "orders:read", "products:read"] },
  { role: "customer", permissions: ["orders:own", "profile:own", "cart:own"] },
];

const PERMISSION_NAMES = [
  "*", "products:read", "products:create", "products:update", "products:delete",
  "orders:read", "orders:update", "orders:refund", "orders:own",
  "customers:read",
  "staff:manage",
  "analytics:read",
  "coupons:manage",
  "settings:manage",
  "profile:own",
  "cart:own",
];

async function seed() {
  console.log("Seeding database...");

  // Seed permissions
  console.log("  Permissions...");
  const permMap = new Map<string, string>();
  for (const name of PERMISSION_NAMES) {
    const [existing] = await db.select().from(permissions).where(eq(permissions.name, name)).limit(1);
    if (!existing) {
      const [inserted] = await db.insert(permissions).values({ name }).returning();
      permMap.set(name, inserted.id);
    } else {
      permMap.set(name, existing.id);
    }
  }

  // Seed roles + role-permissions
  console.log("  Roles...");
  for (const rp of ROLES_AND_PERMISSIONS) {
    const [existingRole] = await db.select().from(roles).where(eq(roles.name, rp.role)).limit(1);
    let roleId = existingRole?.id;
    if (!roleId) {
      const [inserted] = await db.insert(roles).values({ name: rp.role, description: `${rp.role} role` }).returning();
      roleId = inserted.id;
    }
    for (const permName of rp.permissions) {
      const permId = permMap.get(permName);
      if (!permId) continue;
      // Check if already linked
      const existing = await db.select().from(rolePermissions).where(
        and(eq(rolePermissions.roleId, roleId), eq(rolePermissions.permissionId, permId)),
      ).limit(1);
      if (existing.length === 0) {
        await db.insert(rolePermissions).values({ roleId: roleId!, permissionId: permId });
      }
    }
  }

  // Seed categories
  console.log("  Categories...");
  const catMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const [existing] = await db.select().from(categories).where(eq(categories.slug, cat.slug)).limit(1);
    if (!existing) {
      const [inserted] = await db.insert(categories).values(cat).returning();
      catMap.set(cat.slug, inserted.id);
    } else {
      catMap.set(cat.slug, existing.id);
    }
  }

  // Seed brands
  console.log("  Brands...");
  const brandMap = new Map<string, string>();
  for (const brand of BRANDS) {
    const [existing] = await db.select().from(brands).where(eq(brands.slug, brand.slug)).limit(1);
    if (!existing) {
      const [inserted] = await db.insert(brands).values(brand).returning();
      brandMap.set(brand.slug, inserted.id);
    } else {
      brandMap.set(brand.slug, existing.id);
    }
  }

  // Seed products
  console.log("  Products...");
  for (const prod of PRODUCTS) {
    const [existing] = await db.select().from(products).where(eq(products.slug, prod.slug)).limit(1);
    if (existing) continue;

    const catId = catMap.get(prod.categoryId);
    const brandMatch = BRANDS.find((b) => b.name.toLowerCase() === prod.brand.trim().toLowerCase());
    const bId = brandMatch ? brandMap.get(brandMatch.slug) : undefined;

    await db.insert(products).values({
      slug: prod.slug,
      name: prod.name,
      categoryId: catId || "",
      brandId: bId || null,
      priceCents: prod.priceCents,
      compareAtCents: prod.compareAtCents ?? null,
      shortDescription: prod.shortDescription,
      description: prod.description,
      specs: prod.specs as unknown as Record<string, string>,
      stock: prod.stock,
      image: prod.image,
      images: prod.image ? [prod.image] : [],
      badge: prod.badge ?? null,
      featuredRank: prod.featuredRank,
    });
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
