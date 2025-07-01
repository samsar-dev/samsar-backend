import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import axios from "axios";
import { CityService } from "../src/services/cityService.js";
import { NearbyCitiesParams } from "../src/types/city.js";

// Type definitions for query parameters
interface SearchQuery {
  q?: string;
  limit?: string;
  proximity?: string;
  country?: string;
}

interface ReverseQuery {
  lat?: string;
  lng?: string;
}

interface NearbyCitiesQuery {
  lat: string;
  lng: string;
  radiusKm?: string;
  limit?: string;
}

export default async function (fastify: FastifyInstance) {
  // Environment variables
  const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  /**
   * Get cities near a specific location
   */
  fastify.get<{ Querystring: NearbyCitiesQuery }>(
    "/api/locations/nearby-cities",
    async (req, reply) => {
      try {
        const { lat, lng, radiusKm = "50", limit } = req.query;

        if (!lat || !lng) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "MISSING_COORDINATES",
              message:
                "Latitude (lat) and longitude (lng) are required parameters",
            },
          });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radius = parseFloat(radiusKm);
        const limitNumber = limit ? parseInt(limit, 10) : undefined;

        if (isNaN(latitude) || isNaN(longitude) || isNaN(radius)) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_PARAMETERS",
              message: "lat, lng, and radiusKm must be valid numbers",
            },
          });
        }

        const nearbyCities = CityService.findNearbyCities(
          latitude,
          longitude,
          radius,
          limitNumber,
        );

        return {
          success: true,
          data: {
            center: { lat: latitude, lng: longitude },
            radiusKm: radius,
            cities: nearbyCities,
          },
        };
      } catch (error) {
        console.error("Error finding nearby cities:", error);
        return reply.code(500).send({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An error occurred while finding nearby cities",
          },
        });
      }
    },
  );

  /**
   * Get all cities (for frontend to use)
   */
  fastify.get("/api/locations/cities", async (_req, reply) => {
    try {
      const cities = CityService.getAllCities();
      return {
        success: true,
        data: cities,
      };
    } catch (error) {
      console.error("Error getting cities:", error);
      return reply.code(500).send({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while getting cities",
        },
      });
    }
  });

  /**
   * Search for locations using Mapbox Geocoding API
   */
  fastify.get<{ Querystring: SearchQuery }>(
    "/api/locations/search",
    async (req, reply) => {
      try {
        const { q, limit = 5, proximity, country = "sy" } = req.query;

        if (!q) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "MISSING_QUERY",
              message: 'Query parameter "q" is required',
            },
          });
        }

        // Construct the Mapbox API URL
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          q as string,
        )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=${country}&limit=${limit}${proximity ? `&proximity=${proximity}` : ""}`;

        const response = await axios.get(url);
        const features = response.data.features;

        // Transform Mapbox response to match our interface
        const results = features.map((feature) => ({
          place_id: feature.id,
          display_name: feature.place_name,
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
          address: {
            city: feature.context?.find((ctx) => ctx.id.includes("place"))
              ?.text,
            municipality: feature.context?.find((ctx) =>
              ctx.id.includes("locality"),
            )?.text,
            country: feature.context?.find((ctx) => ctx.id.includes("country"))
              ?.text,
            country_code: feature.context?.find((ctx) =>
              ctx.id.includes("country"),
            )?.short_code,
          },
          namedetails: {
            name: feature.text,
            "name:ar": feature.properties?.name_ar,
            "name:en": feature.properties?.name_en,
          },
        }));

        reply.send({
          success: true,
          data: results,
        });
      } catch (error) {
        console.error("Error searching locations:", error);
        reply.code(500).send({
          success: false,
          error: {
            code: "GEOCODING_ERROR",
            message: "Failed to search locations",
          },
        });
      }
    },
  );

  /**
   * Reverse geocode coordinates to get address
   */
  fastify.get<{ Querystring: ReverseQuery }>(
    "/api/locations/reverse",
    async (req, reply) => {
      try {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
          return reply.code(400).send({
            success: false,
            error: {
              code: "INVALID_COORDINATES",
              message: "Latitude and longitude are required",
            },
          });
        }

        const response = await axios.get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=place,locality`,
        );

        const feature = response.data.features[0];
        if (!feature) {
          return reply.code(404).send({
            success: false,
            error: {
              code: "NO_LOCATION_FOUND",
              message: "No location found for these coordinates",
            },
          });
        }

        reply.send({
          success: true,
          data: {
            place_id: feature.id,
            display_name: feature.place_name,
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0],
            address: {
              city: feature.context?.find((ctx) => ctx.id.includes("place"))
                ?.text,
              municipality: feature.context?.find((ctx) =>
                ctx.id.includes("locality"),
              )?.text,
              country: feature.context?.find((ctx) =>
                ctx.id.includes("country"),
              )?.text,
              country_code: feature.context?.find((ctx) =>
                ctx.id.includes("country"),
              )?.short_code,
            },
            namedetails: {
              name: feature.text,
              "name:ar": feature.properties?.name_ar,
              "name:en": feature.properties?.name_en,
            },
          },
        });
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        reply.code(500).send({
          success: false,
          error: {
            code: "GEOCODING_ERROR",
            message: "Failed to reverse geocode coordinates",
          },
        });
      }
    },
  );
}
