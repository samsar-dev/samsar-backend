// Fix navigationSystem field in VehicleDetails
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixNavigationSystem() {
  try {
    console.log('Fixing navigationSystem field in VehicleDetails...');
    
    // Find records with boolean true values
    const trueRecords = await prisma.vehicleDetails.findMany({
      where: {
        navigationSystem: 'true',
      },
    });
    
    console.log(`Found ${trueRecords.length} records with 'true' value`);
    
    // Update records with true values to 'built-in'
    if (trueRecords.length > 0) {
      for (const record of trueRecords) {
        await prisma.vehicleDetails.update({
          where: { id: record.id },
          data: { navigationSystem: 'built-in' },
        });
      }
      console.log(`Updated ${trueRecords.length} records from 'true' to 'built-in'`);
    }
    
    // Find records with boolean false values
    const falseRecords = await prisma.vehicleDetails.findMany({
      where: {
        navigationSystem: 'false',
      },
    });
    
    console.log(`Found ${falseRecords.length} records with 'false' value`);
    
    // Update records with false values to 'none'
    if (falseRecords.length > 0) {
      for (const record of falseRecords) {
        await prisma.vehicleDetails.update({
          where: { id: record.id },
          data: { navigationSystem: 'none' },
        });
      }
      console.log(`Updated ${falseRecords.length} records from 'false' to 'none'`);
    }
    
    console.log('Navigation system field fix completed successfully');
  } catch (error) {
    console.error('Error fixing navigationSystem field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNavigationSystem();
