import { CityCoordinates, CityWithDistance } from "../../types/city.js";

// Import comprehensive Syrian cities data from your frontend database
// This data should ideally be loaded from a database, but for now we'll import it directly
import { syrianCities as comprehensiveCities } from "../data/syrianCities.js";

// Convert the comprehensive data to our backend format
const syrianCities: CityCoordinates[] = comprehensiveCities.flatMap(city => [
  // Add the main city
  {
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
  },
  // Add all neighbors as separate cities
  ...city.neighbors.map(neighbor => ({
    name: neighbor.name,
    latitude: neighbor.latitude,
    longitude: neighbor.longitude,
  }))
]);

export class CityService {
  /**
   * Get all Syrian cities
   */
  static getAllCities(): CityCoordinates[] {
    return syrianCities;
  }

  /**
   * Get total count of cities in database
   */
  static getTotalCityCount(): number {
    return syrianCities.length;
  }

  /**
   * Search cities by name with intelligent filtering
   */
  static searchCities(query: string, limit: number = 10): CityCoordinates[] {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Exact matches first
    const exactMatches = syrianCities.filter(city => 
      city.name.toLowerCase() === searchTerm
    );

    // Starts with matches
    const startsWithMatches = syrianCities.filter(city => 
      city.name.toLowerCase().startsWith(searchTerm) && 
      !exactMatches.some(exact => exact.name === city.name)
    );

    // Contains matches
    const containsMatches = syrianCities.filter(city => 
      city.name.toLowerCase().includes(searchTerm) && 
      !exactMatches.some(exact => exact.name === city.name) &&
      !startsWithMatches.some(starts => starts.name === city.name)
    );

    // Combine results with priority order
    const allMatches = [...exactMatches, ...startsWithMatches, ...containsMatches];
    
    return allMatches.slice(0, limit);
  }

  /**
   * Find nearby cities within a given radius (in kilometers)
   */
  static findNearbyCities(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limit: number = 10
  ): CityWithDistance[] {
    const nearbyCities = syrianCities
      .map(city => ({
        ...city,
        distance: this.calculateDistance(latitude, longitude, city.latitude, city.longitude)
      }))
      .filter(city => city.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return nearbyCities;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
