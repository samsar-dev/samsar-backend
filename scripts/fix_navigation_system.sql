-- Convert boolean true values to 'built-in' string
UPDATE "VehicleDetails"
SET "navigationSystem" = 'built-in'
WHERE "navigationSystem" = 'true' OR "navigationSystem" IS TRUE;

-- Convert boolean false values to 'none' string
UPDATE "VehicleDetails"
SET "navigationSystem" = 'none'
WHERE "navigationSystem" = 'false' OR "navigationSystem" IS FALSE;
