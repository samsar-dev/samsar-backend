import { VehicleType, PropertyType } from "../types/enums.js";
import { validateCarData, mapCarData, CarDetails } from "./car.js";
import { validateMotorcycleData, mapMotorcycleData, MotorcycleDetails } from "./motorcycle.js";
import { validateCommercialData, mapCommercialData, CommercialDetails } from "./commercial.js";
import { HouseValidator, HouseDetails } from "./house.js";
import { ApartmentValidator, ApartmentDetails } from "./apartment.js";
import { CondoValidator, CondoDetails } from "./condo.js";
import { LandValidator, LandDetails } from "./land.js";
import { CommercialRealEstateValidator, CommercialRealEstateDetails } from "./commercial-realestate.js";
import { OtherPropertyValidator, OtherPropertyDetails } from "./other-property.js";

export type VehicleDetails = CarDetails | MotorcycleDetails | CommercialDetails;
export type RealEstateDetails = HouseDetails | ApartmentDetails | CondoDetails | LandDetails | CommercialRealEstateDetails | OtherPropertyDetails;

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

      case VehicleType.VANS:
      case VehicleType.TRUCKS:
      case VehicleType.BUSES:
      case VehicleType.TRACTORS:
        errors = validateCommercialData(data);
        if (errors.length === 0) {
          mappedData = mapCommercialData(data);
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
      VehicleType.VANS,
      VehicleType.TRUCKS,
      VehicleType.BUSES,
      VehicleType.TRACTORS,
    ];
  }

  static isCommercialVehicle(vehicleType: VehicleType): boolean {
    return [VehicleType.VANS, VehicleType.TRUCKS, VehicleType.BUSES, VehicleType.TRACTORS].includes(vehicleType);
  }

  static getValidatorName(vehicleType: VehicleType): string {
    switch (vehicleType) {
      case VehicleType.CARS:
        return "Car Validator";
      case VehicleType.MOTORCYCLES:
        return "Motorcycle Validator";
      case VehicleType.VANS:
      case VehicleType.TRUCKS:
      case VehicleType.BUSES:
      case VehicleType.TRACTORS:
        return "Commercial Vehicle Validator";
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

      case PropertyType.CONDO:
        const condoResult = CondoValidator.validate(data);
        errors = condoResult.errors;
        if (errors.length === 0) {
          mappedData = condoResult.mappedData || undefined;
        }
        break;

      case PropertyType.LAND:
        const landResult = LandValidator.validate(data);
        errors = landResult.errors;
        if (errors.length === 0) {
          mappedData = landResult.mappedData || undefined;
        }
        break;

      case PropertyType.COMMERCIAL:
        const commercialResult = CommercialRealEstateValidator.validate(data);
        errors = commercialResult.errors;
        if (errors.length === 0) {
          mappedData = commercialResult.mappedData || undefined;
        }
        break;

      case PropertyType.OTHER:
        const otherResult = OtherPropertyValidator.validate(data);
        errors = otherResult.errors;
        if (errors.length === 0) {
          mappedData = otherResult.mappedData || undefined;
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
      PropertyType.CONDO,
      PropertyType.LAND,
      PropertyType.COMMERCIAL,
      PropertyType.OTHER,
    ];
  }

  static isResidentialProperty(propertyType: PropertyType): boolean {
    return [PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.CONDO].includes(propertyType);
  }

  static getValidatorName(propertyType: PropertyType): string {
    switch (propertyType) {
      case PropertyType.HOUSE:
        return "House Validator";
      case PropertyType.APARTMENT:
        return "Apartment Validator";
      case PropertyType.CONDO:
        return "Condo Validator";
      case PropertyType.LAND:
        return "Land Validator";
      case PropertyType.COMMERCIAL:
        return "Commercial Real Estate Validator";
      case PropertyType.OTHER:
        return "Other Property Validator";
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
  validateCommercialData,
  mapCommercialData,
};

export type { CarDetails, MotorcycleDetails, CommercialDetails };
