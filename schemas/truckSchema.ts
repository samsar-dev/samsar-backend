export const truckEssentialFields = [
  "color",
  "condition",
  "truckType",
  "transmissionType",
  "mileage",
  "fuelType",
  "cabType",
  "previousOwners",
  "registrationStatus",
];

export const truckAdvancedFields = [
  "vin",
  "engineNumber",
  "registrationExpiry",
  "insuranceType",
  "upholsteryMaterial",
  "tireCondition",
  "importStatus",
  "accidentFree",
  "serviceHistory",
  "bedLength",
  "emissions",
  "warranty",
  "suspensionType",
  "seatConfiguration",
];

export const truckFieldNames = [
  ...truckEssentialFields,
  ...truckAdvancedFields,
];
