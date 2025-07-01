/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of point 1 (in decimal degrees)
 * @param lon1 Longitude of point 1 (in decimal degrees)
 * @param lat2 Latitude of point 2 (in decimal degrees)
 * @param lon2 Longitude of point 2 (in decimal degrees)
 * @returns Distance in kilometers
 */
export declare const calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
/**
 * Check if a point is within a certain radius of another point
 * @param pointLat Latitude of the point to check
 * @param pointLng Longitude of the point to check
 * @param centerLat Latitude of the center point
 * @param centerLng Longitude of the center point
 * @param radius Radius in kilometers
 * @returns boolean indicating if the point is within the radius
 */
export declare const isWithinRadius: (pointLat: number, pointLng: number, centerLat: number, centerLng: number, radius: number) => boolean;
/**
 * Calculate the bounding box coordinates around a center point with a given radius
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radius Radius in kilometers
 * @returns Object with min/max latitude and longitude
 */
export declare const getBoundingBox: (lat: number, lng: number, radius: number) => {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};
/**
 * Format distance with appropriate unit
 * @param distance Distance in kilometers
 * @param unit 'km' or 'mi'
 * @returns Formatted distance string
 */
export declare const formatDistance: (distance: number, unit?: "km" | "mi") => string;
