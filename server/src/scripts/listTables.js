import { sequelize } from "../config/database.js";

const listTables = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    // Query to list all tables in the database
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);

    console.log("\nExisting tables in database:");
    results.forEach((result) => {
      console.log(result.table_name);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error listing tables:", error);
    process.exit(1);
  }
};

listTables();
