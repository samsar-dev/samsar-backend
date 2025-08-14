// Essential fields (required section)
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

// Advanced fields (optional section)
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

// Safety and operational feature fields
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

// All constructions fields combined
export const allConstructionsFields = [
  ...constructionsEssentialFields,
  ...constructionsAdvancedFields,
  ...constructionsSafetyFields,
];
