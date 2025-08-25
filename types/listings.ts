import type {
  ListingCategory,
  VehicleType,
  PropertyType,
  FuelType,
  TransmissionType,
  Condition,
  ListingAction,
  ListingStatus,
} from "./enums.js";

export enum YesNo {
  Yes = "true",
  No = "false",
}

export enum Zoning {
  Residential = "residential",
  Commercial = "commercial",
  Industrial = "industrial",
  Agricultural = "agricultural",
  MixedUse = "mixed_use",
  Recreational = "recreational",
}

export enum PropertyCondition {
  New = "new",
  Excellent = "excellent",
  Good = "good",
  Fair = "fair",
  NeedsWork = "needs_work",
  FixerUpper = "fixer_upper",
}

export enum PropertyUsage {
  Retail = "retail",
  Office = "office",
  Industrial = "industrial",
  Warehouse = "warehouse",
  Hospitality = "hospitality",
  MixedUse = "mixed_use",
  Other = "other",
}

export enum CustomFeature {
  Furnished = "furnished",
  Basement = "basement",
  Security = "security",
  Fireplace = "fireplace",
}

export interface SelectOption {
  value: string;
  label: string;
}

// Real estate specific interfaces
export interface HouseDetails {
  propertyType: PropertyType.HOUSE;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  livingArea: number;
  halfBathrooms: number;
  stories: number;
  hasGarden?: boolean;
  hasGarage?: boolean;
  floors?: number;
  parkingSpaces?: number;
  garage?: boolean;
  garden?: boolean;
  petsAllowed?: boolean;
  constructionType?: string;
  parking?: string;
}

export interface ApartmentDetails {
  propertyType: PropertyType.APARTMENT;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  floorLevel: number;
  yearBuilt: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasBalcony?: boolean;
}

export interface CondoDetails {
  propertyType: PropertyType.CONDO;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  floorLevel: number;
  yearBuilt: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasGym?: boolean;
}

export interface LandDetails {
  propertyType: PropertyType.LAND;
  totalArea: number;
  isBuildable?: boolean;
  hasUtilities?: boolean;
  hasAccessRoad?: boolean;
}

export interface CommercialDetails {
  propertyType: PropertyType.COMMERCIAL;
  totalArea: number;
  usageType: string;
  yearBuilt: number;
  hasParking?: boolean;
  isAccessible?: boolean;
}

export interface OtherDetails {
  propertyType: PropertyType.OTHER;
  totalArea: number;
  yearBuilt: number;
  customFeatures?: string[];
}

export interface ListingFieldSchema {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "select"
    | "textarea"
    | "checkbox"
    | "date"
    | "colorpicker"
    | "multiselect"
    | "toggle"
    | "featureGroup";
  section: string;
  required: boolean;
  options?: string[] | SelectOption[];
  validate?: (value: string | number | boolean) => string | null;
  featureGroups?: FeatureGroups;
  featureCategory?:
    | "entertainment"
    | "lighting"
    | "cameras"
    | "safety"
    | "climate";
  tooltip?: string;
}

export interface VehicleFeatures {
  // Safety Features
  accidentFree?: boolean;
  blindSpotMonitor?: boolean;
  laneAssist?: boolean;
  adaptiveCruiseControl?: boolean;
  tractionControl?: boolean;
  abs?: boolean;
  emergencyBrakeAssist?: boolean;
  tirePressureMonitoring?: boolean;
  distanceTempomat?: boolean;
  distanceWarning?: boolean;
  passengerAirbag?: boolean;
  glarelessHighBeam?: boolean;
  esp?: boolean;
  driverAirbag?: boolean;
  highBeamAssistant?: boolean;
  speedLimitingSystem?: boolean;
  isofix?: boolean;
  fatigueWarningSystem?: boolean;
  emergencyCallSystem?: boolean;
  sideAirbag?: boolean;
  trackHoldingAssistant?: boolean;
  deadAngleAssistant?: boolean;
  trafficSignRecognition?: boolean;
  burglarAlarmSystem?: boolean;


  // Camera Features
  rearCamera?: boolean;
  camera360?: boolean;
  dashCam?: boolean;
  nightVision?: boolean;
  parkingSensors?: boolean;
  parkingAid?: boolean;
  parkingAidCamera?: boolean;
  parkingAidSensorsRear?: boolean;
  parkingAidSensorsFront?: boolean;

  // Climate Features
  climateControl?: boolean | string[];
  heatedSeats?: boolean;
  ventilatedSeats?: boolean;
  dualZoneClimate?: boolean;
  rearAC?: boolean;
  airQualitySensor?: boolean;
  airConditioning?: boolean;
  twoZoneClimateControl?: boolean;

  // Entertainment Features
  bluetooth?: boolean;
  appleCarPlay?: boolean;
  androidAuto?: boolean;
  premiumSound?: boolean;
  wirelessCharging?: boolean;
  usbPorts?: boolean;
  cdPlayer?: boolean;
  dvdPlayer?: boolean;
  rearSeatEntertainment?: boolean;
  androidCar?: boolean;
  onBoardComputer?: boolean;
  dabRadio?: boolean;
  handsFreeCalling?: boolean;
  integratedMusicStreaming?: boolean;
  radio?: boolean;
  soundSystem?: boolean;
  wifiHotspot?: boolean;

  // Lighting Features
  ledHeadlights?: boolean;
  adaptiveHeadlights?: boolean;
  ambientLighting?: boolean;
  fogLights?: boolean;
  automaticHighBeams?: boolean;
  ledDaytimeRunningLights?: boolean;
  daytimeRunningLights?: boolean;
  headlightCleaning?: boolean;
  lightSensor?: boolean;

  // Convenience Features
  keylessEntry?: boolean;
  sunroof?: boolean;
  spareKey?: boolean;
  remoteStart?: boolean;
  powerTailgate?: boolean;
  autoDimmingMirrors?: boolean;
  rainSensingWipers?: boolean;
  mountainDrivingAssistant?: boolean;
  electricalWindowLifter?: boolean;
  electricalSideMirrors?: boolean;
  electricSeats?: boolean;
  headUpDisplay?: boolean;
  leatherSteeringWheel?: boolean;
  lumbarSupport?: boolean;
  multifunctionalSteeringWheel?: boolean;
  navigationSystem?: string;
  rainSensor?: boolean;
  automaticStartStop?: boolean;
  automaticDazzlingInteriorMirrors?: boolean;
  switchingRockers?: boolean;
  armrest?: boolean;
  voiceControl?: boolean;
  touchscreen?: boolean;

  // Extras
  aluminumRims?: boolean;
  luggageCompartmentSeparation?: boolean;
  summerTires?: boolean;
  powerSteering?: boolean;
}

// Base interface for all vehicles
export interface BaseVehicleDetails {
  // Basic info
  customMake?: string;
  customModel?: string;
  make: string;
  model: string;
  year: string;
  price: number;
  description: string;
  images: string[];
  insuranceType?: string;
  color: string;
  condition: Condition;
  transmissionType: string;
  transmission?: string;
  gearbox?: string;
  mileage: number | string;
  fuelType: string;
  previousOwners: number;
  registrationStatus: string;
  serviceHistory: string | boolean;

  // Engine & Performance
  engineType: string;
  engineSize: string;
  enginePower: number;
  torque: number;
  horsepower: number;
  driveSystem: string;
  driveType?: string;
  emissions: string;
  emissionClass?: string;
  fuelEfficiency?: string;
  fuelTankCapacity?: number | string;
  engineNumber?: string;
  engine?: string;

  // Dimensions & Weight
  operatingWeight: number;
  payloadCapacity: number;
  cargoVolume: number;
  roofHeight: string;
  interiorLength: string;
  wheelSize?: string;
  wheelType?: string;

  // Features
  features: VehicleFeatures;

  // Additional common fields
  warranty?: string;
  warrantyPeriod?: string;
  customsCleared?: boolean;
  upholsteryMaterial?: string;
  tireCondition?: string;
  bodyType?: string;
  bodyStyle?: string;
  roofType?: string;
  brakeType?: string;
  attachments?: string[];
  tires?: string;
  hydraulicSystem?: string;
  ptoType?: string;
  registrationExpiry?: string;
  brakeSystem?: string[];
  seatType?: string;
  ownershipHistory?: string;
  accidentHistory?: boolean;
  ownerManual?: boolean;
  additionalNotes?: string;

  // Safety features
  accidentFree?: boolean;
  blindSpotMonitor?: boolean;
  laneAssist?: boolean;
  adaptiveCruiseControl?: boolean;
  tractionControl?: boolean;
  abs?: boolean;
  emergencyBrakeAssist?: boolean;
  tirePressureMonitoring?: boolean;
  distanceTempomat?: boolean;
  distanceWarning?: boolean;
  passengerAirbag?: boolean;
  glarelessHighBeam?: boolean;
  esp?: boolean;
  driverAirbag?: boolean;
  highBeamAssistant?: boolean;
  speedLimitingSystem?: boolean;
  isofix?: boolean;
  fatigueWarningSystem?: boolean;
  emergencyCallSystem?: boolean;
  sideAirbag?: boolean;
  trackHoldingAssistant?: boolean;
  deadAngleAssistant?: boolean;
  trafficSignRecognition?: boolean;
  burglarAlarmSystem?: boolean;
  frontAirbags?: boolean;
  sideAirbags?: boolean;
  curtainAirbags?: boolean;
  kneeAirbags?: boolean;
  cruiseControl?: boolean;
  laneDepartureWarning?: boolean;
  laneKeepAssist?: boolean;
  automaticEmergencyBraking?: boolean;

  // Camera and parking
  rearCamera?: boolean;
  camera360?: boolean;
  dashCam?: boolean;
  nightVision?: boolean;
  parkingSensors?: boolean;
  parkingAid?: boolean;
  parkingAidCamera?: boolean;
  parkingAidSensorsRear?: boolean;
  parkingAidSensorsFront?: boolean;

  // Climate control
  climateControl?: boolean | string[];
  heatedSeats?: boolean;
  ventilatedSeats?: boolean;
  dualZoneClimate?: boolean;
  rearAC?: boolean;
  airQualitySensor?: boolean;
  airConditioning?: boolean | string;
  twoZoneClimateControl?: boolean;

  // Infotainment
  bluetooth?: boolean;
  appleCarPlay?: boolean;
  androidAuto?: boolean;
  premiumSound?: boolean;
  wirelessCharging?: boolean;
  usbPorts?: boolean;
  cdPlayer?: boolean;
  dvdPlayer?: boolean;
  rearSeatEntertainment?: boolean;
  androidCar?: boolean;
  onBoardComputer?: boolean;
  dabRadio?: boolean;
  handsFreeCalling?: boolean;
  integratedMusicStreaming?: boolean;
  radio?: boolean;
  soundSystem?: boolean;
  wifiHotspot?: boolean;
  navigationSystem?: string | boolean;

  // Lighting
  ledHeadlights?: boolean;
  adaptiveHeadlights?: boolean;
  ambientLighting?: boolean;
  fogLights?: boolean;
  automaticHighBeams?: boolean;
  ledDaytimeRunningLights?: boolean;
  daytimeRunningLights?: boolean;
  headlightCleaning?: boolean;
  lightSensor?: boolean;

  // Comfort and convenience
  keylessEntry?: boolean;
  sunroof?: boolean;
  spareKey?: boolean;
  remoteStart?: boolean;
  powerTailgate?: boolean;
  autoDimmingMirrors?: boolean;
  rainSensingWipers?: boolean;
  mountainDrivingAssistant?: boolean;
  electricalWindowLifter?: boolean;
  electricalSideMirrors?: boolean;
  electricSeats?: boolean;
  headUpDisplay?: boolean;
  leatherSteeringWheel?: boolean;
  lumbarSupport?: boolean;
  multifunctionalSteeringWheel?: boolean;
  rainSensor?: boolean;
  automaticStartStop?: boolean;
  automaticDazzlingInteriorMirrors?: boolean;
  switchingRockers?: boolean;
  armrest?: boolean;
  voiceControl?: boolean;
  touchscreen?: boolean;
  aluminumRims?: boolean;
  luggageCompartmentSeparation?: boolean;
  summerTires?: boolean;
  powerSteering?: boolean;

  // Motorcycle specific
  startType?: string;
  coolingSystem?: string;
  frameType?: string;
  frontSuspension?: string[];
  rearSuspension?: string[];
  riderAids?: string[];
  electronics?: string[];
  seatHeight?: number;
  handlebarType?: string;
  storageOptions?: string[];
  protectiveEquipment?: string[];
  importStatus?: string;
  serviceHistoryDetails?: string;

  // Allow additional dynamic fields
  [key: string]: any;
}

export interface CarDetails extends BaseVehicleDetails {
  vehicleType: VehicleType.CARS;
  // Required fields from BaseVehicleDetails
  transmissionType: string;
  serviceHistory: string | boolean;
  engineType: string;
  engineSize: string;
  enginePower: number;
  torque: number;
  horsepower: number;
  driveSystem: string;
  emissions: string;
  operatingWeight: number;
  payloadCapacity: number;
  cargoVolume: number;
  roofHeight: string;
  interiorLength: string;

  // Car specific required fields
  bodyType: string;
  bodyStyle: string;
  fuelType: string;
  driveType: string;

  // Optional fields from BaseVehicleDetails
  emissionClass?: string;
  fuelEfficiency?: string;
  fuelTankCapacity?: number | string;
  engineNumber?: string;
  engine?: string;
  wheelSize?: string;
  wheelType?: string;

  // Car specific optional fields
  safetyFeatures?: string[];
  comfortFeatures?: string[];
  entertainmentSystem?: string[];
  exteriorFeatures?: string[];
  performanceFeatures?: string[];
  warranty?: string;
  modifications?: string[];
  seatingCapacity?: number;
  trunkCapacity?: number;
  acceleration?: string;
  maxSpeed?: number;
  airbags?: number;
  numberOfOwners?: number;
  brakeType?: string;
  interiorFeatures?: string[];
  roofType?: string;
  suspensionType?: string;
  steeringType?: string;
  parkingAssist?: string[];
  climateControl?: string[];

  // Features from BaseVehicleDetails
  features: VehicleFeatures;
}

// Fields to omit from BaseVehicleDetails that we'll redefine in MotorcycleDetails
type OmittedBaseFields =
  | "seatType"
  | "startType"
  | "lighting"
  | "comfortFeatures"
  | "customParts"
  | "modifications"
  | "emissions";

export interface MotorcycleDetails
  extends Omit<BaseVehicleDetails, OmittedBaseFields> {
  vehicleType: VehicleType.MOTORCYCLES;
  motorcycleType?: string;
  engineType?: string;
  transmissionType?: string;
  engineConfiguration?: string;
  safetyFeatures?: string[];
  comfortFeatures?: string[];
  performanceFeatures?: string[];
  serviceHistory?: string | boolean;
  modifications?: string[];
  accessories?: string[];
  ridingStyle?: string;
  numberOfOwners?: number;
  engine?: string;
  engineSize?: string;
  enginePowerOutput?: string | number;
  powerOutput?: string | number; // Alias for enginePowerOutput
  fuelSystem?: string;
  coolingSystem?: string;
  frameType?: string;
  frontSuspension?: string[];
  rearSuspension?: string[];
  brakeSystem?: string[];
  startType?: string[];
  riderAids?: string[];
  electronics?: string[];
  lighting?: string[];
  seatType?: string[]; // Override from BaseVehicleDetails
  seatHeight?: number;
  handlebarType?: string;
  storageOptions?: string[];
  protectiveEquipment?: string[];
  customParts?: string[];
  customFeatures?: string[];
  emissions?: string;
  torque?: number;
  // Deprecated fields (kept for backward compatibility)
  suspensionType?: string;
  wheelSize?: string;
  tireType?: string;
  startingSystem?: string;
  instrumentCluster?: string[];
  lightingSystem?: string[];
}

// Union type for all possible vehicle details
export type VehicleDetails =
  | (BaseVehicleDetails & {
      vehicleType: VehicleType.CARS;
      // Cars-specific fields
      bodyType?: string;
      bodyStyle?: string;
      // ... other car-specific fields
    })
  | (BaseVehicleDetails & {
      vehicleType: VehicleType.MOTORCYCLES;
      // Motorcycle-specific fields
      motorcycleType?: string;
      // ... other motorcycle-specific fields
    });

export interface BaseRealEstateDetails {
  propertyType: PropertyType;
  area?: number;
  furnished?: boolean;
  features: string[];
  condition: Condition;
  utilities?: string[] | boolean;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
}

export interface Category {
  mainCategory: ListingCategory;
  subCategory: string;
}

export interface LocationMeta {
  lat: number;
  lng: number;
  placeId?: string;
  bounds?: [number, number, number, number]; // [south, west, north, east]
}

export interface Listing {
  id?: string;
  title: string;
  description: string;
  price: number;
  category: {
    mainCategory: ListingCategory;
    subCategory: VehicleType | PropertyType;
  };
  location: string;
  latitude: number;
  longitude: number;
  locationMeta?: LocationMeta;
  images: Array<string | File>;
  image?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  userId?: string;
  details: ListingDetails;
  listingAction?: ListingAction;
  status?: ListingStatus;
  seller?: {
    id: string;
    username: string;
    profilePicture: string | null;
    allowMessaging: boolean;
    privateProfile: boolean;
  };
}

export interface ListingUpdateInput {
  title: string;
  description: string;
  price: number;
  location: string;
  latitude: number;
  longitude: number;
  category: Category;
  details?: {
    vehicles?: Record<string, string | number | boolean | string[]>;
    realEstate?: Record<string, string | number | boolean | string[]>;
  };
  status?: ListingStatus;
}

export interface ListingResponse {
  success: boolean;
  data?: Listing;
  message?: string;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore?: boolean;
}

export interface UserListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Base form state with all fields optional for form handling
export interface BaseFormState {
  title?: string;
  description?: string;
  price?: number | string;
  location?: string;
  category?: {
    mainCategory: ListingCategory;
    subCategory: VehicleType | PropertyType;
  };
  details?: {
    vehicles?: VehicleDetails;
    realEstate?: RealEstateDetails;
  };
  images?: Array<string | File>;
  features?: string[];
  listingAction?: ListingAction;
  locationMeta?: LocationMeta;
  latitude?: number;
  longitude?: number;
}

// Complete form state with required fields for final submission
export interface FormState
  extends Required<Omit<BaseFormState, "features" | "listingAction">> {
  features?: string[];
  listingAction?: ListingAction;
}

export type CategoryFilter = "ALL" | "VEHICLES" | "REAL_ESTATE";

export interface ListingParams {
  category: {
    mainCategory: ListingCategory;
    subCategory?: string;
  };
  vehicleDetails?: {
    make?: string;
    model?: string;
  };
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  preview?: boolean;
  forceRefresh?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

// Extended listing interface to include savedBy
export interface ExtendedListing extends Listing {
  savedBy?: Array<{ id: string }>;
}

interface FeatureItem {
  name: string;
  label: string;
  type: "toggle" | "checkbox";
}

interface FeatureGroup {
  label: string;
  features: FeatureItem[];
}

interface FeatureGroups {
  [key: string]: FeatureGroup;
}

// New RealEstateDetails interface based on Prisma schema
export interface RealEstateDetails {
  id: string;
  propertyType: PropertyType;
  condition?: Condition;
  listingId: string;
  constructionType?: string;
  features: string[];
  parking?: string;
  accessibilityFeatures: string[];
  balcony?: boolean;
  buildingAmenities: string[];
  cooling?: string;
  elevator?: boolean;
  energyRating?: string;
  exposureDirection: string[];
  fireSafety: string[];
  floor?: number;
  flooringType?: string;
  furnished?: string;
  livingArea?: number;
  heating?: string;
  internetIncluded?: boolean;
  parkingType?: string;
  petPolicy?: string;
  renovationHistory?: string;
  securityFeatures: string[];
  storage?: boolean;
  storageType: string[];
  totalFloors?: number;
  utilities: string[];
  view?: string;
  windowType?: string;
  attic?: string;
  basement?: string;
  buildable?: string;
  buildingRestrictions?: string;
  elevation?: number;
  environmentalFeatures?: string;
  flooringTypes: string[];
  naturalFeatures?: string;
  parcelNumber?: string;
  permitsInPlace?: string;
  soilTypes: string[];
  topography: string[];
  waterFeatures?: string;
  bedrooms?: number;
  bathrooms?: number;
  size: number;
  yearBuilt: number;
  usageType?: string;
  houseDetails?: HouseDetails;
  apartmentDetails?: ApartmentDetails;
  condoDetails?: CondoDetails;
  landDetails?: LandDetails;
  commercialDetails?: CommercialDetails;
  otherDetails?: OtherDetails;
}

// Update ListingDetails and FormState to use the new RealEstateDetails interface
export interface ListingDetails {
  vehicles?: VehicleDetails;
  realEstate?: RealEstateDetails;
}
