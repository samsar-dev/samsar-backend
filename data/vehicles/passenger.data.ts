// Syrian Market Passenger Vehicles Makes and Models
export const PASSENGER_VEHICLES_DATA = {
  makes: [
    // European Brands (Popular in Syria)
    "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Peugeot", "Renault", "Fiat", "Opel", 
    "Skoda", "SEAT", "Citroen", "Volvo", "Saab", "Alfa Romeo",
    
    // Japanese Brands (Very Popular)
    "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Subaru", "Suzuki", "Lexus", "Infiniti", "Acura",
    
    // American Brands
    "Ford", "Chevrolet", "Cadillac", "Buick", "GMC", "Chrysler", "Dodge", "Jeep",
    
    // Korean Brands (Growing Market)
    "Hyundai", "Kia", "Genesis",
    
    // Chinese Brands (Emerging Market)
    "Chery", "Geely", "BYD", "Great Wall", "Haval", "MG", "Changan", "JAC", "Brilliance",
    
    // Other Brands
    "Lada", "Dacia", "Proton", "Perodua", "Others"
  ],
  
  models: {
    "BMW": [
      // 1 Series
      "116i", "118i", "120i", "125i", "M135i",
      
      // 2 Series
      "218i", "220i", "225i", "M240i",
      
      // 3 Series
      "316i", "318i", "320i", "325i", "330i", "335i", "M3",
      
      // 4 Series
      "420i", "425i", "430i", "435i", "M4",
      
      // 5 Series
      "520i", "523i", "525i", "528i", "530i", "535i", "540i", "M5",
      
      // 6 Series
      "630i", "640i", "650i", "M6",
      
      // 7 Series
      "730i", "740i", "750i", "760i",
      
      // X Series (SUVs)
      "X1", "X2", "X3", "X4", "X5", "X6", "X7",
      
      // Z Series
      "Z3", "Z4"
    ],
    
    "Mercedes-Benz": [
      // A-Class
      "A160", "A180", "A200", "A220", "A250", "AMG A35", "AMG A45",
      
      // B-Class
      "B160", "B180", "B200", "B220", "B250",
      
      // C-Class
      "C160", "C180", "C200", "C220", "C230", "C240", "C250", "C280", "C300", "C320", "C350", "AMG C43", "AMG C63",
      
      // E-Class
      "E200", "E220", "E230", "E240", "E250", "E280", "E300", "E320", "E350", "E400", "E500", "AMG E43", "AMG E53", "AMG E63",
      
      // S-Class
      "S320", "S350", "S400", "S450", "S500", "S560", "S600", "AMG S63", "AMG S65",
      
      // CLA-Class
      "CLA180", "CLA200", "CLA220", "CLA250", "AMG CLA35", "AMG CLA45",
      
      // CLS-Class
      "CLS320", "CLS350", "CLS400", "CLS450", "CLS500", "AMG CLS53", "AMG CLS63",
      
      // GLA-Class
      "GLA180", "GLA200", "GLA220", "GLA250", "AMG GLA35", "AMG GLA45",
      
      // GLB-Class
      "GLB180", "GLB200", "GLB220", "GLB250", "AMG GLB35",
      
      // GLC-Class
      "GLC200", "GLC220", "GLC250", "GLC300", "AMG GLC43", "AMG GLC63",
      
      // GLE-Class
      "GLE300", "GLE350", "GLE400", "GLE450", "GLE500", "AMG GLE53", "AMG GLE63",
      
      // GLS-Class
      "GLS350", "GLS400", "GLS450", "GLS500", "AMG GLS63",
      
      // G-Class
      "G350", "G400", "G500", "AMG G63"
    ],
    
    "Toyota": [
      // Compact Cars
      "Yaris", "Vitz", "Platz", "Belta",
      
      // Sedans
      "Corolla", "Camry", "Avalon", "Crown", "Mark X",
      
      // SUVs
      "RAV4", "Highlander", "4Runner", "Sequoia", "Land Cruiser", "Prado", "FJ Cruiser",
      
      // Pickup Trucks
      "Hilux", "Tacoma", "Tundra",
      
      // Minivans
      "Sienna", "Previa", "Hiace",
      
      // Sports Cars
      "Supra", "86", "Celica", "MR2",
      
      // Hybrids
      "Prius", "Prius C", "Prius V", "Camry Hybrid", "RAV4 Hybrid"
    ],
    
    "Honda": [
      // Compact Cars
      "Civic", "Fit", "City", "Insight",
      
      // Sedans
      "Accord", "Legend",
      
      // SUVs
      "CR-V", "HR-V", "Pilot", "Passport", "Ridgeline",
      
      // Minivans
      "Odyssey", "Stream",
      
      // Sports Cars
      "S2000", "NSX", "Type R"
    ],
    
    "Nissan": [
      // Compact Cars
      "Micra", "Versa", "Sentra", "Sunny",
      
      // Sedans
      "Altima", "Maxima", "Teana",
      
      // SUVs
      "Rogue", "Murano", "Pathfinder", "Armada", "Patrol", "X-Trail", "Juke", "Qashqai",
      
      // Pickup Trucks
      "Frontier", "Titan", "Navara",
      
      // Sports Cars
      "350Z", "370Z", "GT-R", "Silvia"
    ],
    
    "Hyundai": [
      // Compact Cars
      "i10", "i20", "Accent", "Elantra", "Veloster",
      
      // Sedans
      "Sonata", "Azera", "Genesis",
      
      // SUVs
      "Tucson", "Santa Fe", "Palisade", "Venue", "Kona",
      
      // Electric
      "Ioniq", "Kona Electric"
    ],
    
    "Kia": [
      // Compact Cars
      "Rio", "Forte", "Cerato", "Soul",
      
      // Sedans
      "Optima", "K5", "Stinger",
      
      // SUVs
      "Sportage", "Sorento", "Telluride", "Seltos", "Niro"
    ],
    
    "Volkswagen": [
      // Compact Cars
      "Polo", "Golf", "Jetta", "Beetle",
      
      // Sedans
      "Passat", "Arteon", "Phaeton",
      
      // SUVs
      "Tiguan", "Atlas", "Touareg", "T-Cross", "T-Roc"
    ],
    
    "Ford": [
      // Compact Cars
      "Fiesta", "Focus", "Fusion",
      
      // SUVs
      "Escape", "Edge", "Explorer", "Expedition", "Bronco", "EcoSport",
      
      // Pickup Trucks
      "F-150", "Ranger",
      
      // Sports Cars
      "Mustang", "GT"
    ],
    
    "Chevrolet": [
      // Compact Cars
      "Spark", "Sonic", "Cruze", "Malibu",
      
      // SUVs
      "Trax", "Equinox", "Traverse", "Tahoe", "Suburban",
      
      // Pickup Trucks
      "Colorado", "Silverado",
      
      // Sports Cars
      "Camaro", "Corvette"
    ],
    
    "Others": [
      "Various Models", "Custom", "Modified", "Classic", "Vintage", "Import"
    ]
  }
};
