"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";

import { CITIES } from "@/data/cities";
import { greatCircleArcPoints, latLonToVector3 } from "@/lib/geo";
import { EARTH_RADIUS } from "./TwoToneEarth";

export type CityLink = {
  fromId: string;
  toId: string;
  score: number;
};

type CityLinksProps = {
  links: CityLink[];
};

const CITY_BY_ID = new Map(CITIES.map((city) => [city.id, city]));

function LinkArc({ link }: { link: CityLink }) {
  const points = useMemo(() => {
    const fromCity = CITY_BY_ID.get(link.fromId);
    const toCity = CITY_BY_ID.get(link.toId);
    if (!fromCity || !toCity) return null;

    const from = latLonToVector3(fromCity.lat, fromCity.lon, EARTH_RADIUS + 0.01);
    const to = latLonToVector3(toCity.lat, toCity.lon, EARTH_RADIUS + 0.01);
    const distance = from.angleTo(to);
    const altitude = 0.015 + Math.min(0.07, distance * 0.05);

    return greatCircleArcPoints(from, to, {
      segments: Math.max(24, Math.ceil(distance * 28)),
      altitude,
    });
  }, [link.fromId, link.toId]);

  if (!points || points.length < 2) return null;

  const opacity = 0.28 + link.score * 0.5;
  const color = new THREE.Color().setHSL(0.45, 0.45, 0.55 + link.score * 0.15);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1.25 + link.score}
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  );
}

export function CityLinks({ links }: CityLinksProps) {
  if (links.length === 0) return null;

  return (
    <group>
      {links.map((link) => (
        <LinkArc key={`${link.fromId}->${link.toId}`} link={link} />
      ))}
    </group>
  );
}
