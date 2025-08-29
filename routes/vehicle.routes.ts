import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authenticate } from "../middleware/auth.js";
import { ErrorHandler, ResponseHelpers } from "../utils/error.handler.js";
import { 
  VEHICLE_DATA, 
  getVehicleMakes, 
  getVehicleModels, 
  getAllVehicleData, 
  isValidSubcategory, 
  isValidMake,
  getVehicleStats 
} from "../data/vehicles/index.js";

interface VehicleMakeQuery {
  subcategory?: string;
}

interface VehicleModelQuery {
  make?: string;
  subcategory?: string;
}

export default async function vehicleRoutes(fastify: FastifyInstance) {
  // Get vehicle makes by subcategory
  fastify.get(
    "/makes",
    async (request: FastifyRequest<{ Querystring: VehicleMakeQuery }>, reply: FastifyReply) => {
      try {
        console.log("🚗 Vehicle makes endpoint called");
        const { subcategory } = request.query;
        console.log("📊 Subcategory received:", subcategory);
        
        if (!subcategory) {
          console.log("❌ No subcategory provided");
          return ResponseHelpers.badRequest(reply, "Subcategory is required");
        }

        console.log("🔍 Checking if subcategory is valid:", subcategory);
        if (!isValidSubcategory(subcategory)) {
          console.log("❌ Invalid subcategory:", subcategory);
          return ResponseHelpers.badRequest(reply, `Invalid subcategory: ${subcategory}`);
        }

        console.log("✅ Subcategory is valid, fetching makes...");
        const makes = getVehicleMakes(subcategory);
        console.log("📋 Makes found:", makes.length);
        
        const responseData = {
          subcategory: subcategory.toUpperCase(),
          makes,
          total: makes.length
        };
        
        console.log("📤 Sending response:", responseData);
        return ResponseHelpers.ok(reply, responseData);
      } catch (error) {
        console.error("❌ Error fetching vehicle makes:", error);
        return ErrorHandler.sendError(reply, error as Error, request.url);
      }
    }
  );

  // Get vehicle models by make and subcategory
  fastify.get(
    "/models",
    async (request: FastifyRequest<{ Querystring: VehicleModelQuery }>, reply: FastifyReply) => {
      try {
        const { make, subcategory } = request.query;
        
        if (!make || !subcategory) {
          return ResponseHelpers.badRequest(reply, "Both make and subcategory are required");
        }

        if (!isValidSubcategory(subcategory)) {
          return ResponseHelpers.badRequest(reply, `Invalid subcategory: ${subcategory}`);
        }

        if (!isValidMake(subcategory, make)) {
          return ResponseHelpers.badRequest(reply, `Invalid make: ${make} for subcategory: ${subcategory}`);
        }

        const models = getVehicleModels(subcategory, make);
        return ResponseHelpers.ok(reply, {
          make,
          subcategory: subcategory.toUpperCase(),
          models,
          total: models.length
        });
      } catch (error) {
        console.error("Error fetching vehicle models:", error);
        return ErrorHandler.sendError(reply, error as Error, request.url);
      }
    }
  );

  // Get all vehicle data for a subcategory (makes + models)
  fastify.get(
    "/all",
    async (request: FastifyRequest<{ Querystring: VehicleMakeQuery }>, reply: FastifyReply) => {
      try {
        const { subcategory } = request.query;
        
        if (!subcategory) {
          return ResponseHelpers.badRequest(reply, "Subcategory is required");
        }

        if (!isValidSubcategory(subcategory)) {
          return ResponseHelpers.badRequest(reply, `Invalid subcategory: ${subcategory}`);
        }

        const vehicleData = getAllVehicleData(subcategory);
        if (!vehicleData) {
          return ResponseHelpers.badRequest(reply, `No data available for subcategory: ${subcategory}`);
        }

        return ResponseHelpers.ok(reply, {
          subcategory: subcategory.toUpperCase(),
          makes: vehicleData.makes,
          models: vehicleData.models,
          totalMakes: vehicleData.makes.length,
          totalModels: Object.values(vehicleData.models).flat().length
        });
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
        return ErrorHandler.sendError(reply, error as Error, request.url);
      }
    }
  );
}
