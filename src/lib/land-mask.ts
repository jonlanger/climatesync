import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import * as THREE from "three";

export type LandTopology = Topology<{ land: GeometryCollection }>;

/**
 * Rasterize Natural Earth land polygons to an equirectangular mask.
 * Used for solid fills (stable on a sphere); pair with vector coastlines for crisp edges.
 */
export function createLandMaskTexture(
  topology: LandTopology,
  width = 4096,
  height = 2048,
): THREE.CanvasTexture {
  const land = feature(topology, topology.objects.land) as FeatureCollection<
    Polygon | MultiPolygon
  >;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Could not create 2D canvas context for land mask");
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const projection = geoEquirectangular()
    .translate([width / 2, height / 2])
    .scale(width / (2 * Math.PI));

  const path = geoPath(projection, ctx);

  // Disable canvas AA so the mask stays a hard land/ocean boundary.
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  path(land);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.flipY = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}
