import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface CarDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  color?: string;
  interiorColor?: string;
  condition?: Condition;
  engine?: string;
  engineSize?: string;
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  // Car-specific features
  doors?: number;
  seats?: number;
  airbags?: number;
  seatingCapacity?: number;
  sunroof?: boolean;
  navigationSystem?: boolean;
  bluetooth?: boolean;
  cruiseControl?: boolean;
  parkingSensors?: boolean;
  backupCamera?: boolean;
  heatedSeats?: boolean;
  leatherSeats?: boolean;
  alloyWheels?: boolean;
}

export const validateCarData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for cars");
  } else if (data.vehicleType !== VehicleType.CARS) {
    errors.push("Invalid vehicle type for car validator");
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

  // Handle transmission type validation with frontend compatibility
  if (data.transmissionType) {
    const validTransmissionTypes = [
      ...Object.values(TransmissionType),
      'continuouslyVariable' // Frontend compatibility
    ];
    if (!validTransmissionTypes.includes(data.transmissionType)) {
      errors.push(`Invalid transmission type. Must be one of: ${Object.values(TransmissionType).join(', ')}`);
    }
  }

  if (data.condition && !Object.values(Condition).includes(data.condition)) {
    errors.push(`Invalid condition. Must be one of: ${Object.values(Condition).join(', ')}`);
  }

  if (data.doors !== undefined && (typeof data.doors !== 'number' || data.doors < 2 || data.doors > 5)) {
    errors.push("Number of doors must be between 2 and 5");
  }

  if (data.seats !== undefined && (typeof data.seats !== 'number' || data.seats < 2 || data.seats > 9)) {
    errors.push("Number of seats must be between 2 and 9");
  }

  if (data.airbags !== undefined && (typeof data.airbags !== 'number' || data.airbags < 0 || data.airbags > 12)) {
    errors.push("Number of airbags must be between 0 and 12");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  return errors;
};

export const mapCarData = (data: any): Partial<CarDetails> => {
  const features = new Set(data.selectedFeatures || []);
  // Map frontend transmission type to backend enum
  const mapTransmissionType = (frontendType: string): string | undefined => {
    if (frontendType === 'continuouslyVariable') {
      return 'continuouslyVariable'; // Map to Prisma enum value
    }
    return frontendType;
  };

  return {
    vehicleType: data.vehicleType as VehicleType,
    make: data.make?.trim(),
    model: data.model?.trim(),
    year: Number(data.year),
    mileage: data.mileage ? Number(data.mileage) : undefined,
    fuelType: data.fuelType as FuelType,
    transmissionType: data.transmissionType ? mapTransmissionType(data.transmissionType) as TransmissionType : undefined,
    color: data.color?.trim(),
    interiorColor: data.interiorColor?.trim(),
    condition: data.condition as Condition,
    engine: data.engine?.trim(),
    engineSize: data.engineSize?.trim(),
    warranty: data.warranty?.trim(),
    serviceHistory: data.serviceHistory?.set ? data.serviceHistory.set : (Array.isArray(data.serviceHistory) ? data.serviceHistory : []),
    previousOwners: data.previousOwners ? Number(data.previousOwners) : undefined,
    registrationStatus: data.registrationStatus?.trim(),
    doors: data.doors ? Number(data.doors) : undefined,
    seats: data.seats ? Number(data.seats) : undefined,
    airbags: data.airbags ? Number(data.airbags) : undefined,
    seatingCapacity: data.seats ? Number(data.seats) : undefined,
    sunroof: features.has('sunroof'),
    navigationSystem: features.has('navigation_system'),
    bluetooth: features.has('bluetooth'),
    cruiseControl: features.has('cruise_control'),
    parkingSensors: features.has('parking_sensors'),
    backupCamera: features.has('backup_camera'),
    heatedSeats: features.has('heated_seats'),
    leatherSeats: features.has('leather_seats'),
    alloyWheels: features.has('alloy_wheels'),
  };
};
