"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { CITIES, type City } from "@/data/cities";
import { markerTier } from "@/lib/city-list";
import { latLonToVector3 } from "@/lib/geo";
import { EARTH_RADIUS } from "./TwoToneEarth";

type CityMarkersProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  matchedIds?: Set<string> | null;
  matchScores?: Map<string, number> | null;
  seedCityId?: string | null;
  /** Cluster hubs for the active query (gold rings). */
  epicenterIds?: Set<string> | null;
  queryActive?: boolean;
  /** Rank 1 = largest marker; driven by the active city-list sort. */
  sizeRanks?: Map<string, number> | null;
  /** When set, cities outside the filter are dimmed on the globe. */
  filteredIds?: Set<string> | null;
  onHoverCity?: (cityId: string | null, point?: { x: number; y: number }) => void;
};

const MAJOR_RADIUS = 0.018;
const MAJOR_SELECTED_RADIUS = 0.028;
const SECONDARY_RADIUS = 0.009;
const SECONDARY_SELECTED_RADIUS = 0.016;
const TERTIARY_RADIUS = 0.0055;
const TERTIARY_SELECTED_RADIUS = 0.011;

const TIER_RADIUS = {
  major: { base: MAJOR_RADIUS, selected: MAJOR_SELECTED_RADIUS },
  secondary: { base: SECONDARY_RADIUS, selected: SECONDARY_SELECTED_RADIUS },
  tertiary: { base: TERTIARY_RADIUS, selected: TERTIARY_SELECTED_RADIUS },
} as const;

function markerRadius(
  tier: "major" | "secondary" | "tertiary",
  selected: boolean,
  matched: boolean,
  score: number,
) {
  const sizes = TIER_RADIUS[tier];
  if (selected) return sizes.selected;
  if (matched) {
    const boost = 0.7 + score * 0.45;
    return sizes.base * boost;
  }
  return sizes.base;
}

function CityMarker({
  city,
  selected,
  matched,
  seed,
  score,
  queryActive,
  filteredOut,
  sizeRank,
  onSelect,
  onHoverCity,
}: {
  city: City;
  selected: boolean;
  matched: boolean;
  seed: boolean;
  score: number;
  queryActive: boolean;
  filteredOut: boolean;
  sizeRank: number;
  onSelect: (id: string) => void;
  onHoverCity?: (cityId: string | null, point?: { x: number; y: number }) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const tier = markerTier(sizeRank);
  const dimmed = (queryActive && !matched && !selected) || (filteredOut && !selected);
  const radius = markerRadius(tier, selected, matched, score);
  const height = tier === "major" ? 0.02 : tier === "secondary" ? 0.015 : 0.012;
  const segments = tier === "major" || matched ? 16 : tier === "secondary" ? 10 : 8;

  const position = useMemo(
    () => latLonToVector3(city.lat, city.lon, EARTH_RADIUS + height),
    [city.lat, city.lon, height],
  );

  // Local +Z points radially outward so rings lie flat on the surface.
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize());
    return q;
  }, [position]);

  const selectedRing =
    tier === "major" || selected
      ? ([0.04, 0.055, 32] as const)
      : tier === "secondary"
        ? ([0.022, 0.03, 24] as const)
        : ([0.014, 0.02, 20] as const);
  const matchRing = [radius * 1.55, radius * 2.05, 24] as const;

  const color = useMemo(() => {
    if (selected) return "#f2c14e";
    if (seed) return "#f2c14e";
    if (matched) return "#7dd3c0";
    if (dimmed) return "#3d4f58";
    if (tier === "major") return "#f0ebe3";
    if (tier === "secondary") return "#9aa8b0";
    return "#6b7c86";
  }, [selected, seed, matched, dimmed, tier]);

  useFrame((_, delta) => {
    if (!group.current) return;
    pulse.current += delta;

    let scale = 1;
    if (selected) {
      scale = 1.35 + Math.sin(pulse.current * 3) * 0.12;
    } else if (matched && queryActive) {
      scale = 1.12 + Math.sin(pulse.current * 2.2 + score) * 0.08;
    }
    group.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={group}
      position={position}
      quaternion={quaternion}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(city.id);
      }}
      onPointerOver={(event) => {
        document.body.style.cursor = "pointer";
        if (queryActive && (matched || seed || selected)) {
          onHoverCity?.(city.id, { x: event.clientX, y: event.clientY });
        }
      }}
      onPointerMove={(event) => {
        if (queryActive && (matched || seed || selected)) {
          onHoverCity?.(city.id, { x: event.clientX, y: event.clientY });
        }
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
        onHoverCity?.(null);
      }}
    >
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={
            dimmed
              ? 0.12
              : selected || matched
                ? 1
                : tier === "major"
                  ? 0.95
                  : tier === "secondary"
                    ? 0.8
                    : 0.7
          }
          depthWrite={!dimmed}
        />
      </mesh>

      {selected || seed ? (
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[...selectedRing]} />
          <meshBasicMaterial color="#f2c14e" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      ) : null}

      {matched && !selected && !seed ? (
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[...matchRing]} />
          <meshBasicMaterial color="#7dd3c0" side={THREE.DoubleSide} transparent opacity={0.55} />
        </mesh>
      ) : null}
    </group>
  );
}

export function CityMarkers({
  selectedId,
  onSelect,
  matchedIds = null,
  matchScores = null,
  seedCityId = null,
  epicenterIds = null,
  queryActive = false,
  sizeRanks = null,
  filteredIds = null,
  onHoverCity,
}: CityMarkersProps) {
  return (
    <group>
      {CITIES.map((city) => {
        const matched = matchedIds?.has(city.id) ?? false;
        const score = matchScores?.get(city.id) ?? (matched ? 0.75 : 0);
        const sizeRank = sizeRanks?.get(city.id) ?? city.rank;
        const filteredOut = filteredIds ? !filteredIds.has(city.id) : false;
        const seed =
          seedCityId === city.id || (epicenterIds?.has(city.id) ?? false);

        return (
          <CityMarker
            key={city.id}
            city={city}
            selected={selectedId === city.id}
            matched={matched}
            seed={seed}
            score={score}
            queryActive={queryActive}
            filteredOut={filteredOut}
            sizeRank={sizeRank}
            onSelect={onSelect}
            onHoverCity={onHoverCity}
          />
        );
      })}
    </group>
  );
}
