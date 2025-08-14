import { allCarFields } from "./carSchema.js";
import { motorcycleFieldNames } from "./motorcycleSchema.js";
import { allPassengersFields } from "./passengersSchema.js";
import { allConstructionsFields } from "./constructionsSchema.js";
import { allCommercialsFields } from "./commercialsSchema.js";

import { houseFieldNames } from "./houseSchema.js";
import { apartmentFieldNames } from "./apartmentSchema.js";
import { landFieldNames } from "./landSchema.js";
import { allOfficesFields } from "./officesSchema.js";
import { ListingFieldSchema } from "../types/listings.js";
import { PropertyType, VehicleType } from "../types/enums.js";

type SchemaMap = {
  [key: string]: string[];
};

export const schemaMap: SchemaMap = {
  // Vehicle types
  [VehicleType.CARS]: allCarFields,
  [VehicleType.MOTORCYCLES]: motorcycleFieldNames,
  [VehicleType.PASSENGER_VEHICLES]: allPassengersFields,
  [VehicleType.CONSTRUCTION_VEHICLES]: allConstructionsFields,
  [VehicleType.COMMERCIAL_TRANSPORT]: allCommercialsFields,

  // Property types
  [PropertyType.HOUSE]: houseFieldNames,
  [PropertyType.APARTMENT]: apartmentFieldNames,
  [PropertyType.LAND]: landFieldNames,
  [PropertyType.COMMERCIAL]: allOfficesFields,
};
