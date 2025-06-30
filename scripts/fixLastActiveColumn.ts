import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixLastActiveColumn() {
  try {
    // First, drop the incorrectly named column if it exists
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'User' 
          AND column_name = 'lastActiveAt'
        ) THEN
          ALTER TABLE "User" DROP COLUMN "lastActiveAt";
          RAISE NOTICE 'Dropped column lastActiveAt';
        END IF;
      END $$;
    `;

    // Then add the column with the correct name
    await prisma.$executeRaw`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3);
    `;

    console.log("Successfully fixed last_active_at column in User table");
  } catch (error) {
    console.error("Error fixing last_active_at column:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLastActiveColumn();
