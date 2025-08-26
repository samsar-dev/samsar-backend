import {
  Condition,
  ListingStatus,
  TransmissionType,
  FuelType,
} from "@prisma/client";

// Shared types that don't fit into a specific category
export * from "./auth.js";

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
  listingAction?: "sale" | "rent" | "searching";
}

export interface ListingUpdateInput
  extends Partial<Omit<ListingCreateInput, "id">> {}

// Enums
export enum ListingCategory {
  VEHICLES = "VEHICLES",
  REAL_ESTATE = "REAL_ESTATE",
}

export enum VehicleType {
  CARS = "CARS",
  MOTORCYCLES = "MOTORCYCLES",
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
}

// Details types
export interface ListingDetails {
  vehicles?: VehicleDetails;
  realEstate?: RealEstateDetails;
}

// Input details - for direct field input based on category
export interface VehicleDetailsInput extends VehicleDetails {
  // Direct vehicle fields without nesting
}

export interface RealEstateDetailsInput extends RealEstateDetails {
  // Direct real estate fields without nesting
}

export interface VehicleDetails {
  vehicleType: VehicleType;
  make: string;
  model: string;
  year: number;
  mileage?: number;
  fuelType?: FuelType;
  transmissionType?: TransmissionType;
  color?: string;
  condition?: Condition;
  features?: string[];
  engine?: string;
  warranty?: string;
  serviceHistory?: string[];
  previousOwners?: number;
  registrationStatus?: string;
  horsepower?: number;
  torque?: number;
}

export interface RealEstateDetails {
  propertyType: PropertyType;
  size?: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
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
  views: number;
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
  listingAction?: "sale" | "rent" | "searching";
  status: ListingStatus;
  // Vehicle fields as individual properties
  make?: string;
  model?: string;
  year?: number;
  condition?: string;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  engineSize?: number;
  mileage?: number;
  exteriorColor?: string;
  sellerType?: string;
  accidental?: string;
  // Real Estate fields as individual properties
  totalArea?: number;
  yearBuilt?: number;
  furnishing?: string;
  floor?: number;
  totalFloors?: number;
}

// Listing with relations
export interface ListingWithRelations extends ListingBase {
  seller?: {
    id: string;
    username: string;
    profilePicture: string | null;
    allowMessaging: true;
    privateProfile: true;
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
