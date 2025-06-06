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
import http from "http";

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
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Configure server timeouts
server.keepAliveTimeout = 65000; // Увеличиваем таймаут keep-alive до 65 секунд
server.headersTimeout = 66000; // Должен быть больше чем keepAliveTimeout

// Track connections with timeout handling
const connections = new Map();

// Connection tracking with improved handling
server.on("connection", (connection) => {
  const key = `${connection.remoteAddress}:${connection.remotePort}`;
  connections.set(key, connection);

  // Устанавливаем таймаут для соединения
  connection.setKeepAlive(true, 30000); // 30 секунд keep-alive
  connection.setTimeout(120000); // 2 минуты таймаут

  connection.on("close", () => {
    connections.delete(key);
  });

  connection.on("timeout", () => {
    console.log(`Connection ${key} timed out`);
    connection.destroy();
    connections.delete(key);
  });

  connection.on("error", (err) => {
    console.error(`Connection ${key} error:`, err);
    connection.destroy();
    connections.delete(key);
  });
});

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

// Improved graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Устанавливаем флаг, что сервер завершает работу
  server.isShuttingDown = true;

  // Останавливаем прием новых соединений
  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }

    try {
      console.log(`Closing ${connections.size} active connections...`);

      // Закрываем все активные соединения
      const closePromises = Array.from(connections.values()).map(
        (connection) => {
          return new Promise((resolve) => {
            if (!connection.destroyed) {
              connection.end(() => {
                connection.destroy();
                resolve();
              });
            } else {
              resolve();
            }
          });
        }
      );

      // Ждем закрытия всех соединений с таймаутом
      await Promise.race([
        Promise.all(closePromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection close timeout")), 5000)
        ),
      ]).catch((err) => {
        console.warn("Some connections did not close gracefully:", err.message);
        // Принудительно закрываем оставшиеся соединения
        connections.forEach((conn) => conn.destroy());
      });

      // Закрываем соединение с базой данных
      await sequelize.close();
      console.log("Database connection closed.");

      console.log("Graceful shutdown completed.");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

// Signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Start server
const startServer = async () => {
  try {
    // Initialize database with table updates in development
    await initializeDatabase({
      alter: process.env.NODE_ENV === "development",
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
