import Link from "next/link";

import { HOW_TO_TIPS, WELCOME_HIGHLIGHTS } from "@/data/how-to-use";

export const metadata = {
  title: "How to Use · Climate Sync",
  description:
    "Step-by-step tips for the globe, climate queries, sync hubs, city panels, and more.",
};

export default function HowToUsePage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-2xl px-6 py-10 md:px-10">
        <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
          Guide
        </p>
        <h1 className="font-heading mt-1 text-4xl tracking-tight text-[color:var(--panel-fg)]">
          How to Use
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[color:var(--panel-muted)]">
          Climate Sync is a globe for spotting cities with similar climate fingerprints.
          Start on{" "}
          <Link href="/" className="text-[#7dd3c0] underline-offset-2 hover:underline">
            Home
          </Link>
          , then use the tips below as you explore.
        </p>

        <section className="mt-10 space-y-3">
          <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
            Quick start
          </h2>
          <ol className="space-y-3">
            {WELCOME_HIGHLIGHTS.map((item, index) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-[color:var(--panel-accent)] font-mono text-xs text-[#f2c14e]">
                  {index + 1}
                </span>
                <span className="text-[color:var(--panel-fg)]/90">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 space-y-8">
          <div>
            <h2 className="font-heading text-2xl tracking-tight text-[color:var(--panel-fg)]">
              Feature tips
            </h2>
            <p className="mt-2 text-base leading-relaxed text-[color:var(--panel-muted)]">
              One note for each major control—skim when you hit something new on the map.
            </p>
          </div>

          <ol className="space-y-8">
            {HOW_TO_TIPS.map((tip, index) => (
              <li key={tip.id} id={tip.id} className="scroll-mt-8">
                <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
                  Tip {index + 1}
                </p>
                <h3 className="font-heading mt-1 text-xl tracking-tight text-[color:var(--panel-fg)]">
                  {tip.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-[color:var(--panel-fg)]/90">
                  {tip.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-12 border-t border-[color:var(--panel-border)] pt-8 text-sm leading-relaxed text-[color:var(--panel-muted)]">
          Want the bigger picture—matching method, data sources, and limits? See{" "}
          <Link href="/about" className="text-[#7dd3c0] underline-offset-2 hover:underline">
            About
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
