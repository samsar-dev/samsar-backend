import { 
  VehicleType, 
  PropertyType,
  ListingAction,
  ListingCategory,
  FuelType,
  TransmissionType,
  Condition
} from "../types/enums.js";

// ============================================================================
// BASE LISTING VALIDATION SCHEMA
// ============================================================================

export interface ListingValidationSchema {
  title: string;
  description: string;
  price: number;
  mainCategory: ListingCategory;
  subCategory: VehicleType | PropertyType;
  location: string;
  latitude?: number;
  longitude?: number;
  listingAction?: ListingAction;
  details?: {
    vehicles?: any;
    realEstate?: any;
  };
}

// ============================================================================
// VEHICLE DETAILS INTERFACES
// ============================================================================

export interface CarDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  color?: string;
  exteriorColor?: string;
  condition?: Condition;
  engine?: string;
  engineSize?: string;
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  registrationExpiry?: string;
  bodyType?: string;
  driveType?: string;
  horsepower?: number;
  accidental?: string;
  importStatus?: string;
  doors?: number;
  seats?: number;
  airbags?: number;
  noOfAirbags?: number;
  seatingCapacity?: number;
  // Car features
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
  parkingSensor?: boolean;
  backupCamera?: boolean;
  rearCamera?: boolean;
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
  engineCapacity?: number;
  motorcycleType?: string;
  abs?: boolean;
  windshield?: boolean;
  saddlebags?: boolean;
  crashBars?: boolean;
  heatedGrips?: boolean;
  quickShifter?: boolean;
  tractionControl?: boolean;
  ridingModes?: string[];
}

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
  payloadCapacity?: number;
  towingCapacity?: number;
  cargoVolume?: number;
  grossVehicleWeight?: number;
  horsepower?: number;
  bodyType?: string;
  driveType?: string;
  refrigeration?: boolean;
  liftGate?: boolean;
  sleepingCab?: boolean;
  airConditioning?: boolean;
  powerSteering?: boolean;
  abs?: boolean;
  airBrakes?: boolean;
  hydraulicBrakes?: boolean;
  cargoAreaLength?: number;
  cargoAreaWidth?: number;
  cargoAreaHeight?: number;
  loadingDockHeight?: number;
  sideAccess?: boolean;
  rearAccess?: boolean;
  topAccess?: boolean;
  gpsTracking?: boolean;
  fleetManagement?: boolean;
  reverseCamera?: boolean;
  dashCamera?: boolean;
  bluetoothConnectivity?: boolean;
  stabilityControl?: boolean;
  tractionControl?: boolean;
  rolloverProtection?: boolean;
  collisionAvoidance?: boolean;
  blindSpotMonitoring?: boolean;
  operatingHours?: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  commercialLicense?: string;
  inspectionCertificate?: boolean;
  emissionStandard?: string;
}

export interface PassengersDetails {
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
  seatingCapacity?: number;
  doors?: number;
  airConditioning?: boolean;
  entertainmentSystem?: boolean;
  bodyType?: string;
  driveType?: string;
  horsepower?: number;
  airbags?: number;
  abs?: boolean;
  stabilityControl?: boolean;
  tractionControl?: boolean;
  powerSteering?: boolean;
  powerWindows?: boolean;
  centralLocking?: boolean;
  cruiseControl?: boolean;
  heatedSeats?: boolean;
  leatherSeats?: boolean;
  sunroof?: boolean;
  navigationSystem?: boolean;
  bluetooth?: boolean;
  usbPorts?: number;
  reverseCamera?: boolean;
  parkingSensors?: boolean;
}

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
  operatingWeight?: number;
  maxLiftCapacity?: number;
  workingHeight?: number;
  bucketCapacity?: number;
  horsepower?: number;
  hydraulicSystem?: string;
  attachments?: string[];
  cabType?: string;
  airConditioning?: boolean;
  heater?: boolean;
  radioSystem?: boolean;
  gpsTracking?: boolean;
  backupAlarm?: boolean;
  workLights?: boolean;
  operatingHours?: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  certifications?: string[];
  trackType?: string;
  tireType?: string;
  driveType?: string;
  rolloverProtection?: boolean;
  fallingObjectProtection?: boolean;
  emergencyStop?: boolean;
  backupCamera?: boolean;
  proximityAlarms?: boolean;
}

export interface StoreDetails {
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  fuelType?: string;
  transmissionType?: string;
  color?: string;
  condition?: string;
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

// ============================================================================
// REAL ESTATE DETAILS INTERFACES
// ============================================================================

export interface HouseDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  constructionType?: string;
  features?: string[];
  parking?: string;
  accessibilityFeatures?: string[];
  balcony?: boolean;
  buildingAmenities?: string[];
  cooling?: string;
  elevator?: boolean;
  energyRating?: string;
  exposureDirection?: string[];
  fireSafety?: string[];
  floor?: number;
  flooringType?: string;
  furnished?: string;
  heating?: string;
  internetIncluded?: boolean;
  parkingType?: string;
  petPolicy?: string;
  renovationHistory?: string;
  securityFeatures?: string[];
  storage?: boolean;
  storageType?: string[];
  totalFloors?: number;
  utilities?: string[];
  view?: string;
  windowType?: string;
  attic?: string;
  basement?: string;
  flooringTypes?: string[];
  halfBathrooms?: number;
  stories?: number;
  totalArea?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  accessibility?: string;
  appliances?: string;
  basementFeatures?: string;
  bathroomFeatures?: string;
  communityFeatures?: string;
  energyFeatures?: string;
  exteriorFeatures?: string;
  hoaFeatures?: string;
  kitchenFeatures?: string;
  landscaping?: string;
  livingArea?: number;
}

export interface ApartmentDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  constructionType?: string;
  features?: string[];
  parking?: string;
  accessibilityFeatures?: string[];
  balcony?: boolean;
  buildingAmenities?: string[];
  cooling?: string;
  elevator?: boolean;
  energyRating?: string;
  exposureDirection?: string[];
  fireSafety?: string[];
  floor?: number;
  flooringType?: string;
  furnished?: string;
  heating?: string;
  internetIncluded?: boolean;
  parkingType?: string;
  petPolicy?: string;
  renovationHistory?: string;
  securityFeatures?: string[];
  storage?: boolean;
  storageType?: string[];
  totalFloors?: number;
  utilities?: string[];
  view?: string;
  windowType?: string;
  floorLevel?: number;
  totalArea?: number;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  hoaFeatures?: string;
  communityFeatures?: string;
  appliances?: string;
  kitchenFeatures?: string;
  bathroomFeatures?: string;
}

export interface LandDetails {
  propertyType: PropertyType;
  size?: string;
  condition?: string;
  features?: string[];
  accessibilityFeatures?: string[];
  utilities?: string[];
  buildable?: string;
  buildingRestrictions?: string;
  elevation?: number;
  environmentalFeatures?: string;
  naturalFeatures?: string;
  parcelNumber?: string;
  permitsInPlace?: string;
  soilTypes?: string[];
  topography?: string[];
  waterFeatures?: string;
  isBuildable?: boolean;
  totalArea?: number;
  yearBuilt?: number;
  accessibility?: string;
  energyFeatures?: string;
  landscaping?: string;
}

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

// ============================================================================
// UNION TYPES
// ============================================================================

export type VehicleDetails = CarDetails | MotorcycleDetails | PassengersDetails | ConstructionsDetails | CommercialsDetails | StoreDetails;
export type RealEstateDetails = HouseDetails | ApartmentDetails | LandDetails | OfficeDetails | VillaDetails;

// ============================================================================
// VALIDATOR RESULT INTERFACES
// ============================================================================

export interface ValidatorResult {
  errors: string[];
  mappedData?: Partial<VehicleDetails>;
}

export interface RealEstateValidatorResult {
  errors: string[];
  mappedData?: Partial<RealEstateDetails>;
}

// ============================================================================
// BASE LISTING VALIDATOR
// ============================================================================

export class ListingValidator {
  static validateBaseListing(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push("Title is required and must be a non-empty string");
    } else if (data.title.trim().length > 200) {
      errors.push("Title must not exceed 200 characters");
    }

    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push("Description is required and must be a non-empty string");
    } else if (data.description.trim().length > 5000) {
      errors.push("Description must not exceed 5000 characters");
    }

    if (!data.price || typeof data.price !== 'number' || data.price <= 0) {
      errors.push("Price is required and must be a positive number");
    }

    if (!data.mainCategory || !Object.values(ListingCategory).includes(data.mainCategory)) {
      errors.push(`Main category is required. Must be one of: ${Object.values(ListingCategory).join(', ')}`);
    }

    if (!data.subCategory) {
      errors.push("Sub category is required");
    } else {
      if (data.mainCategory === ListingCategory.VEHICLES && !Object.values(VehicleType).includes(data.subCategory)) {
        errors.push(`Invalid vehicle type. Must be one of: ${Object.values(VehicleType).join(', ')}`);
      } else if (data.mainCategory === ListingCategory.REAL_ESTATE && !Object.values(PropertyType).includes(data.subCategory)) {
        errors.push(`Invalid property type. Must be one of: ${Object.values(PropertyType).join(', ')}`);
      }
    }

    if (!data.location || typeof data.location !== 'string' || data.location.trim().length === 0) {
      errors.push("Location is required and must be a non-empty string");
    }

    if (data.latitude !== undefined && (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90)) {
      errors.push("Latitude must be a number between -90 and 90");
    }

    if (data.longitude !== undefined && (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180)) {
      errors.push("Longitude must be a number between -180 and 180");
    }

    if (data.listingAction && !Object.values(ListingAction).includes(data.listingAction)) {
      errors.push(`Invalid listing action. Must be one of: ${Object.values(ListingAction).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

// ============================================================================
// DATA NORMALIZER
// ============================================================================

export class ListingDataNormalizer {
  static normalizeBaseData(data: any): Partial<ListingValidationSchema> {
    return {
      title: data.title?.trim(),
      description: data.description?.trim(),
      price: data.price ? Number(data.price) : undefined,
      mainCategory: data.mainCategory,
      subCategory: data.subCategory,
      location: data.location?.trim(),
      latitude: data.latitude ? Number(data.latitude) : undefined,
      longitude: data.longitude ? Number(data.longitude) : undefined,
      listingAction: data.listingAction || ListingAction.SALE,
      details: data.details || {},
    };
  }
}

// ============================================================================
// VEHICLE VALIDATORS
// ============================================================================

export const validateCarData = (data: any): string[] => {
  const errors: string[] = [];

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

  if (data.mileage !== undefined && (typeof data.mileage !== 'number' || data.mileage < 0)) {
    errors.push("Mileage must be a positive number");
  }

  if (data.fuelType && !Object.values(FuelType).includes(data.fuelType)) {
    errors.push(`Invalid fuel type. Must be one of: ${Object.values(FuelType).join(', ')}`);
  }

  if (data.transmissionType) {
    const validTransmissionTypes = [
      ...Object.values(TransmissionType),
      'continuouslyVariable'
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

  if (data.horsepower !== undefined && (typeof data.horsepower !== 'number' || data.horsepower < 0)) {
    errors.push("Horsepower must be a positive number");
  }

  if (data.bodyType) {
    const validBodyTypes = ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'wagon', 'minivan'];
    if (!validBodyTypes.includes(data.bodyType.toLowerCase())) {
      errors.push(`Invalid body type. Must be one of: ${validBodyTypes.join(', ')}`);
    }
  }

  return errors;
};

export const mapCarData = (data: any): Partial<CarDetails> => {
  const features = new Set(data.selectedFeatures || []);
  
  const mapTransmissionType = (frontendType: string): string | undefined => {
    if (frontendType === 'continuouslyVariable') {
      return 'continuouslyVariable';
    }
    return frontendType;
  };

  const vehicleData = data.vehicles || data;

  return {
    vehicleType: vehicleData.vehicleType as VehicleType,
    make: vehicleData.make?.trim(),
    model: vehicleData.model?.trim(),
    year: Number(vehicleData.year),
    mileage: vehicleData.mileage ? Number(vehicleData.mileage) : undefined,
    fuelType: vehicleData.fuelType as FuelType,
    transmissionType: vehicleData.transmissionType ? mapTransmissionType(vehicleData.transmissionType) as TransmissionType : undefined,
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
    bodyType: vehicleData.bodyType?.trim(),
    driveType: vehicleData.driveType?.trim(),
    horsepower: vehicleData.horsepower ? Number(vehicleData.horsepower) : undefined,
    accidental: vehicleData.accidental?.trim(),
    importStatus: vehicleData.importStatus?.trim(),
    doors: vehicleData.doors ? Number(vehicleData.doors) : undefined,
    seats: vehicleData.seats ? Number(vehicleData.seats) : undefined,
    airbags: vehicleData.airbags ? Number(vehicleData.airbags) : undefined,
    noOfAirbags: vehicleData.noOfAirbags ? Number(vehicleData.noOfAirbags) : undefined,
    seatingCapacity: vehicleData.seats ? Number(vehicleData.seats) : undefined,
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

// Motorcycle Validators
export const validateMotorcycleData = (data: any): string[] => {
  const errors: string[] = [];

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
    engineCapacity: data.engineCapacity ? Number(data.engineCapacity) : undefined,
    motorcycleType: data.motorcycleType?.trim(),
    abs: features.has('abs'),
    windshield: features.has('windshield'),
    saddlebags: features.has('saddlebags'),
    crashBars: features.has('crash_bars'),
    heatedGrips: features.has('heated_grips'),
    quickShifter: features.has('quick_shifter'),
    tractionControl: features.has('traction_control'),
    ridingModes: Array.isArray(data.ridingModes) ? data.ridingModes : undefined,
  };
};

// Commercial Vehicle Validators
export const validateCommercialsData = (data: any): string[] => {
  const errors: string[] = [];

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

  return errors;
};

export const mapCommercialsData = (data: any): Partial<CommercialsDetails> => {
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
    payloadCapacity: data.payloadCapacity ? Number(data.payloadCapacity) : undefined,
    towingCapacity: data.towingCapacity ? Number(data.towingCapacity) : undefined,
    cargoVolume: data.cargoVolume ? Number(data.cargoVolume) : undefined,
    grossVehicleWeight: data.grossVehicleWeight ? Number(data.grossVehicleWeight) : undefined,
    horsepower: data.horsepower ? Number(data.horsepower) : undefined,
    bodyType: data.bodyType?.trim(),
    driveType: data.driveType?.trim(),
    refrigeration: features.has('refrigeration'),
    liftGate: features.has('lift_gate'),
    sleepingCab: features.has('sleeping_cab'),
    airConditioning: features.has('air_conditioning'),
    powerSteering: features.has('power_steering'),
    abs: features.has('abs'),
    airBrakes: features.has('air_brakes'),
    hydraulicBrakes: features.has('hydraulic_brakes'),
  };
};

// Passenger Vehicle Validators
export const validatePassengersData = (data: any): string[] => {
  const errors: string[] = [];

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
    condition: data.condition as Condition,
  };
};

// Construction Vehicle Validators
export const validateConstructionsData = (data: any): string[] => {
  const errors: string[] = [];

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
  };
};

// Store Validators
export const validateStoreData = (data: any): string[] => {
  const errors: string[] = [];
  if (!data.storeType || typeof data.storeType !== 'string' || data.storeType.trim().length === 0) {
    errors.push("Store type is required");
  }
  return errors;
};

export const mapStoreData = (data: any): StoreDetails => {
  return {
    vehicleType: data.vehicleType || 'STORE',
    make: data.make || undefined,
    model: data.model || undefined,
    year: data.year ? parseInt(data.year) : undefined,
    mileage: data.mileage ? parseInt(data.mileage) : undefined,
    fuelType: data.fuelType || undefined,
    transmissionType: data.transmissionType || undefined,
    color: data.color || undefined,
    condition: data.condition || undefined,
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
};

// ============================================================================
// REAL ESTATE VALIDATORS
// ============================================================================

export class HouseValidator {
  static validate(data: any): { errors: string[]; mappedData: HouseDetails | null } {
    const errors: string[] = [];
    
    if (!data.propertyType || data.propertyType !== PropertyType.HOUSE) {
      errors.push("Property type must be HOUSE");
    }

    const mappedData: HouseDetails = {
      propertyType: PropertyType.HOUSE,
      size: data.size || undefined,
      condition: data.condition || undefined,
      constructionType: data.constructionType || undefined,
      features: Array.isArray(data.features) ? data.features : [],
      parking: data.parking || undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms.toString()) : undefined,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms.toString()) : undefined,
    };

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}

export class ApartmentValidator {
  static validate(data: any): { errors: string[]; mappedData: ApartmentDetails | null } {
    const errors: string[] = [];
    
    if (!data.propertyType || data.propertyType !== PropertyType.APARTMENT) {
      errors.push("Property type must be APARTMENT");
    }

    const mappedData: ApartmentDetails = {
      propertyType: PropertyType.APARTMENT,
      size: data.size || undefined,
      condition: data.condition || undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms.toString()) : undefined,
      bathrooms: data.bathrooms ? parseFloat(data.bathrooms.toString()) : undefined,
    };

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}

export class LandValidator {
  static validate(data: any): { errors: string[]; mappedData: LandDetails | null } {
    const errors: string[] = [];
    
    if (!data.propertyType || data.propertyType !== PropertyType.LAND) {
      errors.push("Property type must be LAND");
    }

    const mappedData: LandDetails = {
      propertyType: PropertyType.LAND,
      size: data.size || undefined,
      condition: data.condition || undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea.toString()) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
    };

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
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
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt.toString()) : undefined,
    };

    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : null
    };
  }
}

export const VillaValidator = {
  validate: (data: any) => {
    const errors: string[] = [];
    const mappedData: VillaDetails = {
      propertyType: data.propertyType || 'Villa',
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : undefined,
      totalArea: data.totalArea ? parseFloat(data.totalArea) : undefined,
      yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : undefined,
    };
    return {
      errors,
      mappedData: errors.length === 0 ? mappedData : undefined
    };
  }
};

export const StoreValidator = {
  validate: (data: any) => {
    const errors = validateStoreData(data);
    return {
      errors,
      mappedData: errors.length === 0 ? mapStoreData(data) : undefined
    };
  }
};

// ============================================================================
// VALIDATOR FACTORIES
// ============================================================================

export class VehicleValidatorFactory {
  static validate(vehicleType: VehicleType, data: any): ValidatorResult {
    let errors: string[] = [];
    let mappedData: Partial<VehicleDetails> | undefined;

    switch (vehicleType) {
      case VehicleType.CARS:
        errors = validateCarData(data);
        if (errors.length === 0) {
          mappedData = mapCarData(data);
        }
        break;

      case VehicleType.MOTORCYCLES:
        errors = validateMotorcycleData(data);
        if (errors.length === 0) {
          mappedData = mapMotorcycleData(data);
        }
        break;

      case VehicleType.PASSENGER_VEHICLES:
        errors = validatePassengersData(data);
        if (errors.length === 0) {
          mappedData = mapPassengersData(data);
        }
        break;

      case VehicleType.COMMERCIAL_TRANSPORT:
        errors = validateCommercialsData(data);
        if (errors.length === 0) {
          mappedData = mapCommercialsData(data);
        }
        break;

      case VehicleType.CONSTRUCTION_VEHICLES:
        errors = validateConstructionsData(data);
        if (errors.length === 0) {
          mappedData = mapConstructionsData(data);
        }
        break;

      case VehicleType.STORE:
        errors = validateStoreData(data);
        if (errors.length === 0) {
          mappedData = mapStoreData(data);
        }
        break;

      default:
        errors.push(`Unsupported vehicle type: ${vehicleType}`);
        break;
    }

    return { errors, mappedData };
  }

  static getSupportedVehicleTypes(): VehicleType[] {
    return [
      VehicleType.CARS,
      VehicleType.MOTORCYCLES,
      VehicleType.PASSENGER_VEHICLES,
      VehicleType.COMMERCIAL_TRANSPORT,
      VehicleType.CONSTRUCTION_VEHICLES,
      VehicleType.STORE,
    ];
  }
}

export class RealEstateValidatorFactory {
  static validate(propertyType: PropertyType, data: any): RealEstateValidatorResult {
    let errors: string[] = [];
    let mappedData: Partial<RealEstateDetails> | undefined;

    switch (propertyType) {
      case PropertyType.HOUSE:
        const houseResult = HouseValidator.validate(data);
        errors = houseResult.errors;
        if (errors.length === 0) {
          mappedData = houseResult.mappedData || undefined;
        }
        break;

      case PropertyType.APARTMENT:
        const apartmentResult = ApartmentValidator.validate(data);
        errors = apartmentResult.errors;
        if (errors.length === 0) {
          mappedData = apartmentResult.mappedData || undefined;
        }
        break;

      case PropertyType.OFFICE:
        const officeResult = OfficeValidator.validate(data);
        errors = officeResult.errors;
        if (errors.length === 0) {
          mappedData = officeResult.mappedData || undefined;
        }
        break;

      case PropertyType.LAND:
        const landResult = LandValidator.validate(data);
        errors = landResult.errors;
        if (errors.length === 0) {
          mappedData = landResult.mappedData || undefined;
        }
        break;

      case PropertyType.VILLA:
        const villaResult = VillaValidator.validate(data);
        errors = villaResult.errors;
        if (errors.length === 0) {
          mappedData = villaResult.mappedData || undefined;
        }
        break;

      default:
        errors.push(`Unsupported property type: ${propertyType}`);
        break;
    }

    return { errors, mappedData };
  }
};
