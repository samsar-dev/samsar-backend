export interface CityCoordinates {
    name: string;
    latitude: number;
    longitude: number;
    neighbors?: CityCoordinates[];
}
export interface CityWithDistance extends CityCoordinates {
    distance: number;
}
export interface NearbyCitiesParams {
    lat: number;
    lng: number;
    radiusKm: number;
    limit?: number;
}
