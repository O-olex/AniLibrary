import { sequelize } from "../config/database.js";
import User from "../models/User.js";
import Anime from "../models/Anime.js";
import UserAnime from "../models/UserAnime.js";

const initializeDatabase = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    // Sync all models
    await sequelize.sync({ force: true });
    console.log("Database synchronized successfully.");

    // Create test user
    const testUser = await User.create({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      isAdmin: false,
    });

    // Create some test anime
    const testAnimes = await Anime.bulkCreate([
      {
        title: "Naruto",
        description: "A young ninja with a sealed demon inside him...",
        imageUrl: "https://example.com/naruto.jpg",
        genre: ["Action", "Adventure", "Fantasy"],
        releaseYear: 2002,
        episodes: 220,
        status: "COMPLETED",
        rating: 8.5,
        ratingCount: 1000,
      },
      {
        title: "Death Note",
        description:
          "A high school student discovers a supernatural notebook...",
        imageUrl: "https://example.com/deathnote.jpg",
        genre: ["Thriller", "Supernatural", "Psychological"],
        releaseYear: 2006,
        episodes: 37,
        status: "COMPLETED",
        rating: 9.0,
        ratingCount: 1200,
      },
    ]);

    // Create some test user-anime relationships
    await UserAnime.bulkCreate([
      {
        userId: testUser.id,
        animeId: testAnimes[0].id,
        status: "watched",
        rating: 8,
        comment: "Great anime, loved the character development!",
      },
      {
        userId: testUser.id,
        animeId: testAnimes[1].id,
        status: "planned",
      },
    ]);

    console.log("Database initialized with test data successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

initializeDatabase();
