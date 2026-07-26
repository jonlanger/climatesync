import { feature } from "topojson-client";
import type { FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import * as THREE from "three";

import { latLonToVector3 } from "@/lib/geo";

export type LandTopology = Topology<{ land: GeometryCollection }>;

type LonLat = [number, number];
type Ring = Position[];

function isClosed(ring: Ring): boolean {
  if (ring.length < 2) return false;
  const a = ring[0];
  const b = ring[ring.length - 1];
  return a[0] === b[0] && a[1] === b[1];
}

function openRing(ring: Ring): LonLat[] {
  const pts = isClosed(ring) ? ring.slice(0, -1) : ring.slice();
  return pts.map(([lon, lat]) => [lon, lat] as LonLat);
}

function unwrapRing(ring: LonLat[]): LonLat[] {
  if (ring.length === 0) return [];
  const out: LonLat[] = [[ring[0][0], ring[0][1]]];
  for (let i = 1; i < ring.length; i += 1) {
    let lon = ring[i][0];
    const prev = out[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    out.push([lon, ring[i][1]]);
  }
  return out;
}

function cutAtAntimeridian(ring: Ring): LonLat[][] {
  const open = openRing(ring);
  if (open.length < 3) return [];

  const segments: LonLat[][] = [];
  let current: LonLat[] = [open[0]];

  for (let i = 1; i < open.length; i += 1) {
    const prev = current[current.length - 1];
    const curr = open[i];
    const delta = curr[0] - prev[0];

    if (Math.abs(delta) > 180) {
      const seamLon = prev[0] > 0 ? 180 : -180;
      const seamLon2 = curr[0] > 0 ? 180 : -180;
      const denom = curr[0] - prev[0] + (delta > 180 ? -360 : delta < -180 ? 360 : 0);
      const t = Math.abs(denom) < 1e-9 ? 0.5 : (seamLon - prev[0]) / denom;
      const seamLat = prev[1] + Math.min(1, Math.max(0, t)) * (curr[1] - prev[1]);
      current.push([seamLon, seamLat]);
      if (current.length >= 3) segments.push(current);
      current = [
        [seamLon2, seamLat],
        [curr[0], curr[1]],
      ];
    } else {
      current.push(curr);
    }
  }

  if (current.length >= 3) segments.push(current);

  if (segments.length >= 2) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    if (
      Math.abs(Math.abs(first[0][0]) - 180) < 1e-6 &&
      Math.abs(Math.abs(last[last.length - 1][0]) - 180) < 1e-6
    ) {
      const merged = unwrapRing([...last, ...first]);
      segments.splice(0, 1);
      segments.splice(segments.length - 1, 1, merged);
    }
  }

  return segments.map((seg) => unwrapRing(seg)).filter((seg) => seg.length >= 3);
}

function eachPolygon(
  geometry: Polygon | MultiPolygon,
  visit: (rings: Ring[]) => void,
): void {
  if (geometry.type === "Polygon") {
    visit(geometry.coordinates);
    return;
  }
  for (const polygon of geometry.coordinates) visit(polygon);
}

/** Vector coastline segments on the sphere (for crisp zoom edges). */
export function createCoastlineGeometry(
  topology: LandTopology,
  radius: number,
): THREE.BufferGeometry {
  const collection = feature(topology, topology.objects.land) as FeatureCollection<
    Polygon | MultiPolygon
  >;

  const positions: number[] = [];
  const scratch = new THREE.Vector3();

  for (const featureItem of collection.features) {
    if (!featureItem.geometry) continue;

    eachPolygon(featureItem.geometry, (rings) => {
      const outerOpen = openRing(rings[0]);
      const hasJump = outerOpen.some(
        (p, i) => i > 0 && Math.abs(p[0] - outerOpen[i - 1][0]) > 180,
      );
      const pieces = hasJump ? cutAtAntimeridian(rings[0]) : [unwrapRing(outerOpen)];

      for (const outer of pieces) {
        if (outer.length < 2) continue;
        for (let i = 0; i < outer.length; i += 1) {
          const a = outer[i];
          const b = outer[(i + 1) % outer.length];
          let dLon = Math.abs(b[0] - a[0]);
          if (dLon > 180) dLon = 360 - dLon;
          if (dLon > 30) continue;
          latLonToVector3(a[1], a[0], radius, scratch);
          positions.push(scratch.x, scratch.y, scratch.z);
          latLonToVector3(b[1], b[0], radius, scratch);
          positions.push(scratch.x, scratch.y, scratch.z);
        }
      }
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}
