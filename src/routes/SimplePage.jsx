export default function SimplePage({ title }) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-[max(6.5rem,calc(env(safe-area-inset-top,0px)+5.25rem))]">
      <h1 className="font-ui-medium text-4xl tracking-[-0.03em] text-[color:var(--ink)]">
        {title}
      </h1>
      <p className="font-ui mt-4 max-w-xl text-[15px] leading-[150%] text-[color:color-mix(in_srgb,var(--ink)_90%,transparent)]">
        XXXX
      </p>
    </div>
  );
}
