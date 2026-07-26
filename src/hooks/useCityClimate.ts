"use client";

import { useEffect, useState } from "react";

import type { City } from "@/data/cities";
import { fetchCityClimate, type CityClimateData } from "@/lib/climate";

type ClimateState =
  | { status: "idle" }
  | { status: "loading"; cityId: string }
  | { status: "ready"; cityId: string; data: CityClimateData }
  | { status: "error"; cityId: string; message: string };

export function useCityClimate(city: City | null) {
  const [state, setState] = useState<ClimateState>({ status: "idle" });

  useEffect(() => {
    if (!city) {
      setState({ status: "idle" });
      return;
    }

    const cityId = city.id;
    let cancelled = false;
    setState({ status: "loading", cityId });

    fetchCityClimate(city)
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", cityId, data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Failed to load climate data";
        setState({ status: "error", cityId, message });
      });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return state;
}
