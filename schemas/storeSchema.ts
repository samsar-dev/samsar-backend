export const storeFields = [
  // Basic Information
  { name: 'storeType', type: 'text', required: true },
  { name: 'floorArea', type: 'text', required: false },
  { name: 'storageArea', type: 'text', required: false },
  { name: 'frontage', type: 'text', required: false },
  { name: 'ceilingHeight', type: 'text', required: false },
  { name: 'parking', type: 'text', required: false },
  
  // Store-specific Features
  { name: 'loadingDock', type: 'text', required: false },
  { name: 'security', type: 'text', required: false },
  { name: 'hvac', type: 'text', required: false },
  { name: 'lighting', type: 'text', required: false },
  { name: 'accessibility', type: 'text', required: false },
  
  // Business Information
  { name: 'zoning', type: 'text', required: false },
  { name: 'businessLicense', type: 'text', required: false },
  { name: 'footTraffic', type: 'text', required: false },
];
