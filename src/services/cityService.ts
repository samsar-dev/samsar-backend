import { CityCoordinates, CityWithDistance } from "../../types/city.js";
import optimizedCityService from "./optimizedCityService.js";

/**
 * CityService - Wrapper for optimized location service
 * Maintains backward compatibility while using high-performance backend
 */
export class CityService {
  /**
   * Get all Syrian cities (Arabic only)
   */
  static getAllCities(): CityCoordinates[] {
    return optimizedCityService.getAllCities().map(location => ({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    }));
  }

  /**
   * Get total count of cities in database
   */
  static getTotalCityCount(): number {
    return optimizedCityService.getTotalLocationCount();
  }

  /**
   * Search cities by name with intelligent filtering (Arabic)
   */
  static searchCities(query: string, limit: number = 10): CityCoordinates[] {
    const results = optimizedCityService.searchCities(query, limit);
    return results.map(result => ({
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude
    }));
  }

  /**
   * Format location for database storage (Neighborhood، City format)
   * @param cityName - Main city name
   * @param neighborhoodName - Neighborhood/area name (optional)
   * @returns Formatted location string
   */
  static formatLocationForDatabase(cityName: string, neighborhoodName?: string): string {
    return optimizedCityService.formatLocationForDatabase(cityName, neighborhoodName);
  }

  /**
   * Find parent city for a given neighborhood
   * @param neighborhoodName - Name of the neighborhood
   * @returns Parent city name or null if not found
   */
  static findParentCity(neighborhoodName: string): string | null {
    return optimizedCityService.findParentCity(neighborhoodName);
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
    const nearbyLocations = optimizedCityService.findNearbyLocations(
      latitude, longitude, radiusKm, limit
    );
    
    // Calculate distances for compatibility
    return nearbyLocations.map(location => ({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      distance: this.calculateDistance(latitude, longitude, location.latitude, location.longitude)
    }));
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

  // === NEW OPTIMIZED METHODS ===

  /**
   * Validate location string format: "حديقة السبكي، دمشق"
   */
  static validateLocation(locationString: string): boolean {
    return optimizedCityService.validateLocation(locationString);
  }

  /**
   * Parse location string into components
   */
  static parseLocationString(locationString: string): { neighborhood?: string; city?: string } {
    return optimizedCityService.parseLocationString(locationString);
  }

  /**
   * Get location statistics
   */
  static getLocationStats(): { cities: number; neighborhoods: number; total: number } {
    return optimizedCityService.getLocationStats();
  }

  /**
   * Get neighborhoods for a specific city
   */
  static getNeighborhoodsForCity(cityName: string): CityCoordinates[] {
    return optimizedCityService.getNeighborhoodsForCity(cityName).map(location => ({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude
    }));
  }
}
