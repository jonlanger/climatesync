"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import { createCoastlineGeometry, type LandTopology } from "@/lib/land-geometry";
import { createLandMaskTexture } from "@/lib/land-mask";

const EARTH_RADIUS = 1.6;
const COAST_RADIUS = EARTH_RADIUS * 1.0015;

const LAND = "#c5b8a0";
const OCEAN = "#0d3d4f";
const COAST = "#9a8b72";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uLandMask;
  uniform vec3 uLandColor;
  uniform vec3 uOceanColor;

  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    // High-res mask fill — fwidth keeps the land/ocean edge sharp under zoom.
    float raw = texture2D(uLandMask, vUv).r;
    float aa = max(fwidth(raw), 0.0015);
    float land = smoothstep(0.5 - aa, 0.5 + aa, raw);

    vec3 color = mix(uOceanColor, uLandColor, land);

    float light = clamp(dot(normalize(vNormalW), normalize(vec3(0.45, 0.7, 0.85))), 0.0, 1.0);
    color *= 0.58 + 0.42 * light;

    float rim = pow(1.0 - max(dot(normalize(vNormalW), vec3(0.0, 0.0, 1.0)), 0.0), 2.5);
    color += uOceanColor * rim * 0.16;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function TwoToneEarth() {
  const [mask, setMask] = useState<THREE.CanvasTexture | null>(null);
  const [coasts, setCoasts] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let cancelled = false;
    let texture: THREE.CanvasTexture | null = null;
    let coastGeom: THREE.BufferGeometry | null = null;

    fetch("/geo/land-50m.json")
      .then((response) => {
        if (!response.ok) return fetch("/geo/land-110m.json");
        return response;
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load land topology (${response.status})`);
        }
        return response.json() as Promise<LandTopology>;
      })
      .then((topology) => {
        if (cancelled) return;
        texture = createLandMaskTexture(topology, 4096, 2048);
        coastGeom = createCoastlineGeometry(topology, COAST_RADIUS);
        setMask(texture);
        setCoasts(coastGeom);
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
      texture?.dispose();
      coastGeom?.dispose();
    };
  }, []);

  const uniforms = useMemo(() => {
    if (!mask) return null;
    return {
      uLandMask: { value: mask },
      uLandColor: { value: new THREE.Color(LAND) },
      uOceanColor: { value: new THREE.Color(OCEAN) },
    };
  }, [mask]);

  if (!uniforms) return null;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 128, 128]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {coasts ? (
        <lineSegments geometry={coasts} frustumCulled={false}>
          <lineBasicMaterial color={COAST} transparent opacity={0.55} depthWrite={false} />
        </lineSegments>
      ) : null}
    </group>
  );
}

export { EARTH_RADIUS };
