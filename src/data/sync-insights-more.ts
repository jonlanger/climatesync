import type { SyncInsight } from "@/data/sync-insights";
import type { SyncInsightIconName, SyncInsightPhoto } from "@/data/sync-insight-icons";

type InsightDraft = Omit<SyncInsight, "links" | "citations" | "image" | "icon"> & {
  image?: SyncInsightPhoto | null;
  icon?: SyncInsightIconName;
  links?: SyncInsight["links"];
  citations?: SyncInsight["citations"];
};

const IPCC = {
  label: "IPCC AR6",
  href: "https://www.ipcc.ch/report/ar6/wg2/",
  detail: "Impacts, adaptation, and vulnerability assessment.",
} as const;

const OPEN_METEO = {
  label: "Open-Meteo CMIP6",
  href: "https://open-meteo.com/en/docs/climate-api",
  detail: "City climate fingerprints used for sync matching.",
} as const;

const WMO = { label: "WMO topics", href: "https://wmo.int/topics" } as const;

/** Photos not used by core insights — each assigned at most once. */
const PHOTOS = {
  floodStreet: {
    src: "https://images.unsplash.com/photo-1661868668264-35233e0e0dac?auto=format&fit=crop&w=1200&q=80",
    alt: "People riding bicycles through a flooded city street",
    credit: "Unsplash",
    creditHref: "https://unsplash.com/photos/people-riding-bicycles-through-a-flooded-street-P7Z3HwNWPeQ",
  },
  floodHomes: {
    src: "https://images.unsplash.com/photo-1741081038901-f258dd2f5a1c?auto=format&fit=crop&w=1200&q=80",
    alt: "Floodwater surrounding homes with a person standing in the water",
    credit: "Unsplash",
    creditHref: "https://unsplash.com/photos/flooding-engulfs-homes-and-a-person-stands-in-the-water-jE_XQeC788s",
  },
  smoke: {
    src: "https://images.unsplash.com/photo-1600298881974-6be191ceeda1?auto=format&fit=crop&w=1200&q=80",
    alt: "Smoke haze over a landscape",
    credit: "Unsplash",
    creditHref: "https://unsplash.com/photos/1600298881974-6be191ceeda1",
  },
  city: {
    src: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
    alt: "Dense city skyline",
    credit: "Unsplash / Pedro Lastra",
    creditHref: "https://unsplash.com/photos/aerial-photography-of-cityscape-euycxJKB8BA",
  },
  earth: {
    src: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    alt: "Earth from space",
    credit: "Unsplash / NASA",
    creditHref: "https://unsplash.com/photos/photo-of-outer-space-yZygONrUBe8",
  },
  fog: {
    src: "https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1200&q=80",
    alt: "Fog over a city skyline",
    credit: "Unsplash",
    creditHref: "https://unsplash.com/photos/1487621167305-5d248087c724",
  },
  wetland: {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    alt: "Misty wetland hills",
    credit: "Unsplash / Luca Bravo",
    creditHref: "https://unsplash.com/photos/foggy-mountain-summit-ESkKOwio0lA",
  },
  glacier: {
    src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=80",
    alt: "Glacier ice and snow",
    credit: "Unsplash / Benjamin Voros",
    creditHref: "https://unsplash.com/photos/aerial-photography-of-snow-covered-mountain-HJxFs7Xu5Ek",
  },
} as const;

type Visual =
  | { photo: (typeof PHOTOS)[keyof typeof PHOTOS]; icon: SyncInsightIconName }
  | { photo?: null; icon: SyncInsightIconName };

function insight(draft: InsightDraft, visual: Visual): SyncInsight {
  return {
    ...draft,
    links: draft.links ?? [WMO, { label: "IPCC reports", href: "https://www.ipcc.ch/" }],
    citations: draft.citations ?? [IPCC, OPEN_METEO],
    image: draft.image ?? visual.photo ?? null,
    icon: draft.icon ?? visual.icon,
  };
}


/**
 * Extended Sync Insight catalog (+50). Merged into SYNC_INSIGHTS at module load.
 * Queries are intentionally distinct so catalog clicks activate unique globe clusters.
 */
export const ADDITIONAL_SYNC_INSIGHTS: SyncInsight[] = [
  insight(
    {
      id: "urban-flooding",
      title: "Urban flooding",
      category: "water",
      query: "urban flood",
      summary: "Cities where intense rainfall meets impermeable surfaces and stressed drainage.",
      blurb: `Urban flooding sync highlights climates with heavy rainfall signals that matter most where concrete, culverts, and combined sewers decide whether a downpour is a nuisance or a crisis.

The climate fingerprint is wet-season intensity; the urban layer is what turns millimeters into street-level impact. Synced cities can compare permeable paving, detention basins, early warnings, and building codes under similar rainfall regimes.`,
      match: { risks: ["heavy_rainfall"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { photo: PHOTOS.floodStreet, icon: "House" },
  ),
  insight(
    {
      id: "flash-flood-climates",
      title: "Flash-flood climates",
      category: "water",
      query: "flash flood",
      summary: "Steep rainfall peaks that can overwhelm catchments within hours.",
      blurb: `Flash-flood climates combine high wettest-month totals with concentrated precipitation. Water arrives fast; catchments have little time to respond.

Syncing these cities emphasizes hydrologic timing—not just annual averages. Early-warning lead times, upstream gauges, and debris-flow awareness travel well across analogues.`,
      match: { risks: ["heavy_rainfall", "landslide_risk"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "Zap" },
  ),
  insight(
    {
      id: "wet-season-extremes",
      title: "Wet-season extremes",
      category: "water",
      query: "wet season",
      summary: "Places where a few wet months dominate the annual water budget.",
      blurb: `Wet-season extremes sync cities whose precip concentration is high: most of the year’s rain falls in a short window. That pattern drives reservoir operations, flood calendars, and disease seasonality.

Compare how peers stage temporary shelters, clear drains before onset, and manage post-season drought rebound.`,
      match: { risks: ["monsoon_pattern", "heavy_rainfall"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "CloudRain" },
  ),
  insight(
    {
      id: "dry-season-stress",
      title: "Dry-season stress",
      category: "water",
      query: "dry season",
      summary: "Climates with long arid stretches that strain water supply and vegetation.",
      blurb: `Dry-season stress is the other half of concentrated rainfall: when the wet months end, supply must stretch. Synced cities share thin driest-month totals and elevated drought signals.

Adaptation themes include demand management, aquifer banking during wet months, and drought-tolerant urban landscaping.`,
      match: { risks: ["drought_stress"], focusKinds: ["precip"], precipPolarity: "dry" },
    },
    { icon: "Sun" },
  ),
  insight(
    {
      id: "water-scarcity-cities",
      title: "Chronic water scarcity",
      category: "water",
      query: "water scarcity",
      summary: "Low annual precipitation climates where scarcity is structural, not episodic.",
      blurb: `Chronic scarcity climates sit near the bottom of the annual precip distribution. Every dry year bites harder because the baseline is already thin.

Sync connects arid and semi-arid cities so utilities and planners can compare reuse, desalination where coastal, and allocation under similar climatic water budgets.`,
      match: { risks: ["drought_stress"], facts: ["arid", "semi_arid"], focusKinds: ["precip"], precipPolarity: "dry" },
    },
    { icon: "CircleGauge" },
  ),
  insight(
    {
      id: "humid-tropics-rain",
      title: "Humid tropical rainfall",
      category: "water",
      query: "humid tropical rain",
      summary: "Warm, wet climates with high annual totals and limited cool seasons.",
      blurb: `Humid tropical rainfall sync clusters cities that are both warm year-round and wet. Heat and moisture together shape mold, mosquito seasons, and cooling demand even outside “extreme” events.

The globe links places that share hydrologic abundance with thermal steadiness—useful for comparing drainage and public-health playbooks.`,
      match: { facts: ["tropical", "humid"], risks: ["heavy_rainfall"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "Palmtree" },
  ),
  insight(
    {
      id: "compound-flood-risk",
      title: "Compound flood risk",
      category: "water",
      query: "compound flood",
      summary: "Rainfall climates that often coincide with coastal surge or river backwater pressure.",
      blurb: `Compound flooding emerges when heavy rain coincides with surge, high tides, or saturated soils. Climate Sync cannot model every estuary, but it can group cities with both intense precip signals and coastal hazard overlays.

Use this sync to compare multi-hazard planning: joint rainfall–surge forecasts, elevated critical assets, and nature-based buffers.`,
      match: { risks: ["heavy_rainfall", "storm_risk"], hazards: ["storm_surge"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { photo: PHOTOS.floodHomes, icon: "TriangleAlert" },
  ),
  insight(
    {
      id: "landslide-rainfall",
      title: "Rainfall-driven landslides",
      category: "water",
      query: "rainfall landslide",
      summary: "Concentrated wet seasons that raise slope-failure potential on steep terrain.",
      blurb: `Landslide-prone rainfall climates show intense wet-month peaks or high annual totals with concentrated seasons. On steep or deforested slopes, that water becomes mass movement.

Synced cities can share slope monitoring, land-use setbacks, and early-warning thresholds calibrated to similar rainfall intensity.`,
      match: { risks: ["landslide_risk", "heavy_rainfall"] },
    },
    { icon: "TriangleAlert" },
  ),
  insight(
    {
      id: "reservoir-stress",
      title: "Reservoir & runoff stress",
      category: "water",
      query: "reservoir stress",
      summary: "Climates where seasonal precip swings challenge storage and runoff reliability.",
      blurb: `Where precipitation is highly seasonal, reservoirs must capture a short pulse and release it for months. Syncing these climates highlights shared storage mathematics even when river names differ.

Compare forecast-informed operations, conjunctive groundwater use, and interannual drought buffers.`,
      match: { risks: ["monsoon_pattern", "drought_stress"], focusKinds: ["precip"] },
    },
    { photo: PHOTOS.wetland, icon: "Droplets" },
  ),
  insight(
    {
      id: "humidity-heat",
      title: "Humid heat stress",
      category: "temperature",
      query: "humid heat",
      summary: "Warm, moist climates where humidity amplifies heat stress beyond dry-bulb temperature.",
      blurb: `Humid heat is not the same as desert heat. When nights stay warm and moisture is high, bodies cool less efficiently. Climate Sync links tropical and humid cities with elevated heat signals.

Adaptation leans on shade, ventilation, night-time cooling centers, and labor protections timed to wet-bulb risk—not only peak afternoon highs.`,
      match: { risks: ["extreme_heat"], facts: ["humid", "tropical"], focusKinds: ["heat"] },
    },
    { icon: "Droplets" },
  ),
  insight(
    {
      id: "urban-heat-island",
      title: "Urban heat burden",
      category: "temperature",
      query: "urban heat",
      summary: "Cities already flagged for extreme heat where built form can intensify nights.",
      blurb: `Urban heat burden sync starts from climates with hot-month extremes, then invites comparison of how dense cities trap heat after sunset.

Cool roofs, tree canopy, reflective pavements, and heat-health warning systems are the shared toolkit across synced peers.`,
      match: { risks: ["extreme_heat"], facts: ["warming_hotspot"], focusKinds: ["heat"] },
    },
    { photo: PHOTOS.city, icon: "Building2" },
  ),
  insight(
    {
      id: "nighttime-heat",
      title: "Warm nights & heat persistence",
      category: "temperature",
      query: "warm nights",
      summary: "High annual and hot-month means that leave little overnight recovery from heat.",
      blurb: `When mean temperatures stay elevated, nights provide less recovery. That persistence drives hospital load and energy peaks differently from a single scorching afternoon.

Sync these cities to compare overnight cooling strategies and building envelope standards under similar thermal baselines.`,
      match: { risks: ["extreme_heat"], focusKinds: ["heat"] },
    },
    { icon: "Moon" },
  ),
  insight(
    {
      id: "cold-wave-cities",
      title: "Cold-wave exposure",
      category: "temperature",
      query: "cold wave",
      summary: "Climates with harsh cold months and freeze risk for people and infrastructure.",
      blurb: `Cold-wave sync groups cities whose coldest-month means plunge low enough to stress housing, pipes, and unhoused populations.

Shared lessons include weatherization, warming centers, and freeze-protection for water systems—especially as climate variability still delivers deep cold even in a warming world.`,
      match: { risks: ["extreme_cold"], focusKinds: ["cold"] },
    },
    { icon: "Snowflake" },
  ),
  insight(
    {
      id: "freeze-thaw-stress",
      title: "Freeze–thaw infrastructure stress",
      category: "temperature",
      query: "freeze thaw",
      summary: "Strong seasonality climates that cycle through freezing and thawing repeatedly.",
      blurb: `Large seasonal temperature swings mean roads, rails, and pipes endure freeze–thaw cycles. High-seasonality climates cluster here.

Compare pavement specs, leak detection, and winter maintenance budgets among cities with similar annual temperature amplitudes.`,
      match: { risks: ["high_seasonality", "extreme_cold"], focusKinds: ["seasonality"] },
    },
    { icon: "ArrowLeftRight" },
  ),
  insight(
    {
      id: "continental-swings",
      title: "Continental temperature swings",
      category: "temperature",
      query: "continental climate",
      summary: "Inland climates with hot summers, cold winters, and wide annual ranges.",
      blurb: `Continental climates demand dual readiness: heat plans for summer and freeze plans for winter. Syncing them surfaces places that already design for both poles of the thermometer.

Energy systems, building codes, and emergency stockpiles look different here than in oceanic climates.`,
      match: { facts: ["continental"], risks: ["high_seasonality"], focusKinds: ["seasonality"] },
    },
    { icon: "Orbit" },
  ),
  insight(
    {
      id: "mild-oceanic",
      title: "Mild oceanic climates",
      category: "temperature",
      query: "oceanic mild",
      summary: "Maritime climates with moderated seasons and fewer temperature extremes.",
      blurb: `Oceanic climates trade extremes for steadiness: cool summers, mild winters, and limited seasonality. That does not mean zero risk—flooding and storms still matter—but heat and cold flags are often quieter.

Sync these cities to compare how mild baselines shape housing stock and when rare extremes still surprise.`,
      match: { facts: ["oceanic", "temperate"], focusKinds: ["climate_zone"] },
    },
    { photo: PHOTOS.fog, icon: "CloudFog" },
  ),
  insight(
    {
      id: "heat-drought-compound",
      title: "Heat–drought compound risk",
      category: "temperature",
      query: "heat drought",
      summary: "Hot, dry climates where heat and water stress reinforce each other.",
      blurb: `Heat and drought compound: dry soils warm faster, and heat raises evaporative demand. Cities with both extreme-heat and drought-stress flags belong in this sync.

Look for shared strategies in irrigation limits, outdoor labor rules, and vegetation that survives both heat and aridity.`,
      match: { risks: ["extreme_heat", "drought_stress"], focusKinds: ["heat"] },
    },
    { icon: "Gauge" },
  ),
  insight(
    {
      id: "warming-megacities",
      title: "Warming megacity hotspots",
      category: "temperature",
      query: "megacity heat hotspot",
      summary: "Locations already showing very high hot-month means in the climate profile.",
      blurb: `Warming hotspots are cities where hottest-month means already sit in extreme territory. Syncing them is a peer network for heat governance under today’s climate—not only 2050 scenarios.

Compare heat action plans, informal settlement outreach, and grid resilience under similar thermal stress.`,
      match: { facts: ["warming_hotspot"], risks: ["extreme_heat"], focusKinds: ["heat"] },
    },
    { icon: "Sparkles" },
  ),
  insight(
    {
      id: "tropical-cyclone-belt",
      title: "Tropical cyclone climates",
      category: "storm",
      query: "tropical cyclone",
      summary: "Wet-season intensity climates that align with cyclone and severe-storm regimes.",
      blurb: `Tropical cyclone climates show concentrated wet seasons and storm-risk flags. The sync is climatic—not a track forecast—but it groups cities that plan for wind, rain, and surge together.

Share building codes, evacuation logistics, and post-storm power restoration among peers with similar storm-season hydrographs.`,
      match: { risks: ["storm_risk", "heavy_rainfall"], hazards: ["storm_surge"], focusKinds: ["hazard"] },
    },
    { icon: "Cloudy" },
  ),
  insight(
    {
      id: "severe-convective",
      title: "Severe convective weather",
      category: "storm",
      query: "severe storm",
      summary: "Climates with intense wet peaks that support thunderstorm and severe-storm seasons.",
      blurb: `Severe convective weather thrives where moisture and instability concentrate. Climate Sync uses wet-season intensity as a proxy for storm-prone regimes.

Peers can compare warning dissemination, hail-resistant roofs, and drainage sized for short-duration extremes.`,
      match: { risks: ["storm_risk"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "CloudLightning" },
  ),
  insight(
    {
      id: "windstorm-exposure",
      title: "Windstorm exposure belts",
      category: "storm",
      query: "windstorm",
      summary: "Storm-risk climates where wind and rain extremes often arrive together.",
      blurb: `Windstorm sync is for cities whose climate profiles already carry storm-risk labels. It is a starting map for comparing canopy management, temporary structure rules, and grid hardening.

Pair with local wind climatologies—the global sync shows who shares the broad regime.`,
      match: { risks: ["storm_risk"] },
    },
    { icon: "Wind" },
  ),
  insight(
    {
      id: "monsoon-storms",
      title: "Monsoon storm seasons",
      category: "storm",
      query: "monsoon storm",
      summary: "Monsoon-pattern cities where wet-season storms dominate the hazard calendar.",
      blurb: `Monsoon storm seasons pack convective rain, flooding, and sometimes landslides into a predictable window. Synced cities share that calendar even across continents.

Pre-season drain clearance and temporary flood barriers are common adaptations worth comparing.`,
      match: { risks: ["monsoon_pattern", "storm_risk"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "Umbrella" },
  ),
  insight(
    {
      id: "coastal-storm-corridor",
      title: "Coastal storm corridors",
      category: "storm",
      query: "coastal storm",
      summary: "Storm-risk cities with coastal surge or erosion overlays.",
      blurb: `Coastal storm corridors combine climatic storm signals with shoreline hazards. Rain inland and water from the sea can arrive in the same event.

Sync to exchange surge mapping, critical-facility siting, and nature-based shoreline defenses.`,
      match: { risks: ["storm_risk"], hazards: ["storm_surge", "coastal_erosion"] },
    },
    { icon: "RadioTower" },
  ),
  insight(
    {
      id: "bushfire-weather",
      title: "Bushfire weather climates",
      category: "fire",
      query: "bushfire",
      summary: "Hot, dry climates that favor dangerous fire weather seasons.",
      blurb: `Bushfire weather climates show hot months, limited rainfall, and dry-month extremes. Vegetation and ignition complete the risk, but climate sets the stage.

Synced cities compare fire bans, ember-resistant building details, and smoke-ready public health messaging.`,
      match: { risks: ["wildfire_risk"], focusKinds: ["hazard"] },
    },
    { icon: "Flame" },
  ),
  insight(
    {
      id: "wildfire-smoke",
      title: "Wildfire smoke corridors",
      category: "fire",
      query: "wildfire smoke",
      summary: "Fire-weather climates where smoke can degrade air quality far from the flame front.",
      blurb: `Smoke is a regional hazard attached to fire-weather climates. Even cities without local wildland interface can breathe smoke from distant fires under the right synoptic setup.

Use this sync to compare clean-air shelters, school closure policies, and air-quality alert systems.`,
      match: { risks: ["wildfire_risk"] },
    },
    { photo: PHOTOS.smoke, icon: "CloudFog" },
  ),
  insight(
    {
      id: "dry-lightning-fire",
      title: "Dry-season fire potential",
      category: "fire",
      query: "dry fire season",
      summary: "Drought-stressed, hot climates where fuels dry and fire seasons lengthen.",
      blurb: `Dry-season fire potential rises where drought stress and heat coincide. Climate Sync flags the climatic readiness for fire; land management decides outcomes.

Peers share prescribed-fire governance, defensible-space rules, and seasonal readiness calendars.`,
      match: { risks: ["wildfire_risk", "drought_stress"] },
    },
    { icon: "House" },
  ),
  insight(
    {
      id: "peat-fire-humid",
      title: "Peat & landscape fire humidity paradox",
      category: "fire",
      query: "peat fire",
      summary: "Regions that can be wet annually but still face landscape fire in dry windows.",
      blurb: `Some humid climates still burn when short dry spells dry organic soils or cleared land. The sync mixes fire-weather signals with monsoon or humid facts to find that paradox.

Compare drainage of peatlands, haze diplomacy, and dry-spell fire bans among peers.`,
      match: { risks: ["wildfire_risk"], facts: ["humid"] },
    },
    { icon: "Leaf" },
  ),
  insight(
    {
      id: "seismic-megacities",
      title: "Seismic megacity risk",
      category: "geologic",
      query: "earthquake megacity",
      summary: "Dense urban centers sitting on mapped earthquake hazard overlays.",
      blurb: `Seismic megacity sync is geographic: climate similarity is secondary to shared earthquake overlays. Still, climate matters for post-quake cascading failures—rain after shaking, heat during displacement.

Compare retrofit programs, early warning, and emergency shelter standards across synced cities.`,
      match: { hazards: ["earthquake"], focusKinds: ["hazard"] },
    },
    { icon: "Building2" },
  ),
  insight(
    {
      id: "volcanic-ash-cities",
      title: "Volcanic ash exposure",
      category: "geologic",
      query: "volcanic ash",
      summary: "Cities within regional volcanic hazard zones.",
      blurb: `Volcanic ash can shut airports, clog drains, and harm lungs far from the crater. This sync groups cities with volcano overlays so preparedness playbooks can travel.

Ashfall cleanup, roof load standards, and respiratory guidance are recurring themes.`,
      match: { hazards: ["volcano"], focusKinds: ["hazard"] },
    },
    { icon: "Mountain" },
  ),
  insight(
    {
      id: "tsunami-ready-coasts",
      title: "Tsunami-ready coasts",
      category: "geologic",
      query: "tsunami coast",
      summary: "Coastal cities with tsunami hazard overlays from nearby seismic sources.",
      blurb: `Tsunami-ready coasts share evacuation signage cultures, vertical refuge thinking, and siren networks. Climate Sync marks them via hazard overlays, then invites comparison of drills and land-use setbacks.

Pair with storm-surge planning—many coasts face both deep-ocean and meteorological water threats.`,
      match: { hazards: ["tsunami"], focusKinds: ["hazard"] },
    },
    { icon: "Ship" },
  ),
  insight(
    {
      id: "multi-hazard-pacific",
      title: "Multi-hazard Pacific rim",
      category: "geologic",
      query: "pacific multi hazard",
      summary: "Cities stacking earthquake, volcano, and tsunami overlays.",
      blurb: `Some cities inherit a stack of geologic hazards. Multi-hazard sync finds places where earthquake, volcano, and tsunami flags coincide.

Integrated drills, shared EOCs, and cascading-failure planning matter more than single-hazard silos here.`,
      match: { hazards: ["earthquake", "volcano", "tsunami"] },
    },
    { icon: "ShieldAlert" },
  ),
  insight(
    {
      id: "dust-storm-belts",
      title: "Dust-storm belts",
      category: "geologic",
      query: "dust storm belt",
      summary: "Arid cities with dust-storm hazard overlays and dry climate signals.",
      blurb: `Dust-storm belts combine arid climates with wind-driven dust overlays. Health, aviation, and road safety all feel the haze.

Synced cities compare dust forecasting, school closure thresholds, and land restoration upwind.`,
      match: { hazards: ["dust_storm"], facts: ["arid", "semi_arid"], focusKinds: ["hazard"] },
    },
    { icon: "Sunrise" },
  ),
  insight(
    {
      id: "sea-level-pressure",
      title: "Sea-level & shoreline pressure",
      category: "coastal",
      query: "shoreline sea level",
      summary: "Coastal cities facing surge and erosion pressure under rising seas.",
      blurb: `Sea-level pressure sync groups coastal erosion and storm-surge overlays. The climatic story is water at the edge; the planning story is what stays dry in 2040 and 2080.

Compare managed retreat debates, elevated infrastructure, and living shorelines among peers.`,
      match: { hazards: ["storm_surge", "coastal_erosion"], focusKinds: ["hazard"] },
    },
    { icon: "MapPinned" },
  ),
  insight(
    {
      id: "delta-cities",
      title: "Delta & lowland coasts",
      category: "coastal",
      query: "delta city",
      summary: "Low coastal cities where rainfall, rivers, and surge can compound.",
      blurb: `Delta cities often sit at the intersection of heavy rainfall climates and coastal hazards. Subsidence and channelization amplify every wet signal.

Sync to exchange polder logic, pump capacity planning, and sediment management lessons.`,
      match: { risks: ["heavy_rainfall"], hazards: ["storm_surge", "coastal_erosion"] },
    },
    { icon: "Combine" },
  ),
  insight(
    {
      id: "saltwater-coasts",
      title: "Saltwater intrusion coasts",
      category: "coastal",
      query: "saltwater intrusion",
      summary: "Coasts where drought inland and surge at the shore threaten freshwater lenses.",
      blurb: `Saltwater intrusion links dry climate stress with coastal exposure. When rivers run low and seas push in, drinking water and agriculture suffer.

Peers compare barrier wells, alternative supply, and land-use limits on coastal aquifers.`,
      match: { risks: ["drought_stress"], hazards: ["coastal_erosion", "storm_surge"] },
    },
    { icon: "Waves" },
  ),
  insight(
    {
      id: "erosion-hotspots",
      title: "Coastal erosion hotspots",
      category: "coastal",
      query: "coastal erosion hotspot",
      summary: "Shorelines flagged for erosion overlays and wave climate pressure.",
      blurb: `Erosion hotspots lose land grain by grain—or storm by storm. Climate Sync marks them with coastal erosion hazards so planners can find peers already negotiating setbacks and nourishment.

Nature-based and gray defenses both appear in these conversations.`,
      match: { hazards: ["coastal_erosion"], focusKinds: ["hazard"] },
    },
    { icon: "Castle" },
  ),
  insight(
    {
      id: "port-city-surge",
      title: "Port city surge risk",
      category: "coastal",
      query: "port surge",
      summary: "Trade hubs with storm-surge overlays where downtime has regional costs.",
      blurb: `Port cities with surge overlays face economic cascading risk: a closed terminal ripples inland. Syncing them highlights continuity planning under similar coastal hazard flags.

Compare wharf elevation, backup power, and mutual-aid berthing agreements.`,
      match: { hazards: ["storm_surge"], risks: ["storm_risk"] },
    },
    { icon: "Anchor" },
  ),
  insight(
    {
      id: "island-climate-stress",
      title: "Island climate stress",
      category: "coastal",
      query: "island climate",
      summary: "Island and peninsula climates balancing limited freshwater with coastal hazards.",
      blurb: `Island climates often combine constrained water catchments with coastal exposure. Even humid islands can face dry-season stress; arid ones feel every ship-delivered supply delay.

Sync for desalination governance, tourist-season demand spikes, and shoreline defense at small scales.`,
      match: { hazards: ["storm_surge", "coastal_erosion"], focusKinds: ["climate_zone"] },
    },
    { icon: "Sailboat" },
  ),
  insight(
    {
      id: "arid-cities",
      title: "Arid city climates",
      category: "climate",
      query: "arid city",
      summary: "Desert and near-desert urban climates with very low annual rainfall.",
      blurb: `Arid city sync is a climate-zone cluster: low precip, high evaporative demand, and often heat. Design languages—shade streets, night ventilation, water thrift—recur across continents.

Use analogues to borrow urban form ideas that already work in dry air.`,
      match: { facts: ["arid"], focusKinds: ["climate_zone"] },
    },
    { icon: "ThermometerSun" },
  ),
  insight(
    {
      id: "semi-arid-belt",
      title: "Semi-arid transition belt",
      category: "climate",
      query: "semi arid",
      summary: "Climates between true desert and humid zones, sensitive to rainfall swings.",
      blurb: `Semi-arid belts are transition climates: a wetter decade looks hopeful; a drier one looks like desertification. Synced cities share that sensitivity.

Compare drought indices, grazing and peri-urban agriculture rules, and early drought finance triggers.`,
      match: { facts: ["semi_arid"], focusKinds: ["climate_zone"] },
    },
    { icon: "LandPlot" },
  ),
  insight(
    {
      id: "mediterranean-cities",
      title: "Mediterranean-type climates",
      category: "climate",
      query: "mediterranean city",
      summary: "Dry-summer, wetter-winter climates with fire and water management dualities.",
      blurb: `Mediterranean-type climates couple pleasant winters with dry, fire-prone summers. Water planning and wildfire readiness are twin seasons.

Sync cities across basins that share this rhythm even when languages differ.`,
      match: { facts: ["mediterranean"], focusKinds: ["climate_zone"] },
    },
    { icon: "Compass" },
  ),
  insight(
    {
      id: "subtropical-humid",
      title: "Humid subtropical belts",
      category: "climate",
      query: "humid subtropical",
      summary: "Warm summers, milder winters, and meaningful humidity and rainfall.",
      blurb: `Humid subtropical belts support dense cities with hot summers and wet spells. Heat and flood both appear on the calendar.

Analogues help compare hurricane or typhoon preparedness where storm flags also light up.`,
      match: { facts: ["subtropical", "humid"], focusKinds: ["climate_zone"] },
    },
    { icon: "Trees" },
  ),
  insight(
    {
      id: "tropical-megacities",
      title: "Tropical megacity climates",
      category: "climate",
      query: "tropical megacity",
      summary: "Year-round warmth with tropical rainfall regimes in major urban centers.",
      blurb: `Tropical megacity climates never really get a cool season. Cooling demand is structural; rainfall is often intense and seasonal.

Sync for transit heat comfort, informal settlement flood risk, and vector control under similar thermal baselines.`,
      match: { facts: ["tropical"], focusKinds: ["climate_zone"] },
    },
    { icon: "Factory" },
  ),
  insight(
    {
      id: "temperate-cities",
      title: "Temperate urban climates",
      category: "climate",
      query: "temperate city",
      summary: "Moderate climates without tropical warmth or polar cold as the dominant label.",
      blurb: `Temperate cities often feel “easy” until extremes arrive. Syncing them shows how moderate baselines can hide rising heat tails and changing storm stats.

Compare how peers update design days and emergency thresholds as the distribution shifts.`,
      match: { facts: ["temperate"], focusKinds: ["climate_zone"] },
    },
    { icon: "CloudFog" },
  ),
  insight(
    {
      id: "polar-adjacent",
      title: "Polar & near-polar cities",
      category: "climate",
      query: "polar city",
      summary: "Cold-climate cities with polar or extreme-cold signals in the profile.",
      blurb: `Polar and near-polar cities live with darkness, freeze, and thawing permafrost risks in some regions. Climate Sync flags the cold end of the spectrum.

Warming here is rapid; analogues help compare infrastructure on thawing ground and changing sea ice seasons.`,
      match: { facts: ["polar"], risks: ["extreme_cold"], focusKinds: ["climate_zone"] },
    },
    { photo: PHOTOS.glacier, icon: "Snowflake" },
  ),
  insight(
    {
      id: "highland-cool",
      title: "Highland cool climates",
      category: "climate",
      query: "highland climate",
      summary: "Elevated cities where altitude moderates heat but can sharpen rainfall extremes.",
      blurb: `Highland climates can feel temperate near the equator because elevation replaces latitude. Rainfall and landslides often remain serious.

Sync elevated cities to compare slope management and the unique energy mix of cool nights with tropical sun.`,
      match: { facts: ["temperate", "oceanic"], risks: ["landslide_risk"], focusKinds: ["climate_zone"] },
    },
    { icon: "Earth" },
  ),
  insight(
    {
      id: "future-climate-twins",
      title: "Future climate twins",
      category: "analogue",
      query: "future twin",
      summary: "Use similarity search to find today’s cities that resemble another city’s emerging climate.",
      blurb: `Future climate twins are the core analogue idea: City A’s 2040 may look like City B’s 2020. Climate Sync’s similarity engine is built for that exploration.

Activate a seed city, enable similarity, and read the arcs as a network of possible futures already lived somewhere else.`,
      match: { focusKinds: ["full_climate"] },
    },
    { photo: PHOTOS.earth, icon: "Sparkles" },
  ),
  insight(
    {
      id: "heat-analogue-network",
      title: "Heat analogue network",
      category: "analogue",
      query: "heat analogue",
      summary: "Cities linked by shared extreme-heat fingerprints across regions.",
      blurb: `A heat analogue network connects places that already endure similar hot-month means. Policy transfer is faster when the thermal math matches.

Look for peers with successful cooling centers, shaded mobility, and heat-health thresholds.`,
      match: { risks: ["extreme_heat"], focusKinds: ["heat"] },
    },
    { icon: "Binary" },
  ),
  insight(
    {
      id: "flood-analogue-network",
      title: "Flood analogue network",
      category: "analogue",
      query: "flood analogue",
      summary: "Cities synced by heavy-rainfall structure rather than shared rivers.",
      blurb: `Flood analogues are hydrologic cousins: similar wet-month intensity and precip concentration. They may sit on different continents but face comparable design storms.

Exchange drainage standards and floodplain ordinances across the network.`,
      match: { risks: ["heavy_rainfall"], focusKinds: ["precip"], precipPolarity: "wet" },
    },
    { icon: "Network" },
  ),
  insight(
    {
      id: "drought-analogue-network",
      title: "Drought analogue network",
      category: "analogue",
      query: "drought analogue",
      summary: "Water-stressed climates that can share scarcity playbooks.",
      blurb: `Drought analogues share thin water budgets. When one city pilots reuse or allocation reform, peers with matching drought-stress flags are the natural audience.

Similarity arcs make that peer set visible on the globe.`,
      match: { risks: ["drought_stress"], focusKinds: ["precip"], precipPolarity: "dry" },
    },
    { icon: "Waypoints" },
  ),
  insight(
    {
      id: "cross-latitude-sync",
      title: "Cross-latitude climate sync",
      category: "analogue",
      query: "cross latitude",
      summary: "Full-climate similarity that ignores hemisphere and finds unexpected twins.",
      blurb: `Cross-latitude sync celebrates surprising matches: a southern-hemisphere city whose monthly climate vector aligns with a northern peer. Seasons flip on the calendar, but the shape of the year can still rhyme.

Use this mode to break regional silos in adaptation learning.`,
      match: { focusKinds: ["full_climate"] },
    },
    { icon: "Globe2" },
  ),
  insight(
    {
      id: "risk-overlap-peers",
      title: "Multi-risk overlap peers",
      category: "analogue",
      query: "multi risk",
      summary: "Cities sharing multiple risk flags—heat and flood, drought and fire, and more.",
      blurb: `Multi-risk peers are places where several climate risk labels fire at once. Adaptation cannot be single-issue.

Sync them to study integrated risk offices, compound-event scenarios, and budget processes that fund more than one hazard.`,
      match: { risks: ["extreme_heat", "heavy_rainfall"], focusKinds: ["full_climate"] },
    },
    { icon: "Layers" },
  ),
  insight(
    {
      id: "adaptation-peer-cities",
      title: "Adaptation peer discovery",
      category: "analogue",
      query: "adaptation peers",
      summary: "Start from any city and discover climate peers worth learning from.",
      blurb: `Adaptation peer discovery is the product promise: not a ranking of “most at risk,” but a map of who faces similar climate math.

Pick a city on the globe, keep similarity on, and treat high-scoring matches as a shortlist for exchange visits and shared metrics.`,
      match: { focusKinds: ["full_climate"] },
    },
    { icon: "Users" },
  ),
];
