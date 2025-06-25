import { allCarFields } from "./carSchema";
import { motorcycleFieldNames } from "./motorcycleSchema";
import { truckFieldNames } from "./truckSchema";
import { tractorFieldNames } from "./tractorSchema";
import { constructionFieldNames } from "./constructionSchema";
import { vanFieldNames } from "./vanSchema";
import { busFieldNames } from "./busSchema";

import { houseFieldNames } from "./houseSchema";
import { apartmentFieldNames } from "./apartmentSchema";
import { landFieldNames } from "./landSchema";
import { ListingFieldSchema } from "../types/listings";
import { PropertyType, VehicleType } from "../types/enums";

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
