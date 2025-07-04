import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Creating View table and related constraints...");

    // Create View table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "View" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "listingId" TEXT NOT NULL,
        "userId" TEXT,
        "userIp" TEXT NOT NULL,
        "userAgent" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "View_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "View_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;

    // Add index on createdAt
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "View_createdAt_idx" ON "View"("createdAt");
    `;

    // Add unique constraint for listingId, userId, and userIp
    await prisma.$executeRaw`
      ALTER TABLE "View" ADD CONSTRAINT "View_listingId_userId_userIp_key" 
      UNIQUE ("listingId", "userId", "userIp");
    `;

    // Add viewHistory relation to User table
    await prisma.$executeRaw`
      ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "viewHistory" JSONB[] DEFAULT '{}';
    `;

    console.log("Successfully created View table and related constraints");
  } catch (error) {
    console.error("Error creating View table:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
