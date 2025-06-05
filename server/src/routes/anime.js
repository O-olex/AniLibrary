import express from "express";
import { Op } from "sequelize";
import Anime from "../models/Anime.js";
import { auth } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import * as jikanService from "../services/jikanService.js";

const router = express.Router();

// Get all anime with optional search and pagination
router.get("/", async (req, res) => {
  try {
    const { search, genre, page = 1, limit = 10 } = req.query;

    // If there's a search query, use Jikan API
    if (search || genre) {
      const jikanResults = await jikanService.searchAnime(search, page, limit);

      // Filter by genre if specified
      if (genre) {
        jikanResults.anime = jikanResults.anime.filter((anime) =>
          anime.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
        );
      }

      return res.json({
        total: jikanResults.total,
        totalPages: jikanResults.totalPages,
        currentPage: jikanResults.currentPage,
        anime: jikanResults.anime,
      });
    }

    // If no search/genre filter, get top anime from Jikan
    const topAnime = await jikanService.getTopAnime(page, limit);
    res.json({
      total: topAnime.total,
      totalPages: topAnime.totalPages,
      currentPage: topAnime.currentPage,
      anime: topAnime.anime,
    });
  } catch (error) {
    console.error("Error fetching anime:", error);
    res.status(500).json({ message: "Error fetching anime list" });
  }
});

// Get seasonal anime
router.get("/seasonal", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const seasonalAnime = await jikanService.getSeasonalAnime(page, limit);
    res.json(seasonalAnime);
  } catch (error) {
    console.error("Error fetching seasonal anime:", error);
    res.status(500).json({ message: "Error fetching seasonal anime" });
  }
});

// Get single anime by ID
router.get("/:id", async (req, res) => {
  try {
    // First try to find in our database
    const localAnime = await Anime.findByPk(req.params.id);
    if (localAnime) {
      return res.json(localAnime);
    }

    // If not found in database, try to fetch from Jikan API
    const jikanAnime = await jikanService.getAnimeById(req.params.id);
    res.json(jikanAnime);
  } catch (error) {
    console.error("Error fetching anime:", error);
    res.status(500).json({ message: "Error fetching anime details" });
  }
});

// Admin routes for managing local database entries
router.post("/", auth, adminMiddleware, async (req, res) => {
  try {
    const anime = await Anime.create(req.body);
    res.status(201).json(anime);
  } catch (error) {
    console.error("Error creating anime:", error);
    res.status(500).json({ message: "Error creating anime" });
  }
});

router.put("/:id", auth, adminMiddleware, async (req, res) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    await anime.update(req.body);
    res.json(anime);
  } catch (error) {
    console.error("Error updating anime:", error);
    res.status(500).json({ message: "Error updating anime" });
  }
});

// Import anime from Jikan to local database
router.post("/import/:malId", auth, adminMiddleware, async (req, res) => {
  try {
    const jikanAnime = await jikanService.getAnimeById(req.params.malId);
    const anime = await Anime.create(jikanAnime);
    res.status(201).json(anime);
  } catch (error) {
    console.error("Error importing anime:", error);
    res.status(500).json({ message: "Error importing anime from Jikan API" });
  }
});

export default router;
