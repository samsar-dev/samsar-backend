import { PropertyType } from "../types/enums.js";

export interface CondoDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  constructionType?: string;
  features?: string[];
  parking?: string;
  accessibilityFeatures?: string[];
  balcony?: boolean;
  buildingAmenities?: string[];
  cooling?: string;
  elevator?: boolean;
  energyRating?: string;
  exposureDirection?: string[];
  fireSafety?: string[];
  floor?: number;
  flooringType?: string;
  furnished?: string;
  heating?: string;
  internetIncluded?: boolean;
  parkingType?: string;
  petPolicy?: string;
  renovationHistory?: string;
  securityFeatures?: string[];
  storage?: boolean;
  storageType?: string[];
  totalFloors?: number;
  utilities?: string[];
  view?: string;
  windowType?: string;
  // Condo-specific fields
  floorLevel?: number;
  totalArea?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  hoaFeatures?: string;
  communityFeatures?: string;
  appliances?: string;
  kitchenFeatures?: string;
  bathroomFeatures?: string;
  energyFeatures?: string;
  exteriorFeatures?: string;
}

export class CondoValidator {
  static validate(data: any): { errors: string[]; mappedData: CondoDetails | null } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.propertyType || data.propertyType !== PropertyType.CONDO) {
      errors.push("Property type must be CONDO");
    }

    // Optional field validations with type checking
    const mappedData: CondoDetails = {
      propertyType: PropertyType.CONDO,
      size: data.size || undefined,
      condition: data.condition || undefined,
      constructionType: data.constructionType || undefined,
      features: Array.isArray(data.features) ? data.features : [],
      parking: data.parking || undefined,
      accessibilityFeatures: Array.isArray(data.accessibilityFeatures) ? data.accessibilityFeatures : [],
      balcony: typeof data.balcony === 'boolean' ? data.balcony : undefined,
      buildingAmenities: Array.isArray(data.buildingAmenities) ? data.buildingAmenities : [],
      cooling: data.cooling || undefined,
      elevator: typeof data.elevator === 'boolean' ? data.elevator : undefined,
      energyRating: data.energyRating || undefined,
      exposureDirection: Array.isArray(data.exposureDirection) ? data.exposureDirection : [],
      fireSafety: Array.isArray(data.fireSafety) ? data.fireSafety : [],
      floor: data.floor ? parseInt(data.floor.toString()) : undefined,
      flooringType: data.flooringType || undefined,
      furnished: data.furnished || undefined,
      heating: data.heating || undefined,
      internetIncluded: typeof data.internetIncluded === 'boolean' ? data.internetIncluded : undefined,
      parkingType: data.parkingType || undefined,
      petPolicy: data.petPolicy || undefined,
      renovationHistory: data.renovationHistory || undefined,
      securityFeatures: Array.isArray(data.securityFeatures) ? data.securityFeatures : [],
      storage: typeof data.storage === 'boolean' ? data.storage : undefined,
      storageType: Array.isArray(data.storageType) ? data.storageType : [],
      totalFloors: data.totalFloors ? parseInt(data.totalFloors.toString()) : undefined,
      utilities: Array.isArray(data.utilities) ? data.utilities : [],
      view: data.view || undefined,
      windowType: data.windowType || undefined,
      // Condo-specific fields
      floorLevel: data.floorLevel ? parseInt(data.floorLevel.toString()) : undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms.toString()) : undefined,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms.toString()) : undefined,
      livingArea: data.livingArea ? parseFloat(data.livingArea.toString()) : undefined,
      hoaFeatures: data.hoaFeatures || undefined,
      communityFeatures: data.communityFeatures || undefined,
      appliances: data.appliances || undefined,
      kitchenFeatures: data.kitchenFeatures || undefined,
      bathroomFeatures: data.bathroomFeatures || undefined,
      energyFeatures: data.energyFeatures || undefined,
      exteriorFeatures: data.exteriorFeatures || undefined,
    };

    // Validation for numeric fields
    if (mappedData.bedrooms !== undefined && (mappedData.bedrooms < 0 || mappedData.bedrooms > 8)) {
      errors.push("Bedrooms must be between 0 and 8");
    }

    if (mappedData.bathrooms !== undefined && (mappedData.bathrooms < 0 || mappedData.bathrooms > 5)) {
      errors.push("Bathrooms must be between 0 and 5");
    }

    if (mappedData.yearBuilt !== undefined && (mappedData.yearBuilt < 1800 || mappedData.yearBuilt > new Date().getFullYear() + 5)) {
      errors.push(`Year built must be between 1800 and ${new Date().getFullYear() + 5}`);
    }

    if (mappedData.totalArea !== undefined && mappedData.totalArea <= 0) {
      errors.push("Total area must be greater than 0");
    }

    if (mappedData.floorLevel !== undefined && (mappedData.floorLevel < -5 || mappedData.floorLevel > 200)) {
      errors.push("Floor level must be between -5 and 200");
    }

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}
