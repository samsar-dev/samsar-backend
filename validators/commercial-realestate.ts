import { PropertyType } from "../types/enums.js";

export interface CommercialRealEstateDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  constructionType?: string;
  features?: string[];
  parking?: string;
  accessibilityFeatures?: string[];
  buildingAmenities?: string[];
  cooling?: string;
  elevator?: boolean;
  energyRating?: string;
  exposureDirection?: string[];
  fireSafety?: string[];
  floor?: number;
  flooringType?: string;
  heating?: string;
  internetIncluded?: boolean;
  parkingType?: string;
  renovationHistory?: string;
  securityFeatures?: string[];
  storage?: boolean;
  storageType?: string[];
  totalFloors?: number;
  utilities?: string[];
  view?: string;
  windowType?: string;
  // Commercial-specific fields
  totalArea?: number;
  yearBuilt?: number;
  accessibility?: string;
  appliances?: string;
  communityFeatures?: string;
  energyFeatures?: string;
  exteriorFeatures?: string;
  kitchenFeatures?: string;
  landscaping?: string;
  livingArea?: number;
  // Additional commercial fields
  officeSpaces?: number;
  conferenceRooms?: number;
  loadingDocks?: number;
  ceilingHeight?: number;
  zoning?: string;
  businessType?: string;
  operatingHours?: string;
  customerParking?: number;
  signageRights?: boolean;
}

export class CommercialRealEstateValidator {
  static validate(data: any): { errors: string[]; mappedData: CommercialRealEstateDetails | null } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.propertyType || data.propertyType !== PropertyType.COMMERCIAL) {
      errors.push("Property type must be COMMERCIAL");
    }

    // Optional field validations with type checking
    const mappedData: CommercialRealEstateDetails = {
      propertyType: PropertyType.COMMERCIAL,
      size: data.size || undefined,
      condition: data.condition || undefined,
      constructionType: data.constructionType || undefined,
      features: Array.isArray(data.features) ? data.features : [],
      parking: data.parking || undefined,
      accessibilityFeatures: Array.isArray(data.accessibilityFeatures) ? data.accessibilityFeatures : [],
      buildingAmenities: Array.isArray(data.buildingAmenities) ? data.buildingAmenities : [],
      cooling: data.cooling || undefined,
      elevator: typeof data.elevator === 'boolean' ? data.elevator : undefined,
      energyRating: data.energyRating || undefined,
      exposureDirection: Array.isArray(data.exposureDirection) ? data.exposureDirection : [],
      fireSafety: Array.isArray(data.fireSafety) ? data.fireSafety : [],
      floor: data.floor ? parseInt(data.floor.toString()) : undefined,
      flooringType: data.flooringType || undefined,
      heating: data.heating || undefined,
      internetIncluded: typeof data.internetIncluded === 'boolean' ? data.internetIncluded : undefined,
      parkingType: data.parkingType || undefined,
      renovationHistory: data.renovationHistory || undefined,
      securityFeatures: Array.isArray(data.securityFeatures) ? data.securityFeatures : [],
      storage: typeof data.storage === 'boolean' ? data.storage : undefined,
      storageType: Array.isArray(data.storageType) ? data.storageType : [],
      totalFloors: data.totalFloors ? parseInt(data.totalFloors.toString()) : undefined,
      utilities: Array.isArray(data.utilities) ? data.utilities : [],
      view: data.view || undefined,
      windowType: data.windowType || undefined,
      // Commercial-specific fields
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      accessibility: data.accessibility || undefined,
      appliances: data.appliances || undefined,
      communityFeatures: data.communityFeatures || undefined,
      energyFeatures: data.energyFeatures || undefined,
      exteriorFeatures: data.exteriorFeatures || undefined,
      kitchenFeatures: data.kitchenFeatures || undefined,
      landscaping: data.landscaping || undefined,
      livingArea: data.livingArea ? parseFloat(data.livingArea.toString()) : undefined,
      // Additional commercial fields
      officeSpaces: data.officeSpaces ? parseInt(data.officeSpaces.toString()) : undefined,
      conferenceRooms: data.conferenceRooms ? parseInt(data.conferenceRooms.toString()) : undefined,
      loadingDocks: data.loadingDocks ? parseInt(data.loadingDocks.toString()) : undefined,
      ceilingHeight: data.ceilingHeight ? parseFloat(data.ceilingHeight.toString()) : undefined,
      zoning: data.zoning || undefined,
      businessType: data.businessType || undefined,
      operatingHours: data.operatingHours || undefined,
      customerParking: data.customerParking ? parseInt(data.customerParking.toString()) : undefined,
      signageRights: typeof data.signageRights === 'boolean' ? data.signageRights : undefined,
    };

    // Validation for numeric fields
    if (mappedData.totalArea !== undefined && mappedData.totalArea <= 0) {
      errors.push("Total area must be greater than 0");
    }

    if (mappedData.yearBuilt !== undefined && (mappedData.yearBuilt < 1800 || mappedData.yearBuilt > new Date().getFullYear() + 5)) {
      errors.push(`Year built must be between 1800 and ${new Date().getFullYear() + 5}`);
    }

    if (mappedData.officeSpaces !== undefined && (mappedData.officeSpaces < 0 || mappedData.officeSpaces > 1000)) {
      errors.push("Office spaces must be between 0 and 1000");
    }

    if (mappedData.conferenceRooms !== undefined && (mappedData.conferenceRooms < 0 || mappedData.conferenceRooms > 100)) {
      errors.push("Conference rooms must be between 0 and 100");
    }

    if (mappedData.loadingDocks !== undefined && (mappedData.loadingDocks < 0 || mappedData.loadingDocks > 50)) {
      errors.push("Loading docks must be between 0 and 50");
    }

    if (mappedData.ceilingHeight !== undefined && (mappedData.ceilingHeight < 2 || mappedData.ceilingHeight > 20)) {
      errors.push("Ceiling height must be between 2 and 20 meters");
    }

    if (mappedData.customerParking !== undefined && (mappedData.customerParking < 0 || mappedData.customerParking > 10000)) {
      errors.push("Customer parking must be between 0 and 10,000 spaces");
    }

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}
