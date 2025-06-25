// Essential fields (required section)
export const busEssentialFields = [
  "color",
  "interiorColor",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
  "busType",
  "registrationStatus",
  "seatingCapacity",
  "engine",
  "serviceHistory", // although optional, it's in "essential"
];

// Advanced fields (optional section)
export const busAdvancedFields = [
  // Seating/Safety
  "seatBelts",

  // Entertainment & Technology
  "entertainmentFeatures",
  "navigationSystem",
  "communicationSystem",

  // Maintenance & Documentation
  "maintenanceHistory",
  "lastInspectionDate",
  "warranty",
  "certifications",

  // Storage & Capacity
  "luggageCompartments",
  "luggageRacks",
  "fuelTankCapacity",

  // Technical Specifications
  "emissionStandard",
  "enginePower",
  "engineTorque",
  "suspension",
  "brakeSystem",

  // Accessibility
  "wheelchairAccessible",
  "wheelchairLift",
  "seatType",
  "seatMaterial",
];

// Combined field names
export const busFieldNames = [...busEssentialFields, ...busAdvancedFields];
