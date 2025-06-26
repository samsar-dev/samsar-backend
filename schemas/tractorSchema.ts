export const tractorEssentialFields = [
  "color",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "hours",
  "horsepower",
  "driveSystem",
];

export const tractorAdvancedFields = [
  // Engine & Performance
  "engineSpecs",
  "engineManufacturer",
  "engineModel",
  "displacement",
  "cylinders",
  "torque",
  "emissions",

  // Hydraulics & PTO
  "hydraulicSystem",
  "hydraulicFlow",
  "hydraulicOutlets",
  "ptoSystem",
  "ptoHorsepower",

  // Implements & Attachments
  "frontAttachments",
  "rearAttachments",
  "threePointHitch",
  "hitchCapacity",

  // Maintenance & Documentation
  "serviceHistory",
  "warranty",
  "modifications",
  "electricalSystem",
];

export const tractorFieldNames = [
  ...tractorEssentialFields,
  ...tractorAdvancedFields,
];
