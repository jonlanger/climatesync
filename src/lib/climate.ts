import type { City } from "@/data/cities";

export type CurrentWeather = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  timezone: string;
  elevation: number;
};

export type MonthlyClimate = {
  month: number;
  label: string;
  meanTemp: number;
  maxTemp: number;
  minTemp: number;
  precipMm: number;
};

export type CityClimateData = {
  city: City;
  current: CurrentWeather;
  recent: {
    year: number;
    months: MonthlyClimate[];
    annualMeanTemp: number;
    annualPrecipMm: number;
  };
  future: {
    year: number;
    months: MonthlyClimate[];
    annualMeanTemp: number;
    annualPrecipMm: number;
  };
};

type ForecastResponse = {
  timezone: string;
  elevation: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
};

type ClimateResponse = {
  daily: {
    time: string[];
    temperature_2m_mean: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Thunderstorm with heavy hail",
};

export function weatherCodeLabel(code: number): string {
  return WEATHER_CODES[code] ?? `Weather code ${code}`;
}

export function formatTemp(value: number): string {
  return `${value >= 0 ? "" : "−"}${Math.abs(value).toFixed(1)}°C`;
}

export function formatPrecip(value: number): string {
  if (value >= 100) return `${Math.round(value)} mm`;
  return `${value.toFixed(1)} mm`;
}

function aggregateMonthly(daily: ClimateResponse["daily"]): MonthlyClimate[] {
  const buckets = Array.from({ length: 12 }, () => ({
    mean: [] as number[],
    max: [] as number[],
    min: [] as number[],
    precip: [] as number[],
  }));

  daily.time.forEach((iso, index) => {
    const month = Number(iso.slice(5, 7)) - 1;
    if (month < 0 || month > 11) return;
    const mean = daily.temperature_2m_mean[index];
    const max = daily.temperature_2m_max[index];
    const min = daily.temperature_2m_min[index];
    const precip = daily.precipitation_sum[index];
    if (Number.isFinite(mean)) buckets[month].mean.push(mean);
    if (Number.isFinite(max)) buckets[month].max.push(max);
    if (Number.isFinite(min)) buckets[month].min.push(min);
    if (Number.isFinite(precip)) buckets[month].precip.push(precip);
  });

  return buckets.map((bucket, month) => {
    const avg = (values: number[]) =>
      values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

    return {
      month: month + 1,
      label: MONTH_LABELS[month],
      meanTemp: avg(bucket.mean),
      maxTemp: avg(bucket.max),
      minTemp: avg(bucket.min),
      precipMm: sum(bucket.precip),
    };
  });
}

function summarizeMonths(months: MonthlyClimate[]) {
  const annualMeanTemp =
    months.reduce((sum, month) => sum + month.meanTemp, 0) / Math.max(months.length, 1);
  const annualPrecipMm = months.reduce((sum, month) => sum + month.precipMm, 0);
  return { annualMeanTemp, annualPrecipMm };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Climate request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchCityClimate(city: City): Promise<CityClimateData> {
  const { lat, lon } = city;
  const recentYear = 2020;
  const futureYear = 2040;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m` +
    `&timezone=auto`;

  const climateParams =
    `latitude=${lat}&longitude=${lon}` +
    `&models=EC_Earth3P_HR` +
    `&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum`;

  const recentUrl =
    `https://climate-api.open-meteo.com/v1/climate?${climateParams}` +
    `&start_date=${recentYear}-01-01&end_date=${recentYear}-12-31`;

  const futureUrl =
    `https://climate-api.open-meteo.com/v1/climate?${climateParams}` +
    `&start_date=${futureYear}-01-01&end_date=${futureYear}-12-31`;

  const [forecast, recentClimate, futureClimate] = await Promise.all([
    fetchJson<ForecastResponse>(forecastUrl),
    fetchJson<ClimateResponse>(recentUrl),
    fetchJson<ClimateResponse>(futureUrl),
  ]);

  const recentMonths = aggregateMonthly(recentClimate.daily);
  const futureMonths = aggregateMonthly(futureClimate.daily);

  return {
    city,
    current: {
      time: forecast.current.time,
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      humidity: forecast.current.relative_humidity_2m,
      precipitation: forecast.current.precipitation,
      weatherCode: forecast.current.weather_code,
      windSpeed: forecast.current.wind_speed_10m,
      windDirection: forecast.current.wind_direction_10m,
      timezone: forecast.timezone,
      elevation: forecast.elevation,
    },
    recent: {
      year: recentYear,
      months: recentMonths,
      ...summarizeMonths(recentMonths),
    },
    future: {
      year: futureYear,
      months: futureMonths,
      ...summarizeMonths(futureMonths),
    },
  };
}
