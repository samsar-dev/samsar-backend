export declare enum ListingCategory {
  VEHICLES = "vehicles",
  REAL_ESTATE = "realEstate",
}
export declare enum VehicleType {
  CAR = "CAR",
  MOTORCYCLE = "MOTORCYCLE",
}
export declare enum PropertyType {
  HOUSE = "HOUSE",
  APARTMENT = "APARTMENT",
  CONDO = "CONDO",
  LAND = "LAND",
  COMMERCIAL = "COMMERCIAL",
  OTHER = "OTHER",
}
export declare enum FuelType {
  GASOLINE = "gasoline",
  DIESEL = "diesel",
  ELECTRIC = "electric",
  HYBRID = "hybrid",
  PLUGIN_HYBRID = "pluginHybrid",
  LPG = "lpg",
  CNG = "cng",
  OTHER = "other",
}
export declare enum TransmissionType {
  AUTOMATIC = "automatic",
  MANUAL = "manual",
  SEMI_AUTOMATIC = "semiAutomatic",
  CONTINUOUSLY_VARIABLE = "cvt",
  DUAL_CLUTCH = "dualClutch",
  OTHER = "other",
}
export declare enum Condition {
  NEW = "new",
  LIKE_NEW = "likeNew",
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  SALVAGE = "salvage",
}
export declare enum LanguageCode {
  EN = "en",
  ES = "es",
  FR = "fr",
  DE = "de",
  AR = "ar",
}
export declare enum ListingStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SOLD = "sold",
  RENTED = "rented",
  PENDING = "pending",
}
export declare enum ListingAction {
  SALE = "SALE",
  RENT = "RENT",
}
export declare enum ReportType {
  USER = "user",
  LISTING = "listing",
  MESSAGE = "message",
  COMMENT = "comment",
}
export declare enum ReportStatus {
  PENDING = "pending",
  INVESTIGATING = "investigating",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}
export declare enum ReportReason {
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  MISLEADING = "misleading",
  OFFENSIVE = "offensive",
  HARASSMENT = "harassment",
  OTHER = "other",
}
export declare enum NotificationType {
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
