const { exec } = require('child_process');
const util = require('util');
const { mkdir } = require('fs/promises');
const { join } = require('path');

const execAsync = util.promisify(exec);

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function build() {
  try {
    console.log("🚀 Starting build process...");
    
    // Clean dist directory
    console.log("🧹 Cleaning dist directory...");
    await execAsync("rimraf dist");
    await ensureDir("dist");

    // Generate Prisma Client
    console.log("🔄 Generating Prisma Client...");
    await execAsync("npx prisma generate");

    // Compile TypeScript files
    console.log("🔨 Compiling TypeScript...");
    await execAsync("npx tsc");

    // Ensure server.js exists in dist
    const fs = require('fs');
    if (!fs.existsSync(join(process.cwd(), 'dist', 'server.js'))) {
      throw new Error('server.js was not built in the dist directory');
    }

    console.log("✅ Build completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (require.main === module) {
  build();
}

module.exports = { build };
