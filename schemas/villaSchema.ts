export const villaFields = [
  // Basic Information
  { name: 'propertyType', type: 'text', required: true },
  { name: 'bedrooms', type: 'number', required: false },
  { name: 'bathrooms', type: 'number', required: false },
  { name: 'totalArea', type: 'number', required: false },
  { name: 'floor', type: 'number', required: false },
  { name: 'parking', type: 'text', required: false },
  
  // Villa-specific Features
  { name: 'gardenArea', type: 'text', required: false },
  { name: 'pool', type: 'text', required: false },
  { name: 'balcony', type: 'number', required: false },
  { name: 'furnishing', type: 'text', required: false },
  { name: 'heating', type: 'text', required: false },
  { name: 'cooling', type: 'text', required: false },
  { name: 'security', type: 'text', required: false },
  { name: 'view', type: 'text', required: false },
  { name: 'orientation', type: 'text', required: false },
  
  // Building Information
  { name: 'buildingAge', type: 'number', required: false },
  { name: 'maintenanceFee', type: 'text', required: false },
  { name: 'energyRating', type: 'text', required: false },
  { name: 'yearBuilt', type: 'number', required: false },
];
