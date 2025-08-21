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
  exteriorColor?: string; // Flutter field mapping
  condition?: Condition;
  engine?: string;
  engineSize?: string;
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  registrationExpiry?: string; // Flutter advanced field
  
  // Advanced Flutter fields
  bodyType?: string;
  driveType?: string;
  horsepower?: number;
  accidental?: string;
  importStatus?: string;
  
  // Car-specific features
  doors?: number;
  seats?: number;
  airbags?: number;
  noOfAirbags?: number; // Flutter field mapping
  seatingCapacity?: number;
  
  // Feature flags from Flutter selectedFeatures
  sunroof?: boolean;
  panoramicRoof?: boolean;
  navigationSystem?: boolean;
  bluetooth?: boolean;
  appleCarplay?: boolean;
  androidAuto?: boolean;
  wirelessCharging?: boolean;
  usbPorts?: boolean;
  cruiseControl?: boolean;
  parkingSensors?: boolean;
  parkingSensor?: boolean; // Flutter variant
  backupCamera?: boolean;
  rearCamera?: boolean; // Flutter variant
  camera360?: boolean;
  heatedSeats?: boolean;
  cooledSeats?: boolean;
  leatherSeats?: boolean;
  electricSeats?: boolean;
  alloyWheels?: boolean;
  centralLocking?: boolean;
  powerSteering?: boolean;
  immobilizer?: boolean;
  alarmSystem?: boolean;
  abs?: boolean;
  tractionControl?: boolean;
  laneAssist?: boolean;
  blindSpotMonitor?: boolean;
  ledHeadlights?: boolean;
  fogLights?: boolean;
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

  if (data.noOfAirbags !== undefined && (typeof data.noOfAirbags !== 'number' || data.noOfAirbags < 0 || data.noOfAirbags > 12)) {
    errors.push("Number of airbags must be between 0 and 12");
  }

  if (data.previousOwners !== undefined && (typeof data.previousOwners !== 'number' || data.previousOwners < 0)) {
    errors.push("Previous owners must be a non-negative number");
  }

  if (data.horsepower !== undefined && (typeof data.horsepower !== 'number' || data.horsepower < 0)) {
    errors.push("Horsepower must be a positive number");
  }

  // Validate body type options
  if (data.bodyType) {
    const validBodyTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'minivan'];
    if (!validBodyTypes.includes(data.bodyType.toLowerCase())) {
      errors.push(`Invalid body type. Must be one of: ${validBodyTypes.join(', ')}`);
    }
  }

  // Validate drive type options
  if (data.driveType) {
    const validDriveTypes = ['front_wheel_drive', 'rear_wheel_drive', 'all_wheel_drive', 'four_wheel_drive'];
    if (!validDriveTypes.includes(data.driveType)) {
      errors.push(`Invalid drive type. Must be one of: ${validDriveTypes.join(', ')}`);
    }
  }

  return errors;
};

export const mapCarData = (data: any): Partial<CarDetails> => {
  const features = new Set(data.selectedFeatures || []);
  
  // Map frontend transmission type to backend enum
  const mapTransmissionType = (frontendType: string): string | undefined => {
    if (frontendType === 'continuouslyVariable') {
      return 'continuouslyVariable';
    }
    return frontendType;
  };

  // Handle both flat and nested data structures for future-proofing
  const vehicleData = data.vehicles || data;

  return {
    vehicleType: vehicleData.vehicleType as VehicleType,
    make: vehicleData.make?.trim(),
    model: vehicleData.model?.trim(),
    year: Number(vehicleData.year),
    mileage: vehicleData.mileage ? Number(vehicleData.mileage) : undefined,
    fuelType: vehicleData.fuelType as FuelType,
    transmissionType: vehicleData.transmissionType ? mapTransmissionType(vehicleData.transmissionType) as TransmissionType : undefined,
    
    // Handle color field mapping
    color: vehicleData.color?.trim() || vehicleData.exteriorColor?.trim(),
    exteriorColor: vehicleData.exteriorColor?.trim() || vehicleData.color?.trim(),
    
    condition: vehicleData.condition as Condition,
    engine: vehicleData.engine?.trim(),
    engineSize: vehicleData.engineSize?.trim(),
    warranty: vehicleData.warranty?.trim(),
    serviceHistory: vehicleData.serviceHistory?.set ? vehicleData.serviceHistory.set : (Array.isArray(vehicleData.serviceHistory) ? vehicleData.serviceHistory : []),
    previousOwners: vehicleData.previousOwners ? Number(vehicleData.previousOwners) : undefined,
    registrationStatus: vehicleData.registrationStatus?.trim(),
    registrationExpiry: vehicleData.registrationExpiry?.trim(),
    
    // Advanced Flutter fields
    bodyType: vehicleData.bodyType?.trim(),
    driveType: vehicleData.driveType?.trim(),
    horsepower: vehicleData.horsepower ? Number(vehicleData.horsepower) : undefined,
    accidental: vehicleData.accidental?.trim(),
    importStatus: vehicleData.importStatus?.trim(),
    
    // Basic car specs
    doors: vehicleData.doors ? Number(vehicleData.doors) : undefined,
    seats: vehicleData.seats ? Number(vehicleData.seats) : undefined,
    airbags: vehicleData.airbags ? Number(vehicleData.airbags) : undefined,
    noOfAirbags: vehicleData.noOfAirbags ? Number(vehicleData.noOfAirbags) : undefined,
    seatingCapacity: vehicleData.seats ? Number(vehicleData.seats) : undefined,
    
    // Map selectedFeatures array to individual boolean fields
    sunroof: features.has('sunroof'),
    panoramicRoof: features.has('panoramic_roof'),
    navigationSystem: features.has('navigation_system'),
    bluetooth: features.has('bluetooth'),
    appleCarplay: features.has('apple_carplay'),
    androidAuto: features.has('android_auto'),
    wirelessCharging: features.has('wireless_charging'),
    usbPorts: features.has('usb_ports'),
    cruiseControl: features.has('cruise_control'),
    parkingSensors: features.has('parking_sensors') || features.has('parking_sensor'),
    parkingSensor: features.has('parking_sensor'),
    backupCamera: features.has('backup_camera') || features.has('rear_camera'),
    rearCamera: features.has('rear_camera'),
    camera360: features.has('360_camera'),
    heatedSeats: features.has('heated_seats'),
    cooledSeats: features.has('cooled_seats'),
    leatherSeats: features.has('leather_seats'),
    electricSeats: features.has('electric_seats'),
    alloyWheels: features.has('alloy_wheels'),
    centralLocking: features.has('central_locking'),
    powerSteering: features.has('power_steering'),
    immobilizer: features.has('immobilizer'),
    alarmSystem: features.has('alarm_system'),
    abs: features.has('abs'),
    tractionControl: features.has('traction_control'),
    laneAssist: features.has('lane_assist'),
    blindSpotMonitor: features.has('blind_spot_monitor'),
    ledHeadlights: features.has('led_headlights'),
    fogLights: features.has('fog_lights'),
  };
};
