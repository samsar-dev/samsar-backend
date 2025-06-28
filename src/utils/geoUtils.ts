/**
 * Calculates the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of the first point in decimal degrees
 * @param lon1 Longitude of the first point in decimal degrees
 * @param lat2 Latitude of the second point in decimal degrees
 * @param lon2 Longitude of the second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts numeric degrees to radians
 */
function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Finds all cities within a specified radius from a given point
 * @param cities Array of cities to search through
 * @param centerLat Latitude of the center point
 * @param centerLng Longitude of the center point
 * @param radiusKm Radius in kilometers
 * @returns Array of cities within the specified radius, sorted by distance
 */
export function findCitiesInRadius(
  cities: Array<{ name: string; latitude: number; longitude: number }>,
  centerLat: number,
  centerLng: number,
  radiusKm: number
) {
  return cities
    .map(city => ({
      ...city,
      distance: calculateDistance(centerLat, centerLng, city.latitude, city.longitude)
    }))
    .filter(city => city.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}
