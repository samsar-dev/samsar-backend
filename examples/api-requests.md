# Improved Listing API Examples

This document demonstrates the improved API structure with validation, error handling, and optimized payload format.

## Key Improvements

✅ **Validation**: Comprehensive input validation with detailed error messages  
✅ **Optional Fields**: Advanced fields are optional - omit them to reduce payload size  
✅ **Consistent Naming**: All fields use camelCase consistently  
✅ **Error Handling**: Standardized error responses with error codes  
✅ **Extensibility**: Easy to add new fields without breaking existing data  

## Create Vehicle Listing

### Minimal Request (Only Required Fields)
```json
POST /listings
Content-Type: multipart/form-data

{
  "title": "Toyota Camry 2020",
  "description": "Excellent condition, well maintained vehicle",
  "price": 25000,
  "mainCategory": "VEHICLES",
  "subCategory": "CARS",
  "location": "Damascus, Syria",
  "listingAction": "SALE",
  "details": {
    "vehicles": {
      "vehicleType": "CARS",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020
    }
  }
}
```

### Extended Request (With Optional Features)
```json
POST /listings
Content-Type: multipart/form-data

{
  "title": "Toyota Camry 2020 - Fully Loaded",
  "description": "Excellent condition, well maintained vehicle with premium features",
  "price": 28000,
  "mainCategory": "VEHICLES",
  "subCategory": "CARS",
  "location": "Damascus, Syria",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "listingAction": "SALE",
  "details": {
    "vehicles": {
      "vehicleType": "CARS",
      "make": "Toyota",
      "model": "Camry",
      "year": 2020,
      "mileage": 35000,
      "fuelType": "GASOLINE",
      "transmissionType": "AUTOMATIC",
      "color": "#FFFFFF",
      "condition": "EXCELLENT",
      "doors": 4,
      "seats": 5,
      "horsepower": 203,
      "previousOwners": 1,
      "features": ["Air Conditioning", "Power Steering", "ABS"],
      
      // Optional advanced features - only include if true/available
      "abs": true,
      "airConditioning": true,
      "bluetooth": true,
      "cruiseControl": true,
      "ledHeadlights": true,
      "navigationSystem": true,
      "parkingSensors": true,
      "rearCamera": true,
      "sunroof": true,
      "heatedSeats": true
    }
  }
}
```

## Create Real Estate Listing

### Minimal Request
```json
POST /listings
Content-Type: multipart/form-data

{
  "title": "Modern 3BR Apartment",
  "description": "Beautiful apartment in the heart of Damascus",
  "price": 150000,
  "mainCategory": "REAL_ESTATE",
  "subCategory": "APARTMENT",
  "location": "Old Damascus, Syria",
  "listingAction": "SALE",
  "details": {
    "realEstate": {
      "propertyType": "APARTMENT"
    }
  }
}
```

### Extended Request
```json
POST /listings
Content-Type: multipart/form-data

{
  "title": "Luxury 3BR Apartment with City View",
  "description": "Beautiful apartment in the heart of Damascus with modern amenities",
  "price": 180000,
  "mainCategory": "REAL_ESTATE",
  "subCategory": "APARTMENT",
  "location": "Old Damascus, Syria",
  "latitude": 33.5138,
  "longitude": 36.2765,
  "listingAction": "SALE",
  "details": {
    "realEstate": {
      "propertyType": "APARTMENT",
      "size": "120 sqm",
      "yearBuilt": 2018,
      "bedrooms": 3,
      "bathrooms": 2,
      "condition": "Excellent",
      "floor": 5,
      "totalFloors": 8,
      "heating": "Central",
      "cooling": "Air Conditioning",
      
      // Optional boolean fields - only include if explicitly set
      "elevator": true,
      "balcony": true,
      "furnished": true,
      "parking": true,
      
      // Optional array fields - only include if not empty
      "features": ["Modern Kitchen", "Walk-in Closet", "City View"],
      "securityFeatures": ["Doorman", "Security Cameras", "Secure Parking"],
      "buildingAmenities": ["Gym", "Swimming Pool", "Garden"]
    }
  }
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "clx1234567890",
    "title": "Toyota Camry 2020",
    "description": "Excellent condition, well maintained vehicle",
    "price": 25000,
    "category": {
      "mainCategory": "VEHICLES",
      "subCategory": "CARS"
    },
    "location": "Damascus, Syria",
    "images": ["https://cdn.example.com/image1.jpg"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "userId": "user123",
    "views": 0,
    "details": {
      "vehicles": {
        "vehicleType": "CARS",
        "make": "Toyota",
        "model": "Camry",
        "year": 2020,
        "mileage": 35000,
        "fuelType": "GASOLINE",
        "condition": "EXCELLENT"
        // Only non-empty fields are included
      }
    },
    "listingAction": "SALE",
    "status": "ACTIVE",
    "seller": {
      "id": "user123",
      "username": "johndoe",
      "profilePicture": "https://cdn.example.com/avatar.jpg"
    },
    "savedBy": []
  },
  "status": 201,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      "Title is required and must be a non-empty string",
      "Price must be a positive number",
      "Vehicle make is required and must be a non-empty string"
    ],
    "timestamp": "2024-01-15T10:30:00.000Z",
    "path": "/listings"
  },
  "status": 400,
  "data": null
}
```

## Query Listings

### Basic Query
```
GET /listings?page=1&limit=10&mainCategory=VEHICLES
```

### Advanced Query with Filters
```
GET /listings?page=1&limit=20&mainCategory=VEHICLES&subCategory=CARS&minPrice=20000&maxPrice=50000&sortBy=price&sortOrder=asc&latitude=33.5138&longitude=36.2765&radius=10
```

## Benefits of New Structure

1. **Reduced Payload Size**: Only include non-empty values
2. **Better Validation**: Comprehensive validation with helpful error messages
3. **Extensible**: Easy to add new fields without breaking existing data
4. **Consistent**: All field names use camelCase
5. **Type Safe**: Full TypeScript support with proper interfaces
6. **Error Handling**: Standardized error responses with error codes
7. **Performance**: Optimized database queries and response formatting

## Migration Notes

- All existing data remains compatible
- New optional fields can be gradually adopted
- Error responses now include error codes for better client handling
- Response format is consistent across all endpoints
