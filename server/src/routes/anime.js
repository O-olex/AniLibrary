import express from "express";
import { Op } from "sequelize";
import Anime from "../models/Anime.js";
import { auth } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all anime with optional search and pagination
router.get("/", async (req, res) => {
  try {
    const { search, genre, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { originalTitle: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (genre) {
      where.genre = { [Op.contains]: [genre] };
    }

    const { count, rows } = await Anime.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["rating", "DESC"]],
    });

    res.json({
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      anime: rows,
    });
  } catch (error) {
    console.error("Error fetching anime:", error);
    res.status(500).json({ message: "Error fetching anime list" });
  }
});

// Get single anime by ID
router.get("/:id", async (req, res) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    res.json(anime);
  } catch (error) {
    console.error("Error fetching anime:", error);
    res.status(500).json({ message: "Error fetching anime details" });
  }
});

// Admin routes for managing anime data
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

router.delete("/:id", auth, adminMiddleware, async (req, res) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }
    await anime.destroy();
    res.json({ message: "Anime deleted successfully" });
  } catch (error) {
    console.error("Error deleting anime:", error);
    res.status(500).json({ message: "Error deleting anime" });
  }
});

export default router;
