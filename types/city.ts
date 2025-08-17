// City coordinate interface for geographic data
export interface CityCoordinates {
  name: string;
  latitude: number;
  longitude: number;
}

// City with distance calculation result
export interface CityWithDistance extends CityCoordinates {
  distance: number; // distance in kilometers
}

// Parameters for nearby cities search
export interface NearbyCitiesParams {
  latitude: number;
  longitude: number;
  radiusKm: number;
  limit?: number;
}
