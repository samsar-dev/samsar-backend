import { PropertyType } from "../types/enums.js";

export interface LandDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  features?: string[];
  accessibilityFeatures?: string[];
  utilities?: string[];
  // Land-specific fields
  buildable?: string;
  buildingRestrictions?: string;
  elevation?: number;
  environmentalFeatures?: string;
  naturalFeatures?: string;
  parcelNumber?: string;
  permitsInPlace?: string;
  soilTypes?: string[];
  topography?: string[];
  waterFeatures?: string;
  isBuildable?: boolean;
  totalArea?: number;
  yearBuilt?: number;
  accessibility?: string;
  energyFeatures?: string;
  landscaping?: string;
}

export class LandValidator {
  static validate(data: any): { errors: string[]; mappedData: LandDetails | null } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.propertyType || data.propertyType !== PropertyType.LAND) {
      errors.push("Property type must be LAND");
    }

    // Optional field validations with type checking
    const mappedData: LandDetails = {
      propertyType: PropertyType.LAND,
      size: data.size || undefined,
      condition: data.condition || undefined,
      features: Array.isArray(data.features) ? data.features : [],
      accessibilityFeatures: Array.isArray(data.accessibilityFeatures) ? data.accessibilityFeatures : [],
      utilities: Array.isArray(data.utilities) ? data.utilities : [],
      // Land-specific fields
      buildable: data.buildable || undefined,
      buildingRestrictions: data.buildingRestrictions || undefined,
      elevation: data.elevation ? parseInt(data.elevation.toString()) : undefined,
      environmentalFeatures: data.environmentalFeatures || undefined,
      naturalFeatures: data.naturalFeatures || undefined,
      parcelNumber: data.parcelNumber || undefined,
      permitsInPlace: data.permitsInPlace || undefined,
      soilTypes: Array.isArray(data.soilTypes) ? data.soilTypes : [],
      topography: Array.isArray(data.topography) ? data.topography : [],
      waterFeatures: data.waterFeatures || undefined,
      isBuildable: typeof data.isBuildable === 'boolean' ? data.isBuildable : undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      accessibility: data.accessibility || undefined,
      energyFeatures: data.energyFeatures || undefined,
      landscaping: data.landscaping || undefined,
    };

    // Validation for numeric fields
    if (mappedData.totalArea !== undefined && mappedData.totalArea <= 0) {
      errors.push("Total area must be greater than 0");
    }

    if (mappedData.elevation !== undefined && (mappedData.elevation < -500 || mappedData.elevation > 10000)) {
      errors.push("Elevation must be between -500 and 10,000 meters");
    }

    if (mappedData.yearBuilt !== undefined && (mappedData.yearBuilt < 1800 || mappedData.yearBuilt > new Date().getFullYear() + 5)) {
      errors.push(`Year built must be between 1800 and ${new Date().getFullYear() + 5}`);
    }

    // Land-specific validations
    if (mappedData.parcelNumber && mappedData.parcelNumber.length > 50) {
      errors.push("Parcel number must be 50 characters or less");
    }

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}
