/**
 * Calculates the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of the first point in decimal degrees
 * @param lon1 Longitude of the first point in decimal degrees
 * @param lat2 Latitude of the second point in decimal degrees
 * @param lon2 Longitude of the second point in decimal degrees
 * @returns Distance in kilometers
 */
export declare function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Finds all cities within a specified radius from a given point
 * @param cities Array of cities to search through
 * @param centerLat Latitude of the center point
 * @param centerLng Longitude of the center point
 * @param radiusKm Radius in kilometers
 * @returns Array of cities within the specified radius, sorted by distance
 */
export declare function findCitiesInRadius(cities: Array<{
    name: string;
    latitude: number;
    longitude: number;
}>, centerLat: number, centerLng: number, radiusKm: number): {
    distance: number;
    name: string;
    latitude: number;
    longitude: number;
}[];
