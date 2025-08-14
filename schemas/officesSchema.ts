// Essential fields (required section)
export const officesEssentialFields = [
  "condition",
  "totalArea",
  "floor",
  "totalFloors",
  "parking",
  "officeType",
  "meetingRooms",
];

// Advanced fields (optional section)
export const officesAdvancedFields = [
  "size",
  "constructionType",
  "features",
  "accessibilityFeatures",
  "buildingAmenities",
  "cooling",
  "heating",
  "elevator",
  "energyRating",
  "exposureDirection",
  "fireSafety",
  "flooringType",
  "internetIncluded",
  "parkingType",
  "renovationHistory",
  "securityFeatures",
  "storage",
  "storageType",
  "utilities",
  "view",
  "windowType",
  "yearBuilt",
];

// Technology and amenity feature fields
export const officesAmenityFields = [
  // Technology Features
  "highSpeedInternet",
  "conferenceRooms",
  "videoConferencing",
  "soundproofing",
  "smartBuilding",
  
  // Comfort Features
  "airConditioning",
  "centralHeating",
  "naturalLight",
  "balcony",
  "terrace",
  
  // Business Features
  "reception",
  "waitingArea",
  "kitchenette",
  "breakRoom",
  "mailServices",
  
  // Security Features
  "securitySystem",
  "accessControl",
  "cctv",
  "securityGuard",
  
  // Accessibility
  "wheelchairAccess",
  "disabledParking",
  "disabledToilets",
];

// All offices fields combined
export const allOfficesFields = [
  ...officesEssentialFields,
  ...officesAdvancedFields,
  ...officesAmenityFields,
];
