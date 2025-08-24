import { PropertyType, VehicleType } from "../types/enums.js";

// ===== VEHICLE SCHEMAS =====

// Car Schema
export const carEssentialFields = [
  "color",
  "exteriorColor",  
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
];

export const carAdvancedFields = [
  'bodyType',
  'driveType',
  'fuelType',
  'transmissionType',
  'mileage',
  'exteriorColor',
  'previousOwners',
  'accidental',
  'serviceHistory',
  'importStatus',
  "engineNumber",
  "serviceHistory",
  "accidental",
  "importStatus",
  "doors",
  "seats",
  "airbags",
  "noOfAirbags",
  "torque",
  "roofType",
  "customsCleared",
  "serviceHistoryDetails",
  "additionalNotes",
  "navigationSystem",
];

export const carFeatureFields = [
  // Safety features
  "abs",
  "tractionControl",
  "laneAssist",
  "blindSpotMonitor",
  "cruiseControl",
  
  // Parking & Camera
  "parkingSensors",
  "parkingSensor",
  "backupCamera",
  "rearCamera",
  "camera360",
  
  // Lighting
  "ledHeadlights",
  "fogLights",
  
  // Connectivity
  "bluetooth",
  "appleCarplay",
  "androidAuto",
  "wirelessCharging",
  "usbPorts",
  
  // Comfort
  "sunroof",
  "panoramicRoof",
  "heatedSeats",
  "cooledSeats",
  "leatherSeats",
  "electricSeats",
  
  // Security & Convenience
  "centralLocking",
  "powerSteering",
  "immobilizer",
  "alarmSystem",
  "alloyWheels",
];

export const carSafetyFields = [
  // Airbags
  "frontAirbags",
  "sideAirbags",
  "curtainAirbags",
  "kneeAirbags",
  // Driver Assistance
  "cruiseControl",
  "adaptiveCruiseControl",
  "laneDepartureWarning",
  "laneKeepAssist",
  "automaticEmergencyBraking",
];

export const allCarFields = [
  ...carEssentialFields,
  ...carAdvancedFields,
  ...carFeatureFields,
  ...carSafetyFields,
];

// Motorcycle Schema
export const motorcycleEssentialFields = [
  "color",
  "exteriorColor",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
];

export const motorcycleAdvancedFields = [
  'bodyType',
  'driveType',
  'engineSize',
  'fuelType',
  'transmissionType',
  'mileage',
  'exteriorColor',
  'previousOwners',
  'accidental',
  'serviceHistory',
  'importStatus',
  // Performance & Technical
  "powerOutput",
  "torque",
  "fuelSystem",
  "coolingSystem",

  // Chassis & Suspension
  "frameType",
  "frontSuspension",
  "rearSuspension",
  "wheelType",

  // Rider Aids & Electronics
  "startType",
  "riderAids",
  "electronics",
  "lighting",

  // Comfort & Ergonomics
  "seatType",
  "seatHeight",
  "handlebarType",
  "comfortFeatures",

  // Storage & Accessories
  "storageOptions",
  "protectiveEquipment",
  "customParts",

  // Documentation & History
  "serviceHistory",
  "modifications",
  "warranty",
  "emissions",
];

export const motorcycleFieldNames = [
  ...motorcycleEssentialFields,
  ...motorcycleAdvancedFields,
];

// Passenger Vehicles Schema
export const passengersEssentialFields = [
  "color",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
  "seatingCapacity",
  "bodyType",
];

export const passengersAdvancedFields = [
  'bodyType',
  'driveType',
  'fuelType',
  'transmissionType',
  'mileage',
  'exteriorColor',
  'previousOwners',
  'accidental',
  'serviceHistory',
  'importStatus',
  "driveType",
  "engineNumber",
  "serviceHistory",
  "accidentFree",
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "doors",
  "horsepower",
  "interiorLength",
  "seatingConfiguration",
  "temperatureRange",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
  "airConditioning",
  "entertainmentSystem",
];

export const passengersSafetyFields = [
  // Safety Features
  "abs",
  "airbags",
  "stabilityControl",
  "tractionControl",
  "frontAirbags",
  "sideAirbags",
  "curtainAirbags",
  
  // Comfort Features
  "powerSteering",
  "powerWindows",
  "centralLocking",
  "cruiseControl",
  "heatedSeats",
  "leatherSeats",
  "sunroof",
  
  // Technology Features
  "navigationSystem",
  "bluetooth",
  "usbPorts",
  "reverseCamera",
  "parkingSensors",
];

export const allPassengersFields = [
  ...passengersEssentialFields,
  ...passengersAdvancedFields,
  ...passengersSafetyFields,
];

// Construction Vehicles Schema
export const constructionsEssentialFields = [
  "color",
  "condition",
  "operatingWeight",
  "maxLiftCapacity",
  "workingHeight",
  "horsepower",
  "operatingHours",
  "previousOwners",
];

export const constructionsAdvancedFields = [
  "engineNumber",
  "serviceHistory",
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "bucketCapacity",
  "hydraulicSystem",
  "attachments",
  "cabType",
  "lastServiceDate",
  "nextServiceDue",
  "certifications",
  "trackType",
  "tireType",
  "driveType",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
];

export const constructionsSafetyFields = [
  // Cab Features
  "airConditioning",
  "heater",
  "radioSystem",
  "workLights",
  
  // Safety Features
  "rolloverProtection",
  "fallingObjectProtection",
  "emergencyStop",
  "backupCamera",
  "proximityAlarms",
  "backupAlarm",
  
  // Technology Features
  "gpsTracking",
];

export const allConstructionsFields = [
  ...constructionsEssentialFields,
  ...constructionsAdvancedFields,
  ...constructionsSafetyFields,
];

// Commercial Transport Schema
export const commercialsEssentialFields = [
  "color",
  "condition",
  "payloadCapacity",
  "towingCapacity",
  "cargoVolume",
  "grossVehicleWeight",
  "horsepower",
  "bodyType",
  "previousOwners",
];

export const commercialsAdvancedFields = [
  "engineNumber",
  "serviceHistory",
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "driveType",
  "cargoAreaLength",
  "cargoAreaWidth",
  "cargoAreaHeight",
  "loadingDockHeight",
  "operatingHours",
  "lastServiceDate",
  "nextServiceDue",
  "commercialLicense",
  "emissionStandard",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
];

export const commercialsSafetyFields = [
  // Operational Features
  "refrigeration",
  "liftGate",
  "sleepingCab",
  "airConditioning",
  "powerSteering",
  
  // Brake Systems
  "abs",
  "airBrakes",
  "hydraulicBrakes",
  
  // Cargo Access
  "sideAccess",
  "rearAccess",
  "topAccess",
  
  // Technology Features
  "gpsTracking",
  "fleetManagement",
  "reverseCamera",
  "dashCamera",
  "bluetoothConnectivity",
  
  // Safety Features
  "stabilityControl",
  "tractionControl",
  "rolloverProtection",
  "collisionAvoidance",
  "blindSpotMonitoring",
  
  // Certification
  "inspectionCertificate",
];

export const allCommercialsFields = [
  ...commercialsEssentialFields,
  ...commercialsAdvancedFields,
  ...commercialsSafetyFields,
];

// ===== REAL ESTATE SCHEMAS =====

// House Schema
export const houseEssentialFields = [
  "condition",
  "livingArea",
  "halfBathrooms",
  "stories",
  "parking",
  "parkingSpaces",
  "constructionType",
];

export const houseAdvancedFields = [
  // HVAC & Energy
  "heating",
  "cooling",
  "energyFeatures",
  "energyRating",

  // Interior Features
  "basement",
  "basementFeatures",
  "attic",
  "flooringTypes",
  "windowFeatures",
  "kitchenFeatures",
  "bathroomFeatures",

  // Exterior & Structure
  "roofType",
  "roofAge",
  "foundation",
  "exteriorFeatures",
  "outdoorFeatures",
  "landscaping",

  // Systems & Utilities
  "waterSystem",
  "sewerSystem",
  "utilities",

  // Smart Home & Security
  "smartHomeFeatures",
  "securityFeatures",

  // Community & HOA
  "communityFeatures",
  "hoaFeatures",

  // Additional Features
  "furnished",
  "appliances",
  "petFeatures",
  "accessibility",
  "storageFeatures",
];

export const houseFieldNames = [
  ...houseEssentialFields,
  ...houseAdvancedFields,
];

// Apartment Schema
export const apartmentEssentialFields = [
  "condition",
  "livingArea",
  "halfBathrooms",
  "floor",
  "totalFloors",
  "parking",
  "parkingSpaces",
];

export const apartmentAdvancedFields = [
  "bedrooms",
  "bathrooms",
  "floor",
  "balconies",
  "parking",
  "furnishing",
  "orientation",
  "view",
  "additionalNotes",
];

export const apartmentFieldNames = [
  ...apartmentEssentialFields,
  ...apartmentAdvancedFields,
];

// Villa Schema
export const villaEssentialFields = [
  "condition",
  "livingArea",
  "halfBathrooms",
  "stories",
  "parking",
  "parkingSpaces",
  "lotSize",
  "constructionType",
];

export const villaAdvancedFields = [
  // Luxury Features
  "poolFeatures",
  "gardenFeatures",
  "outdoorEntertainment",
  "guestAccommodation",
  "staffQuarters",
  
  // Interior Luxury
  "masterSuite",
  "walkInClosets",
  "homeOffice",
  "library",
  "wineStorage",
  "homeTheater",
  
  // Exterior & Grounds
  "landscaping",
  "waterFeatures",
  "outdoorKitchen",
  "sportsFeatures",
  "gateAccess",
  
  // Systems & Technology
  "smartHomeFeatures",
  "securityFeatures",
  "audioVisual",
  "climateControl",
  
  // Additional Amenities
  "elevatorAccess",
  "serviceAreas",
  "storageFeatures",
  "maintenanceFeatures",
];

export const villaFieldNames = [
  ...villaEssentialFields,
  ...villaAdvancedFields,
];

// Land Schema
export const landEssentialFields = [
  "landType",
  "zoning",
  "utilities",
  "access",
  "topography",
];

export const landAdvancedFields = [
  "plotSize",
  "zoning",
  "roadAccess",
  "utilities",
  "additionalNotes",
];

export const landFieldNames = [
  ...landEssentialFields,
  ...landAdvancedFields,
];

// Commercial/Office Schema
export const officesEssentialFields = [
  "condition",
  "totalArea",
  "floor",
  "totalFloors",
  "parking",
  "parkingSpaces",
  "officeType",
];

export const officesAdvancedFields = [
  "officeType",
  "floorArea",
  "meetingRooms",
  "floor",
  "parking",
  "furnishing",
  "hvac",
  "additionalNotes",
  
  // Office Layout
  "openPlan",
  "privateOffices",
  "conferenceRooms",
  "reception",
  "breakRoom",
  
  // Technology & Infrastructure
  "internetSpeed",
  "phoneSystem",
  "securitySystem",
  "accessControl",
  "hvacSystem",
  
  // Amenities
  "buildingAmenities",
  "nearbyAmenities",
  "publicTransport",
  "restaurantOptions",
  
  // Commercial Features
  "leaseTerm",
  "operatingExpenses",
  "utilities",
  "signageRights",
];

export const allOfficesFields = [
  ...officesEssentialFields,
  ...officesAdvancedFields,
];

// Store Schema
export const storeEssentialFields = [
  "condition",
  "totalArea",
  "floor",
  "parking",
  "parkingSpaces",
  "storeType",
  "frontage",
];

export const storeAdvancedFields = [
  // Retail Features
  "displayWindows",
  "storageArea",
  "customerArea",
  "cashierArea",
  "fittingRooms",
  
  // Location & Visibility
  "footTraffic",
  "visibility",
  "cornerLocation",
  "signageOptions",
  "neighboringBusinesses",
  
  // Infrastructure
  "loadingAccess",
  "securityFeatures",
  "hvacSystem",
  "lighting",
  "flooring",
  
  // Commercial Terms
  "leaseTerm",
  "operatingHours",
  "utilities",
  "maintenanceResponsibility",
];

export const storeFieldNames = [
  ...storeEssentialFields,
  ...storeAdvancedFields,
];

// ===== SCHEMA MAP =====

type SchemaMap = {
  [key: string]: string[];
};

export const schemaMap: SchemaMap = {
  // Vehicle types
  [VehicleType.CARS]: allCarFields,
  [VehicleType.MOTORCYCLES]: motorcycleFieldNames,
  [VehicleType.PASSENGER_VEHICLES]: allPassengersFields,
  [VehicleType.CONSTRUCTION_VEHICLES]: allConstructionsFields,
  [VehicleType.COMMERCIAL_TRANSPORT]: allCommercialsFields,

  // Property types
  [PropertyType.HOUSE]: houseFieldNames,
  [PropertyType.APARTMENT]: apartmentFieldNames,
  [PropertyType.VILLA]: villaFieldNames,
  [PropertyType.LAND]: landFieldNames,
  [PropertyType.COMMERCIAL]: allOfficesFields,
  [PropertyType.STORE]: storeFieldNames,
};

// No need for re-exports since all are already exported above
