"use client";

import { ExternalLink, Minus, PanelRightClose, PanelRightOpen, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { City } from "@/data/cities";
import { useCityClimate } from "@/hooks/useCityClimate";
import { useCityContext } from "@/hooks/useCityContext";
import {
  buildCityClimateBrief,
  getCityHazardDetails,
  getCityRiskDetails,
  type BriefTag,
} from "@/lib/city-climate-brief";
import type { CityAlertItem, CityContextData, CityNewsItem } from "@/lib/city-context";
import {
  formatPrecip,
  formatTemp,
  weatherCodeLabel,
  type CityClimateData,
  type MonthlyClimate,
} from "@/lib/climate";
import { cn } from "@/lib/utils";

export type PanelMode = "open" | "minimized" | "closed";

type CityClimatePanelProps = {
  city: City | null;
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[color:var(--panel-hover)] px-3 py-2.5">
      <p className="text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-[color:var(--panel-fg)]">{value}</p>
    </div>
  );
}

function TagRow({ tags }: { tags: BriefTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={`${tag.kind}-${tag.id}`}
          className={cn(
            "rounded-md px-2 py-0.5 text-[0.7rem] tracking-wide",
            tag.kind === "risk" && "bg-[#f2c14e]/18 text-[#f2c14e]",
            tag.kind === "hazard" && "bg-[#e07a5f]/18 text-[#e07a5f]",
            tag.kind === "fact" && "bg-[color:var(--panel-hover)] text-[color:var(--panel-muted)]",
          )}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}

function formatNewsDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function CityMedia({
  cityName,
  context,
}: {
  cityName: string;
  context: CityContextData | null;
}) {
  if (!context?.image && !context?.extract) return null;

  return (
    <section className="space-y-3">
      {context.image ? (
        <figure className="overflow-hidden rounded-md">
          {/* Wikimedia city photo — plain img avoids next/image remote config for dynamic hosts */}
          <img
            src={context.image.src}
            alt={context.image.alt || cityName}
            className="aspect-[16/10] w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <figcaption className="mt-1.5 text-[0.65rem] text-[color:var(--panel-muted)]">
            {context.wikiUrl ? (
              <a
                href={context.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-2 hover:underline"
              >
                {context.image.credit}
              </a>
            ) : (
              context.image.credit
            )}
          </figcaption>
        </figure>
      ) : null}
      {context.extract ? (
        <p className="text-[0.8rem] leading-relaxed text-[color:var(--panel-muted)]">
          {context.extract.length > 320 ? `${context.extract.slice(0, 317)}…` : context.extract}
          {context.wikiUrl ? (
            <>
              {" "}
              <a
                href={context.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-[color:var(--panel-fg)] underline-offset-2 hover:underline"
              >
                Wikipedia
                <ExternalLink className="size-2.5" />
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}

function NewsList({ items }: { items: CityNewsItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[color:var(--panel-muted)]">No recent climate headlines found.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.slice(0, 6).map((item) => {
        const date = formatNewsDate(item.publishedAt);
        return (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md bg-[color:var(--panel-hover)] px-3 py-2.5 transition-colors hover:bg-[color:var(--panel-border)]/40"
            >
              <span className="block text-sm leading-snug text-[color:var(--panel-fg)]">{item.title}</span>
              <span className="mt-1 block text-[0.65rem] text-[color:var(--panel-muted)]">
                {[item.source, date].filter(Boolean).join(" · ")}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function AlertsList({ items }: { items: CityAlertItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-[0.7rem] tracking-wide text-[color:var(--panel-muted)] uppercase">
        Nearby alerts (GDACS)
      </h4>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-md border border-[color:var(--panel-border)] px-3 py-2.5 transition-colors hover:border-[#e07a5f]/40"
            >
              <span className="block text-sm leading-snug text-[color:var(--panel-fg)]">{item.title}</span>
              <span className="mt-1 block text-[0.65rem] text-[color:var(--panel-muted)]">
                {[item.alertLevel, `${item.distanceKm} km away`, formatNewsDate(item.publishedAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CityBrief({ city, data }: { city: City; data: CityClimateData }) {
  const brief = buildCityClimateBrief(city, data);
  if (!brief) return null;

  const riskDetails = getCityRiskDetails(city.id);
  const hazardDetails = getCityHazardDetails(city.id);

  return (
    <section className="space-y-4 border-t border-[color:var(--panel-border)] pt-5">
      <div>
        <h3 className="mb-2 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
          Climate profile
        </h3>
        <TagRow tags={[...brief.facts, ...brief.risks, ...brief.hazards]} />
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--panel-fg)]">{brief.overview}</p>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--panel-muted)]">{brief.weather}</p>
      </div>

      {(riskDetails.length > 0 || hazardDetails.length > 0) && (
        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
            Climate risks
          </h3>
          {brief.risksNarrative ? (
            <p className="mb-3 text-sm leading-relaxed text-[color:var(--panel-muted)]">
              {brief.risksNarrative}
            </p>
          ) : null}
          <ul className="space-y-2">
            {riskDetails.map((item) => (
              <li key={item.id} className="rounded-md bg-[color:var(--panel-hover)] px-3 py-2.5">
                <p className="text-sm font-medium text-[color:var(--panel-fg)]">{item.label}</p>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[color:var(--panel-muted)]">
                  {item.detail}
                </p>
              </li>
            ))}
            {hazardDetails.map((item) => (
              <li key={item.id} className="rounded-md bg-[color:var(--panel-hover)] px-3 py-2.5">
                <p className="text-sm font-medium text-[color:var(--panel-fg)]">{item.label}</p>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[color:var(--panel-muted)]">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.outlook ? (
        <div>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
            What&apos;s changing
          </h3>
          <p className="text-sm leading-relaxed text-[color:var(--panel-muted)]">{brief.outlook}</p>
        </div>
      ) : null}
    </section>
  );
}

function MonthlyBars({
  months,
  futureMonths,
}: {
  months: MonthlyClimate[];
  futureMonths: MonthlyClimate[];
}) {
  const temps = [...months, ...futureMonths].flatMap((month) => [month.minTemp, month.maxTemp]);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const span = Math.max(max - min, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5">
        {months.map((month, index) => {
          const future = futureMonths[index];
          const recentBottom = ((month.minTemp - min) / span) * 100;
          const recentHeight = ((month.maxTemp - month.minTemp) / span) * 100;
          const futureBottom = ((future.minTemp - min) / span) * 100;
          const futureHeight = ((future.maxTemp - future.minTemp) / span) * 100;

          return (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative h-24 w-full">
                <div
                  className="absolute inset-x-0 rounded-sm bg-[#f2c14e]/35"
                  style={{ bottom: `${futureBottom}%`, height: `${Math.max(futureHeight, 4)}%` }}
                  title={`${future.label} 2040: ${formatTemp(future.minTemp)} – ${formatTemp(future.maxTemp)}`}
                />
                <div
                  className="absolute inset-x-[18%] rounded-sm bg-[#f2c14e]"
                  style={{ bottom: `${recentBottom}%`, height: `${Math.max(recentHeight, 4)}%` }}
                  title={`${month.label} 2020: ${formatTemp(month.minTemp)} – ${formatTemp(month.maxTemp)}`}
                />
              </div>
              <span className="text-[0.65rem] text-[color:var(--panel-muted)]">{month.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[0.7rem] text-[color:var(--panel-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#f2c14e]" /> 2020 range
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#f2c14e]/35" /> 2040 range
        </span>
      </div>
    </div>
  );
}

function ClimateContent({
  city,
  data,
  context,
  contextLoading,
}: {
  city: City;
  data: CityClimateData;
  context: CityContextData | null;
  contextLoading: boolean;
}) {
  const tempDelta = data.future.annualMeanTemp - data.recent.annualMeanTemp;
  const precipDelta = data.future.annualPrecipMm - data.recent.annualPrecipMm;

  return (
    <div className="space-y-6 px-5 py-5">
      {contextLoading && !context ? (
        <div className="h-36 animate-pulse rounded-md bg-[color:var(--panel-hover)]" />
      ) : (
        <CityMedia cityName={city.name} context={context} />
      )}

      <section>
        <h3 className="mb-3 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
          Current conditions
        </h3>
        <div className="mb-3">
          <p className="font-heading text-3xl text-[color:var(--panel-fg)]">
            {formatTemp(data.current.temperature)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--panel-muted)]">
            {weatherCodeLabel(data.current.weatherCode)} · feels like{" "}
            {formatTemp(data.current.apparentTemperature)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Humidity" value={`${Math.round(data.current.humidity)}%`} />
          <Stat label="Wind" value={`${data.current.windSpeed.toFixed(1)} km/h`} />
          <Stat label="Precip now" value={formatPrecip(data.current.precipitation)} />
          <Stat label="Elevation" value={`${Math.round(data.current.elevation)} m`} />
        </div>
      </section>

      <CityBrief city={city} data={data} />

      <section className="border-t border-[color:var(--panel-border)] pt-5">
        <h3 className="mb-3 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
          Climate news
        </h3>
        {contextLoading && !context ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-md bg-[color:var(--panel-hover)]" />
            ))}
          </div>
        ) : (
          <>
            <NewsList items={context?.news ?? []} />
            <AlertsList items={context?.alerts ?? []} />
            <p className="mt-3 text-[0.65rem] leading-relaxed text-[color:var(--panel-muted)]">
              Headlines via Google News RSS. Nearby disaster alerts via GDACS (within ~750 km).
            </p>
          </>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
          Climate outlook
        </h3>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <Stat label="2020 mean" value={formatTemp(data.recent.annualMeanTemp)} />
          <Stat label="2040 mean" value={formatTemp(data.future.annualMeanTemp)} />
          <Stat
            label="Temp change"
            value={`${tempDelta >= 0 ? "+" : "−"}${Math.abs(tempDelta).toFixed(1)}°C`}
          />
          <Stat
            label="Precip change"
            value={`${precipDelta >= 0 ? "+" : "−"}${Math.abs(precipDelta).toFixed(0)} mm`}
          />
        </div>
        <MonthlyBars months={data.recent.months} futureMonths={data.future.months} />
        <p className="mt-3 text-[0.7rem] leading-relaxed text-[color:var(--panel-muted)]">
          Monthly temperature ranges from Open-Meteo CMIP6 climate models (EC-Earth3P-HR), comparing
          2020 with a 2040 projection.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-xs font-medium tracking-wide text-[color:var(--panel-muted)] uppercase">
          Annual precipitation
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="2020 total" value={formatPrecip(data.recent.annualPrecipMm)} />
          <Stat label="2040 total" value={formatPrecip(data.future.annualPrecipMm)} />
        </div>
      </section>
    </div>
  );
}

export function CityClimatePanel({ city, mode, onModeChange }: CityClimatePanelProps) {
  const activeCity = mode === "closed" ? null : city;
  const climate = useCityClimate(activeCity);
  const context = useCityContext(activeCity);

  if (mode === "closed" || !city) return null;

  if (mode === "minimized") {
    return (
      <aside className="flex h-full w-12 flex-col items-center border-l border-[color:var(--panel-border)] bg-[color:var(--panel)] py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
          onClick={() => onModeChange("open")}
          aria-label="Expand climate panel"
        >
          <PanelRightOpen />
        </Button>
        <button
          type="button"
          onClick={() => onModeChange("open")}
          className="mt-4 flex flex-1 items-start justify-center overflow-hidden px-1"
          aria-label={`Expand climate details for ${city.name}`}
        >
          <span
            className="origin-center rotate-180 text-xs tracking-wide text-[color:var(--panel-muted)]"
            style={{ writingMode: "vertical-rl" }}
          >
            {city.name}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
          onClick={() => onModeChange("closed")}
          aria-label="Close climate panel"
        >
          <X />
        </Button>
      </aside>
    );
  }

  const ready = climate.status === "ready" && climate.cityId === city.id;
  const loading = climate.status === "loading" || (climate.status === "ready" && climate.cityId !== city.id);
  const errored = climate.status === "error" && climate.cityId === city.id;
  const contextReady = context.status === "ready" && context.cityId === city.id;
  const contextLoading =
    context.status === "loading" || (context.status === "ready" && context.cityId !== city.id);

  return (
    <aside
      className={cn(
        "flex h-full w-full max-w-[22rem] flex-col border-l border-[color:var(--panel-border)] bg-[color:var(--panel)] text-[color:var(--panel-fg)]",
      )}
    >
      <div className="flex items-start gap-3 border-b border-[color:var(--panel-border)] px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="font-heading text-2xl tracking-tight">{city.name}</p>
          <p className="mt-0.5 text-sm text-[color:var(--panel-muted)]">
            {city.country}
            <span className="mx-1.5 text-[color:var(--panel-border)]">·</span>
            {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
            onClick={() => onModeChange("minimized")}
            aria-label="Minimize climate panel"
          >
            <Minus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[color:var(--panel-muted)] hover:bg-[color:var(--panel-hover)] hover:text-[color:var(--panel-fg)]"
            onClick={() => onModeChange("closed")}
            aria-label="Close climate panel"
          >
            <PanelRightClose />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 px-5 py-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-md bg-[color:var(--panel-hover)]"
              />
            ))}
          </div>
        ) : null}

        {errored ? (
          <div className="px-5 py-8 text-sm text-[color:var(--panel-muted)]">
            Couldn’t load climate data. {climate.status === "error" ? climate.message : null}
          </div>
        ) : null}

        {ready ? (
          <ClimateContent
            city={city}
            data={climate.data}
            context={contextReady ? context.data : null}
            contextLoading={contextLoading}
          />
        ) : null}
      </div>

      <div className="border-t border-[color:var(--panel-border)] px-5 py-3 text-[0.7rem] text-[color:var(--panel-muted)]">
        Open-Meteo · Wikipedia · Google News · GDACS
      </div>
    </aside>
  );
}
