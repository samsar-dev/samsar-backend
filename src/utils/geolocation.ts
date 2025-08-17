/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of point 1 (in decimal degrees)
 * @param lon1 Longitude of point 1 (in decimal degrees)
 * @param lat2 Latitude of point 2 (in decimal degrees)
 * @param lon2 Longitude of point 2 (in decimal degrees)
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

/**
 * Convert degrees to radians
 */
const toRad = (value: number): number => {
  return (value * Math.PI) / 180;
};

/**
 * Check if a point is within a certain radius of another point
 * @param pointLat Latitude of the point to check
 * @param pointLng Longitude of the point to check
 * @param centerLat Latitude of the center point
 * @param centerLng Longitude of the center point
 * @param radius Radius in kilometers
 * @returns boolean indicating if the point is within the radius
 */
export const isWithinRadius = (
  pointLat: number,
  pointLng: number,
  centerLat: number,
  centerLng: number,
  radius: number,
): boolean => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng);
  return distance <= radius;
};

/**
 * Calculate the bounding box coordinates around a center point with a given radius
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radius Radius in kilometers
 * @returns Object with min/max latitude and longitude
 */
export const getBoundingBox = (
  lat: number,
  lng: number,
  radius: number,
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} => {
  // Earth's radius in km
  const R = 6371;

  // Convert latitude and longitude to radians
  const latR = toRad(lat);
  const lngR = toRad(lng);

  // Angular distance in radians on a great circle
  const d = radius / R;

  // Calculate the bounding box
  const minLat = latR - d;
  const maxLat = latR + d;

  // Compensate for longitude at higher latitudes
  const deltaLng = Math.asin(Math.sin(d) / Math.cos(latR));
  const minLng = lngR - deltaLng;
  const maxLng = lngR + deltaLng;

  // Convert back to degrees
  return {
    minLat: (minLat * 180) / Math.PI,
    maxLat: (maxLat * 180) / Math.PI,
    minLng: (minLng * 180) / Math.PI,
    maxLng: (maxLng * 180) / Math.PI,
  };
};

/**
 * Format distance with appropriate unit
 * @param distance Distance in kilometers
 * @param unit 'km' or 'mi'
 * @returns Formatted distance string
 */
export const formatDistance = (
  distance: number,
  unit: "km" | "mi" = "km",
): string => {
  if (unit === "mi") {
    const miles = distance * 0.621371;
    return `${miles.toFixed(1)} mi`;
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  return `${distance.toFixed(1)} km`;
};
