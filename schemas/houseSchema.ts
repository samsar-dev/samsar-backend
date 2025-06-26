export const houseEssentialFields = [
  "condition",
  "livingArea",
  "halfBathrooms",
  "stories",
  "parking",
  "parkingSpaces",
  "constructionType",
];

export const houseAdvancedFields = [
  // HVAC & Energy
  "heating",
  "cooling",
  "energyFeatures",
  "energyRating",

  // Interior Features
  "basement",
  "basementFeatures",
  "attic",
  "flooringTypes",
  "windowFeatures",
  "kitchenFeatures",
  "bathroomFeatures",

  // Exterior & Structure
  "roofType",
  "roofAge",
  "foundation",
  "exteriorFeatures",
  "outdoorFeatures",
  "landscaping",

  // Systems & Utilities
  "waterSystem",
  "sewerSystem",
  "utilities",

  // Smart Home & Security
  "smartHomeFeatures",
  "securityFeatures",

  // Community & HOA
  "communityFeatures",
  "hoaFeatures",

  // Additional Features
  "furnished",
  "appliances",
  "petFeatures",
  "accessibility",
  "storageFeatures",
];

export const houseFieldNames = [
  ...houseEssentialFields,
  ...houseAdvancedFields,
];
