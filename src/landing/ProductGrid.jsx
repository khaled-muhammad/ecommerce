import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Heart } from "lucide-react";
import GlassSurface from "../components/GlassSurface.jsx";
import { landingImages } from "./imageUrls.js";
import GlowingMainLink from "../components/GlowingMainLink.jsx";

const productCardsGlassProps = {
  displace: 0.22,
  distortionScale: -95,
  redOffset: 0,
  greenOffset: 8,
  blueOffset: 14,
  brightness: 82,
  opacity: 0.82,
  mixBlendMode: "normal",
  backgroundOpacity: 0.46,
  saturation: 1.05,
  blur: 16,
  backdropBlur: 8,
};

export default function ProductGrid() {
  const [likedProducts, setLikedProducts] = useState([]);

  const toggleLike = (id) => {
    setLikedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const productSkus = [
    { name: "NVMe Gen4 2TB Heatsink", price: "USD 189.00", badge: "Storage" },
    { name: "850W Gold Modular PSU", price: "USD 139.00", badge: "Power" },
    { name: "32GB DDR5-6000 Kit", price: "USD 124.00", badge: "Memory" },
    { name: "Mid-Tower ATX Airflow", price: "USD 99.00", badge: "Case" },
    { name: "360mm AIO Liquid Cooler", price: "USD 149.00", badge: "Cooling" },
    { name: "Wi-Fi 6E PCIe Adapter", price: "USD 79.00", badge: "Networking" },
    { name: "Mechanical KB — Tactile", price: "USD 119.00", badge: "Peripherals" },
    { name: '27" QHD 165Hz IPS', price: "USD 329.00", badge: "Display" },
  ];

  const products = landingImages.products.map((image, i) => ({
    id: i + 1,
    image,
    ...productSkus[i],
  }));

  return (
    <section className="section-bg py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col lg:mb-14 lg:flex-row lg:items-center lg:justify-between">
          <span className="scroll-reveal text-xs font-medium uppercase tracking-wider text-vexo-text-muted">
            NEW IN STOCK
          </span>
          <h2 className="scroll-reveal my-4 text-center text-3xl font-bold leading-tight text-vexo-text lg:my-0 lg:text-[42px]">
            FRESH PICKS FOR YOUR
            <br />
            NEXT BUILD
          </h2>
          <Link
            to="/brands"
            className="scroll-reveal text-xs font-medium uppercase tracking-wider text-vexo-text-muted transition-colors hover:text-vexo-text"
          >
            ALL BRANDS
          </Link>
        </div>

        <div className="grid-stagger mx-auto grid max-w-[1200px] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="grid-item group relative aspect-[5/6] cursor-pointer overflow-hidden rounded-2xl bg-vexo-card card-hover"
            >
              <div className="absolute inset-0 img-zoom">
                <img src={product.image} alt="" className="h-full w-full object-cover" />
                <div
                  className="pointer-events-none absolute inset-0 z-[0] bg-gradient-to-t from-black/80 via-black/35 to-black/10"
                  aria-hidden
                />
              </div>

              <div className="absolute left-3 top-3 z-[1] flex items-center gap-2">
                <GlassSurface
                  {...productCardsGlassProps}
                  borderRadius={9999}
                  width="max-content"
                  height="auto"
                  className="pointer-events-none !shadow-none [&_.glass-surface__content]:!px-3 [&_.glass-surface__content]:!py-1"
                >
                  <span className="text-xs font-bold text-[color:var(--vexo-badge-fg)]">{product.badge}</span>
                </GlassSurface>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(product.id);
                }}
                className="absolute right-3 top-3 z-[1] flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 shadow-none outline-none transition-transform duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-[color:var(--vexo-focus-ring)]"
                aria-pressed={likedProducts.includes(product.id)}
                aria-label={likedProducts.includes(product.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <GlassSurface
                  {...productCardsGlassProps}
                  borderRadius={9999}
                  width={32}
                  height={32}
                  className={`[&_.glass-surface__content]:!p-0 ${likedProducts.includes(product.id) ? "ring-2 ring-red-500/90 ring-offset-1 ring-offset-transparent" : ""}`}
                >
                  <span className="relative flex h-full w-full items-center justify-center">
                    {likedProducts.includes(product.id) ? (
                      <span className="absolute inset-0 rounded-full bg-red-500/95" aria-hidden />
                    ) : null}
                    <Heart
                      className={`relative z-[1] h-4 w-4 ${likedProducts.includes(product.id) ? "text-white" : "text-[color:var(--vexo-badge-fg)]"}`}
                      fill={likedProducts.includes(product.id) ? "currentColor" : "none"}
                    />
                  </span>
                </GlassSurface>
              </button>

              <div className="absolute bottom-3 left-3 right-3 z-[1]">
                <GlassSurface
                  {...productCardsGlassProps}
                  borderRadius={14}
                  width="100%"
                  height="auto"
                  className="w-full shadow-lg [&_.glass-surface__content]:!p-0"
                >
                  <div className="flex w-full items-center justify-between gap-2 p-3">
                    <div>
                      <p className="text-xs font-bold leading-snug text-vexo-text">{product.name}</p>
                      <p className="mt-0.5 text-xs font-bold tabular-nums text-vexo-text opacity-80">
                        {product.price}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vexo-bg transition-colors hover:bg-vexo-dark hover:text-[color:var(--vexo-contrast-fg)]"
                      aria-label="View product"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </GlassSurface>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <GlowingMainLink to="/brands" variant="primary" linkClassName="group flex items-center gap-2">
            SEE ALL BRANDS
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--vexo-btn-primary-fg)_16%,transparent)] transition-colors group-hover:bg-[color-mix(in_srgb,var(--vexo-btn-primary-fg)_26%,transparent)]">
              <ChevronRight className="h-3 w-3" />
            </span>
          </GlowingMainLink>
        </div>
      </div>
    </section>
  );
}
