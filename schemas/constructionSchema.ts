export const constructionEssentialFields = [
  "condition",
  "equipmentType",
  "operatingWeight",
  "enginePower",
  "previousOwners",
  "registrationStatus",
  "serviceHistory",
  "hoursUsed",
];

export const constructionAdvancedFields = [
  "maxLiftingCapacity",
  "maintenanceHistory",
  "hydraulicSystem",
  "emissions",
  "operatorCabType",
  "tireType",
  "warranty",
  "ptoType",
  "hydraulicOutlets",
  "implementCompatibility",
];

export const constructionFieldNames = [
  ...constructionEssentialFields,
  ...constructionAdvancedFields,
];
