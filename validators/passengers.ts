import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface PassengersDetails {
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
  // Passenger vehicle-specific features
  seatingCapacity?: number;
  doors?: number;
  airConditioning?: boolean;
  entertainmentSystem?: boolean;
  bodyType?: string; // Van, Bus, Minibus, etc.
  driveType?: string; // FWD, RWD, AWD, 4WD
  horsepower?: number;
  // Safety features
  airbags?: number;
  abs?: boolean;
  stabilityControl?: boolean;
  tractionControl?: boolean;
  // Comfort features
  powerSteering?: boolean;
  powerWindows?: boolean;
  centralLocking?: boolean;
  cruiseControl?: boolean;
  heatedSeats?: boolean;
  leatherSeats?: boolean;
  sunroof?: boolean;
  // Technology features
  navigationSystem?: boolean;
  bluetooth?: boolean;
  usbPorts?: number;
  reverseCamera?: boolean;
  parkingSensors?: boolean;
}

export const validatePassengersData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for passenger vehicles");
  } else if (data.vehicleType !== VehicleType.PASSENGER_VEHICLES) {
    errors.push("Invalid vehicle type for passengers validator");
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

  if (data.seatingCapacity !== undefined && (typeof data.seatingCapacity !== 'number' || data.seatingCapacity < 2 || data.seatingCapacity > 60)) {
    errors.push("Seating capacity must be between 2 and 60");
  }

  if (data.doors !== undefined && (typeof data.doors !== 'number' || data.doors < 2 || data.doors > 6)) {
    errors.push("Number of doors must be between 2 and 6");
  }

  if (data.airbags !== undefined && (typeof data.airbags !== 'number' || data.airbags < 0 || data.airbags > 20)) {
    errors.push("Number of airbags must be between 0 and 20");
  }

  if (data.horsepower !== undefined && (typeof data.horsepower !== 'number' || data.horsepower < 50 || data.horsepower > 1000)) {
    errors.push("Horsepower must be between 50 and 1000");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  if (data.usbPorts !== undefined && (typeof data.usbPorts !== 'number' || data.usbPorts < 0 || data.usbPorts > 10)) {
    errors.push("Number of USB ports must be between 0 and 10");
  }

  const validBodyTypes = ['Van', 'Bus', 'Minibus', 'Microbus', 'Coach', 'Shuttle', 'Transit'];
  if (data.bodyType && !validBodyTypes.includes(data.bodyType)) {
    errors.push(`Invalid body type. Must be one of: ${validBodyTypes.join(', ')}`);
  }

  const validDriveTypes = ['FWD', 'RWD', 'AWD', '4WD'];
  if (data.driveType && !validDriveTypes.includes(data.driveType)) {
    errors.push(`Invalid drive type. Must be one of: ${validDriveTypes.join(', ')}`);
  }

  return errors;
};

export const mapPassengersData = (data: any): Partial<PassengersDetails> => {
  const features = new Set(data.selectedFeatures || []);
  return {
    vehicleType: data.vehicleType as VehicleType,
    make: data.make?.trim(),
    model: data.model?.trim(),
    year: Number(data.year),
    mileage: data.mileage ? Number(data.mileage) : undefined,
    fuelType: data.fuelType as FuelType,
    transmissionType: data.transmissionType as TransmissionType,
    color: data.color?.trim(),
    interiorColor: data.interiorColor?.trim(),
    condition: data.condition as Condition,
    engine: data.engine?.trim(),
    engineSize: data.engineSize?.trim(),
    warranty: data.warranty?.trim(),
    serviceHistory: Array.isArray(data.serviceHistory) ? data.serviceHistory : undefined,
    previousOwners: data.previousOwners ? Number(data.previousOwners) : undefined,
    registrationStatus: data.registrationStatus?.trim(),
    seatingCapacity: data.seatingCapacity ? Number(data.seatingCapacity) : undefined,
    doors: data.doors ? Number(data.doors) : undefined,
    airConditioning: features.has('air_conditioning'),
    entertainmentSystem: features.has('entertainment_system'),
    bodyType: data.bodyType?.trim(),
    driveType: data.driveType?.trim(),
    horsepower: data.horsepower ? Number(data.horsepower) : undefined,
    airbags: data.airbags ? Number(data.airbags) : undefined,
    abs: features.has('abs'),
    stabilityControl: features.has('stability_control'),
    tractionControl: features.has('traction_control'),
    powerSteering: features.has('power_steering'),
    powerWindows: features.has('power_windows'),
    centralLocking: features.has('central_locking'),
    cruiseControl: features.has('cruise_control'),
    heatedSeats: features.has('heated_seats'),
    leatherSeats: features.has('leather_seats'),
    sunroof: features.has('sunroof'),
    navigationSystem: features.has('navigation_system'),
    bluetooth: features.has('bluetooth'),
    usbPorts: data.usbPorts ? Number(data.usbPorts) : undefined,
    reverseCamera: features.has('reverse_camera'),
    parkingSensors: features.has('parking_sensors'),
  };
};
