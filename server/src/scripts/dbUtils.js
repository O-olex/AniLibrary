import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import Anime from "../models/Anime.js";
import UserAnime from "../models/UserAnime.js";

const usage = () => {
  console.log(`
Database Utility Script

Usage: node dbUtils.js <command> [options]

Commands:
  reset     - Drop and recreate all tables
  clean     - Drop all tables and recreate with correct structure
  seed      - Create test data (users, anime)
  createAdmin <username> <email> <password> - Create or update admin user

Options:
  --force   - Skip confirmation prompts
  `);
  process.exit(0);
};

const confirmAction = async (action) => {
  if (process.argv.includes("--force")) return true;

  console.log(`\nWARNING: This will ${action}. This action cannot be undone.`);
  console.log("Are you sure you want to continue? (yes/no)");

  const response = await new Promise((resolve) => {
    process.stdin.once("data", (data) => {
      resolve(data.toString().trim().toLowerCase());
    });
  });

  return response === "yes";
};

const resetDatabase = async () => {
  if (!(await confirmAction("reset the entire database"))) {
    console.log("Operation cancelled.");
    return;
  }

  try {
    await sequelize.sync({ force: true });
    console.log("Database reset successful. All tables have been recreated.");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
};

const cleanDatabase = async () => {
  if (!(await confirmAction("clean the database and recreate all tables"))) {
    console.log("Operation cancelled.");
    return;
  }

  try {
    await sequelize.query('DROP TABLE IF EXISTS "users" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "animes" CASCADE;');
    await sequelize.query('DROP TABLE IF EXISTS "user_animes" CASCADE;');
    console.log("Successfully dropped all existing tables.");

    await sequelize.sync({ force: true });
    console.log("Database cleaned up and tables recreated successfully.");

    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);

    console.log("\nVerifying created tables:");
    tables.forEach((table) => {
      console.log(table.table_name);
    });
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Create test user
    const testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      isAdmin: false,
    });

    console.log("Test user created successfully:", {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
    });

    // Add more seed data here as needed
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

const createAdmin = async (username, email, password) => {
  if (!username || !email || !password) {
    console.error(
      "Missing required parameters. Usage: createAdmin <username> <email> <password>"
    );
    process.exit(1);
  }

  try {
    const existingAdmin = await User.findOne({ where: { email } });

    if (existingAdmin) {
      await existingAdmin.update({ isAdmin: true });
      console.log("Admin privileges updated successfully.");
    } else {
      const adminUser = await User.create({
        username,
        email,
        password,
        isAdmin: true,
      });

      console.log("Admin user created successfully:", {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
      });
    }
  } catch (error) {
    console.error("Error creating/updating admin:", error);
    process.exit(1);
  }
};

// Command processing
const [, , command, ...args] = process.argv;

if (!command || command === "--help" || command === "-h") {
  usage();
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    switch (command) {
      case "reset":
        await resetDatabase();
        break;
      case "clean":
        await cleanDatabase();
        break;
      case "seed":
        await seedDatabase();
        break;
      case "createAdmin":
        await createAdmin(...args);
        break;
      default:
        console.error("Unknown command:", command);
        usage();
    }

    process.exit(0);
  } catch (error) {
    console.error("Database operation failed:", error);
    process.exit(1);
  }
})();
