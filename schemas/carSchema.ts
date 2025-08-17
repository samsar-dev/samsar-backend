// Essential fields (required section) - Updated for Flutter compatibility
export const carEssentialFields = [
  "color",
  "exteriorColor", // Flutter field
  "interiorColor",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
];

// Advanced fields (optional section) - Updated for Flutter compatibility
export const carAdvancedFields = [
  "bodyType", // Flutter field (was bodyStyle)
  "driveType",
  "engineNumber",
  "serviceHistory",
  "accidental", // Flutter field (was accidentFree)
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "doors",
  "seats",
  "airbags",
  "noOfAirbags", // Flutter field
  "horsepower",
  "torque",
  "roofType",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
  "navigationSystem",
];

// Feature fields mapped from Flutter selectedFeatures array
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

// Legacy safety fields for backward compatibility
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

// All car fields combined - Updated for Flutter compatibility
export const allCarFields = [
  ...carEssentialFields,
  ...carAdvancedFields,
  ...carFeatureFields,
  ...carSafetyFields,
];
