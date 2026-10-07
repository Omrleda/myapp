/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HaversineBreakdown {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  dLat: number; // in radians
  dLon: number; // in radians
  a: number;    // intermediate square half-chord length
  c: number;    // angular distance in radians
  distanceMeters: number; // in meters (Earth R = 6,371,000 m)
}

/**
 * Converts degrees to radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates authoritative distance in meters between two GPS coordinates using the Haversine formula
 * strictly adhering to Section 3 of the ClassTrack System Architecture.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): HaversineBreakdown {
  const EARTH_RADIUS_METERS = 6371000;

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // a = sin²(dLat/2) + cos(toRadians(lat1)) * cos(toRadians(lat2)) * sin²(dLon/2)
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const a =
    sinHalfLat * sinHalfLat +
    Math.cos(φ1) * Math.cos(φ2) * sinHalfLon * sinHalfLon;

  // c = 2 * atan2(√a, √(1-a))
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(Math.min(1, Math.max(0, 1 - a))));

  // Distance = 6,371,000 * c (in meters)
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return {
    lat1,
    lon1,
    lat2,
    lon2,
    dLat,
    dLon,
    a,
    c,
    distanceMeters: Math.round(distanceMeters * 100) / 100, // round to 2 decimals
  };
}

/**
 * Given anchor coordinates (teacher), calculate new coordinates for a student at
 * a given distance in meters and bearing in degrees (0 = North, 90 = East, etc.)
 */
export function offsetCoordinates(
  lat: number,
  lon: number,
  distanceMeters: number,
  bearingDegrees: number = 45
): { latitude: number; longitude: number } {
  const EARTH_RADIUS = 6371000;
  const δ = distanceMeters / EARTH_RADIUS; // angular distance in radians
  const θ = toRadians(bearingDegrees);

  const φ1 = toRadians(lat);
  const λ1 = toRadians(lon);

  const sinφ2 =
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);

  const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
  const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
  const λ2 = λ1 + Math.atan2(y, x);

  return {
    latitude: φ2 * (180 / Math.PI),
    longitude: λ2 * (180 / Math.PI),
  };
}
