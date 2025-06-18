import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding last_active_at column to User table...');
    
    // Add last_active_at column to User table
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP WITH TIME ZONE`;
    
    console.log('Successfully added last_active_at column');
  } catch (error) {
    console.error('Error adding last_active_at column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
