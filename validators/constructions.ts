import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface ConstructionsDetails {
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
  // Construction vehicle-specific features
  operatingWeight?: number; // in tons
  maxLiftCapacity?: number; // in tons
  workingHeight?: number; // in meters
  bucketCapacity?: number; // in cubic meters
  horsepower?: number;
  hydraulicSystem?: string;
  attachments?: string[]; // bucket, hammer, grapple, etc.
  // Construction-specific features
  cabType?: string; // enclosed, open, ROPS, FOPS
  airConditioning?: boolean;
  heater?: boolean;
  radioSystem?: boolean;
  gpsTracking?: boolean;
  backupAlarm?: boolean;
  workLights?: boolean;
  // Operational features
  operatingHours?: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  certifications?: string[]; // CE, ISO, etc.
  // Mobility features
  trackType?: string; // rubber, steel
  tireType?: string; // solid, pneumatic
  driveType?: string; // 2WD, 4WD, AWD
  // Safety features
  rolloverProtection?: boolean;
  fallingObjectProtection?: boolean;
  emergencyStop?: boolean;
  backupCamera?: boolean;
  proximityAlarms?: boolean;
}

export const validateConstructionsData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for construction vehicles");
  } else if (data.vehicleType !== VehicleType.CONSTRUCTION_VEHICLES) {
    errors.push("Invalid vehicle type for constructions validator");
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

  if (data.operatingHours !== undefined && (typeof data.operatingHours !== 'number' || data.operatingHours < 0)) {
    errors.push("Operating hours must be a positive number");
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

  if (data.operatingWeight !== undefined && (typeof data.operatingWeight !== 'number' || data.operatingWeight < 0.1 || data.operatingWeight > 1000)) {
    errors.push("Operating weight must be between 0.1 and 1000 tons");
  }

  if (data.maxLiftCapacity !== undefined && (typeof data.maxLiftCapacity !== 'number' || data.maxLiftCapacity < 0.1 || data.maxLiftCapacity > 500)) {
    errors.push("Max lift capacity must be between 0.1 and 500 tons");
  }

  if (data.workingHeight !== undefined && (typeof data.workingHeight !== 'number' || data.workingHeight < 1 || data.workingHeight > 100)) {
    errors.push("Working height must be between 1 and 100 meters");
  }

  if (data.bucketCapacity !== undefined && (typeof data.bucketCapacity !== 'number' || data.bucketCapacity < 0.1 || data.bucketCapacity > 50)) {
    errors.push("Bucket capacity must be between 0.1 and 50 cubic meters");
  }

  if (data.horsepower !== undefined && (typeof data.horsepower !== 'number' || data.horsepower < 50 || data.horsepower > 2000)) {
    errors.push("Horsepower must be between 50 and 2000");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  const validCabTypes = ['Enclosed', 'Open', 'ROPS', 'FOPS', 'ROPS/FOPS'];
  if (data.cabType && !validCabTypes.includes(data.cabType)) {
    errors.push(`Invalid cab type. Must be one of: ${validCabTypes.join(', ')}`);
  }

  const validTrackTypes = ['Rubber', 'Steel'];
  if (data.trackType && !validTrackTypes.includes(data.trackType)) {
    errors.push(`Invalid track type. Must be one of: ${validTrackTypes.join(', ')}`);
  }

  const validTireTypes = ['Solid', 'Pneumatic'];
  if (data.tireType && !validTireTypes.includes(data.tireType)) {
    errors.push(`Invalid tire type. Must be one of: ${validTireTypes.join(', ')}`);
  }

  const validDriveTypes = ['2WD', '4WD', 'AWD'];
  if (data.driveType && !validDriveTypes.includes(data.driveType)) {
    errors.push(`Invalid drive type. Must be one of: ${validDriveTypes.join(', ')}`);
  }

  return errors;
};

export const mapConstructionsData = (data: any): Partial<ConstructionsDetails> => {
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
    condition: data.condition as Condition,
    engine: data.engine?.trim(),
    engineSize: data.engineSize?.trim(),
    warranty: data.warranty?.trim(),
    serviceHistory: Array.isArray(data.serviceHistory) ? data.serviceHistory : undefined,
    previousOwners: data.previousOwners ? Number(data.previousOwners) : undefined,
    registrationStatus: data.registrationStatus?.trim(),
    operatingWeight: data.operatingWeight ? Number(data.operatingWeight) : undefined,
    maxLiftCapacity: data.maxLiftCapacity ? Number(data.maxLiftCapacity) : undefined,
    workingHeight: data.workingHeight ? Number(data.workingHeight) : undefined,
    bucketCapacity: data.bucketCapacity ? Number(data.bucketCapacity) : undefined,
    horsepower: data.horsepower ? Number(data.horsepower) : undefined,
    hydraulicSystem: data.hydraulicSystem?.trim(),
    attachments: Array.isArray(data.attachments) ? data.attachments : undefined,
    cabType: data.cabType?.trim(),
    airConditioning: features.has('air_conditioning'),
    heater: features.has('heater'),
    radioSystem: features.has('radio_system'),
    gpsTracking: features.has('gps_tracking'),
    backupAlarm: features.has('backup_alarm'),
    workLights: features.has('work_lights'),
    operatingHours: data.operatingHours ? Number(data.operatingHours) : undefined,
    lastServiceDate: data.lastServiceDate?.trim(),
    nextServiceDue: data.nextServiceDue?.trim(),
    certifications: Array.isArray(data.certifications) ? data.certifications : undefined,
    trackType: data.trackType?.trim(),
    tireType: data.tireType?.trim(),
    driveType: data.driveType?.trim(),
    rolloverProtection: features.has('rollover_protection'),
    fallingObjectProtection: features.has('falling_object_protection'),
    emergencyStop: features.has('emergency_stop'),
    backupCamera: features.has('backup_camera'),
    proximityAlarms: features.has('proximity_alarms'),
  };
};
