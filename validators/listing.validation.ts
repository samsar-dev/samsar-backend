import { request } from "http";
import { 
  VehicleType, 
  PropertyType, 
  FuelType, 
  TransmissionType, 
  Condition, 
  ListingAction,
  ListingCategory 
} from "../types/enums.js";
import { ErrorHandler, ValidationError, ResponseHelpers } from "../utils/error.handler.js";
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
    vehicles?: VehicleDetailsSchema;
    realEstate?: RealEstateDetailsSchema;
  };
}

// Vehicle details validation schema
export interface VehicleDetailsSchema {
  // Required fields
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;

  // Essential optional fields
  mileage?: number;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  color?: string;
  condition?: Condition;

  // Advanced optional fields
  doors?: number;
  seats?: number;
  seatingCapacity?: number;
  horsepower?: number;
  torque?: number;
  engineSize?: string;
  previousOwners?: number;
  registrationStatus?: string;
  warranty?: string;
  serviceHistory?: string[];

  // Feature flags (all optional)
  abs?: boolean;
  airConditioning?: boolean;
  bluetooth?: boolean;
  cruiseControl?: boolean;
  electricWindows?: boolean;
  ledHeadlights?: boolean;
  navigationSystem?: boolean;
  parkingSensors?: boolean;
  rearCamera?: boolean;
  sunroof?: boolean;
  
  // Extended features for specific vehicle types
  [key: string]: any; // Allow additional fields for extensibility
}

// Real estate details validation schema
export interface RealEstateDetailsSchema {
  // Required fields
  propertyType: PropertyType;
  
  // Essential optional fields
  size?: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  condition?: string;
  
  // Advanced optional fields
  floor?: number;
  totalFloors?: number;
  elevator?: boolean;
  balcony?: boolean;
  parking?: boolean;
  furnished?: boolean;
  heating?: string;
  cooling?: string;
  features?: string[];
  securityFeatures?: string[];
  buildingAmenities?: string[];
  
  // Extended fields for specific property types
  [key: string]: any; // Allow additional fields for extensibility
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

  static validateVehicleDetails(data: any, vehicleType: VehicleType): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push("Vehicle details are required for vehicle listings");
      return { isValid: false, errors };
    }

    // Validate vehicleType - it's required and must be from VehicleType enum
    if (!data.vehicleType) {
      errors.push("Vehicle type is required in vehicle details");
    } else {
      // Validate that vehicleType exists in VehicleType enum
      if (!Object.values(VehicleType).includes(data.vehicleType)) {
        errors.push(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}`);
      } else if (data.vehicleType !== vehicleType) {
        errors.push(`Vehicle type in details (${data.vehicleType}) must match sub category (${vehicleType})`);
      }
    }

    // Required fields
    if (!data.make || typeof data.make !== 'string' || data.make.trim().length === 0) {
      errors.push("Vehicle make is required and must be a non-empty string");
    }

    if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
      errors.push("Vehicle model is required and must be a non-empty string");
    }

    if (!data.year || typeof data.year !== 'number') {
      errors.push("Vehicle year is required and must be a number");
    } else {
      const currentYear = new Date().getFullYear();
      if (data.year < 1900 || data.year > currentYear + 1) {
        errors.push(`Vehicle year must be between 1900 and ${currentYear + 1}`);
      }
    }

    // Optional field validations
    if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
      errors.push("Mileage must be a non-negative number");
    }

    if (data.fuelType && !Object.values(FuelType).includes(data.fuelType)) {
      errors.push(`Invalid fuel type. Must be one of: ${Object.values(FuelType).join(', ')}`);
    }

    if (data.transmissionType && !Object.values(TransmissionType).includes(data.transmissionType)) {
      errors.push(`Invalid transmission type. Must be one of: ${Object.values(TransmissionType).join(', ')}`);
    }

    if (data.condition && !Object.values(Condition).includes(data.condition)) {
      errors.push(`Invalid condition. Must be one of: ${Object.values(Condition).join(', ')}`);
    }

    if (data.doors !== undefined && (typeof data.doors !== 'number' || data.doors < 2 || data.doors > 6)) {
      errors.push("Number of doors must be between 2 and 6");
    }

    if (data.seats !== undefined && (typeof data.seats !== 'number' || data.seats < 1 || data.seats > 50)) {
      errors.push("Number of seats must be between 1 and 50");
    }

    if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
      errors.push("Previous owners must be a non-negative number");
    }

    if (data.vehicleType && !Object.values(VehicleType).includes(data.vehicleType)) {
      errors.push(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateRealEstateDetails(data: any, propertyType: PropertyType): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data) {
      errors.push("Real estate details are required for property listings");
      return { isValid: false, errors };
    }

    // Validate propertyType - use subCategory if not provided, or validate if provided
    if (!data.propertyType) {
      // If propertyType is not provided, we'll use the subCategory
      console.log(`Property type not provided, using subCategory: ${propertyType}`);
    } else {
      // If propertyType is provided, validate it
      if (!Object.values(PropertyType).includes(data.propertyType)) {
        errors.push(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
      } else if (data.propertyType !== propertyType) {
        errors.push(`Property type in details (${data.propertyType}) must match sub category (${propertyType})`);
      }
    }

    // Optional field validations
    if (data.size !== undefined && typeof data.size !== 'string') {
      errors.push("Property size must be a string");
    }

    if (data.yearBuilt !== undefined && (typeof data.yearBuilt !== 'number' || data.yearBuilt < 1800 || data.yearBuilt > new Date().getFullYear())) {
      errors.push(`Year built must be between 1800 and ${new Date().getFullYear()}`);
    }

    if (data.bedrooms !== undefined && (typeof data.bedrooms !== 'number' || data.bedrooms < 0 || data.bedrooms > 20)) {
      errors.push("Number of bedrooms must be between 0 and 20");
    }

    if (data.bathrooms !== undefined && (typeof data.bathrooms !== 'number' || data.bathrooms < 0 || data.bathrooms > 20)) {
      errors.push("Number of bathrooms must be between 0 and 20");
    }

    if (data.floor !== undefined && (typeof data.floor !== 'number' || data.floor < -5 || data.floor > 200)) {
      errors.push("Floor number must be between -5 and 200");
    }

    if (data.totalFloors !== undefined && (typeof data.totalFloors !== 'number' || data.totalFloors < 1 || data.totalFloors > 200)) {
      errors.push("Total floors must be between 1 and 200");
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateListingData(data: any): { isValid: boolean; errors: string[] } {
    const baseValidation = this.validateBaseListing(data);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const allErrors: string[] = [];

    // Validate details based on main category
    if (data.mainCategory === ListingCategory.VEHICLES && data.details?.vehicles) {
      const vehicleValidation = this.validateVehicleDetails(data.details.vehicles, data.subCategory);
      allErrors.push(...vehicleValidation.errors);
    }

    if (data.mainCategory === ListingCategory.REAL_ESTATE && data.details?.realEstate) {
      const realEstateValidation = this.validateRealEstateDetails(data.details.realEstate, data.subCategory);
      allErrors.push(...realEstateValidation.errors);
    }

    return { isValid: allErrors.length === 0, errors: allErrors };
  }
}

// Helper function to sanitize and normalize data
export class ListingDataNormalizer {
  
  static normalizeBaseData(data: any): Partial<ListingValidationSchema> {
    return {
      title: data.title?.trim(),
      description: data.description?.trim(),
      price: data.price ? Number(data.price) : undefined,
      mainCategory: data.mainCategory,
      subCategory: data.subCategory,
      location: data.location?.trim(),
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      listingAction: data.listingAction || ListingAction.SALE,
    };
  }

  static normalizeVehicleDetails(data: any, subCategory?: VehicleType): Partial<VehicleDetailsSchema> {
    if (!data) return {};

    // Only include defined values to reduce payload size
    const normalized: Partial<VehicleDetailsSchema> = {};
    
    // Use provided vehicleType or fallback to subCategory - validate it exists in VehicleType enum
  
    if (data.vehicleType) {
      if (Object.values(VehicleType).includes(data.vehicleType)) {
        normalized.vehicleType = data.vehicleType;
      } else {
        return  new ValidationError(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}`);
      }
    } 

    if (data.make) normalized.make = data.make.trim();
    if (data.model) normalized.model = data.model.trim();
    if (data.year) normalized.year = Number(data.year);
    if (data.mileage !== undefined && data.mileage !== null) normalized.mileage = Number(data.mileage);
    if (data.fuelType) {
      if (Object.values(FuelType).includes(data.fuelType)) {
        normalized.fuelType = data.fuelType;
      } else {
        return new ValidationError(`Invalid fuel type. Must be one of: ${Object.values(FuelType).join(', ')}`);
      }
    }

    if (data.transmissionType) {
      if (Object.values(TransmissionType).includes(data.transmissionType)) {
        normalized.transmissionType = data.transmissionType;
      } else {
        return new ValidationError(`Invalid transmission type. Must be one of: ${Object.values(TransmissionType).join(', ')}`);
      }
    }

    if (data.color) normalized.color = data.color.trim();
    if (data.condition) normalized.condition = data.condition;
    if (data.condition) {
      if (Object.values(Condition).includes(data.condition)) {
        normalized.condition = data.condition;
      } else {
        return new ValidationError(`Invalid condition. Must be one of: ${Object.values(Condition).join(', ')}`);
      }
    }
    if (data.doors !== undefined && data.doors !== null) normalized.doors = Number(data.doors);
    if (data.seats !== undefined && data.seats !== null) normalized.seats = Number(data.seats);
    if (data.seatingCapacity !== undefined && data.seatingCapacity !== null) normalized.seatingCapacity = Number(data.seatingCapacity);
    if (data.horsepower !== undefined && data.horsepower !== null) normalized.horsepower = Number(data.horsepower);
    if (data.torque !== undefined && data.torque !== null) normalized.torque = Number(data.torque);
    if (data.engineSize) normalized.engineSize = data.engineSize.trim();
    if (data.previousOwners !== undefined && data.previousOwners !== null) normalized.previousOwners = Number(data.previousOwners);
    if (data.registrationStatus) normalized.registrationStatus = data.registrationStatus.trim();
    if (data.warranty) normalized.warranty = data.warranty.trim();
    if (data.serviceHistory && Array.isArray(data.serviceHistory)) normalized.serviceHistory = data.serviceHistory;

    // Feature flags - only include if true to reduce payload
    const features = ['abs', 'airConditioning', 'bluetooth', 'cruiseControl', 'electricWindows', 
                     'ledHeadlights', 'navigationSystem', 'parkingSensors', 'rearCamera', 'sunroof'];
    
    features.forEach(feature => {
      if (data[feature] === true) {
        normalized[feature] = true;
      }
    });

    return normalized;
  }

  static normalizeRealEstateDetails(data: any, subCategory?: PropertyType): Partial<RealEstateDetailsSchema> {
    if (!data) return {};

    // Only include defined values to reduce payload size
    const normalized: Partial<RealEstateDetailsSchema> = {};
    
    // Use provided propertyType or fallback to subCategory
    if (data.propertyType) {
      normalized.propertyType = data.propertyType;
    } else if (subCategory) {
      normalized.propertyType = subCategory;
    } else {
      return new ValidationError(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
    }
    if (data.size) normalized.size = data.size.trim();
    if (data.yearBuilt !== undefined && data.yearBuilt !== null) normalized.yearBuilt = Number(data.yearBuilt);
    if (data.bedrooms !== undefined && data.bedrooms !== null) normalized.bedrooms = Number(data.bedrooms);
    if (data.bathrooms !== undefined && data.bathrooms !== null) normalized.bathrooms = Number(data.bathrooms);
    if (data.condition) normalized.condition = data.condition.trim();
    if (data.floor !== undefined && data.floor !== null) normalized.floor = Number(data.floor);
    if (data.totalFloors !== undefined && data.totalFloors !== null) normalized.totalFloors = Number(data.totalFloors);
    if (data.elevator === true || data.elevator === false) normalized.elevator = data.elevator;
    if (data.balcony === true || data.balcony === false) normalized.balcony = data.balcony;
    if (data.parking === true || data.parking === false) normalized.parking = data.parking;
    if (data.furnished === "yes" || data.furnished === "no") normalized.furnished = data.furnished;
    else {
      return new ValidationError(`Invalid furnished status. Must be one of: yes, no`);
    }
    if (data.heating) normalized.heating = data.heating.trim();
    if (data.cooling) normalized.cooling = data.cooling.trim();
    if (data.features && Array.isArray(data.features)) normalized.features = data.features;
    if (data.securityFeatures && Array.isArray(data.securityFeatures)) normalized.securityFeatures = data.securityFeatures;
    if (data.buildingAmenities && Array.isArray(data.buildingAmenities)) normalized.buildingAmenities = data.buildingAmenities;

    return normalized;
  }
}
