import type { ClimateProfile } from "@/lib/climate-profile";
import climateProfilesData from "@/data/climate-profiles.json";

export type ClimateProfilesFile = {
  generatedAt: string;
  sourceYear: number;
  model: string;
  cityCount: number;
  profiles: Record<string, ClimateProfile>;
};

export const CLIMATE_PROFILES_META = {
  generatedAt: climateProfilesData.generatedAt,
  sourceYear: climateProfilesData.sourceYear,
  model: climateProfilesData.model,
  cityCount: climateProfilesData.cityCount,
} as const;

export const CLIMATE_PROFILES = climateProfilesData.profiles as Record<string, ClimateProfile>;

export function getClimateProfile(cityId: string): ClimateProfile | null {
  return CLIMATE_PROFILES[cityId] ?? null;
}
