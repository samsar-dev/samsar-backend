import { PropertyType } from "../types/enums.js";

export interface OfficeDetails {
  propertyType: PropertyType;
  totalArea?: number;
  floor?: number;
  parking?: string;
  officeType?: string;
  meetingRooms?: number;
  zoning?: string;
  roadAccess?: boolean;
  condition?: string;
  features?: string[];
  securityFeatures?: string[];
  energyRating?: string;
  yearBuilt?: number;
}

export class OfficeValidator {
  static validate(data: any): { errors: string[]; mappedData: OfficeDetails | null } {
    const errors: string[] = [];

    if (!data.propertyType || data.propertyType !== PropertyType.OFFICE) {
      errors.push("Property type must be OFFICE");
    }

    const mappedData: OfficeDetails = {
      propertyType: PropertyType.OFFICE,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      floor: data.floor ? parseInt(data.floor.toString()) : undefined,
      parking: data.parking || undefined,
      officeType: data.officeType || undefined,
      meetingRooms: data.meetingRooms ? parseInt(data.meetingRooms.toString()) : undefined,
      zoning: data.zoning || undefined,
      roadAccess: typeof data.roadAccess === 'boolean' ? data.roadAccess : undefined,
      condition: data.condition || undefined,
      features: Array.isArray(data.features) ? data.features : [],
      securityFeatures: Array.isArray(data.securityFeatures) ? data.securityFeatures : [],
      energyRating: data.energyRating || undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
    };

    if (mappedData.totalArea !== undefined && mappedData.totalArea <= 0) {
      errors.push("Total area must be greater than 0");
    }

    if (mappedData.meetingRooms !== undefined && mappedData.meetingRooms < 0) {
      errors.push("Meeting rooms cannot be negative");
    }

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}
