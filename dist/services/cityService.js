"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CityService = void 0;
const geoUtils_js_1 = require("../utils/geoUtils.js");
// This should be populated from a database in a real application
// For now, we'll use a simplified version of the cities data
const syrianCities = [
    {
        name: "Damascus",
        latitude: 33.5131,
        longitude: 36.2913,
    },
    {
        name: "Aleppo",
        latitude: 36.2018,
        longitude: 37.1556,
    },
    {
        name: "Homs",
        latitude: 34.7324,
        longitude: 36.7132,
    },
    {
        name: "Hama",
        latitude: 35.1318,
        longitude: 36.7578,
    },
    {
        name: "Latakia",
        latitude: 35.5216,
        longitude: 35.7924,
    },
    {
        name: "Tartus",
        latitude: 34.895,
        longitude: 35.8867,
    },
    {
        name: "Deir ez-Zor",
        latitude: 35.3333,
        longitude: 40.15,
    },
    {
        name: "Al-Hasakah",
        latitude: 36.5119,
        longitude: 40.7422,
    },
    {
        name: "Qamishli",
        latitude: 37.05,
        longitude: 41.2167,
    },
    {
        name: "Raqqa",
        latitude: 35.95,
        longitude: 39.0167,
    },
];
class CityService {
    /**
     * Find all cities within a specified radius from a given point
     */
    static findNearbyCities(lat, lng, radiusKm, limit) {
        let results = (0, geoUtils_js_1.findCitiesInRadius)(syrianCities, lat, lng, radiusKm);
        if (limit) {
            results = results.slice(0, limit);
        }
        return results;
    }
    /**
     * Get all cities (for frontend to use)
     */
    static getAllCities() {
        return syrianCities;
    }
}
exports.CityService = CityService;
//# sourceMappingURL=cityService.js.map