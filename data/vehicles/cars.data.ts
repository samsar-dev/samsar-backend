// Syrian Market Car Makes and Models
export const CARS_DATA = {
  makes: [
    // European Brands (Popular in Syria)
    "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Peugeot", "Renault", 
    "Citroen", "Fiat", "Opel", "Skoda", "SEAT", "Volvo", "Porsche",
    
    // Japanese Brands (Very Popular)
    "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Suzuki", 
    "Subaru", "Lexus", "Infiniti", "Acura",
    
    // Korean Brands (Growing Market)
    "Hyundai", "Kia", "Genesis", "SsangYong",
    
    // American Brands
    "Ford", "Chevrolet", "Cadillac", "GMC", "Jeep", "Dodge", "Chrysler",
    
    // Chinese Brands (Emerging in Syria)
    "Chery", "Geely", "BYD", "Great Wall", "Changan", "JAC", "Brilliance",
    "Dongfeng", "BAIC", "Haval", "MG", "Maxus",
    
    // Other Brands
    "Lada", "Dacia", "Proton", "Tata", "Mahindra", "Others"
  ],
  
  models: {
    "Audi": [
      "A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", 
      "Q5", "Q7", "Q8", "Q8 e-tron", "R8", "TT", "e-tron", "e-tron GT", "RS3", "RS4", "RS5", "RS6", "RS7"
    ],
    
    "BMW": [
      "1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series",
      "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "i7", "i8", "iX", "iX1", "iX3",
      "M2", "M3", "M4", "M5", "M8", "X3 M", "X4 M", "X5 M", "X6 M"
    ],
    
    "Mercedes-Benz": [
      "A-Class", "B-Class", "C-Class", "CLA", "CLS", "E-Class", "S-Class", "G-Class",
      "GLA", "GLB", "GLC", "GLE", "GLS", "SL", "SLK", "AMG GT", "EQA", "EQB", "EQC", "EQE", "EQS",
      "C63 AMG", "E63 AMG", "S63 AMG", "G63 AMG", "GLE63 AMG"
    ],
    
    "Toyota": [
      "Yaris", "Corolla", "Camry", "Avalon", "Prius", "RAV4", "Highlander", "4Runner", 
      "Land Cruiser", "Prado", "Hilux", "Fortuner", "C-HR", "Venza", "Sienna", "Alphard",
      "Crown", "Mark X", "Supra", "86"
    ],
    
    "Honda": [
      "Civic", "Accord", "City", "Jazz", "Fit", "CR-V", "HR-V", "Pilot", "Passport",
      "Ridgeline", "Odyssey", "Insight", "Clarity", "NSX", "S2000", "Type R"
    ],
    
    "Nissan": [
      "Sentra", "Altima", "Maxima", "Versa", "Micra", "Juke", "Qashqai", "X-Trail", 
      "Murano", "Pathfinder", "Armada", "Patrol", "Navara", "Leaf", "Ariya", "GT-R", "370Z"
    ],
    
    "Hyundai": [
      "i10", "i20", "i30", "Elantra", "Sonata", "Azera", "Genesis", "Kona", "Tucson", 
      "Santa Fe", "Palisade", "Creta", "Venue", "Ioniq", "Ioniq 5", "Ioniq 6", "Veloster N"
    ],
    
    "Kia": [
      "Picanto", "Rio", "Cerato", "Forte", "Optima", "K5", "Stinger", "Soul", "Seltos", 
      "Sportage", "Sorento", "Telluride", "Carnival", "EV6", "EV9", "Niro"
    ],
    
    "Volkswagen": [
      "Polo", "Golf", "Jetta", "Passat", "Arteon", "Tiguan", "Touareg", "Atlas", 
      "T-Cross", "T-Roc", "ID.3", "ID.4", "ID.Buzz", "GTI", "R32"
    ],
    
    "Peugeot": [
      "208", "308", "508", "2008", "3008", "5008", "Partner", "Expert", "Boxer",
      "e-208", "e-2008", "e-308"
    ],
    
    "Renault": [
      "Clio", "Megane", "Talisman", "Captur", "Kadjar", "Koleos", "Duster", "Logan", 
      "Sandero", "Kangoo", "Master", "Zoe", "Twingo"
    ],
    
    "Ford": [
      "Fiesta", "Focus", "Fusion", "Mustang", "EcoSport", "Escape", "Edge", "Explorer", 
      "Expedition", "F-150", "Ranger", "Bronco", "Maverick", "Transit", "E-Transit"
    ],
    
    "Chevrolet": [
      "Spark", "Cruze", "Malibu", "Impala", "Camaro", "Corvette", "Trax", "Equinox", 
      "Traverse", "Tahoe", "Suburban", "Silverado", "Colorado", "Bolt EV"
    ],
    
    "Mazda": [
      "Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5", "CX-9", "MX-5", "MX-30", "RX-8"
    ],
    
    "Mitsubishi": [
      "Mirage", "Lancer", "Eclipse Cross", "Outlander", "Pajero", "L200", "ASX", "Montero"
    ],
    
    "Chery": [
      "QQ", "Arrizo 3", "Arrizo 5", "Arrizo 6", "Tiggo 2", "Tiggo 3", "Tiggo 4", 
      "Tiggo 5", "Tiggo 7", "Tiggo 8", "Exeed TXL", "Exeed VX"
    ],
    
    "Geely": [
      "Emgrand 7", "Emgrand X7", "Coolray", "Azkarra", "Okavango", "Atlas", "Boyue", 
      "Xingyue", "Geometry A", "Geometry C"
    ],
    
    "BYD": [
      "F3", "G3", "S6", "S7", "Tang", "Song", "Qin", "Han", "Dolphin", "Atto 3", "Seal"
    ],
    
    "Great Wall": [
      "Wingle 5", "Wingle 6", "Wingle 7", "Poer", "Cannon", "Voleex C10", "Voleex C30", "Voleex C50"
    ],
    
    "Haval": [
      "H1", "H2", "H6", "H9", "F5", "F7", "Jolion", "Dargo", "Big Dog"
    ],
    
    "Lada": [
      "Granta", "Vesta", "XRAY", "Largus", "4x4 Urban", "4x4 Bronto"
    ],
    
    "Dacia": [
      "Sandero", "Logan", "Duster", "Lodgy", "Dokker", "Spring"
    ],
    
    "Fiat": [
      "Panda", "Punto", "Tipo", "500", "500X", "500L", "Doblo", "Ducato"
    ],
    
    "Skoda": [
      "Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq"
    ],
    
    "Suzuki": [
      "Alto", "Swift", "Baleno", "Ciaz", "Vitara", "S-Cross", "Jimny", "Ertiga", "XL7"
    ],
    
    "Subaru": [
      "Impreza", "Legacy", "Outback", "Forester", "Ascent", "WRX", "BRZ"
    ],
    
    "Lexus": [
      "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC", "RC"
    ],
    
    "Infiniti": [
      "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX60", "QX80"
    ],
    
    "Others": [
      "Custom Model", "Imported Model", "Classic Car", "Modified Vehicle"
    ]
  }
};
