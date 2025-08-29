import { RealEstateDetails, VehicleDetails } from "../types/shared.js";
import { PropertyType, VehicleType } from "../types/enums.js";
import { schemaMap } from "../schemas/consolidated-schemas.js";

export const filterListingDetails = (
  listingDetails: VehicleDetails | RealEstateDetails,
  listingType: VehicleType | PropertyType,
): VehicleDetails | RealEstateDetails => {
  try {
    if ("vehicleType" in listingDetails) {
      const vehicleDetails = listingDetails as VehicleDetails;
      const details: VehicleDetails = {
        vehicleType: vehicleDetails.vehicleType,
        make: vehicleDetails.make,
        model: vehicleDetails.model,
        year: vehicleDetails.year,
      };
      const vehicleTypeField: string[] = schemaMap[listingType];

      // Process each field, with special handling for serviceHistory
      for (const [key, value] of Object.entries(vehicleDetails)) {
        if (vehicleTypeField.includes(key)) {
          // Convert serviceHistory to an array if it's a single value
          if (key === "serviceHistory" && value !== undefined) {
            if (Array.isArray(value)) {
              details[key] = value;
            } else if (value === false) {
              details[key] = [];
            } else if (value !== null) {
              details[key] = [String(value)];
            } else {
              details[key] = [];
            }
          } else {
            details[key] = value;
          }
        }
      }
      return details;
    } else if ("propertyType" in listingDetails) {
      // copy
      const realEstateDetails = listingDetails as RealEstateDetails;
      // added require filed
      const details: RealEstateDetails = {
        propertyType: realEstateDetails.propertyType,
      };
      // array of essential fields
      const propertyTypeField: string[] = schemaMap[listingType];
      // insert all essential fields in var details
      for (const [key, value] of Object.entries(realEstateDetails)) {
        if (propertyTypeField.includes(key) && !(key in details)) {
          (details as any)[key] = value;
        }
      }
      return details;
    } else return listingDetails;
  } catch (error) {
    return listingDetails;
  }
};
