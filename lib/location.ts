/** Great-circle distance in km between two coordinates. */
export function haversineKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** "2.4 km away" / "Nearby" / "Distance unknown" — never an exact address. */
export function describeDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return 'Distance unknown';
  if (km < 1) return 'Under 1 km away';
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/** Public-safe location string: city + state only. */
export function publicLocation(city?: string | null, state?: string | null) {
  return [city, state].filter(Boolean).join(', ') || 'Location not set';
}

export type GeoResult = { latitude: number; longitude: number; source: string };

/**
 * Address -> lat/lng. Nominatim needs no key; LocationIQ is used when
 * LOCATION_PROVIDER=locationiq and LOCATION_API_KEY is set.
 * Falls back to a coarse city centroid so matching still works offline.
 */
export async function geocode(parts: {
  addressLine?: string | null;
  area?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
}): Promise<GeoResult | null> {
  const query = [parts.area, parts.city, parts.state, parts.pincode, 'India']
    .filter(Boolean)
    .join(', ');

  const provider = (process.env.LOCATION_PROVIDER || 'nominatim').toLowerCase();
  const key = process.env.LOCATION_API_KEY;

  try {
    if (provider === 'locationiq' && key) {
      const url = `https://us1.locationiq.com/v1/search?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (json[0]) {
          return { latitude: +json[0].lat, longitude: +json[0].lon, source: 'locationiq' };
        }
      }
    } else {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&limit=1`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { 'User-Agent': 'BookSwap/1.0 (exchange platform)' },
      });
      if (res.ok) {
        const json = (await res.json()) as Array<{ lat: string; lon: string }>;
        if (json[0]) {
          return { latitude: +json[0].lat, longitude: +json[0].lon, source: 'nominatim' };
        }
      }
    }
  } catch (err) {
    console.warn('[geocode] provider failed, using fallback:', (err as Error).message);
  }

  const fallback = CITY_CENTROIDS[parts.city.trim().toLowerCase()];
  if (fallback) return { ...fallback, source: 'fallback' };
  return null;
}

/** Coarse centroids so seeding and offline dev still produce distances. */
export const CITY_CENTROIDS: Record<string, { latitude: number; longitude: number }> = {
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  thane: { latitude: 19.2183, longitude: 72.9781 },
  navimumbai: { latitude: 19.033, longitude: 73.0297 },
  'navi mumbai': { latitude: 19.033, longitude: 73.0297 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  'new delhi': { latitude: 28.6139, longitude: 77.209 },
  noida: { latitude: 28.5355, longitude: 77.391 },
  gurugram: { latitude: 28.4595, longitude: 77.0266 },
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
  ahmedabad: { latitude: 23.0225, longitude: 72.5714 },
  surat: { latitude: 21.1702, longitude: 72.8311 },
  jaipur: { latitude: 26.9124, longitude: 75.7873 },
  lucknow: { latitude: 26.8467, longitude: 80.9462 },
  indore: { latitude: 22.7196, longitude: 75.8577 },
  bhopal: { latitude: 23.2599, longitude: 77.4126 },
  nagpur: { latitude: 21.1458, longitude: 79.0882 },
  kochi: { latitude: 9.9312, longitude: 76.2673 },
  chandigarh: { latitude: 30.7333, longitude: 76.7794 },
};
