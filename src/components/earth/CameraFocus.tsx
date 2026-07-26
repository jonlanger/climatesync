"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { CITIES } from "@/data/cities";
import { latLonToVector3 } from "@/lib/geo";
import { EARTH_RADIUS } from "./TwoToneEarth";

const CAMERA_DISTANCE = EARTH_RADIUS * 2.7825;

type CameraFocusProps = {
  selectedId: string | null;
};

type OrbitLike = {
  target: THREE.Vector3;
  update: () => void;
};

export function CameraFocus({ selectedId }: CameraFocusProps) {
  const { camera, controls } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, CAMERA_DISTANCE));
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const animating = useRef(false);

  useEffect(() => {
    if (!selectedId) return;
    const city = CITIES.find((c) => c.id === selectedId);
    if (!city) return;

    latLonToVector3(city.lat, city.lon, CAMERA_DISTANCE, scratch);
    targetPos.current.copy(scratch);
    animating.current = true;
  }, [selectedId, scratch]);

  useFrame((_, delta) => {
    if (!animating.current) return;

    const orbit = controls as OrbitLike | null;
    camera.position.lerp(targetPos.current, 1 - Math.exp(-delta * 3.2));
    camera.lookAt(0, 0, 0);

    if (orbit) {
      orbit.target.set(0, 0, 0);
      orbit.update();
    }

    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      camera.position.copy(targetPos.current);
      animating.current = false;
    }
  });

  return null;
}
