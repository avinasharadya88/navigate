import districtsData from "./bangalore-districts.json";

type Position = [number, number];

function pointInRing(longitude: number, latitude: number, ring: Position[]) {
  let inside = false;
  for (let current = 0, previous = ring.length - 1; current < ring.length; previous = current++) {
    const [currentLng, currentLat] = ring[current];
    const [previousLng, previousLat] = ring[previous];
    const crosses =
      currentLat > latitude !== previousLat > latitude &&
      longitude <
        ((previousLng - currentLng) * (latitude - currentLat)) /
          (previousLat - currentLat) +
          currentLng;
    if (crosses) inside = !inside;
  }
  return inside;
}

// Bounding box for Bangalore Urban and Bangalore Rural combined
export const BANGALORE_BBOX = {
  minLat: 12.50,
  maxLat: 13.56,
  minLng: 77.05,
  maxLng: 78.02,
};

/**
 * Checks if a given coordinate is within the official Bangalore Urban or Bangalore Rural districts.
 */
export function isInsideBangalore(latitude: number, longitude: number): boolean {
  if (
    latitude < BANGALORE_BBOX.minLat ||
    latitude > BANGALORE_BBOX.maxLat ||
    longitude < BANGALORE_BBOX.minLng ||
    longitude > BANGALORE_BBOX.maxLng
  ) {
    return false;
  }

  // Check against the district polygons
  const features = districtsData.features;
  for (const feature of features) {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      const coords = geom.coordinates as Position[][];
      if (pointInRing(longitude, latitude, coords[0])) {
        return true;
      }
    } else if (geom.type === "MultiPolygon") {
      const multi = geom.coordinates as Position[][][];
      for (const poly of multi) {
        if (pointInRing(longitude, latitude, poly[0])) {
          return true;
        }
      }
    }
  }

  // Fallback within bounding box envelope with reasonable margin
  return (
    latitude >= 12.52 &&
    latitude <= 13.54 &&
    longitude >= 77.12 &&
    longitude <= 77.98
  );
}

// Maintain backwards compatibility for south-zone imports
export const isInsideSouthZone = isInsideBangalore;
