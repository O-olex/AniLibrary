import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize, initializeDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.js";
import animeRoutes from "./routes/anime.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnvVars = requiredEnvVars.filter(
  (varName) => !process.env[varName]
);

if (missingEnvVars.length > 0) {
  console.error(
    "Missing required environment variables:",
    missingEnvVars.join(", ")
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/anime", animeRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database with table updates in development
    await initializeDatabase({
      alter: process.env.NODE_ENV === "development",
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  process.exit(1);
});

startServer();
