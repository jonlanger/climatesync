"use client";

import { useEffect, useState } from "react";

import type { City } from "@/data/cities";
import { fetchCityContext, type CityContextData } from "@/lib/city-context";

type ContextState =
  | { status: "idle" }
  | { status: "loading"; cityId: string }
  | { status: "ready"; cityId: string; data: CityContextData }
  | { status: "error"; cityId: string; message: string };

export function useCityContext(city: City | null) {
  const [state, setState] = useState<ContextState>({ status: "idle" });

  useEffect(() => {
    if (!city) {
      setState({ status: "idle" });
      return;
    }

    const cityId = city.id;
    let cancelled = false;
    setState({ status: "loading", cityId });

    fetchCityContext({
      cityId: city.id,
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
    })
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", cityId, data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load city context";
        setState({ status: "error", cityId, message });
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return state;
}
