import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface CommercialDetails {
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
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  // Commercial vehicle specific features
  vehicleSubtype?: string; // Van, Truck, Bus, etc.
  payloadCapacity?: number; // in kg
  towingCapacity?: number; // in kg
  cargoVolume?: number; // in cubic meters
  axles?: number;
  wheelbase?: number; // in mm
  gvw?: number; // Gross Vehicle Weight in kg
  refrigerated?: boolean;
  hydraulicLift?: boolean;
  airConditioning?: boolean;
  powerSteering?: boolean;
  abs?: boolean;
  centralLocking?: boolean;
  electricWindows?: boolean;
  commercialLicense?: boolean;
}

export const validateCommercialData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for commercial vehicles");
  } else if (![VehicleType.VANS, VehicleType.TRUCKS, VehicleType.BUSES, VehicleType.TRACTORS].includes(data.vehicleType)) {
    errors.push("Invalid vehicle type for commercial validator");
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

  if (data.payloadCapacity !== undefined && (typeof data.payloadCapacity !== 'number' || data.payloadCapacity < 0)) {
    errors.push("Payload capacity must be a positive number");
  }

  if (data.towingCapacity !== undefined && (typeof data.towingCapacity !== 'number' || data.towingCapacity < 0)) {
    errors.push("Towing capacity must be a positive number");
  }

  if (data.cargoVolume !== undefined && (typeof data.cargoVolume !== 'number' || data.cargoVolume < 0)) {
    errors.push("Cargo volume must be a positive number");
  }

  if (data.axles !== undefined && (typeof data.axles !== 'number' || data.axles < 2 || data.axles > 10)) {
    errors.push("Number of axles must be between 2 and 10");
  }

  if (data.gvw !== undefined && (typeof data.gvw !== 'number' || data.gvw < 0)) {
    errors.push("Gross Vehicle Weight must be a positive number");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  const validSubtypes = ['VANS', 'BUSES', 'TRACTORS'];
  if (data.vehicleSubtype && !validSubtypes.includes(data.vehicleSubtype)) {
    errors.push(`Invalid vehicle subtype. Must be one of: ${validSubtypes.join(', ')}`);
  }

  return errors;
};

export const mapCommercialData = (data: any): Partial<CommercialDetails> => {
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
    warranty: data.warranty?.trim(),
    serviceHistory: Array.isArray(data.serviceHistory) ? data.serviceHistory : undefined,
    previousOwners: data.previousOwners ? Number(data.previousOwners) : undefined,
    registrationStatus: data.registrationStatus?.trim(),
    vehicleSubtype: data.vehicleSubtype?.trim(),
    payloadCapacity: data.payloadCapacity ? Number(data.payloadCapacity) : undefined,
    towingCapacity: data.towingCapacity ? Number(data.towingCapacity) : undefined,
    cargoVolume: data.cargoVolume ? Number(data.cargoVolume) : undefined,
    axles: data.axles ? Number(data.axles) : undefined,
    wheelbase: data.wheelbase ? Number(data.wheelbase) : undefined,
    gvw: data.gvw ? Number(data.gvw) : undefined,
    refrigerated: Boolean(data.refrigerated),
    hydraulicLift: Boolean(data.hydraulicLift),
    airConditioning: Boolean(data.airConditioning),
    powerSteering: Boolean(data.powerSteering),
    abs: Boolean(data.abs),
    centralLocking: Boolean(data.centralLocking),
    electricWindows: Boolean(data.electricWindows),
    commercialLicense: Boolean(data.commercialLicense),
  };
};
