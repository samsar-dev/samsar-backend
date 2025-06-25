export const vanEssentialFields = [
  "color",
  "interiorColor",
  "condition",
  "vanType",
  "transmissionType",
  "mileage",
  "fuelType",
  "engineType",
  "cargoVolume",
  "payloadCapacity",
];

export const vanAdvancedFields = [
  "previousOwners",
  "registrationStatus",
  "serviceHistory",
  "engine",
  "horsepower",
  "torque",
  "roofHeight",
  "loadingFeatures",
  "refrigeration",
  "temperatureRange",
  "interiorHeight",
  "interiorLength",
  "emissions",
  "warranty",
  "seatingConfiguration",
];

export const vanFieldNames = [...vanEssentialFields, ...vanAdvancedFields];
