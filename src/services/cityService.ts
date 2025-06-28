import { CityCoordinates, CityWithDistance } from '../types/city.js';
import { findCitiesInRadius } from '../utils/geoUtils.js';

// This should be populated from a database in a real application
// For now, we'll use a simplified version of the cities data
const syrianCities: CityCoordinates[] = [
  {
    name: "Damascus",
    latitude: 33.5131,
    longitude: 36.2913
  },
  {
    name: "Aleppo",
    latitude: 36.2018,
    longitude: 37.1556
  },
  {
    name: "Homs",
    latitude: 34.7324,
    longitude: 36.7132
  },
  {
    name: "Hama",
    latitude: 35.1318,
    longitude: 36.7578
  },
  {
    name: "Latakia",
    latitude: 35.5216,
    longitude: 35.7924
  },
  {
    name: "Tartus",
    latitude: 34.8950,
    longitude: 35.8867
  },
  {
    name: "Deir ez-Zor",
    latitude: 35.3333,
    longitude: 40.1500
  },
  {
    name: "Al-Hasakah",
    latitude: 36.5119,
    longitude: 40.7422
  },
  {
    name: "Qamishli",
    latitude: 37.0500,
    longitude: 41.2167
  },
  {
    name: "Raqqa",
    latitude: 35.9500,
    longitude: 39.0167
  }
];

export class CityService {
  /**
   * Find all cities within a specified radius from a given point
   */
  static findNearbyCities(
    lat: number,
    lng: number,
    radiusKm: number,
    limit?: number
  ): CityWithDistance[] {
    let results = findCitiesInRadius(syrianCities, lat, lng, radiusKm);
    
    if (limit) {
      results = results.slice(0, limit);
    }
    
    return results;
  }

  /**
   * Get all cities (for frontend to use)
   */
  static getAllCities(): CityCoordinates[] {
    return syrianCities;
  }
}
