import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir, copyFile, readdir, rename, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const execAsync = promisify(exec);

async function build() {
  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    await execAsync('rimraf dist');

    // Create necessary directories
    console.log('📁 Creating directories...');
    await mkdir('dist', { recursive: true });
    await mkdir('dist/src', { recursive: true });
    await mkdir('dist/src/prisma', { recursive: true });
    await mkdir('dist/src/lib', { recursive: true });

    // Generate Prisma Client with schema path
    console.log('🔄 Generating Prisma Client...');
    await execAsync('prisma generate --schema src/prisma/schema.prisma');

    // Copy schema.prisma to dist
    console.log('📄 Copying Prisma schema...');
    await copyFile(
      join(process.cwd(), 'src', 'prisma', 'schema.prisma'),
      join(process.cwd(), 'dist', 'src', 'prisma', 'schema.prisma')
    );

    // Create prismaClient.js in dist
    console.log('📝 Creating Prisma client...');
    const prismaClientContent = `
import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
} else {
  // Prevent multiple instances in development
  const globalWithPrisma = global;
  
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }
  
  prisma = globalWithPrisma.prisma;
}

// Add connection validation
async function validateConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Call validateConnection but don't await it here
validateConnection().catch(console.error);

export default prisma;
`;

    await writeFile(
      join(process.cwd(), 'dist', 'src', 'lib', 'prismaClient.js'),
      prismaClientContent
    );

    // Compile TypeScript
    console.log('🔨 Compiling TypeScript...');
    await execAsync('tsc');

    // Copy node_modules/@prisma/client to dist/node_modules/@prisma/client
    console.log('📦 Copying Prisma client files...');
    const prismaClientDir = join(process.cwd(), 'node_modules', '@prisma', 'client');
    const distPrismaClientDir = join(process.cwd(), 'dist', 'node_modules', '@prisma', 'client');
    
    await mkdir(join(process.cwd(), 'dist', 'node_modules', '@prisma'), { recursive: true });
    
    // Copy entire @prisma/client directory
    await execAsync(`cp -r "${prismaClientDir}" "${distPrismaClientDir}"`);

    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
