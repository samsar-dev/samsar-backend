import { FastifyRequest, FastifyReply } from "fastify";
import { ListingValidator, ListingDataNormalizer } from "../validators/listing.validation.js";
import { ListingCategory } from "../types/enums.js";
import { ErrorHandler, ValidationError, ResponseHelpers } from "../utils/error.handler.js";

// Request types for listing operations
export interface ListingCreateRequest extends FastifyRequest {
  body: {
    title: string;
    description: string;
    price: number | string;
    mainCategory: ListingCategory;
    subCategory: string;
    location: string;
    latitude?: number | string;
    longitude?: number | string;
    listingAction?: string;
    details?: string | any;
    // Vehicle fields
    make?: string;
    model?: string;
    year?: string | number;
    condition?: string;
    sellerType?: string;
    fuelType?: string;
    transmission?: string;
    transmissionType?: string;
    bodyType?: string;
    engineSize?: string | number;
    mileage?: string | number;
    exteriorColor?: string;
    color?: string;
    accidental?: string | boolean;
    horsepower?: string | number;
    registrationExpiry?: string;
    // Real estate fields
    bedrooms?: string | number;
    bathrooms?: string | number;
    totalArea?: string | number;
    yearBuilt?: string | number;
    furnishing?: string;
    floor?: string | number;
    totalFloors?: string | number;
    parking?: string;
    [key: string]: any; // Allow additional fields
  };
  validatedData?: any;
  processedImages?: Array<{ url: string; order: number }>;
}

export interface ListingUpdateRequest extends FastifyRequest {
  params: { id: string };
  body: {
    title?: string;
    description?: string;
    price?: number | string;
    mainCategory?: ListingCategory;
    subCategory?: string;
    location?: string;
    latitude?: number | string;
    longitude?: number | string;
    listingAction?: string;
    details?: string | any;
    existingImages?: string[] | string;
    // Vehicle fields
    make?: string;
    model?: string;
    year?: string | number;
    condition?: string;
    sellerType?: string;
    fuelType?: string;
    transmission?: string;
    transmissionType?: string;
    bodyType?: string;
    engineSize?: string | number;
    mileage?: string | number;
    exteriorColor?: string;
    color?: string;
    accidental?: string | boolean;
    horsepower?: string | number;
    registrationExpiry?: string;
    // Real estate fields
    bedrooms?: string | number;
    bathrooms?: string | number;
    totalArea?: string | number;
    yearBuilt?: string | number;
    furnishing?: string;
    floor?: string | number;
    totalFloors?: string | number;
    parking?: string;
    [key: string]: any; // Allow additional fields
  };
  validatedData?: any;
  processedImages?: Array<{ url: string; order: number }>;
}

// Validation middleware for creating listings
export async function validateListingCreate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const req = request as any;
    const body = req.body as any;

    console.log("\n🔍 === VALIDATION MIDDLEWARE START ===");
    console.log("📥 RAW REQUEST ANALYSIS:");
    console.log("  Request method:", request.method);
    console.log("  Request URL:", request.url);
    console.log("  Content-Type:", request.headers['content-type']);
    console.log("  Request body type:", typeof body);
    console.log("  Request body keys:", Object.keys(body || {}));
    console.log("  Request body:", body);
    
    if (request.isMultipart && request.isMultipart()) {
      console.log("  📎 Multipart request detected");
      console.log("  📎 Files:", (request as any).files);
    }

    if (!body) {
      return ResponseHelpers.badRequest(reply, "Request body is required");
    }

    // Parse details if it's a string
    console.log("\n📋 PARSING DETAILS:");
    console.log("  Details type:", typeof body.details);
    console.log("  Raw details:", body.details);
    
    let parsedDetails;
    try {
      parsedDetails = typeof body.details === 'string' 
        ? JSON.parse(body.details) 
        : body.details;
      console.log("  ✅ Parsed details successfully:", parsedDetails);
    } catch (error) {
      console.log("  ❌ Failed to parse details:", error);
      return ResponseHelpers.badRequest(reply, "Invalid details format. Must be valid JSON.");
    }
    
    // Normalize the data
    console.log("\n🔄 NORMALIZING BASE DATA:");
    const normalizedData = ListingDataNormalizer.normalizeBaseData(body);
    console.log("  Base normalized data:", normalizedData);
    
    // Extract and pass through vehicle/real estate fields from multipart form data
    const vehicleFields = [
      'make', 'model', 'year', 'condition', 'sellerType', 'fuelType', 
      'transmission', 'transmissionType', 'bodyType', 'engineSize', 
      'mileage', 'exteriorColor', 'color', 'accidental', 'horsepower', 
      'registrationExpiry'
    ];
    
    const realEstateFields = [
      'bedrooms', 'bathrooms', 'totalArea', 'yearBuilt', 'furnishing', 
      'floor', 'totalFloors', 'parking'
    ];
    
    console.log("\n🚗 VEHICLE FIELDS EXTRACTION:");
    console.log("  Available vehicle fields to check:", vehicleFields);
    console.log("  Body keys that might match:", Object.keys(body).filter(key => vehicleFields.includes(key)));
    
    // Add vehicle fields to normalized data if they exist in the request body
    console.log("\n🔍 DETAILED VEHICLE FIELD ANALYSIS:");
    let foundVehicleFields = 0;
    vehicleFields.forEach(field => {
      const value = body[field];
      const valueType = typeof value;
      const isEmpty = value === undefined || value === null || value === '';
      
      console.log(`  📝 ${field}:`);
      console.log(`    Value: '${value}'`);
      console.log(`    Type: ${valueType}`);
      console.log(`    Is empty: ${isEmpty}`);
      
      if (!isEmpty) {
        normalizedData[field] = value;
        foundVehicleFields++;
        console.log(`    ✅ ADDED to normalized data`);
      } else {
        console.log(`    ❌ SKIPPED (empty/null/undefined)`);
      }
    });
    
    console.log(`\n📊 VEHICLE FIELDS SUMMARY:`);
    console.log(`  Total vehicle fields checked: ${vehicleFields.length}`);
    console.log(`  Vehicle fields found and added: ${foundVehicleFields}`);
    console.log(`  Missing vehicle fields: ${vehicleFields.length - foundVehicleFields}`);
    
    console.log("\n📦 FINAL NORMALIZED DATA ANALYSIS:");
    console.log(`  Total normalized data keys: ${Object.keys(normalizedData).length}`);
    console.log(`  Normalized data keys: [${Object.keys(normalizedData).join(', ')}]`);
    console.log(`  Full normalized data:`, normalizedData);
    
    // Check specifically for vehicle fields in normalized data
    const vehicleFieldsInNormalized = vehicleFields.filter(field => normalizedData.hasOwnProperty(field));
    console.log(`  Vehicle fields in normalized data: [${vehicleFieldsInNormalized.join(', ')}]`);
    
    if (vehicleFieldsInNormalized.length > 0) {
      console.log(`  ✅ Vehicle field values in normalized data:`);
      vehicleFieldsInNormalized.forEach(field => {
        console.log(`    ${field}: '${normalizedData[field]}'`);
      });
    } else {
      console.log(`  ❌ NO vehicle fields found in normalized data!`);
    }
    
    // Add real estate fields to normalized data if they exist in the request body
    realEstateFields.forEach(field => {
      if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
        normalizedData[field] = body[field];
      }
    });
    
    // Attach validated data to request for use in route handler
    req.validatedData = normalizedData;
    
    console.log("\n🎯 VALIDATION MIDDLEWARE COMPLETE:");
    console.log(`  req.validatedData attached with ${Object.keys(normalizedData).length} fields`);
    console.log(`  Vehicle fields passed to route handler: [${vehicleFieldsInNormalized.join(', ')}]`);
    console.log("🔍 === VALIDATION MIDDLEWARE END ===\n");
    
  } catch (error) {
    console.error("❌ Validation middleware error:", error);
    return ErrorHandler.sendError(reply, error as Error, request.url);
  }
}

// Validation middleware for updating listings
export async function validateListingUpdate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const req = request as ListingUpdateRequest;
    const body = req.body;

    if (!body) {
      return ResponseHelpers.badRequest(reply, "Request body is required");
    }

    // Parse details if it's a string
    let parsedDetails;
    if (body.details) {
      try {
        parsedDetails = typeof body.details === 'string' 
          ? JSON.parse(body.details) 
          : body.details;
      } catch (error) {
        return ResponseHelpers.badRequest(reply, "Invalid details format. Must be valid JSON.");
      }
    }

    // Parse existing images if it's a string
    let parsedExistingImages;
    if (body.existingImages) {
      try {
        parsedExistingImages = typeof body.existingImages === 'string'
          ? JSON.parse(body.existingImages)
          : body.existingImages;
      } catch (error) {
        return ResponseHelpers.badRequest(reply, "Invalid existing images format. Must be valid JSON array.");
      }
    }

    // Normalize the data (only for provided fields)
    const normalizedData: any = {};
    
    if (body.title !== undefined) normalizedData.title = body.title?.trim();
    if (body.description !== undefined) normalizedData.description = body.description?.trim();
    if (body.price !== undefined) normalizedData.price = Number(body.price);
    if (body.mainCategory !== undefined) normalizedData.mainCategory = body.mainCategory;
    if (body.subCategory !== undefined) normalizedData.subCategory = body.subCategory;
    if (body.location !== undefined) normalizedData.location = body.location?.trim();
    if (body.latitude !== undefined) normalizedData.latitude = Number(body.latitude);
    if (body.longitude !== undefined) normalizedData.longitude = Number(body.longitude);
    if (body.listingAction !== undefined) normalizedData.listingAction = body.listingAction;

    if (parsedExistingImages) {
      normalizedData.existingImages = parsedExistingImages;
    }

    // Validate individual fields if they are provided
    const errors: string[] = [];

    if (normalizedData.title !== undefined) {
      if (!normalizedData.title || normalizedData.title.length === 0) {
        errors.push("Title cannot be empty");
      } else if (normalizedData.title.length > 200) {
        errors.push("Title must not exceed 200 characters");
      }
    }

    if (normalizedData.description !== undefined) {
      if (!normalizedData.description || normalizedData.description.length === 0) {
        errors.push("Description cannot be empty");
      } else if (normalizedData.description.length > 5000) {
        errors.push("Description must not exceed 5000 characters");
      }
    }

    if (normalizedData.price !== undefined) {
      if (isNaN(normalizedData.price) || normalizedData.price <= 0) {
        errors.push("Price must be a positive number");
      }
    }

    if (normalizedData.latitude !== undefined) {
      if (isNaN(normalizedData.latitude) || normalizedData.latitude < -90 || normalizedData.latitude > 90) {
        errors.push("Latitude must be a number between -90 and 90");
      }
    }

    if (normalizedData.longitude !== undefined) {
      if (isNaN(normalizedData.longitude) || normalizedData.longitude < -180 || normalizedData.longitude > 180) {
        errors.push("Longitude must be a number between -180 and 180");
      }
    }

    // Validate details if provided
    if (normalizedData.details) {
      if (normalizedData.mainCategory && normalizedData.subCategory) {
        const validation = ListingValidator.validateBaseListing({
          mainCategory: normalizedData.mainCategory,
          subCategory: normalizedData.subCategory,
          details: normalizedData.details,
          // Include dummy required fields for validation
          title: normalizedData.title || "dummy",
          description: normalizedData.description || "dummy",
          price: normalizedData.price || 1,
          location: normalizedData.location || "dummy",
        });
        errors.push(...validation.errors.filter(err => !err.includes("dummy")));
      }
    }

    if (errors.length > 0) {
      return ResponseHelpers.badRequest(reply, "Validation failed", errors);
    }

    // Attach validated data to request for use in route handler
    req.validatedData = normalizedData;

  } catch (error) {
    console.error("Update validation middleware error:", error);
    return ErrorHandler.sendError(reply, error as Error, request.url);
  }
}

// Query validation middleware for listing filters
export async function validateListingQuery(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const query = request.query as any;
    const errors: string[] = [];

    // Validate pagination parameters
    if (query.page !== undefined) {
      const page = Number(query.page);
      if (isNaN(page) || page < 1) {
        errors.push("Page must be a positive integer");
      }
    }

    if (query.limit !== undefined) {
      const limit = Number(query.limit);
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push("Limit must be between 1 and 100");
      }
    }

    // Validate price range
    if (query.minPrice !== undefined) {
      const minPrice = Number(query.minPrice);
      if (isNaN(minPrice) || minPrice < 0) {
        errors.push("Minimum price must be a non-negative number");
      }
    }

    if (query.maxPrice !== undefined) {
      const maxPrice = Number(query.maxPrice);
      if (isNaN(maxPrice) || maxPrice < 0) {
        errors.push("Maximum price must be a non-negative number");
      }
    }

    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      const minPrice = Number(query.minPrice);
      const maxPrice = Number(query.maxPrice);
      if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
        errors.push("Minimum price cannot be greater than maximum price");
      }
    }

    // Validate location parameters
    if (query.latitude !== undefined) {
      const lat = Number(query.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push("Latitude must be between -90 and 90");
      }
    }

    if (query.longitude !== undefined) {
      const lng = Number(query.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.push("Longitude must be between -180 and 180");
      }
    }

    if (query.radius !== undefined) {
      const radius = Number(query.radius);
      if (isNaN(radius) || radius < 0 || radius > 1000) {
        errors.push("Radius must be between 0 and 1000 km");
      }
    }

    // Validate sort parameters
    const validSortFields = ['price', 'createdAt', 'favorites', 'views'];
    if (query.sortBy !== undefined && !validSortFields.includes(query.sortBy)) {
      errors.push(`Sort field must be one of: ${validSortFields.join(', ')}`);
    }

    const validSortOrders = ['asc', 'desc'];
    if (query.sortOrder !== undefined && !validSortOrders.includes(query.sortOrder.toLowerCase())) {
      errors.push(`Sort order must be one of: ${validSortOrders.join(', ')}`);
    }

    if (errors.length > 0) {
      return ResponseHelpers.badRequest(reply, "Invalid query parameters", errors);
    }

  } catch (error) {
    console.error("Query validation middleware error:", error);
    return ErrorHandler.sendError(reply, error as Error, request.url);
  }
}

// Legacy helper functions for backward compatibility
export function createValidationErrorResponse(errors: string[]) {
  return ErrorHandler.validationError(errors);
}

export function createSuccessResponse(data: any, status: number = 200) {
  return ErrorHandler.createSuccessResponse(data, status);
}
