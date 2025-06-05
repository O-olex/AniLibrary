import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  NODE_ENV = "development",
} = process.env;

// Validate required environment variables
if (!DB_NAME || !DB_USER || !DB_PASSWORD) {
  console.error("Missing required database environment variables");
  process.exit(1);
}

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST || "localhost",
  port: DB_PORT || 5432,
  dialect: "postgres",
  logging: NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const initializeDatabase = async (options = { alter: false }) => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    if (options.alter) {
      // First, ensure all status values are valid
      await sequelize.query(`
        UPDATE animes 
        SET status = 'COMPLETED' 
        WHERE status NOT IN ('ONGOING', 'COMPLETED', 'UPCOMING');
      `);

      // Now proceed with the normal sync
      await sequelize.sync({ alter: true });
      console.log("Database tables structure updated successfully");
    }
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error; // Let the caller handle the error
  }
};

export default { sequelize, initializeDatabase };
