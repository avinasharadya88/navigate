import boundary from "./south-zone.json";

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

export function isInsideSouthZone(latitude: number, longitude: number) {
  const geometry = boundary.features[0].geometry;
  const polygons = geometry.coordinates as Position[][][];
  return polygons.some((polygon) => {
    const [outer, ...holes] = polygon;
    return pointInRing(longitude, latitude, outer) &&
      !holes.some((hole) => pointInRing(longitude, latitude, hole));
  });
}
