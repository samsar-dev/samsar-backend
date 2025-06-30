import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log(
      "Adding latitude and longitude columns to Listing and User tables...",
    );

    // Add columns to Listing table
    await prisma.$executeRaw`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "latitude" FLOAT DEFAULT 0`;
    await prisma.$executeRaw`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "longitude" FLOAT DEFAULT 0`;

    // Add columns to User table
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "latitude" FLOAT`;
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longitude" FLOAT`;

    console.log("Successfully added columns");
  } catch (error) {
    console.error("Error applying schema changes:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
