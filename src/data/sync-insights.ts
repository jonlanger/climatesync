import { ADDITIONAL_SYNC_INSIGHTS } from "@/data/sync-insights-more";
import type { SyncInsightIconName, SyncInsightPhoto } from "@/data/sync-insight-icons";
import type { QueryFocus } from "@/lib/climate-affinity";
import type { ClimateFact, ClimateHazard, ClimateRisk } from "@/lib/climate-profile";

export type SyncInsightLink = {
  label: string;
  href: string;
};

export type SyncInsightCitation = {
  label: string;
  href: string;
  detail?: string;
};

export type SyncInsight = {
  id: string;
  title: string;
  category: "water" | "temperature" | "storm" | "fire" | "geologic" | "coastal" | "climate" | "analogue";
  /** Query that activates this sync on the globe. */
  query: string;
  summary: string;
  /** Long-form insight for the Sync side panel (kept under ~1000 words). */
  blurb: string;
  /**
   * Accurate photo when available. When null, the UI renders `icon` instead.
   */
  image: SyncInsightPhoto | null;
  /** Lucide icon used when no suitable photo exists (and as a category cue). */
  icon: SyncInsightIconName;
  links: SyncInsightLink[];
  citations: SyncInsightCitation[];
  /** Optional tags used to match an active QueryFocus. */
  match?: {
    risks?: ClimateRisk[];
    facts?: ClimateFact[];
    hazards?: ClimateHazard[];
    focusKinds?: Array<QueryFocus["kind"]>;
    precipPolarity?: "wet" | "dry";
  };
};

const CORE_SYNC_INSIGHTS: SyncInsight[] = [
  {
    id: "heavy-rainfall",
    title: "Heavy rainfall & floods",
    category: "water",
    query: "flood",
    summary: "Cities with intense wet-season peaks and flood-prone rainfall climates.",
    blurb: `Heavy rainfall sync groups cities whose climates share elevated wet-season intensity—not merely “wet places,” but places where precipitation concentrates into sharp peaks that stress drainage, rivers, and urban surfaces.

Climate Sync derives this signal from monthly rainfall structure: high wettest-month totals, large annual precipitation, and concentrated wet seasons. That is why a monsoon megacity can sync with a tropical coastal hub even when average temperatures differ. The link is hydrologic similarity: how water arrives through the year.

Flood risk is not only a climate number. Local topography, river networks, coastal surge, and impermeable urban cover decide whether the same rainfall becomes nuisance flooding or disaster. Still, climate analogues matter because adaptation playbooks travel. Early-warning systems, permeable surfaces, elevated critical infrastructure, and wetland buffers are lessons cities with similar rainfall regimes can share.

When you activate this insight, the globe clusters cities by rainfall affinity. Each gold epicenter is a strong local exemplar of the wet-climate pattern; arcs connect peers whose precip fingerprints are close enough to justify a sync.`,
    image: {
      src: "https://images.unsplash.com/photo-1761252987116-a3e993bd23e9?auto=format&fit=crop&w=1200&q=80",
      alt: "Cars driving through a flooded street after heavy rain",
      credit: "Unsplash / Aldward Castillo",
      creditHref: "https://unsplash.com/photos/cars-driving-through-flooded-street-after-heavy-rain-DhM9aChufzU",
    },
    icon: "CloudRain",
    links: [
      { label: "WMO flood guidance", href: "https://wmo.int/topics/flood" },
      { label: "IPCC WGII water chapter", href: "https://www.ipcc.ch/report/ar6/wg2/" },
    ],
    citations: [
      {
        label: "IPCC AR6 WGII",
        href: "https://www.ipcc.ch/report/ar6/wg2/",
        detail: "Observed and projected flood and extreme precipitation impacts.",
      },
      {
        label: "Open-Meteo CMIP6",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Downscaled climate fields used for city precip fingerprints.",
      },
    ],
    match: {
      risks: ["heavy_rainfall"],
      focusKinds: ["precip"],
      precipPolarity: "wet",
    },
  },
  {
    id: "drought",
    title: "Drought & water stress",
    category: "water",
    query: "drought",
    summary: "Arid and water-stressed climates with low annual or seasonal rainfall.",
    blurb: `Drought sync connects cities living with chronic or seasonal water scarcity. The climate signal combines low annual precipitation with long dry stretches—conditions that raise evaporative demand, stress reservoirs, and amplify heat.

Unlike a single dry month, drought-prone climates are structural: the rainfall baseline is thin, so multi-year deficits hit hard. Many synced cities sit in arid or semi-arid belts, or have Mediterranean-like dry summers. Adaptation themes recur: demand management, wastewater reuse, aquifer recovery, drought-tolerant landscaping, and diversified supply.

Syncing these cities does not claim identical governance or hydrology. It highlights places facing comparable climatic water budgets, so planners can compare what worked under similar rainfall constraints.`,
    image: {
      src: "https://images.unsplash.com/photo-1752419258297-f769e1a878ce?auto=format&fit=crop&w=1200&q=80",
      alt: "Cracked earth showing the effects of drought",
      credit: "Unsplash / GWANGJIN GO",
      creditHref: "https://unsplash.com/photos/cracked-earth-shows-the-effects-of-drought-7f6KYooWCIo",
    },
    icon: "Droplets",
    links: [
      { label: "UNCCD drought", href: "https://www.unccd.int/land-and-life/drought/overview" },
      { label: "NASA drought resources", href: "https://www.nasa.gov/earth/climate-change/" },
    ],
    citations: [
      {
        label: "IPCC AR6 drought assessment",
        href: "https://www.ipcc.ch/report/ar6/wg1/",
        detail: "Changes in drought frequency and intensity under warming.",
      },
    ],
    match: {
      risks: ["drought_stress"],
      focusKinds: ["precip"],
      precipPolarity: "dry",
    },
  },
  {
    id: "monsoon",
    title: "Monsoon patterns",
    category: "water",
    query: "monsoon",
    summary: "Climates where rainfall is packed into a dominant wet season.",
    blurb: `Monsoon sync finds cities whose year is split between a concentrated wet season and a markedly drier remainder. The key metric is precipitation concentration: a large share of annual rain falls in a few months.

That rhythm shapes everything from agriculture calendars to flood preparedness and mosquito seasonality. Cities in South Asia, West Africa, and parts of East Asia often appear together because their hydrographs rhyme—even when cultures and latitudes differ.

When monsoon clusters light up, compare not only totals but timing: early onset, delayed withdrawal, and wet-season extremes are where climate risk and adaptation planning meet.`,
    image: {
      src: "https://images.unsplash.com/photo-1765683011450-c2b8dae7b223?auto=format&fit=crop&w=1200&q=80",
      alt: "Tuk-tuk driving through heavy monsoon rain on a city street",
      credit: "Unsplash / Aprhille Salao",
      creditHref: "https://unsplash.com/photos/tuk-tuk-driving-through-heavy-rain-on-city-street-U7nXKK7xavY",
    },
    icon: "Umbrella",
    links: [
      { label: "IMD monsoon", href: "https://mausam.imd.gov.in/" },
      { label: "WCRP monsoon research", href: "https://www.wcrp-climate.org/" },
    ],
    citations: [
      {
        label: "Open-Meteo climate API",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Monthly precip fields used to estimate monsoon concentration.",
      },
    ],
    match: { risks: ["monsoon_pattern"] },
  },
  {
    id: "extreme-heat",
    title: "Extreme heat",
    category: "temperature",
    query: "extreme heat",
    summary: "Cities with dangerously hot summers or high annual mean temperatures.",
    blurb: `Heat sync links cities where the hottest months push into ranges associated with heat stress, labor productivity loss, and excess mortality—especially where nights stay warm and housing stock traps heat.

Urban heat islands amplify the climate signal. Two cities with similar monthly means can diverge once asphalt, canopy cover, and building materials enter the picture. Still, climatic analogues help: cooling centers, reflective surfaces, shade corridors, and heat-health warning systems transfer between heat peers.

Activate this insight to see epicenters of heat intensity and the peers that share a comparable thermal profile.`,
    image: {
      src: "https://images.unsplash.com/photo-1751889188945-f15e42becd73?auto=format&fit=crop&w=1200&q=80",
      alt: "Thermometer showing extreme heat",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/the-thermometer-shows-a-very-hot-temperature-qs5HR1dG7h4",
    },
    icon: "ThermometerSun",
    links: [
      { label: "WHO heat & health", href: "https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health" },
      { label: "C40 heat resources", href: "https://www.c40.org/" },
    ],
    citations: [
      {
        label: "IPCC AR6 heat extremes",
        href: "https://www.ipcc.ch/report/ar6/wg1/",
        detail: "Observed intensification of heat extremes.",
      },
    ],
    match: { risks: ["extreme_heat"], focusKinds: ["heat"] },
  },
  {
    id: "extreme-cold",
    title: "Extreme cold",
    category: "temperature",
    query: "extreme cold",
    summary: "Cities with harsh winters, freezing means, or polar-adjacent climates.",
    blurb: `Cold sync groups cities whose coldest months dive well below freezing or whose annual means stay near or below freezing. These climates share winter energy demand, freeze-thaw infrastructure stress, and cold-season public-health risks.

As winters warm unevenly, cold cities still matter as analogues for resilience: district heating, snow management, and building envelopes designed for deep cold. Syncing highlights peers confronting similar thermal floors even as extremes shift.`,
    image: {
      src: "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?auto=format&fit=crop&w=1200&q=80",
      alt: "Snow-covered city road in winter",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/road-covered-by-snow-near-vehicle-traveling-at-daytime-R5SrmZPoO40",
    },
    icon: "Snowflake",
    links: [
      { label: "CDC extreme cold", href: "https://www.cdc.gov/disasters/winter/index.html" },
    ],
    citations: [
      {
        label: "Open-Meteo climate fields",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Cold-month means used for extreme-cold tagging.",
      },
    ],
    match: { risks: ["extreme_cold"], focusKinds: ["cold"] },
  },
  {
    id: "seasonality",
    title: "High seasonality",
    category: "temperature",
    query: "seasonality",
    summary: "Large swings between the hottest and coldest months.",
    blurb: `Seasonality sync highlights continental and higher-latitude climates with big temperature ranges across the year. Four-season cities often share infrastructure challenges: heating and cooling peaks, freeze-thaw cycles, and allergy or vector seasons that migrate with the calendar.

Low-seasonality tropical peers rarely appear here. The insight is about amplitude—how hard the climate pulls between summer and winter—not about absolute heat or cold alone.`,
    image: null,
    icon: "CalendarRange",
    links: [
      { label: "Köppen climate classification", href: "https://en.wikipedia.org/wiki/K%C3%B6ppen_climate_classification" },
    ],
    citations: [
      {
        label: "Climate Sync seasonality metric",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Hottest-minus-coldest monthly mean temperature.",
      },
    ],
    match: { risks: ["high_seasonality"], focusKinds: ["seasonality"] },
  },
  {
    id: "storms",
    title: "Severe storms & cyclones",
    category: "storm",
    query: "hurricane",
    summary: "Stormy climates with intense wet peaks and concentrated rainfall.",
    blurb: `Storm sync is a climate proxy for places where intense wet-season peaks and concentrated precipitation imply elevated tropical-cyclone or severe-storm exposure. It is not a storm-track model; it clusters hydrologic regimes associated with damaging wind-and-rain seasons.

Peers often share coastal or monsoon-influenced settings. Adaptation overlaps include building codes, early warning, evacuation logistics, and surge-aware land use—even when the named hazard differs (hurricane, typhoon, cyclone).`,
    image: {
      src: "https://images.unsplash.com/photo-1677759662192-a2c6e9d067a2?auto=format&fit=crop&w=1200&q=80",
      alt: "Lightning storm over a city at night",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/a-lightning-storm-over-a-city-at-night-6wkemuAGzMY",
    },
    icon: "CloudLightning",
    links: [
      { label: "NOAA hurricanes", href: "https://www.noaa.gov/hurricane" },
      { label: "WMO tropical cyclones", href: "https://wmo.int/topics/tropical-cyclone" },
    ],
    citations: [
      {
        label: "IPCC AR6 extremes",
        href: "https://www.ipcc.ch/report/ar6/wg1/",
        detail: "Changes in tropical cyclone rainfall intensity.",
      },
    ],
    match: { risks: ["storm_risk"], focusKinds: ["storm"] },
  },
  {
    id: "wildfire",
    title: "Wildfire weather",
    category: "fire",
    query: "wildfire",
    summary: "Hot, dry climates associated with elevated fire-weather conditions.",
    blurb: `Wildfire sync links cities whose climate fingerprints combine heat with dryness—conditions that raise fire-weather potential in surrounding landscapes and, increasingly, at the urban–wildland interface.

Climate Sync does not simulate fuel loads or ignition. It clusters the meteorological backdrop: hot peaks, limited annual rain, and dry months. Cities in Mediterranean, semi-arid, and hot-dry continental settings often sync together.

Shared adaptation themes include defensible space, air-quality alerts during smoke events, and land-use buffers—lessons that travel between fire-weather peers.`,
    image: {
      src: "https://images.unsplash.com/photo-1615092296061-e2ccfeb2f3d6?auto=format&fit=crop&w=1200&q=80",
      alt: "Wildfire burning across a dry hillside at dusk",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/wildfire-burning-across-hillside-at-dusk-kbTp7dBzHyY",
    },
    icon: "Flame",
    links: [
      { label: "GFMC wildfire", href: "https://gfmc.online/" },
      { label: "NASA FIRMS", href: "https://firms.modaps.eosdis.nasa.gov/" },
    ],
    citations: [
      {
        label: "IPCC AR6 fire weather",
        href: "https://www.ipcc.ch/report/ar6/wg1/",
        detail: "Observed increases in fire-weather conditions in many regions.",
      },
    ],
    match: { risks: ["wildfire_risk"], focusKinds: ["wildfire"] },
  },
  {
    id: "landslide",
    title: "Landslide-prone rainfall",
    category: "water",
    query: "mudslide",
    summary: "Very wet or sharply peaked rainfall climates linked to slope failure risk.",
    blurb: `Landslide sync uses intense or highly peaked rainfall as a climate proxy for slope-failure potential. Steep terrain, deforestation, and soil type complete the hazard—but rainfall intensity is the climatic trigger many cities share.

Clusters often include wet tropical and monsoon cities where debris flows and mudslides follow extreme rain. Syncing helps compare early-warning thresholds, slope stabilization, and land-use setbacks used under similar precip regimes.`,
    image: {
      src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
      alt: "Steep mountain slopes vulnerable to landslide after heavy rain",
      credit: "Unsplash / Kalen Emsley",
      creditHref: "https://unsplash.com/photos/mountains-covered-with-snow-under-gray-sky-Bkci_8qcdvQ",
    },
    icon: "Mountain",
    links: [
      { label: "USGS landslides", href: "https://www.usgs.gov/programs/landslide-hazards" },
    ],
    citations: [
      {
        label: "IPCC slopes & extremes",
        href: "https://www.ipcc.ch/report/ar6/wg2/",
        detail: "Rainfall extremes and landslide impacts in mountain regions.",
      },
    ],
    match: { risks: ["landslide_risk"], focusKinds: ["landslide"] },
  },
  {
    id: "earthquake",
    title: "Earthquake zones",
    category: "geologic",
    query: "earthquake",
    summary: "Cities in known seismic zones, clustered by regional proximity.",
    blurb: `Earthquake sync is a geologic overlay, not a climate derivation. Cities tagged for seismic exposure are clustered regionally—Anatolia, Japan, Mexico, the Andes, Indonesia—so peers share tectonic neighborhood as well as the hazard label.

Within a cluster, arcs favor nearby seismic cities. Distant quake-prone metros stay in separate epicenters. That mirrors how building codes, drill culture, and emergency logistics are regional even when the hazard name is global.

Use this insight to compare seismic readiness among cities that face a similar tectonic setting.`,
    image: null,
    icon: "Activity",
    links: [
      { label: "USGS earthquakes", href: "https://earthquake.usgs.gov/" },
      { label: "GEM Foundation", href: "https://www.globalquakemodel.org/" },
    ],
    citations: [
      {
        label: "Climate Sync city hazard overlays",
        href: "https://earthquake.usgs.gov/",
        detail: "Static seismic tags curated for cities in this dataset.",
      },
    ],
    match: { hazards: ["earthquake"], focusKinds: ["hazard"] },
  },
  {
    id: "volcano",
    title: "Volcanic exposure",
    category: "geologic",
    query: "volcano",
    summary: "Cities near volcanic systems, grouped into regional clusters.",
    blurb: `Volcano sync connects cities with nearby volcanic systems. Like earthquakes, this is an overlay hazard: ashfall, lahars, and aviation disruption can couple with rainfall, but the base tag is geologic.

Regional clusters (Japan, Indonesia, Andes, Mexico) keep syncs local. Cities compare ash-ready infrastructure, tourism contingency, and lahar channel planning with peers under similar volcanic neighborhoods.`,
    image: {
      src: "https://images.unsplash.com/photo-1744968776905-d602155b4947?auto=format&fit=crop&w=1200&q=80",
      alt: "Volcano erupting with smoke and ash from above",
      credit: "Unsplash / USGS",
      creditHref: "https://unsplash.com/photos/volcano-erupting-with-smoke-and-clouds-from-above-vmxG-RLh_gQ",
    },
    icon: "Flame",
    links: [
      { label: "Smithsonian GVP", href: "https://volcano.si.edu/" },
      { label: "USGS volcanoes", href: "https://www.usgs.gov/programs/VHP" },
    ],
    citations: [
      {
        label: "Global Volcanism Program",
        href: "https://volcano.si.edu/",
        detail: "Authoritative catalog of Holocene volcanoes.",
      },
    ],
    match: { hazards: ["volcano"], focusKinds: ["hazard"] },
  },
  {
    id: "tsunami",
    title: "Tsunami exposure",
    category: "coastal",
    query: "tsunami",
    summary: "Coastal cities with tsunami exposure overlays.",
    blurb: `Tsunami sync highlights coastal cities tagged for tsunami exposure—often where seismic or volcanic coasts meet dense settlement. Syncing is regional so Pacific and other basin peers compare warning chains, vertical evacuation, and coastal setbacks.`,
    image: {
      src: "https://images.unsplash.com/photo-1779231926860-503334a33d51?auto=format&fit=crop&w=1200&q=80",
      alt: "Waves crashing against coastal rocks",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/waves-crash-against-large-rocks-on-a-sunny-coastline-3aXVfxmnHww",
    },
    icon: "Waves",
    links: [
      { label: "IOC UNESCO tsunami", href: "https://www.ioc.unesco.org/" },
      { label: "NOAA tsunami", href: "https://www.tsunami.noaa.gov/" },
    ],
    citations: [
      {
        label: "IOC Tsunami Programme",
        href: "https://www.ioc.unesco.org/",
        detail: "International tsunami warning and awareness coordination.",
      },
    ],
    match: { hazards: ["tsunami"], focusKinds: ["hazard"] },
  },
  {
    id: "dust-storm",
    title: "Dust storms",
    category: "storm",
    query: "sandstorm",
    summary: "Cities exposed to dust- and sand-storm overlays.",
    blurb: `Dust-storm sync groups arid-belt cities where blowing dust and sandstorms degrade air quality and visibility. Many peers sit near deserts or dry plains. Shared responses include air-quality alerts, building filtration, and land restoration that reduces dust sources.`,
    image: {
      src: "https://images.unsplash.com/photo-1511514323702-88e7e52f5223?auto=format&fit=crop&w=1200&q=80",
      alt: "Dusty desert landscape",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/desert-with-wire-fence-sBXVsMsfoEc",
    },
    icon: "Wind",
    links: [
      { label: "WMO sand & dust", href: "https://community.wmo.int/activity-areas/gaw/science/sand-and-dust-storms" },
    ],
    citations: [
      {
        label: "WMO SDS-WAS",
        href: "https://community.wmo.int/activity-areas/gaw/science/sand-and-dust-storms",
        detail: "Sand and dust storm warning advisory system.",
      },
    ],
    match: { hazards: ["dust_storm"], focusKinds: ["hazard"] },
  },
  {
    id: "storm-surge",
    title: "Storm surge",
    category: "coastal",
    query: "storm surge",
    summary: "Coastal cities with storm-surge exposure overlays.",
    blurb: `Storm-surge sync focuses on coastal metros where surge flooding can compound rainfall and tide. Peers often share low-lying districts and tropical-cyclone or extratropical-storm seasons. Compare barriers, elevated infrastructure, and retreat strategies among surge-tagged coasts.`,
    image: {
      src: "https://images.unsplash.com/photo-1774703299544-9b98d029fba5?auto=format&fit=crop&w=1200&q=80",
      alt: "Severe storm lightning over a coastal city skyline",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/city-skyline-at-night-with-lightning-storm-E2290BfFU7Y",
    },
    icon: "Ship",
    links: [
      { label: "NOAA storm surge", href: "https://www.nhc.noaa.gov/surge/" },
    ],
    citations: [
      {
        label: "NOAA NHC surge",
        href: "https://www.nhc.noaa.gov/surge/",
        detail: "Operational storm-surge science and messaging.",
      },
    ],
    match: { hazards: ["storm_surge"], focusKinds: ["hazard"] },
  },
  {
    id: "coastal-erosion",
    title: "Coastal erosion & sea-level rise",
    category: "coastal",
    query: "sea level rise",
    summary: "Cities tagged for coastal erosion and rising-seas pressure.",
    blurb: `Coastal-erosion sync marks places where shoreline retreat and sea-level rise pressure settlement, ports, and heritage coasts. Climate Sync pairs the overlay with broader warming context: rising seas turn today’s nuisance flooding into tomorrow’s chronic inundation.

Peers can compare soft defenses, sediment management, and managed retreat timelines.`,
    image: {
      src: "https://images.unsplash.com/photo-1652117500909-c475212fe733?auto=format&fit=crop&w=1200&q=80",
      alt: "Eroded rocky coastline and beach",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/a-beach-with-rocks-and-a-hill-63OjbN6uqbg",
    },
    icon: "Waves",
    links: [
      { label: "NASA sea level", href: "https://sealevel.nasa.gov/" },
      { label: "IPCC ocean & cryosphere", href: "https://www.ipcc.ch/srocc/" },
    ],
    citations: [
      {
        label: "IPCC SROCC",
        href: "https://www.ipcc.ch/srocc/",
        detail: "Sea-level rise and coastal hazard assessment.",
      },
    ],
    match: { hazards: ["coastal_erosion"], focusKinds: ["hazard"] },
  },
  {
    id: "tropical",
    title: "Tropical climates",
    category: "climate",
    query: "tropical",
    summary: "Equatorial and tropical climate-zone cities.",
    blurb: `Tropical sync groups cities with warm year-round temperatures (high coldest-month means). Humidity, convective rainfall, and limited seasonality often co-occur. Adaptation priorities lean toward heat-humidity stress, vector control, and intense short-duration rains.`,
    image: {
      src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
      alt: "Dense tropical forest canopy",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/green-leafed-trees-lObpcyG3LVQ",
    },
    icon: "Palmtree",
    links: [
      { label: "Köppen tropical climates", href: "https://en.wikipedia.org/wiki/Tropical_climate" },
    ],
    citations: [
      {
        label: "Climate Sync zone rules",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Coldest-month thresholds used for tropical tagging.",
      },
    ],
    match: { facts: ["tropical"], focusKinds: ["climate_zone"] },
  },
  {
    id: "arid",
    title: "Arid & desert climates",
    category: "climate",
    query: "arid",
    summary: "Desert and hyper-arid climate-zone cities.",
    blurb: `Arid sync highlights desert-climate cities with very low annual rainfall. Day–night swings, dust, and water scarcity define the lived climate. Peers share cooling strategies, water reuse, and shade-first urban design.`,
    image: {
      src: "https://images.unsplash.com/photo-1641118593381-ded30a11d4e1?auto=format&fit=crop&w=1200&q=80",
      alt: "Drought-stressed field under harsh sun",
      credit: "Unsplash",
      creditHref: "https://unsplash.com/photos/a-large-field-of-dead-plants-in-the-middle-of-the-day-mz278SNa2ek",
    },
    icon: "Sun",
    links: [
      { label: "UNCCD", href: "https://www.unccd.int/" },
    ],
    citations: [
      {
        label: "Climate Sync arid threshold",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Annual precip under ~250 mm tagged arid.",
      },
    ],
    match: { facts: ["arid"], focusKinds: ["climate_zone"] },
  },
  {
    id: "mediterranean",
    title: "Mediterranean climates",
    category: "climate",
    query: "mediterranean",
    summary: "Dry-summer, wet-winter climate analogues.",
    blurb: `Mediterranean sync finds dry-summer / wetter-winter climates common to parts of the Mediterranean basin, California analogues, Chile, South Africa, and Australia. Fire weather in summer and flood risk in winter often coexist—making these peers natural adaptation partners.`,
    image: {
      src: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1200&q=80",
      alt: "Coastal Mediterranean town",
      credit: "Unsplash / Willian Justen",
      creditHref: "https://unsplash.com/",
    },
    icon: "Leaf",
    links: [
      { label: "Mediterranean climate", href: "https://en.wikipedia.org/wiki/Mediterranean_climate" },
    ],
    citations: [
      {
        label: "Climate Sync Mediterranean proxy",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Precip seasonality plus warm-summer thresholds.",
      },
    ],
    match: { facts: ["mediterranean"], focusKinds: ["climate_zone"] },
  },
  {
    id: "warming-hotspot",
    title: "Warming hotspots",
    category: "climate",
    query: "warming hotspot",
    summary: "Cities with especially hot peak months signaling rapid heat pressure.",
    blurb: `Warming-hotspot sync flags cities whose hottest months already sit in extreme ranges—places where additional warming lands on a high baseline. Peers are useful for heat-adaptation foresight: what today’s hottest cities are already building, funding, and regulating.`,
    image: {
      src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      alt: "Sunlight over a warm landscape",
      credit: "Unsplash / David Marcu",
      creditHref: "https://unsplash.com/",
    },
    icon: "Thermometer",
    links: [
      { label: "IPCC regional fact sheets", href: "https://www.ipcc.ch/report/ar6/wg1/" },
    ],
    citations: [
      {
        label: "IPCC AR6 WG1",
        href: "https://www.ipcc.ch/report/ar6/wg1/",
        detail: "Regional warming and heat extremes.",
      },
    ],
    match: { facts: ["warming_hotspot"], focusKinds: ["climate_zone"] },
  },
  {
    id: "climate-analogue",
    title: "Climate analogues",
    category: "analogue",
    query: "cities like Tokyo",
    summary: "Full-climate twins: similar temperature, rainfall, and seasonal structure.",
    blurb: `Climate-analogue sync is the classic “cities like X” mode. The epicenter is the seed city. Peers are ranked by a blended score: continuous climate features (temperature, rainfall, seasonality) plus shared risk and zone tags.

This is the broadest sync. Use it when you want holistic twins—useful for transferring urban forestry, energy demand, or tourism-season insights across cities whose entire climate fingerprints align.`,
    image: null,
    icon: "GitCompareArrows",
    links: [
      { label: "Climate analogues concept", href: "https://www.sciencedirect.com/topics/earth-and-planetary-sciences/climate-analogue" },
      { label: "Open-Meteo climate API", href: "https://open-meteo.com/en/docs/climate-api" },
    ],
    citations: [
      {
        label: "Climate Sync similarity score",
        href: "https://open-meteo.com/en/docs/climate-api",
        detail: "Cosine similarity on normalized climate vectors plus risk/fact Jaccard.",
      },
    ],
    match: { focusKinds: ["full_climate"] },
  },
];

export const SYNC_INSIGHTS: SyncInsight[] = [...CORE_SYNC_INSIGHTS, ...ADDITIONAL_SYNC_INSIGHTS];

const CATEGORY_ORDER: SyncInsight["category"][] = [
  "water",
  "temperature",
  "storm",
  "fire",
  "geologic",
  "coastal",
  "climate",
  "analogue",
];

export type InsightSortKey = "category" | "title-asc" | "title-desc";

export const INSIGHT_SORT_OPTIONS: Array<{ value: InsightSortKey; label: string }> = [
  { value: "category", label: "By category" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

export function sortInsights(
  insights: readonly SyncInsight[],
  sort: InsightSortKey,
): SyncInsight[] {
  const sorted = [...insights];
  switch (sort) {
    case "title-asc":
      sorted.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
      break;
    case "title-desc":
      sorted.sort((a, b) => b.title.localeCompare(a.title) || a.id.localeCompare(b.id));
      break;
    case "category":
    default:
      sorted.sort((a, b) => {
        const cat =
          CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
        return cat || a.title.localeCompare(b.title);
      });
      break;
  }
  return sorted;
}

export const SYNC_INSIGHT_CATEGORIES: Array<{
  id: SyncInsight["category"];
  label: string;
}> = [
  { id: "water", label: "Water" },
  { id: "temperature", label: "Temperature" },
  { id: "storm", label: "Storms" },
  { id: "fire", label: "Fire" },
  { id: "geologic", label: "Geologic" },
  { id: "coastal", label: "Coastal" },
  { id: "climate", label: "Climate zones" },
  { id: "analogue", label: "Analogues" },
];

export function insightsByCategory(
  sort: InsightSortKey = "category",
): Array<{
  category: SyncInsight["category"] | "all";
  label: string;
  insights: SyncInsight[];
}> {
  if (sort !== "category") {
    return [
      {
        category: "all",
        label: sort === "title-asc" ? "All insights A–Z" : "All insights Z–A",
        insights: sortInsights(SYNC_INSIGHTS, sort),
      },
    ];
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    label: SYNC_INSIGHT_CATEGORIES.find((entry) => entry.id === category)?.label ?? category,
    insights: sortInsights(
      SYNC_INSIGHTS.filter((insight) => insight.category === category),
      "title-asc",
    ),
  })).filter((group) => group.insights.length > 0);
}

export function getSyncInsight(id: string): SyncInsight | null {
  return SYNC_INSIGHTS.find((insight) => insight.id === id) ?? null;
}

/** Resolve the best catalog insight for the active query focus. */
export function insightForFocus(
  focus: QueryFocus | null | undefined,
  traits?: {
    risks?: ClimateRisk[];
    facts?: ClimateFact[];
    hazards?: ClimateHazard[];
  },
): SyncInsight | null {
  if (!focus) return null;

  const risks = traits?.risks ?? [];
  const facts = traits?.facts ?? [];
  const hazards = traits?.hazards ?? [];

  for (const risk of risks) {
    const hit = SYNC_INSIGHTS.find((insight) => insight.match?.risks?.includes(risk));
    if (hit) return hit;
  }
  for (const hazard of hazards) {
    const hit = SYNC_INSIGHTS.find((insight) => insight.match?.hazards?.includes(hazard));
    if (hit) return hit;
  }
  for (const fact of facts) {
    const hit = SYNC_INSIGHTS.find((insight) => insight.match?.facts?.includes(fact));
    if (hit) return hit;
  }

  if (focus.kind === "precip") {
    return (
      SYNC_INSIGHTS.find(
        (insight) =>
          insight.match?.focusKinds?.includes("precip") &&
          insight.match.precipPolarity === focus.polarity,
      ) ?? null
    );
  }

  if (focus.kind === "hazard") {
    for (const hazard of focus.hazards) {
      const hit = SYNC_INSIGHTS.find((insight) => insight.match?.hazards?.includes(hazard));
      if (hit) return hit;
    }
  }

  if (focus.kind === "climate_zone") {
    for (const fact of focus.facts) {
      const hit = SYNC_INSIGHTS.find((insight) => insight.match?.facts?.includes(fact));
      if (hit) return hit;
    }
  }

  return (
    SYNC_INSIGHTS.find((insight) => insight.match?.focusKinds?.includes(focus.kind)) ??
    (focus.kind === "full_climate" ? getSyncInsight("climate-analogue") : null)
  );
}

export function insightForQuery(raw: string): SyncInsight | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) return null;
  const exact = SYNC_INSIGHTS.find((insight) => insight.query.toLowerCase() === normalized);
  if (exact) return exact;
  return (
    SYNC_INSIGHTS.find(
      (insight) =>
        normalized.includes(insight.query.toLowerCase()) ||
        insight.title.toLowerCase().includes(normalized),
    ) ?? null
  );
}
