export const landEssentialFields = [
  "condition",
  "zoning",
  "utilities",
  "accessRoad",
  "parcelNumber",
];

export const landAdvancedFields = [
  "topography",
  "elevation",
  "waterFeatures",
  "naturalFeatures",
  "buildable",
  "buildingRestrictions",
  "permitsInPlace",
  "environmentalFeatures",
  "soilTypes",
  "floodZone",
  "mineralRights",
  "waterRights",
  "easements",
  "boundaryFeatures",
  "fencingType",
  "irrigation",
  "improvements",
  "documentsAvailable",
  "previousUse",
  "propertyHistory",
];

export const landFieldNames = [...landEssentialFields, ...landAdvancedFields];
