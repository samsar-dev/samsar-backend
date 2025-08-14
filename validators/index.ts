import { VehicleType, PropertyType } from "../types/enums.js";
import { validateCarData, mapCarData, CarDetails } from "./cars.js";
import { validateMotorcycleData, mapMotorcycleData, MotorcycleDetails } from "./motorcycles.js";
import { validatePassengersData, mapPassengersData, PassengersDetails } from "./passengers.js";
import { validateConstructionsData, mapConstructionsData, ConstructionsDetails } from "./constructions.js";
import { validateCommercialsData, mapCommercialsData, CommercialsDetails } from "./commercials.js";
import { HouseValidator, HouseDetails } from "./houses.js";
import { ApartmentValidator, ApartmentDetails } from "./apartments.js";
import { LandValidator, LandDetails } from "./land.js";
import { OfficeValidator, OfficeDetails } from './offices.js';
import { VillaValidator, VillaDetails } from './villa.js';
import { StoreValidator, StoreDetails, validateStoreData, mapStoreData } from './store.js';


export type VehicleDetails = CarDetails | MotorcycleDetails | PassengersDetails | ConstructionsDetails | CommercialsDetails | StoreDetails;
export type RealEstateDetails = HouseDetails | ApartmentDetails | LandDetails | OfficeDetails | VillaDetails;

export interface ValidatorResult {
  errors: string[];
  mappedData?: Partial<VehicleDetails>;
}

export interface RealEstateValidatorResult {
  errors: string[];
  mappedData?: Partial<RealEstateDetails>;
}

export class VehicleValidatorFactory {
  static validate(vehicleType: VehicleType, data: any): ValidatorResult {
    let errors: string[] = [];
    let mappedData: Partial<VehicleDetails> | undefined;

    switch (vehicleType) {
      case VehicleType.CARS:
        errors = validateCarData(data);
        if (errors.length === 0) {
          mappedData = mapCarData(data);
        }
        break;

      case VehicleType.MOTORCYCLES:
        errors = validateMotorcycleData(data);
        if (errors.length === 0) {
          mappedData = mapMotorcycleData(data);
        }
        break;

      case VehicleType.PASSENGER_VEHICLES:
        errors = validatePassengersData(data);
        if (errors.length === 0) {
          mappedData = mapPassengersData(data);
        }
        break;

      case VehicleType.COMMERCIAL_TRANSPORT:
        errors = validateCommercialsData(data);
        if (errors.length === 0) {
          mappedData = mapCommercialsData(data);
        }
        break;

      case VehicleType.CONSTRUCTION_VEHICLES:
        errors = validateConstructionsData(data);
        if (errors.length === 0) {
          mappedData = mapConstructionsData(data);
        }
        break;

      case VehicleType.STORE:
        errors = validateStoreData(data);
        if (errors.length === 0) {
          mappedData = mapStoreData(data);
        }
        break;

      default:
        errors.push(`Unsupported vehicle type: ${vehicleType}`);
        break;
    }

    return { errors, mappedData };
  }

  static getSupportedVehicleTypes(): VehicleType[] {
    return [
      VehicleType.CARS,
      VehicleType.MOTORCYCLES,
      VehicleType.PASSENGER_VEHICLES,
      VehicleType.COMMERCIAL_TRANSPORT,
      VehicleType.CONSTRUCTION_VEHICLES,
      VehicleType.STORE,
    ];
  }

  static isCommercialVehicle(vehicleType: VehicleType): boolean {
    return [
      VehicleType.PASSENGER_VEHICLES,
      VehicleType.COMMERCIAL_TRANSPORT,
      VehicleType.CONSTRUCTION_VEHICLES,
    ].includes(vehicleType);
  }

  static getValidatorName(vehicleType: VehicleType): string {
    switch (vehicleType) {
      case VehicleType.CARS:
        return "Car Validator";
      case VehicleType.MOTORCYCLES:
        return "Motorcycle Validator";
      case VehicleType.PASSENGER_VEHICLES:
        return "Passenger Vehicle Validator";
      case VehicleType.COMMERCIAL_TRANSPORT:
        return "Commercial Transport Validator";
      case VehicleType.CONSTRUCTION_VEHICLES:
        return "Construction Vehicle Validator";
      case VehicleType.STORE:
        return "Store Validator";
      default:
        return "Unknown Validator";
    }
  }
}

export class RealEstateValidatorFactory {
  static validate(propertyType: PropertyType, data: any): RealEstateValidatorResult {
    let errors: string[] = [];
    let mappedData: Partial<RealEstateDetails> | undefined;

    switch (propertyType) {
      case PropertyType.HOUSE:
        const houseResult = HouseValidator.validate(data);
        errors = houseResult.errors;
        if (errors.length === 0) {
          mappedData = houseResult.mappedData || undefined;
        }
        break;

      case PropertyType.APARTMENT:
        const apartmentResult = ApartmentValidator.validate(data);
        errors = apartmentResult.errors;
        if (errors.length === 0) {
          mappedData = apartmentResult.mappedData || undefined;
        }
        break;

      case PropertyType.OFFICE:
        const officeResult = OfficeValidator.validate(data);
        errors = officeResult.errors;
        if (errors.length === 0) {
          mappedData = officeResult.mappedData || undefined;
        }
        break;

       

      case PropertyType.LAND:
        const landResult = LandValidator.validate(data);
        errors = landResult.errors;
        if (errors.length === 0) {
          mappedData = landResult.mappedData || undefined;
        }
        break;

      case PropertyType.VILLA:
        const villaResult = VillaValidator.validate(data);
        errors = villaResult.errors;
        if (errors.length === 0) {
          mappedData = villaResult.mappedData || undefined;
        }
        break;

      default:
        errors.push(`Unsupported property type: ${propertyType}`);
        break;
    }

    return { errors, mappedData };
  }

  static getSupportedPropertyTypes(): PropertyType[] {
    return [
      PropertyType.HOUSE,
      PropertyType.APARTMENT,
      PropertyType.LAND,
      PropertyType.OFFICE,
      PropertyType.VILLA,
    ];
  }

  static isResidentialProperty(propertyType: PropertyType): boolean {
    return [PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.VILLA].includes(propertyType);
  }

  static getValidatorName(propertyType: PropertyType): string {
    switch (propertyType) {
      case PropertyType.HOUSE:
        return "House Validator";
      case PropertyType.APARTMENT:
        return "Apartment Validator";
      case PropertyType.LAND:
        return "Land Validator";
      case PropertyType.OFFICE:
        return "Office Validator";
      case PropertyType.VILLA:
        return "Villa Validator";
      default:
        return "Unknown Property Validator";
    }
  }
}

// Export individual validators for direct use if needed
export {
  validateCarData,
  mapCarData,
  validateMotorcycleData,
  mapMotorcycleData,
  validatePassengersData,
  mapPassengersData,
  validateConstructionsData,
  mapConstructionsData,
  validateCommercialsData,
  mapCommercialsData,
};

export type { CarDetails, MotorcycleDetails, PassengersDetails, ConstructionsDetails, CommercialsDetails, HouseDetails, ApartmentDetails, LandDetails, OfficeDetails, VillaDetails, StoreDetails };
