import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const runMigration = async (migrationName) => {
  try {
    const migrationPath = join(__dirname, "migrations", `${migrationName}.js`);

    // Check if migration exists
    try {
      await fs.access(migrationPath);
    } catch (error) {
      console.error(`Migration ${migrationName} not found`);
      process.exit(1);
    }

    // Import and run the migration
    console.log(`Running migration: ${migrationName}`);
    await import(migrationPath);
  } catch (error) {
    console.error("Error running migration:", error);
    process.exit(1);
  }
};

// Get migration name from command line args
const [, , migrationName] = process.argv;

if (!migrationName) {
  console.error("Please provide a migration name");
  console.log("Usage: node migrate.js <migrationName>");
  console.log("Example: node migrate.js fixAnimeColumns");
  process.exit(1);
}

runMigration(migrationName);
