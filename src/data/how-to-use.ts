export type HowToTip = {
  id: string;
  title: string;
  body: string;
};

/** Short bullets shown in the first-visit welcome modal. */
export const WELCOME_HIGHLIGHTS = [
  "Drag the globe to rotate; scroll or pinch to zoom.",
  "Click a city marker to open its climate brief.",
  "Search a theme (flood, heat, drought…) or pick a Sync Insight to light up peer cities.",
  "Gold hubs and teal arcs show where climate fingerprints sync.",
] as const;

/** One tip per major feature — used on the How to Use page. */
export const HOW_TO_TIPS: HowToTip[] = [
  {
    id: "globe",
    title: "Navigate the globe",
    body: "Drag to rotate the Earth, scroll or pinch to zoom. Panning is disabled so the planet stays centered—orbit until the region you care about faces you.",
  },
  {
    id: "city-select",
    title: "Focus a city",
    body: "Click any marker to fly the camera there and open the city climate panel. The selected city highlights in gold so you always know what is in focus.",
  },
  {
    id: "climate-query",
    title: "Run a climate query",
    body: "In the Explore tab, type a free-text query—city names (“cities like Nairobi”), traits (“monsoon flooding”), or comparisons. Matching cities light up; non-matches dim so the sync pattern is readable.",
  },
  {
    id: "similarity",
    title: "Toggle similarity",
    body: "Similarity on finds peer cities that share climate fingerprints with your focus. Turn it off when you only want the selected or seeded city highlighted, without the peer network.",
  },
  {
    id: "sync-insights-explore",
    title: "Browse Sync Insights on the map",
    body: "The Explore tab lists curated climate themes. Choose one to set the query, open the insight panel, and draw hub-and-arc clusters across the globe.",
  },
  {
    id: "markers",
    title: "Read marker size and color",
    body: "Marker size follows the Cities tab sort (population by default). Gold marks selection, seeds, and sync hubs; teal marks climate matches; dimmed cities are outside the active query or filter.",
  },
  {
    id: "hubs-arcs",
    title: "Follow hubs and arcs",
    body: "When a query is active, gold epicenter hubs are strong local exemplars. Teal arcs connect peers whose fingerprints are close enough to justify a climate sync.",
  },
  {
    id: "city-panel",
    title: "Use the city climate panel",
    body: "After selecting a city, the right-side brief shows profile traits, 2020 vs 2040 climate bars, news, and hazard context. Minimize or close it when you want more globe space.",
  },
  {
    id: "sync-panel",
    title: "Read the Sync Insight panel",
    body: "An active insight opens a panel explaining the signal and listing linked cities. Collapse it to a vertical tab if you need the map, then reopen when you want the story again.",
  },
  {
    id: "cities-tab",
    title: "Filter and sort cities",
    body: "Switch to the Cities tab to search by name and change sort order. Sort drives marker sizing on the globe—useful when comparing population, name, or other rankings.",
  },
  {
    id: "insights-catalog",
    title: "Open the Sync Insights catalog",
    body: "The Sync Insights page in the sidebar is the full theme catalog. Open any card for sources and detail, then use “Open on globe” to jump straight into that query on Home.",
  },
  {
    id: "sidebar",
    title: "Move with the sidebar",
    body: "The left sidebar stays collapsed to icons by default. Expand it with ⌘B / Ctrl+B (or the header control) to reach Home, Sync Insights, How to Use, and About.",
  },
  {
    id: "limits",
    title: "Treat syncs as a starting map",
    body: "Fingerprints summarize climatic structure, not local terrain, infrastructure, or governance. Use Climate Sync to find analogues and jump-off points—not as a substitute for local hazard models.",
  },
];
