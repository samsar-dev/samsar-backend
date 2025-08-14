// Essential fields (required section)
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

// Advanced fields (optional section)
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

// Safety and operational feature fields
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

// All commercials fields combined
export const allCommercialsFields = [
  ...commercialsEssentialFields,
  ...commercialsAdvancedFields,
  ...commercialsSafetyFields,
];
