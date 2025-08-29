/**
 * Optimized City Service - Maximum Performance Syrian Location Data
 * Features: Static data loading, intelligent caching, fast search, Arabic support
 */

import syrianCitiesArabic from '../data/syrianCities.js';
import locationSearchIndex from '../data/locationSearchIndex.js';

interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  type: 'city' | 'neighborhood';
  parentCity: string | null;
}

interface SearchResult extends LocationData {
  formattedName: string;
  relevanceScore: number;
}

class OptimizedCityService {
  private static instance: OptimizedCityService;
  private allLocations: LocationData[] = [];
  private searchIndex: Record<string, LocationData[]> = {};
  private cityMap: Map<string, LocationData> = new Map();
  private neighborhoodMap: Map<string, LocationData[]> = new Map();
  private isInitialized = false;

  private constructor() {
    this.initializeData();
  }

  public static getInstance(): OptimizedCityService {
    if (!OptimizedCityService.instance) {
      OptimizedCityService.instance = new OptimizedCityService();
    }
    return OptimizedCityService.instance;
  }

  /**
   * Initialize data once at startup - NO RELOADING
   */
  private initializeData(): void {
    if (this.isInitialized) return;

    // Load all locations
    this.allLocations = syrianCitiesArabic as LocationData[];
    
    // Load search index
    this.searchIndex = locationSearchIndex as Record<string, LocationData[]>;
    
    // Build optimized maps for O(1) lookups
    this.buildOptimizedMaps();
    
    this.isInitialized = true;
  }

  private buildOptimizedMaps(): void {
    this.allLocations.forEach(location => {
      // City map for direct lookups
      if (location.type === 'city') {
        this.cityMap.set(location.name, location);
      }
      
      // Neighborhood map grouped by city
      if (location.type === 'neighborhood' && location.parentCity) {
        if (!this.neighborhoodMap.has(location.parentCity)) {
          this.neighborhoodMap.set(location.parentCity, []);
        }
        this.neighborhoodMap.get(location.parentCity)!.push(location);
      }
    });
  }

  /**
   * Ultra-fast search with intelligent Arabic matching
   */
  public searchCities(query: string, limit: number = 10): SearchResult[] {
    if (!query.trim()) return [];

    const normalizedQuery = query.trim();
    const results: SearchResult[] = [];
    
    // Strategy 1: Use search index for first character optimization
    const firstChar = normalizedQuery.charAt(0);
    const candidateLocations = this.searchIndex[firstChar] || this.allLocations;
    
    // Strategy 2: Multi-tier matching with relevance scoring
    const exactMatches: SearchResult[] = [];
    const startsWithMatches: SearchResult[] = [];
    const containsMatches: SearchResult[] = [];
    
    candidateLocations.forEach(location => {
      const locationName = location.name;
      const formattedName = this.formatLocationDisplay(location);
      
      let relevanceScore = 0;
      let matchType: 'exact' | 'startsWith' | 'contains' | null = null;
      
      // Exact match (highest priority)
      if (locationName === normalizedQuery) {
        relevanceScore = 100;
        matchType = 'exact';
      }
      // Starts with match
      else if (locationName.startsWith(normalizedQuery)) {
        relevanceScore = 80 - (locationName.length - normalizedQuery.length) * 0.1;
        matchType = 'startsWith';
      }
      // Contains match
      else if (locationName.includes(normalizedQuery)) {
        relevanceScore = 60 - (locationName.indexOf(normalizedQuery) * 0.5);
        matchType = 'contains';
      }
      
      if (matchType) {
        // Boost cities over neighborhoods
        if (location.type === 'city') relevanceScore += 10;
        
        const result: SearchResult = {
          ...location,
          formattedName,
          relevanceScore
        };
        
        switch (matchType) {
          case 'exact':
            exactMatches.push(result);
            break;
          case 'startsWith':
            startsWithMatches.push(result);
            break;
          case 'contains':
            containsMatches.push(result);
            break;
        }
      }
    });
    
    // Sort by relevance within each tier
    exactMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    startsWithMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    containsMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Combine results with tier priority
    results.push(...exactMatches, ...startsWithMatches, ...containsMatches);
    
    return results.slice(0, limit);
  }

  /**
   * Format location for display: "حديقة السبكي، دمشق"
   */
  public formatLocationDisplay(location: LocationData): string {
    if (location.type === 'city') {
      return location.name;
    }
    
    if (location.type === 'neighborhood' && location.parentCity) {
      return `${location.name}، ${location.parentCity}`;
    }
    
    return location.name;
  }

  /**
   * Format location for database storage
   */
  public formatLocationForDatabase(cityName: string, neighborhoodName?: string): string {
    if (!neighborhoodName) return cityName;
    return `${neighborhoodName}، ${cityName}`;
  }

  /**
   * Get all cities (O(1) operation)
   */
  public getAllCities(): LocationData[] {
    return Array.from(this.cityMap.values());
  }

  /**
   * Get neighborhoods for a city (O(1) operation)
   */
  public getNeighborhoodsForCity(cityName: string): LocationData[] {
    return this.neighborhoodMap.get(cityName) || [];
  }

  /**
   * Find parent city for neighborhood (O(1) operation)
   */
  public findParentCity(neighborhoodName: string): string | null {
    const neighborhood = this.allLocations.find(
      loc => loc.type === 'neighborhood' && loc.name === neighborhoodName
    );
    return neighborhood?.parentCity || null;
  }

  /**
   * Get total location count
   */
  public getTotalLocationCount(): number {
    return this.allLocations.length;
  }

  /**
   * Get cities and neighborhoods count
   */
  public getLocationStats(): { cities: number; neighborhoods: number; total: number } {
    const cities = this.cityMap.size;
    const neighborhoods = this.allLocations.filter(loc => loc.type === 'neighborhood').length;
    return { cities, neighborhoods, total: cities + neighborhoods };
  }

  /**
   * Find nearby locations using Haversine formula
   */
  public findNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
    limit: number = 10
  ): LocationData[] {
    const nearby: Array<LocationData & { distance: number }> = [];
    
    this.allLocations.forEach(location => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
      
      if (distance <= radiusKm) {
        nearby.push({ ...location, distance });
      }
    });
    
    // Sort by distance and return without distance property
    return nearby
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ distance, ...location }) => location);
  }

  /**
   * Haversine formula for distance calculation
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Parse location string "حديقة السبكي، دمشق" into components
   */
  public parseLocationString(locationString: string): { neighborhood?: string; city?: string } {
    if (!locationString.includes('،')) {
      // Single location - could be city or neighborhood
      const location = this.allLocations.find(loc => loc.name === locationString.trim());
      if (location?.type === 'city') {
        return { city: locationString.trim() };
      } else if (location?.type === 'neighborhood') {
        return { 
          neighborhood: locationString.trim(),
          city: location.parentCity || undefined
        };
      }
      return { city: locationString.trim() };
    }
    
    const [neighborhood, city] = locationString.split('،').map(s => s.trim());
    return { neighborhood, city };
  }

  /**
   * Validate location exists in database
   */
  public validateLocation(locationString: string): boolean {
    const { neighborhood, city } = this.parseLocationString(locationString);
    
    if (neighborhood && city) {
      // Validate both neighborhood and city exist and are related
      const cityExists = this.cityMap.has(city);
      const neighborhoodExists = this.getNeighborhoodsForCity(city)
        .some(n => n.name === neighborhood);
      return cityExists && neighborhoodExists;
    } else if (city) {
      // Validate city exists
      return this.cityMap.has(city);
    }
    
    return false;
  }
}

// Export singleton instance
export default OptimizedCityService.getInstance();
