import { Listing } from '@prisma/client';

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
};

/**
 * Filter listings by distance from a point
 * @param listings Array of listings with latitude and longitude
 * @param centerLat Center point latitude
 * @param centerLon Center point longitude
 * @param maxDistance Maximum distance in kilometers
 * @returns Filtered array of listings
 */
export const filterByDistance = (listings: Listing[], centerLat: number, centerLon: number, maxDistance: number): Listing[] => {
    return listings.filter(listing => {
        if (!listing.latitude || !listing.longitude) return false;
        const distance = calculateDistance(centerLat, centerLon, listing.latitude, listing.longitude);
        return distance <= maxDistance;
    });
};
