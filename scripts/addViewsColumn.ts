import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adding views column to Listing table...");

    // Add views column to Listing table with a default value of 0
    await prisma.$executeRaw`
      ALTER TABLE "Listing" 
      ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
    `;

    console.log("Successfully added views column to Listing table");
  } catch (error) {
    console.error("Error adding views column:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
