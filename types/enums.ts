// 🌟 Listing Categories
export enum ListingCategory {
  VEHICLES = "VEHICLES",
  REAL_ESTATE = "REAL_ESTATE",
}

// 🌟 Vehicle Types
export enum VehicleType {
  CARS = "CARS",
  MOTORCYCLES = "MOTORCYCLES",
  VANS = "VANS",
  TRUCKS = "TRUCKS",
  BUSES = "BUSES",
  TRACTORS = "TRACTORS",
  PASSENGER_VEHICLES = "PASSENGER_VEHICLES",
  COMMERCIAL_TRANSPORT = "COMMERCIAL_TRANSPORT",
  CONSTRUCTION_VEHICLES = "CONSTRUCTION_VEHICLES",
  STORE = "STORE",
}

// 🌟 Property Types
export enum PropertyType {
  HOUSE = "HOUSE",
  APARTMENT = "APARTMENT",
  LAND = "LAND",
  OFFICE = "OFFICE",
  VILLA = "VILLA",
}

// 🌟 Vehicle Details
export enum FuelType {
  GASOLINE = "GASOLINE",
  DIESEL = "DIESEL",
  ELECTRIC = "ELECTRIC",
  HYBRID = "HYBRID",
  PLUGIN_HYBRID = "PLUGIN_HYBRID",
  LPG = "LPG",
  CNG = "CNG",
  OTHER = "OTHER",
}

export enum TransmissionType {
  AUTOMATIC = "AUTOMATIC",
  MANUAL = "MANUAL",
  AUTOMATIC_MANUAL = "AUTOMATIC_MANUAL",
  OTHER = "OTHER"
}

export enum Condition {
  NEW = "NEW",
  LIKE_NEW = "LIKE_NEW",
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  NOT_WORKING = "NOT_WORKING"
}

// 🌟 Settings Related Enums
export enum LanguageCode {
  EN = "EN",
  AR = "AR",
}
// 🌟 Listing Status
export enum ListingStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SOLD = "SOLD",
  RENTED = "RENTED",
  PENDING = "PENDING",
}

// 🌟 Listing Action Types
export enum ListingAction {
  SALE = "SALE",
  RENT = "RENT",
  SEARCHING = "SEARCHING", // For wanted/searching listings
}

// 🌟 Report System Enums
export enum ReportType {
  USER = "USER",
  LISTING = "LISTING",
  MESSAGE = "MESSAGE",
  COMMENT = "COMMENT",
}

export enum ReportStatus {
  PENDING = "PENDING",
  INVESTIGATING = "INVESTIGATING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export enum ReportReason {
  SPAM = "SPAM",
  INAPPROPRIATE = "INAPPROPRIATE",
  MISLEADING = "MISLEADING",
  OFFENSIVE = "OFFENSIVE",
  HARASSMENT = "HARASSMENT",
  OTHER = "OTHER",
}

// 🌟 Notification Types
export enum NotificationType {
  NEW_MESSAGE = "NEW_MESSAGE",
  LISTING_INTEREST = "LISTING_INTEREST",
  PRICE_UPDATE = "PRICE_UPDATE",
  LISTING_SOLD = "LISTING_SOLD",
  SYSTEM_NOTICE = "SYSTEM_NOTICE",
  LISTING_CREATED = "LISTING_CREATED",
  NEW_LISTING_MATCH = "NEW_LISTING_MATCH",
  ACCOUNT_WARNING = "ACCOUNT_WARNING",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
}
