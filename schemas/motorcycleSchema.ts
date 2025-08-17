export const motorcycleEssentialFields = [
  "color",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "engineSize",
  "engineType",
  "previousOwners",
  "registrationStatus",
  "brakeSystem",
];

export const motorcycleAdvancedFields = [
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
