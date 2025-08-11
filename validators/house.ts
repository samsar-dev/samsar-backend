import { PropertyType } from "../types/enums.js";

export interface HouseDetails {
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
  // House-specific fields
  attic?: string;
  basement?: string;
  flooringTypes?: string[];
  halfBathrooms?: number;
  stories?: number;
  totalArea?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  accessibility?: string;
  appliances?: string;
  basementFeatures?: string;
  bathroomFeatures?: string;
  communityFeatures?: string;
  energyFeatures?: string;
  exteriorFeatures?: string;
  hoaFeatures?: string;
  kitchenFeatures?: string;
  landscaping?: string;
  livingArea?: number;
}

export class HouseValidator {
  static validate(data: any): { errors: string[]; mappedData: HouseDetails | null } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.propertyType || data.propertyType !== PropertyType.HOUSE) {
      errors.push("Property type must be HOUSE");
    }

    // Optional field validations with type checking
    const mappedData: HouseDetails = {
      propertyType: PropertyType.HOUSE,
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
      // House-specific fields
      attic: data.attic || undefined,
      basement: data.basement || undefined,
      flooringTypes: Array.isArray(data.flooringTypes) ? data.flooringTypes : [],
      halfBathrooms: data.halfBathrooms ? parseInt(data.halfBathrooms.toString()) : undefined,
      stories: data.stories ? parseInt(data.stories.toString()) : undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms.toString()) : undefined,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms.toString()) : undefined,
      accessibility: data.accessibility || undefined,
      appliances: data.appliances || undefined,
      basementFeatures: data.basementFeatures || undefined,
      bathroomFeatures: data.bathroomFeatures || undefined,
      communityFeatures: data.communityFeatures || undefined,
      energyFeatures: data.energyFeatures || undefined,
      exteriorFeatures: data.exteriorFeatures || undefined,
      hoaFeatures: data.hoaFeatures || undefined,
      kitchenFeatures: data.kitchenFeatures || undefined,
      landscaping: data.landscaping || undefined,
      livingArea: data.livingArea ? parseFloat(data.livingArea.toString()) : undefined,
    };

    // Validation for numeric fields
    if (mappedData.bedrooms !== undefined && (mappedData.bedrooms < 0 || mappedData.bedrooms > 20)) {
      errors.push("Bedrooms must be between 0 and 20");
    }

    if (mappedData.bathrooms !== undefined && (mappedData.bathrooms < 0 || mappedData.bathrooms > 10)) {
      errors.push("Bathrooms must be between 0 and 10");
    }

    if (mappedData.yearBuilt !== undefined && (mappedData.yearBuilt < 1800 || mappedData.yearBuilt > new Date().getFullYear() + 5)) {
      errors.push(`Year built must be between 1800 and ${new Date().getFullYear() + 5}`);
    }

    if (mappedData.totalArea !== undefined && mappedData.totalArea <= 0) {
      errors.push("Total area must be greater than 0");
    }

    if (mappedData.stories !== undefined && (mappedData.stories < 1 || mappedData.stories > 10)) {
      errors.push("Stories must be between 1 and 10");
    }

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}
