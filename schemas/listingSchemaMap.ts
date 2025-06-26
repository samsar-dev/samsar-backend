import { allCarFields } from "./carSchema.js";
import { motorcycleFieldNames } from "./motorcycleSchema.js";
import { truckFieldNames } from "./truckSchema.js";
import { tractorFieldNames } from "./tractorSchema.js";
import { constructionFieldNames } from "./constructionSchema.js";
import { vanFieldNames } from "./vanSchema.js";
import { busFieldNames } from "./busSchema.js";

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
  [VehicleType.CAR]: allCarFields,
  [VehicleType.MOTORCYCLE]: motorcycleFieldNames,
  [VehicleType.TRUCK]: truckFieldNames,
  [VehicleType.TRACTOR]: tractorFieldNames,
  [VehicleType.CONSTRUCTION]: constructionFieldNames,
  [VehicleType.VAN]: vanFieldNames,
  [VehicleType.BUS]: busFieldNames,

  // Property types
  [PropertyType.HOUSE]: houseFieldNames,
  [PropertyType.APARTMENT]: apartmentFieldNames,
  [PropertyType.LAND]: landFieldNames,
};
