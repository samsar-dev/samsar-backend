import { z } from 'zod';

export interface VillaDetails {
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  totalArea?: number;
  floor?: number;
  parking?: string;
  gardenArea?: string;
  pool?: string;
  balcony?: number;
  furnishing?: string;
  heating?: string;
  cooling?: string;
  security?: string;
  view?: string;
  orientation?: string;
  buildingAge?: number;
  maintenanceFee?: string;
  energyRating?: string;
  yearBuilt?: number;
}

export const villaSchema = z.object({
  // Essential fields
  propertyType: z.string().min(1, 'Property type is required'),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  totalArea: z.number().min(0).optional(),
  floor: z.number().min(0).optional(),
  parking: z.string().optional(),
  
  // Villa-specific fields
  gardenArea: z.string().optional(),
  pool: z.string().optional(),
  balcony: z.number().min(0).optional(),
  furnishing: z.string().optional(),
  heating: z.string().optional(),
  cooling: z.string().optional(),
  security: z.string().optional(),
  view: z.string().optional(),
  orientation: z.string().optional(),
  buildingAge: z.number().min(0).optional(),
  maintenanceFee: z.string().optional(),
  energyRating: z.string().optional(),
  yearBuilt: z.number().min(1800).max(new Date().getFullYear() + 5).optional(),
});

export function mapVillaData(data: any): VillaDetails {
  return {
    propertyType: data.propertyType || 'Villa',
    bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
    bathrooms: data.bathrooms ? parseInt(data.bathrooms) : undefined,
    totalArea: data.totalArea ? parseFloat(data.totalArea) : undefined,
    floor: data.floor ? parseInt(data.floor) : undefined,
    parking: data.parking || undefined,
    gardenArea: data.gardenArea || undefined,
    pool: data.pool || undefined,
    balcony: data.balcony ? parseInt(data.balcony) : undefined,
    furnishing: data.furnishing || undefined,
    heating: data.heating || undefined,
    cooling: data.cooling || undefined,
    security: data.security || undefined,
    view: data.view || undefined,
    orientation: data.orientation || undefined,
    buildingAge: data.buildingAge ? parseInt(data.buildingAge) : undefined,
    maintenanceFee: data.maintenanceFee || undefined,
    energyRating: data.energyRating || undefined,
    yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : undefined,
  };
}

export function validateVillaData(data: any): string[] {
  try {
    villaSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return ['Unknown validation error'];
  }
}

export const VillaValidator = {
  validate: (data: any) => {
    const errors = validateVillaData(data);
    return {
      errors,
      mappedData: errors.length === 0 ? mapVillaData(data) : undefined
    };
  }
};
