import express from "express";
import { auth } from "../middleware/auth.js";
import UserAnime from "../models/UserAnime.js";
import Anime from "../models/Anime.js";
import { Op } from "sequelize";

const router = express.Router();

// Helper function to build filter conditions
const buildAnimeFilterConditions = (query) => {
  const conditions = {};

  if (query.genre) {
    conditions.genre = {
      [Op.contains]: [query.genre],
    };
  }

  if (query.year) {
    conditions.releaseYear = parseInt(query.year);
  }

  if (query.status) {
    conditions.status = query.status;
  }

  if (query.search) {
    conditions.title = {
      [Op.iLike]: `%${query.search}%`,
    };
  }

  return conditions;
};

// Get user's watched anime list
router.get("/watched", auth, async (req, res) => {
  try {
    const animeConditions = buildAnimeFilterConditions(req.query);

    const userAnimeList = await UserAnime.findAll({
      where: {
        userId: req.user.id,
        status: "watched",
      },
      include: [
        {
          model: Anime,
          as: "anime",
          where: animeConditions,
        },
      ],
    });

    res.json(userAnimeList);
  } catch (error) {
    console.error("Error fetching watched list:", error);
    res.status(500).json({ message: "Error fetching watched list" });
  }
});

// Get user's planned anime list
router.get("/planned", auth, async (req, res) => {
  try {
    const animeConditions = buildAnimeFilterConditions(req.query);

    const userAnimeList = await UserAnime.findAll({
      where: {
        userId: req.user.id,
        status: "planned",
      },
      include: [
        {
          model: Anime,
          as: "anime",
          where: animeConditions,
        },
      ],
    });

    res.json(userAnimeList);
  } catch (error) {
    console.error("Error fetching planned list:", error);
    res.status(500).json({ message: "Error fetching planned list" });
  }
});

// Add anime to user's list
router.post("/anime/:animeId", auth, async (req, res) => {
  try {
    const { animeId } = req.params;
    const { status, rating, comment } = req.body;

    console.log("Received update request:", {
      animeId,
      userId: req.user.id,
      status,
      rating,
      comment,
    });

    // Validate status
    if (!["watched", "planned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Check if anime exists
    const anime = await Anime.findByPk(animeId);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    // Check if entry already exists
    let userAnime = await UserAnime.findOne({
      where: {
        userId: req.user.id,
        animeId: animeId,
      },
    });

    console.log("Found existing user anime:", userAnime);

    if (userAnime) {
      // Update existing entry
      const updateData = {
        status,
        rating: status === "watched" ? rating : null,
        comment: comment !== undefined ? comment : userAnime.comment,
      };
      console.log("Updating with data:", updateData);
      await userAnime.update(updateData);
    } else {
      // Create new entry
      const createData = {
        userId: req.user.id,
        animeId: animeId,
        status,
        rating: status === "watched" ? rating : null,
        comment,
      };
      console.log("Creating new entry with data:", createData);
      userAnime = await UserAnime.create(createData);
    }

    // Get the updated anime data with the new overall rating
    const updatedAnime = await Anime.findByPk(animeId);
    console.log("Updated anime data:", {
      id: updatedAnime.id,
      title: updatedAnime.title,
      rating: updatedAnime.rating,
      ratingCount: updatedAnime.ratingCount,
    });

    // Fetch the updated user anime with anime details
    const updatedUserAnime = await UserAnime.findOne({
      where: {
        id: userAnime.id,
      },
      include: [
        {
          model: Anime,
          as: "anime",
          attributes: [
            "id",
            "title",
            "description",
            "imageUrl",
            "genre",
            "releaseYear",
            "episodes",
            "rating",
            "ratingCount",
          ],
        },
      ],
    });

    res.json(updatedUserAnime);
  } catch (error) {
    console.error("Detailed error in updating anime list:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });
    res.status(500).json({
      message: "Error updating anime list",
      details: error.message,
    });
  }
});

// Remove anime from user's list
router.delete("/anime/:animeId", auth, async (req, res) => {
  try {
    const { animeId } = req.params;

    const userAnime = await UserAnime.findOne({
      where: {
        userId: req.user.id,
        animeId: animeId,
      },
    });

    if (!userAnime) {
      return res.status(404).json({ message: "Anime not found in your list" });
    }

    await userAnime.destroy();

    // Update anime average rating if it was a watched entry with rating
    if (userAnime.status === "watched" && userAnime.rating) {
      const allRatings = await UserAnime.findAll({
        where: {
          animeId: animeId,
          status: "watched",
          rating: { [Op.not]: null },
        },
      });

      const anime = await Anime.findByPk(animeId);
      const totalRatings = allRatings.length;
      const sumRatings = allRatings.reduce((sum, item) => sum + item.rating, 0);
      const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

      await anime.update({
        rating: averageRating,
        ratingCount: totalRatings,
      });
    }

    res.json({ message: "Anime removed from your list" });
  } catch (error) {
    console.error("Error removing anime from list:", error);
    res.status(500).json({ message: "Error removing anime from list" });
  }
});

export default router;
