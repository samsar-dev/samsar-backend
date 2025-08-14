import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface MotorcycleDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  color?: string;
  condition?: Condition;
  engine?: string;
  engineSize?: string;
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  // Motorcycle-specific features
  engineCapacity?: number; // in CC
  motorcycleType?: string; // Sport, Cruiser, Touring, etc.
  abs?: boolean;
  windshield?: boolean;
  saddlebags?: boolean;
  crashBars?: boolean;
  heatedGrips?: boolean;
  quickShifter?: boolean;
  tractionControl?: boolean;
  ridingModes?: string[];
}

export const validateMotorcycleData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for motorcycles");
  } else if (data.vehicleType !== VehicleType.MOTORCYCLES) {
    errors.push("Invalid vehicle type for motorcycle validator");
  }

  if (!data.make || typeof data.make !== 'string' || data.make.trim().length === 0) {
    errors.push("Make is required and must be a non-empty string");
  }

  if (!data.model || typeof data.model !== 'string' || data.model.trim().length === 0) {
    errors.push("Model is required and must be a non-empty string");
  }

  if (!data.year || typeof data.year !== 'number') {
    errors.push("Year is required and must be a number");
  } else {
    const currentYear = new Date().getFullYear();
    if (data.year < 1900 || data.year > currentYear + 1) {
      errors.push(`Year must be between 1900 and ${currentYear + 1}`);
    }
  }

  // Optional field validations
  if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
    errors.push("Mileage must be a positive number");
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

  if (data.engineCapacity !== undefined && (typeof data.engineCapacity !== 'number' || data.engineCapacity < 50 || data.engineCapacity > 2500)) {
    errors.push("Engine capacity must be between 50cc and 2500cc");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  const validMotorcycleTypes = ['Sport', 'Cruiser', 'Touring', 'Adventure', 'Naked', 'Scooter', 'Dirt', 'Chopper', 'Standard'];
  if (data.motorcycleType && !validMotorcycleTypes.includes(data.motorcycleType)) {
    errors.push(`Invalid motorcycle type. Must be one of: ${validMotorcycleTypes.join(', ')}`);
  }

  return errors;
};

export const mapMotorcycleData = (data: any): Partial<MotorcycleDetails> => {
  return {
    vehicleType: data.vehicleType as VehicleType,
    make: data.make?.trim(),
    model: data.model?.trim(),
    year: Number(data.year),
    mileage: data.mileage ? Number(data.mileage) : undefined,
    fuelType: data.fuelType as FuelType,
    transmissionType: data.transmissionType as TransmissionType,
    color: data.color?.trim(),
    condition: data.condition as Condition,
    engine: data.engine?.trim(),
    engineSize: data.engineSize?.trim(),
    warranty: data.warranty?.trim(),
    serviceHistory: Array.isArray(data.serviceHistory) ? data.serviceHistory : undefined,
    previousOwners: data.previousOwners ? Number(data.previousOwners) : undefined,
    registrationStatus: data.registrationStatus?.trim(),
    engineCapacity: data.engineCapacity ? Number(data.engineCapacity) : undefined,
    motorcycleType: data.motorcycleType?.trim(),
    abs: Boolean(data.abs),
    windshield: Boolean(data.windshield),
    saddlebags: Boolean(data.saddlebags),
    crashBars: Boolean(data.crashBars),
    heatedGrips: Boolean(data.heatedGrips),
    quickShifter: Boolean(data.quickShifter),
    tractionControl: Boolean(data.tractionControl),
    ridingModes: Array.isArray(data.ridingModes) ? data.ridingModes : undefined,
  };
};
