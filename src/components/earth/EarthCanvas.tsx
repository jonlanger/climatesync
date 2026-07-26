"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";

import { CameraFocus } from "./CameraFocus";
import { CityLinks, type CityLink } from "./CityLinks";
import { CityMarkers } from "./CityMarkers";
import { TwoToneEarth } from "./TwoToneEarth";

type EarthCanvasProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  matchedIds?: Set<string> | null;
  matchScores?: Map<string, number> | null;
  seedCityId?: string | null;
  epicenterIds?: Set<string> | null;
  queryActive?: boolean;
  links?: CityLink[];
  sizeRanks?: Map<string, number> | null;
  filteredIds?: Set<string> | null;
  onHoverCity?: (cityId: string | null, point?: { x: number; y: number }) => void;
};

function Scene({
  selectedId,
  onSelect,
  matchedIds = null,
  matchScores = null,
  seedCityId = null,
  epicenterIds = null,
  queryActive = false,
  links = [],
  sizeRanks = null,
  filteredIds = null,
  onHoverCity,
}: EarthCanvasProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2, 5]} intensity={1.1} />
      <Stars radius={80} depth={40} count={2500} factor={3} saturation={0} fade speed={0.4} />
      <TwoToneEarth />
      <CityLinks links={links} />
      <CityMarkers
        selectedId={selectedId}
        onSelect={onSelect}
        matchedIds={matchedIds}
        matchScores={matchScores}
        seedCityId={seedCityId}
        epicenterIds={epicenterIds}
        queryActive={queryActive}
        sizeRanks={sizeRanks}
        filteredIds={filteredIds}
        onHoverCity={onHoverCity}
      />
      <CameraFocus selectedId={selectedId} />
      <OrbitControls
        enablePan={false}
        minDistance={2.73}
        maxDistance={6.3}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  );
}

export function EarthCanvas({
  selectedId,
  onSelect,
  matchedIds = null,
  matchScores = null,
  seedCityId = null,
  epicenterIds = null,
  queryActive = false,
  links = [],
  sizeRanks = null,
  filteredIds = null,
  onHoverCity,
}: EarthCanvasProps) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      camera={{ position: [0, 0.42, 4.41], fov: 42, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Scene
          selectedId={selectedId}
          onSelect={onSelect}
          matchedIds={matchedIds}
          matchScores={matchScores}
          seedCityId={seedCityId}
          epicenterIds={epicenterIds}
          queryActive={queryActive}
          links={links}
          sizeRanks={sizeRanks}
          filteredIds={filteredIds}
          onHoverCity={onHoverCity}
        />
      </Suspense>
    </Canvas>
  );
}
