import { 
  VehicleType, 
  PropertyType,
  ListingAction,
  ListingCategory 
} from "../types/enums.js";
// Base listing validation schema
export interface ListingValidationSchema {
  title: string;
  description: string;
  price: number;
  mainCategory: ListingCategory;
  subCategory: VehicleType | PropertyType;
  location: string;
  latitude?: number;
  longitude?: number;
  listingAction?: ListingAction;
  details?: {
    vehicles?: any;
    realEstate?: any;
  };
}

// Validation functions
export class ListingValidator {
  
  static validateBaseListing(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validations
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push("Title is required and must be a non-empty string");
    } else if (data.title.trim().length > 200) {
      errors.push("Title must not exceed 200 characters");
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push("Description is required and must be a non-empty string");
    } else if (data.description.trim().length > 5000) {
      errors.push("Description must not exceed 5000 characters");
    }

    if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
      errors.push("Price is required and must be a positive number");
    }

    if (!data.mainCategory || !Object.values(ListingCategory).includes(data.mainCategory)) {
      errors.push(`Main category is required. Must be one of: ${Object.values(ListingCategory).join(', ')}`);
    }

    if (!data.subCategory) {
      errors.push("Sub category is required");
    } else {
      // Validate subCategory based on mainCategory
      if (data.mainCategory === ListingCategory.VEHICLES && !Object.values(VehicleType).includes(data.subCategory)) {
        errors.push(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}`);
      } else if (data.mainCategory === ListingCategory.REAL_ESTATE && !Object.values(PropertyType).includes(data.subCategory)) {
        errors.push(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
      }
    }

    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push("Location is required and must be a non-empty string");
    }

    // Optional field validations
    if (data.latitude !== undefined && (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90)) {
      errors.push("Latitude must be a number between -90 and 90");
    }

    if (data.longitude !== undefined && (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180)) {
      errors.push("Longitude must be a number between -180 and 180");
    }

    if (data.listingAction && !Object.values(ListingAction).includes(data.listingAction)) {
      errors.push(`Invalid listing action. Must be one of: ${Object.values(ListingAction).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Helper function to sanitize and normalize data
export class ListingDataNormalizer {
  static normalizeBaseData(data: any): Partial<ListingValidationSchema> {
    // Extract base fields
    const baseData = {
      title: data.title?.trim(),
      description: data.description?.trim(),
      price: data.price ? Number(data.price) : undefined,
      mainCategory: data.mainCategory,
      subCategory: data.subCategory,
      location: data.location?.trim(),
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      listingAction: data.listingAction || ListingAction.SALE,
      details: data.details || {},
    };

    // Preserve all vehicle fields from multipart form data
    const vehicleFields = [
      'make', 'model', 'year', 'condition', 'sellerType', 'fuelType', 
      'transmission', 'transmissionType', 'bodyType', 'engineSize', 
      'mileage', 'exteriorColor', 'color', 'accidental', 'horsepower', 
      'registrationExpiry', 'doors', 'seatingCapacity', 'interiorColor'
    ];

    // Preserve all real estate fields from multipart form data
    const realEstateFields = [
      'bedrooms', 'bathrooms', 'totalArea', 'yearBuilt', 'furnishing', 
      'floor', 'totalFloors', 'parking'
    ];

    // Add vehicle fields if they exist
    vehicleFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (baseData as any)[field] = data[field];
      }
    });

    // Add real estate fields if they exist
    realEstateFields.forEach(field => {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        (baseData as any)[field] = data[field];
      }
    });

    return baseData;
  }

  // static normalizeVehicleDetails(data: any, subCategory?: VehicleType): Partial<any> {
  //   if (!data) return {};

  //   // Only include defined values to reduce payload size
  //   const normalized: Partial<any> = {};

  //   const allErrors: string[] = []
    
  //   // Use provided vehicleType or fallback to subCategory - validate it exists in VehicleType enum
  //   if (data.vehicleType) {
  //     // Handle common variations
  //     let vehicleType = data.vehicleType;
  //     if (vehicleType === "CAR") vehicleType = "CARS";
  //     if (vehicleType === "MOTORCYCLE") vehicleType = "MOTORCYCLES";
  //     if (vehicleType === "VAN") vehicleType = "VANS";
  //     if (vehicleType === "TRUCK") vehicleType = "TRUCKS";
  //     if (vehicleType === "BUS") vehicleType = "BUSES";
  //     if (vehicleType === "TRACTOR") vehicleType = "TRACTORS";
      
  //     if (Object.values(VehicleType).includes(vehicleType)) {
  //       normalized.vehicleType = vehicleType;
  //     } else {
  //       allErrors.push(`Invalid vehicle type "${data.vehicleType}". Must be one of: ${Object.values(VehicleType).join(', ')}`)
  //     }
  //   } 

  //   if (data.make) normalized.make = data.make.trim();
  //   if (data.model) normalized.model = data.model.trim();
  //   if (data.year) normalized.year = Number(data.year);
  //   if (data.mileage !== undefined && data.mileage !== null) normalized.mileage = Number(data.mileage);

  //   if (data.fuelType) {
  //     // Handle common variations
  //     let fuelType = data.fuelType;
  //     if (fuelType === "Petrol" || fuelType === "PETROL" || fuelType === "Gas") fuelType = "GASOLINE";
  //     if (fuelType === "DIESEL") fuelType = "DIESEL";
  //     if (fuelType === "Electric" || fuelType === "ELECTRIC") fuelType = "ELECTRIC";
  //     if (fuelType === "Hybrid" || fuelType === "HYBRID") fuelType = "HYBRID";
      
  //     if (Object.values(FuelType).includes(fuelType)) {
  //       normalized.fuelType = fuelType;
  //     } else {
  //       allErrors.push(`Invalid fuel type "${data.fuelType}". Must be one of: ${Object.values(FuelType).join(', ')}`)
  //     }
  //   }

  //   if (data.transmissionType) {
  //     // Handle common variations
  //     let transmissionType = data.transmissionType;
  //     if (transmissionType === "Automatic" || transmissionType === "automatic") transmissionType = "AUTOMATIC";
  //     if (transmissionType === "Manual" || transmissionType === "manual") transmissionType = "MANUAL";
      
  //     if (Object.values(TransmissionType).includes(transmissionType)) {
  //       normalized.transmissionType = transmissionType;
  //     } else {
  //       allErrors.push(`Invalid transmission type "${data.transmissionType}". Must be one of: ${Object.values(TransmissionType).join(', ')}`)
  //     }
  //   }

  //   if (data.color) normalized.color = data.color.trim();
  //   if (data.condition) {
  //     // Handle common variations
  //     let condition = data.condition;
  //     if (condition === "Used" || condition === "used") condition = "USED";
  //     if (condition === "New" || condition === "new") condition = "NEW";
  //     if (condition === "Excellent" || condition === "excellent") condition = "EXCELLENT";
  //     if (condition === "Good" || condition === "good") condition = "GOOD";
  //     if (condition === "Fair" || condition === "fair") condition = "FAIR";
  //     if (condition === "Poor" || condition === "poor") condition = "POOR";
      
  //     if (Object.values(Condition).includes(condition)) {
  //       normalized.condition = condition;
  //     } else {
  //       allErrors.push(`Invalid condition "${data.condition}". Must be one of: ${Object.values(Condition).join(', ')}`)
  //     }
  //   }

  //   if (allErrors.length > 0) {
  //     return {
  //       isValid: false,
  //       errors: allErrors,
  //       data: normalized
  //     }
  //   }

  //   return normalized;
  // }

  // static normalizeRealEstateDetails(data: any, subCategory?: PropertyType): Partial<any> {
  //   if (!data) return {};

  //   // Only include defined values to reduce payload size
  //   const normalized: Partial<any> = {};
    
  //   const allErrors: string[] = []
  //   // Use provided propertyType or fallback to subCategory
  //   if (data.propertyType) {
  //     normalized.propertyType = data.propertyType;
  //   } else if (subCategory) {
  //     normalized.propertyType = subCategory;
  //   } else {
  //     allErrors.push(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`)
  //   }
    
  //   if (data.furnished === "yes" || data.furnished === "no") normalized.furnished = data.furnished === "yes";
  //   else {
  //     allErrors.push(`Invalid furnished status. Must be one of: yes, no`)
  //   }
  //   if (allErrors.length > 0) {
  //     return {
  //       isValid: false,
  //       errors: allErrors,
  //       data: normalized
  //     }
  //   }

  //   return normalized;
  // }
}
