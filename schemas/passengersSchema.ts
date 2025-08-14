// Essential fields (required section)
export const passengersEssentialFields = [
  "color",
  "condition",
  "transmissionType",
  "mileage",
  "fuelType",
  "previousOwners",
  "seatingCapacity",
  "bodyType",
];

// Advanced fields (optional section)
export const passengersAdvancedFields = [
  "driveType",
  "engineNumber",
  "serviceHistory",
  "accidentFree",
  "importStatus",
  "registrationExpiry",
  "warranty",
  "engineSize",
  "doors",
  "horsepower",
  "interiorLength",
  "seatingConfiguration",
  "temperatureRange",
  "customsCleared",
  "warrantyPeriod",
  "serviceHistoryDetails",
  "additionalNotes",
  "airConditioning",
  "entertainmentSystem",
];

// Safety and comfort feature fields
export const passengersSafetyFields = [
  // Safety Features
  "abs",
  "airbags",
  "stabilityControl",
  "tractionControl",
  "frontAirbags",
  "sideAirbags",
  "curtainAirbags",
  
  // Comfort Features
  "powerSteering",
  "powerWindows",
  "centralLocking",
  "cruiseControl",
  "heatedSeats",
  "leatherSeats",
  "sunroof",
  
  // Technology Features
  "navigationSystem",
  "bluetooth",
  "usbPorts",
  "reverseCamera",
  "parkingSensors",
];

// All passengers fields combined
export const allPassengersFields = [
  ...passengersEssentialFields,
  ...passengersAdvancedFields,
  ...passengersSafetyFields,
];
