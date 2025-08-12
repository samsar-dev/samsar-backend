// Essential fields (required section)
export const carEssentialFields = [
  "color",
  "interiorColor",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
];

// Advanced fields (optional section)
export const carAdvancedFields = [
  "bodyStyle",
  "driveType",
  "engineNumber",
  "serviceHistory",
  "accidentFree",
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "doors",
  "seats",
  "horsepower",
  "torque",
  "roofType",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
  "navigationSystem",
];

// Safety feature fields (from featureGroup)
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

// All car fields combined
export const allCarFields = [
  ...carEssentialFields,
  ...carAdvancedFields,
  ...carSafetyFields,
];
