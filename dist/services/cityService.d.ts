import { CityCoordinates, CityWithDistance } from "../types/city.js";
export declare class CityService {
    /**
     * Find all cities within a specified radius from a given point
     */
    static findNearbyCities(lat: number, lng: number, radiusKm: number, limit?: number): CityWithDistance[];
    /**
     * Get all cities (for frontend to use)
     */
    static getAllCities(): CityCoordinates[];
}
