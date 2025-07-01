"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDistance = exports.getBoundingBox = exports.isWithinRadius = exports.calculateDistance = void 0;
/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param lat1 Latitude of point 1 (in decimal degrees)
 * @param lon1 Longitude of point 1 (in decimal degrees)
 * @param lat2 Latitude of point 2 (in decimal degrees)
 * @param lon2 Longitude of point 2 (in decimal degrees)
 * @returns Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};
exports.calculateDistance = calculateDistance;
/**
 * Convert degrees to radians
 */
const toRad = (value) => {
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
const isWithinRadius = (pointLat, pointLng, centerLat, centerLng, radius) => {
    const distance = (0, exports.calculateDistance)(centerLat, centerLng, pointLat, pointLng);
    return distance <= radius;
};
exports.isWithinRadius = isWithinRadius;
/**
 * Calculate the bounding box coordinates around a center point with a given radius
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radius Radius in kilometers
 * @returns Object with min/max latitude and longitude
 */
const getBoundingBox = (lat, lng, radius) => {
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
exports.getBoundingBox = getBoundingBox;
/**
 * Format distance with appropriate unit
 * @param distance Distance in kilometers
 * @param unit 'km' or 'mi'
 * @returns Formatted distance string
 */
const formatDistance = (distance, unit = "km") => {
    if (unit === "mi") {
        const miles = distance * 0.621371;
        return `${miles.toFixed(1)} mi`;
    }
    if (distance < 1) {
        return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
};
exports.formatDistance = formatDistance;
//# sourceMappingURL=geolocation.js.map