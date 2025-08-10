import { allCarFields } from "./carSchema.js";
import { motorcycleFieldNames } from "./motorcycleSchema.js";

import { houseFieldNames } from "./houseSchema.js";
import { apartmentFieldNames } from "./apartmentSchema.js";
import { landFieldNames } from "./landSchema.js";
import { ListingFieldSchema } from "../types/listings.js";
import { PropertyType, VehicleType } from "../types/enums.js";

type SchemaMap = {
  [key: string]: string[];
};

export const schemaMap: SchemaMap = {
  // Vehicle types
  [VehicleType.CARS]: allCarFields,
  [VehicleType.MOTORCYCLES]: motorcycleFieldNames,

  // Property types
  [PropertyType.HOUSE]: houseFieldNames,
  [PropertyType.APARTMENT]: apartmentFieldNames,
  [PropertyType.LAND]: landFieldNames,
};
