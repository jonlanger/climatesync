import * as THREE from "three";

/** Convert geographic coordinates to a point on a sphere (Y-up, lon 0 at -X). */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

/**
 * Build a raised great-circle arc between two surface points.
 * Midpoints lift away from the globe so the path reads as a link, not a chord.
 */
export function greatCircleArcPoints(
  from: THREE.Vector3,
  to: THREE.Vector3,
  options: { segments?: number; altitude?: number } = {},
): THREE.Vector3[] {
  const segments = options.segments ?? 48;
  const altitude = options.altitude ?? 0.04;
  const start = from.clone().normalize();
  const end = to.clone().normalize();
  const radius = (from.length() + to.length()) / 2;
  const points: THREE.Vector3[] = [];
  const dot = Math.min(1, Math.max(-1, start.dot(end)));
  const omega = Math.acos(dot);

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = new THREE.Vector3();

    if (omega < 1e-4) {
      point.copy(start);
    } else if (dot < -0.98) {
      // Nearly antipodal: fall back to lerp through a stable pole.
      const pole =
        Math.abs(start.y) < 0.9
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(1, 0, 0);
      const mid = new THREE.Vector3().crossVectors(start, pole).normalize();
      if (t < 0.5) {
        const localT = t * 2;
        const a = Math.sin((1 - localT) * Math.PI * 0.5);
        const b = Math.sin(localT * Math.PI * 0.5);
        point.copy(start).multiplyScalar(a).addScaledVector(mid, b).normalize();
      } else {
        const localT = (t - 0.5) * 2;
        const a = Math.sin((1 - localT) * Math.PI * 0.5);
        const b = Math.sin(localT * Math.PI * 0.5);
        point.copy(mid).multiplyScalar(a).addScaledVector(end, b).normalize();
      }
    } else {
      const sinOmega = Math.sin(omega);
      const a = Math.sin((1 - t) * omega) / sinOmega;
      const b = Math.sin(t * omega) / sinOmega;
      point.copy(start).multiplyScalar(a).addScaledVector(end, b).normalize();
    }

    const lift = 1 + Math.sin(Math.PI * t) * altitude;
    points.push(point.multiplyScalar(radius * lift));
  }

  return points;
}
