import { VehicleType, FuelType, TransmissionType, Condition } from "../types/enums.js";

export interface CommercialsDetails {
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
  // Commercial vehicle-specific features
  payloadCapacity?: number; // in tons
  towingCapacity?: number; // in tons
  cargoVolume?: number; // in cubic meters
  grossVehicleWeight?: number; // in tons
  horsepower?: number;
  bodyType?: string; // truck, van, pickup, etc.
  driveType?: string; // 2WD, 4WD, AWD
  // Commercial-specific features
  refrigeration?: boolean;
  liftGate?: boolean;
  sleepingCab?: boolean;
  airConditioning?: boolean;
  powerSteering?: boolean;
  abs?: boolean;
  airBrakes?: boolean;
  hydraulicBrakes?: boolean;
  // Cargo features
  cargoAreaLength?: number; // in meters
  cargoAreaWidth?: number; // in meters
  cargoAreaHeight?: number; // in meters
  loadingDockHeight?: number; // in meters
  sideAccess?: boolean;
  rearAccess?: boolean;
  topAccess?: boolean;
  // Technology features
  gpsTracking?: boolean;
  fleetManagement?: boolean;
  reverseCamera?: boolean;
  dashCamera?: boolean;
  bluetoothConnectivity?: boolean;
  // Safety features
  stabilityControl?: boolean;
  tractionControl?: boolean;
  rolloverProtection?: boolean;
  collisionAvoidance?: boolean;
  blindSpotMonitoring?: boolean;
  // Operational features
  operatingHours?: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  commercialLicense?: string; // CDL class required
  inspectionCertificate?: boolean;
  emissionStandard?: string; // Euro 5, Euro 6, etc.
}

export const validateCommercialsData = (data: any): string[] => {
  const errors: string[] = [];

  // Required fields
  if (!data.vehicleType) {
    errors.push("Vehicle type is required for commercial vehicles");
  } else if (data.vehicleType !== VehicleType.COMMERCIAL_TRANSPORT) {
    errors.push("Invalid vehicle type for commercials validator");
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

  if (data.payloadCapacity !== undefined && (typeof data.payloadCapacity !== 'number' || data.payloadCapacity < 0.1 || data.payloadCapacity > 100)) {
    errors.push("Payload capacity must be between 0.1 and 100 tons");
  }

  if (data.towingCapacity !== undefined && (typeof data.towingCapacity !== 'number' || data.towingCapacity < 0.5 || data.towingCapacity > 200)) {
    errors.push("Towing capacity must be between 0.5 and 200 tons");
  }

  if (data.cargoVolume !== undefined && (typeof data.cargoVolume !== 'number' || data.cargoVolume < 1 || data.cargoVolume > 200)) {
    errors.push("Cargo volume must be between 1 and 200 cubic meters");
  }

  if (data.grossVehicleWeight !== undefined && (typeof data.grossVehicleWeight !== 'number' || data.grossVehicleWeight < 1 || data.grossVehicleWeight > 150)) {
    errors.push("Gross vehicle weight must be between 1 and 150 tons");
  }

  if (data.horsepower !== undefined && (typeof data.horsepower !== 'number' || data.horsepower < 100 || data.horsepower > 2000)) {
    errors.push("Horsepower must be between 100 and 2000");
  }

  if (data.cargoAreaLength !== undefined && (typeof data.cargoAreaLength !== 'number' || data.cargoAreaLength < 1 || data.cargoAreaLength > 20)) {
    errors.push("Cargo area length must be between 1 and 20 meters");
  }

  if (data.cargoAreaWidth !== undefined && (typeof data.cargoAreaWidth !== 'number' || data.cargoAreaWidth < 1 || data.cargoAreaWidth > 5)) {
    errors.push("Cargo area width must be between 1 and 5 meters");
  }

  if (data.cargoAreaHeight !== undefined && (typeof data.cargoAreaHeight !== 'number' || data.cargoAreaHeight < 1 || data.cargoAreaHeight > 5)) {
    errors.push("Cargo area height must be between 1 and 5 meters");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  const validBodyTypes = ['Truck', 'Van', 'Pickup', 'Box Truck', 'Flatbed', 'Tanker', 'Refrigerated', 'Dump Truck', 'Tow Truck', 'Delivery Van'];
  if (data.bodyType && !validBodyTypes.includes(data.bodyType)) {
    errors.push(`Invalid body type. Must be one of: ${validBodyTypes.join(', ')}`);
  }

  const validDriveTypes = ['2WD', '4WD', 'AWD'];
  if (data.driveType && !validDriveTypes.includes(data.driveType)) {
    errors.push(`Invalid drive type. Must be one of: ${validDriveTypes.join(', ')}`);
  }

  const validCommercialLicenses = ['CDL-A', 'CDL-B', 'CDL-C', 'Regular'];
  if (data.commercialLicense && !validCommercialLicenses.includes(data.commercialLicense)) {
    errors.push(`Invalid commercial license. Must be one of: ${validCommercialLicenses.join(', ')}`);
  }

  const validEmissionStandards = ['Euro 3', 'Euro 4', 'Euro 5', 'Euro 6', 'EPA 2007', 'EPA 2010'];
  if (data.emissionStandard && !validEmissionStandards.includes(data.emissionStandard)) {
    errors.push(`Invalid emission standard. Must be one of: ${validEmissionStandards.join(', ')}`);
  }

  return errors;
};

export const mapCommercialsData = (data: any): Partial<CommercialsDetails> => {
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
    payloadCapacity: data.payloadCapacity ? Number(data.payloadCapacity) : undefined,
    towingCapacity: data.towingCapacity ? Number(data.towingCapacity) : undefined,
    cargoVolume: data.cargoVolume ? Number(data.cargoVolume) : undefined,
    grossVehicleWeight: data.grossVehicleWeight ? Number(data.grossVehicleWeight) : undefined,
    horsepower: data.horsepower ? Number(data.horsepower) : undefined,
    bodyType: data.bodyType?.trim(),
    driveType: data.driveType?.trim(),
    refrigeration: Boolean(data.refrigeration),
    liftGate: Boolean(data.liftGate),
    sleepingCab: Boolean(data.sleepingCab),
    airConditioning: Boolean(data.airConditioning),
    powerSteering: Boolean(data.powerSteering),
    abs: Boolean(data.abs),
    airBrakes: Boolean(data.airBrakes),
    hydraulicBrakes: Boolean(data.hydraulicBrakes),
    cargoAreaLength: data.cargoAreaLength ? Number(data.cargoAreaLength) : undefined,
    cargoAreaWidth: data.cargoAreaWidth ? Number(data.cargoAreaWidth) : undefined,
    cargoAreaHeight: data.cargoAreaHeight ? Number(data.cargoAreaHeight) : undefined,
    loadingDockHeight: data.loadingDockHeight ? Number(data.loadingDockHeight) : undefined,
    sideAccess: Boolean(data.sideAccess),
    rearAccess: Boolean(data.rearAccess),
    topAccess: Boolean(data.topAccess),
    gpsTracking: Boolean(data.gpsTracking),
    fleetManagement: Boolean(data.fleetManagement),
    reverseCamera: Boolean(data.reverseCamera),
    dashCamera: Boolean(data.dashCamera),
    bluetoothConnectivity: Boolean(data.bluetoothConnectivity),
    stabilityControl: Boolean(data.stabilityControl),
    tractionControl: Boolean(data.tractionControl),
    rolloverProtection: Boolean(data.rolloverProtection),
    collisionAvoidance: Boolean(data.collisionAvoidance),
    blindSpotMonitoring: Boolean(data.blindSpotMonitoring),
    operatingHours: data.operatingHours ? Number(data.operatingHours) : undefined,
    lastServiceDate: data.lastServiceDate?.trim(),
    nextServiceDue: data.nextServiceDue?.trim(),
    commercialLicense: data.commercialLicense?.trim(),
    inspectionCertificate: Boolean(data.inspectionCertificate),
    emissionStandard: data.emissionStandard?.trim(),
  };
};
