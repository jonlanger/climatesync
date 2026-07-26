export const metadata = {
  title: "About · Climate Sync",
  description:
    "What Climate Sync is, how city climate fingerprints work, and where the data comes from.",
};

export default function AboutPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-2xl px-6 py-10 md:px-10">
        <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
          About
        </p>
        <h1 className="font-heading mt-1 text-4xl tracking-tight text-[color:var(--panel-fg)]">
          Climate Sync
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--panel-muted)]">
          A globe for finding cities that share climate fingerprints—so adaptation ideas can
          travel between places that face similar weather, water, and risk regimes.
        </p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-[color:var(--panel-fg)]/90">
          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              The idea
            </h2>
            <p>
              Cities often look for peers when they plan for heat, floods, drought, or fire
              weather. Those peers are not always nearby. A monsoon megacity and a tropical
              coastal hub can share hydrologic stress even when their average temperatures
              differ. Climate Sync makes those analogues visible: pick a place or a theme,
              and the globe clusters cities whose climates rhyme.
            </p>
            <p>
              The point is not to claim identical governance or topography. It is to surface
              places with comparable climatic budgets so planners, journalists, and curious
              readers can compare what worked under similar constraints.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              How matching works
            </h2>
            <p>
              Each city carries a compact climate profile: seasonal temperature and
              precipitation structure, risk and hazard labels, and related traits. Queries
              such as “flood,” “drought,” or “cities like Nairobi” resolve into a focus—
              precipitation intensity, aridity, heat, storms, and more—then score peer
              cities by affinity on those dimensions.
            </p>
            <p>
              When a Sync Insight is active, gold hubs mark strong local exemplars and arcs
              link peers whose fingerprints are close enough to justify a sync. Similarity
              can be toggled off if you only want a single city in focus.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              Sync Insights
            </h2>
            <p>
              Sync Insights are curated themes—heavy rainfall, drought, monsoon, heat,
              wildfire weather, coasts, geologic overlays, and climate-zone analogues.
              Each insight explains the signal, cites sources, and activates a globe query
              so you can see the network of matching cities. Browse the full catalog from
              the Sync Insights page, or open an insight panel while exploring the map.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              Data &amp; limits
            </h2>
            <p>
              Climate fields lean on downscaled CMIP6 outputs via Open-Meteo’s climate API,
              combined with curated city metadata and hazard overlays. Profiles summarize
              monthly structure rather than every extreme event. Flooding, fire, and seismic
              risk also depend on local terrain, infrastructure, and governance—factors the
              globe cannot fully encode.
            </p>
            <p>
              Treat Climate Sync as a starting map for exchange and comparison, not a
              substitute for local hazard models or official guidance. Citations on each
              Sync Insight point to IPCC assessments, agency resources, and the climate
              data used for fingerprints.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              Using the app
            </h2>
            <p>
              Home is the interactive Earth: search or browse cities, run climate queries,
              and inspect city briefs. Sync Insights collects every theme as cards with
              full-detail pages. About—this page—is the short orientation. Use the sidebar
              (collapsed to icons by default; press ⌘B / Ctrl+B to expand) to move between
              them.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
