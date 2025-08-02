const { execSync } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

console.log("🚀 Starting database migration...");
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error("❌ Error: Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`- ${varName}`));
  process.exit(1);
}

// Function to run a command and log output
function runCommand(command) {
  console.log(`\n$ ${command}`);
  try {
    const output = execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Main migration function
async function runMigration() {
  console.log("\n🔍 Checking for migrations...");

  // Generate Prisma client
  console.log("\n🔄 Generating Prisma client...");
  if (!runCommand("npx prisma generate")) {
    console.error("❌ Failed to generate Prisma client");
    process.exit(1);
  }

  // Run migrations
  console.log("\n🚀 Running migrations...");
  if (!runCommand("npx prisma migrate deploy")) {
    console.error("❌ Migration failed");
    process.exit(1);
  }

  console.log("\n✅ Migration completed successfully!");
}

// Run the migration
runMigration().catch((error) => {
  console.error("❌ Migration script failed:", error);
  process.exit(1);
});
