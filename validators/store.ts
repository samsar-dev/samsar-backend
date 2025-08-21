import { z } from 'zod';

export interface StoreDetails {
  // Base vehicle fields (required for vehicle details)
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmissionType?: string;
  color?: string;
  condition?: string;
  
  // Store-specific fields
  storeType: string;
  floorArea?: string;
  storageArea?: string;
  frontage?: string;
  ceilingHeight?: string;
  parking?: string;
  loadingDock?: string;
  security?: string;
  hvac?: string;
  lighting?: string;
  accessibility?: string;
  zoning?: string;
  businessLicense?: string;
  footTraffic?: string;
}

export const storeSchema = z.object({
  // Base vehicle fields
  vehicleType: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  mileage: z.number().optional(),
  fuelType: z.string().optional(),
  transmissionType: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  
  // Store-specific fields
  storeType: z.string().min(1, 'Store type is required'),
  floorArea: z.string().optional(),
  storageArea: z.string().optional(),
  frontage: z.string().optional(),
  ceilingHeight: z.string().optional(),
  parking: z.string().optional(),
  loadingDock: z.string().optional(),
  security: z.string().optional(),
  hvac: z.string().optional(),
  lighting: z.string().optional(),
  accessibility: z.string().optional(),
  zoning: z.string().optional(),
  businessLicense: z.string().optional(),
  footTraffic: z.string().optional(),
});

export function mapStoreData(data: any): StoreDetails {
  return {
    // Base vehicle fields
    vehicleType: data.vehicleType || 'STORE',
    make: data.make || undefined,
    model: data.model || undefined,
    year: data.year ? parseInt(data.year) : undefined,
    mileage: data.mileage ? parseInt(data.mileage) : undefined,
    fuelType: data.fuelType || undefined,
    transmissionType: data.transmissionType || undefined,
    color: data.color || undefined,
    condition: data.condition || undefined,
    
    // Store-specific fields
    storeType: data.storeType || 'Retail Store',
    floorArea: data.floorArea || undefined,
    storageArea: data.storageArea || undefined,
    frontage: data.frontage || undefined,
    ceilingHeight: data.ceilingHeight || undefined,
    parking: data.parking || undefined,
    loadingDock: data.loadingDock || undefined,
    security: data.security || undefined,
    hvac: data.hvac || undefined,
    lighting: data.lighting || undefined,
    accessibility: data.accessibility || undefined,
    zoning: data.zoning || undefined,
    businessLicense: data.businessLicense || undefined,
    footTraffic: data.footTraffic || undefined,
  };
}

export function validateStoreData(data: any): string[] {
  try {
    storeSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    }
    return ['Unknown validation error'];
  }
}

export const StoreValidator = {
  validate: (data: any) => {
    const errors = validateStoreData(data);
    return {
      errors,
      mappedData: errors.length === 0 ? mapStoreData(data) : undefined
    };
  }
};
