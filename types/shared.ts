import { ListingStatus } from "@prisma/client";

// Shared types that don't fit into a specific category
export * from './auth.js';

// Listing types
export interface ListingCreateInput {
  title: string;
  description: string;
  price: number;
  category: {
    mainCategory: ListingCategory;
    subCategory: VehicleType | PropertyType;
  };
  location: string;
  images: string[];
  details: ListingDetails;
  listingAction?: "sell" | "rent";
}

export interface ListingUpdateInput
  extends Partial<Omit<ListingCreateInput, "id">> {}

// Enums
export enum ListingCategory {
  VEHICLES = "VEHICLES",
  REAL_ESTATE = "REAL_ESTATE",
}

export enum VehicleType {
  CAR = "CAR",
  TRUCK = "TRUCK",
  MOTORCYCLE = "MOTORCYCLE",
  RV = "RV",
  OTHER = "OTHER",
  TRACTOR = "TRACTOR",
}

export enum PropertyType {
  HOUSE = "HOUSE",
  APARTMENT = "APARTMENT",
  CONDO = "CONDO",
  LAND = "LAND",
  COMMERCIAL = "COMMERCIAL",
  OTHER = "OTHER",
}

// Location type
export interface Location {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

// Details types
export interface ListingDetails {
  vehicles?: VehicleDetails;
  realEstate?: RealEstateDetails;
}

export interface VehicleDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: string;
  mileage?: string;
  fuelType?: string;
  transmissionType?: string;
  color?: string;
  condition?: string;
  features?: string[];
  interiorColor?: string;
  engine?: string;
  warranty?: string | number;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  horsepower?: number;
  torque?: number;
  // Bus-specific fields
  seatingCapacity?: number;
  luggageSpace?: number;
  comfortFeatures?: string[];
  seatType?: string;
  seatMaterial?: string;
  wheelchairAccessible?: boolean;
  wheelchairLift?: boolean;
  accessibilityFeatures?: string[];
  emergencyExits?: number;
  safetyFeatures?: string[];
  seatBelts?: string;
  emissionStandard?: string;
  enginePower?: string;
  engineTorque?: string;
  suspension?: string[];
  brakeSystem?: string[];
  entertainmentFeatures?: string[];
  navigationSystem?: string;
  communicationSystem?: string[];
  maintenanceHistory?: string;
  lastInspectionDate?: string;
  certifications?: string[];
  luggageCompartments?: number;
  luggageRacks?: boolean;
  fuelTankCapacity?: number;
  // Tractor-specific fields
  hours?: number;
  driveSystem?: string;
  engineSpecs?: string[];
  engineManufacturer?: string;
  engineModel?: string;
  displacement?: string;
  cylinders?: string;
  emissions?: string;
  hydraulicSystem?: string;
  hydraulicFlow?: number;
  hydraulicOutlets?: string[];
  ptoSystem?: string[];
  ptoHorsepower?: number;
  frontAttachments?: string[];
  rearAttachments?: string[];
  threePointHitch?: string;
  hitchCapacity?: number;
  cabFeatures?: string[];
  seating?: string[];
  steeringSystem?: string[];
  lighting?: string[];
  precisionFarming?: string[];
  monitor?: string[];
  electricalSystem?: string;
  modifications?: string;
  // Legacy tractor fields
  attachments?: string[];
  tires?: string;
  implementType?: string;
  width?: number;
  weight?: number;
  maxLoadCapacity?: number;
  wheelbase?: number;
  turningRadius?: number;
  powerTakeOff?: boolean;
  frontLoader?: boolean;
  rearLoader?: boolean;
  fuelEfficiency?: string;
}

export interface RealEstateDetails {
  propertyType: PropertyType;
  size?: string;
  yearBuilt?: string;
  bedrooms?: string;
  bathrooms?: string;
  condition?: string;
  features?: string[];
  floor?: number;
  totalFloors?: number;
  elevator?: boolean;
  balcony?: boolean;
  storage?: boolean;
  heating?: string;
  cooling?: string;
  buildingAmenities?: string[];
  energyRating?: string;
  furnished?: string;
  petPolicy?: string;
  view?: string;
  securityFeatures?: string[];
  fireSafety?: string[];
  flooringType?: string;
  internetIncluded?: boolean;
  windowType?: string;
  accessibilityFeatures?: string[];
  renovationHistory?: string;
  parkingType?: string;
  utilities?: string[];
  exposureDirection?: string[];
  storageType?: string[];
  parking?: string;
  constructionType?: string;
}

// Base listing type
export interface ListingBase {
  id: string;
  title: string;
  description: string;
  price: number;
  category: {
    mainCategory: ListingCategory;
    subCategory: VehicleType | PropertyType;
  };
  location: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  details: ListingDetails;
  listingAction?: "sell" | "rent";
  status: ListingStatus;
}

// Listing with relations
export interface ListingWithRelations extends ListingBase {
  seller?: {
    id: string;
    username: string;
    profilePicture: string | null;
  };
  savedBy?: {
    id: string;
    userId: string;
  }[];
}

// API response types
export interface APIResponse<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  status: number;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> extends APIResponse<PaginatedData<T>> {}
