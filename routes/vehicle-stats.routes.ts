import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ResponseHelpers } from "../utils/error.handler.js";
import { getVehicleStats, getSubcategories } from "../data/vehicles/index.js";

export default async function vehicleStatsRoutes(fastify: FastifyInstance) {
  // Get vehicle statistics
  fastify.get(
    "/stats",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = getVehicleStats();
        const subcategories = getSubcategories();
        
        return ResponseHelpers.ok(reply, {
          subcategories,
          stats,
          totalSubcategories: subcategories.length,
          summary: {
            totalMakes: Object.values(stats).reduce((sum, stat) => sum + stat.totalMakes, 0),
            totalModels: Object.values(stats).reduce((sum, stat) => sum + stat.totalModels, 0),
          }
        });
      } catch (error) {
        return ResponseHelpers.internal(reply, new Error("Failed to fetch vehicle statistics"));
      }
    }
  );

  // Get available subcategories
  fastify.get(
    "/subcategories",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const subcategories = getSubcategories();
        
        return ResponseHelpers.ok(reply, {
          subcategories,
          total: subcategories.length,
          descriptions: {
            CARS: "Passenger vehicles, sedans, SUVs, hatchbacks, coupes",
            MOTORCYCLES: "Motorcycles, scooters, sport bikes, cruisers",
            COMMERCIAL_TRANSPORT: "Trucks, vans, buses, commercial vehicles",
            CONSTRUCTION_VEHICLES: "Excavators, bulldozers, cranes, construction equipment"
          }
        });
      } catch (error) {
        return ResponseHelpers.internal(reply, new Error("Failed to fetch subcategories"));
      }
    }
  );
}
