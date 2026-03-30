import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TiltedCard from '../components/TiltedCard';
import { BUNDLES } from '../data/categories';
import { fetchCategories } from '../lib/catalogApi.js';
import { motion } from 'motion/react';

const CATEGORY_ACCENTS = [
  '#00f2ff',
  '#7000ff',
  '#ff8c00',
  '#ff004c',
  '#00ff8c',
  '#e1ff00',
  '#a78bfa',
  '#38bdf8',
];

const FALLBACK_CATEGORY_IMAGE = '/categories/cpu_category_image_1774714070121.png';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    fetchCategories()
      .then((rows) => {
        if (!cancelled) setCategories(rows);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load categories');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="categories-page mx-auto flex w-full max-w-[min(100%,1600px)] flex-col px-4 pb-20 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))] md:px-6 lg:px-8">
      <header className="mb-12 max-w-2xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-ui-medium text-4xl tracking-[-0.03em] text-[color:var(--ink)] md:text-5xl"
        >
          Categories
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-ui mt-4 text-[17px] leading-relaxed text-[color:color-mix(in_srgb,var(--ink)_72%,transparent)]"
        >
          Explore our extensive range of high-performance hardware. From the core processors to the cases that house them, we have everything you need for your next build.
        </motion.p>
      </header>

      <section className="mb-20">
        <div className="mb-8 flex items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--ink)]">Hardware Essentials</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--ink)]/20 to-transparent" />
        </div>
        
        {loadError ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {loadError}
          </p>
        ) : null}

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.length === 0 && !loadError
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[240px] animate-pulse rounded-2xl bg-[color:color-mix(in_srgb,var(--ink)_8%,transparent)]"
                  aria-hidden
                />
              ))
            : categories.map((cat, i) => {
                const accent = CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length];
                const imageSrc = cat.image?.trim() || FALLBACK_CATEGORY_IMAGE;
                const shopHref = `/shop?category=${encodeURIComponent(cat.slug)}`;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group"
                  >
                    <Link to={shopHref} className="block rounded-2xl no-underline outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[color:var(--ink)]">
                      <TiltedCard
                        imageSrc={imageSrc}
                        altText={cat.title}
                        captionText={cat.title}
                        containerHeight="240px"
                        containerWidth="100%"
                        imageHeight="240px"
                        imageWidth="100%"
                        rotateAmplitude={10}
                        scaleOnHover={1.05}
                        showMobileWarning={false}
                        showTooltip
                        displayOverlayContent
                        overlayContent={
                          <div className="flex h-full flex-col justify-end gap-1.5 p-4 sm:p-5">
                            <h3
                              className="text-lg font-bold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,.85)] sm:text-xl"
                              style={{ color: accent }}
                            >
                              {cat.title}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-snug text-white/95 drop-shadow-[0_1px_3px_rgba(0,0,0,.9)]">
                              {cat.description || 'Browse products in this category.'}
                            </p>
                          </div>
                        }
                      />
                    </Link>
                  </motion.div>
                );
              })}
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-center gap-4">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--ink)]">Premium Bundles</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[color:var(--ink)]/20 to-transparent" />
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {BUNDLES.map((bundle, i) => (
            <motion.div 
              key={bundle.id}
              initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <TiltedCard
                imageSrc={bundle.image}
                altText={bundle.title}
                captionText={bundle.title}
                containerHeight="260px"
                containerWidth="100%"
                imageHeight="260px"
                imageWidth="100%"
                rotateAmplitude={8}
                scaleOnHover={1.03}
                showMobileWarning={false}
                showTooltip
                displayOverlayContent
                overlayContent={
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <span className="mb-2 inline-block rounded-full bg-black/35 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md drop-shadow-sm" style={{ color: bundle.accent }}>
                      Limited Bundle
                    </span>
                    <h3 className="mb-1.5 text-xl font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.9)] sm:text-2xl">
                      {bundle.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,.85)] sm:text-[15px]">
                      {bundle.description}
                    </p>
                  </div>
                }
              />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
