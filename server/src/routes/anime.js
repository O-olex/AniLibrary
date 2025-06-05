import express from "express";
import { Op } from "sequelize";
import Anime from "../models/Anime.js";
import { auth } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import * as jikanService from "../services/jikanService.js";

const router = express.Router();

// Helper function to store anime data in the database
const storeAnimeData = async (animeList) => {
  try {
    // Filter out any null or undefined entries
    const validAnime = animeList.filter((anime) => anime && anime.title);

    // Use bulkCreate with updateOnDuplicate to handle existing entries
    await Anime.bulkCreate(validAnime, {
      updateOnDuplicate: [
        "title",
        "originalTitle",
        "description",
        "imageUrl",
        "genre",
        "releaseYear",
        "episodes",
        "duration",
        "status",
        "rating",
        "ratingCount",
        "updatedAt",
      ],
    });
    return validAnime.length;
  } catch (error) {
    console.error("Error storing anime data:", error);
    throw error;
  }
};

// Get all anime with optional search and pagination
router.get("/", async (req, res) => {
  try {
    const { search, genre, year, status, page = 1, limit = 10 } = req.query;

    // Check if we need to do initial data fetch
    const animeCount = await Anime.count();
    if (animeCount === 0) {
      console.log("No anime in database. Getting initial data...");

      // Get first page only
      const firstPage = await jikanService.getTopAnime(1, 25);
      const storedCount = await storeAnimeData(firstPage.anime);
      console.log(`Stored ${storedCount} anime from initial fetch`);
    }

    // Build the database query
    const dbQuery = {
      where: {},
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [["rating", "DESC"]],
    };

    // Add search condition if provided
    if (search) {
      dbQuery.where.title = {
        [Op.iLike]: `%${search}%`,
      };
    }

    // Add genre condition if provided
    if (genre) {
      dbQuery.where.genre = {
        [Op.contains]: [genre],
      };
    }

    // Add year condition if provided
    if (year) {
      dbQuery.where.releaseYear = parseInt(year);
    }

    // Add status condition if provided
    if (status) {
      dbQuery.where.status = status;
    }

    // Try to get results from database
    const dbResults = await Anime.findAndCountAll(dbQuery);

    // If we have results in database, return them
    if (dbResults.rows.length > 0) {
      return res.json({
        total: dbResults.count,
        totalPages: Math.ceil(dbResults.count / limit),
        currentPage: parseInt(page),
        anime: dbResults.rows,
      });
    }

    // If no results in database and we have search/filters, try Jikan API
    if (search || genre || year || status) {
      console.log("No results in database, fetching from Jikan API");
      const jikanResults = await jikanService.searchAnime(search, page, limit);

      // Store the results in our database
      try {
        await storeAnimeData(jikanResults.anime);
      } catch (dbError) {
        console.error("Error storing search results:", dbError);
      }

      return res.json({
        total: jikanResults.total,
        totalPages: jikanResults.totalPages,
        currentPage: jikanResults.currentPage,
        anime: jikanResults.anime,
      });
    }

    // If we get here, return empty results
    return res.json({
      total: 0,
      totalPages: 0,
      currentPage: 1,
      anime: [],
    });
  } catch (error) {
    console.error("Error in anime route:", error);
    res.status(500).json({
      message: "Error fetching anime list",
      error: error.message,
    });
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

// Add new endpoint for forced data loading
router.post("/load-data", auth, adminMiddleware, async (req, res) => {
  try {
    const { startPage = 1, pageCount = 20 } = req.body;
    let totalStored = 0;
    let currentPage = startPage;
    const endPage = startPage + pageCount - 1;

    console.log(
      `Starting forced data load from page ${startPage} to ${endPage}`
    );

    for (let page = startPage; page <= endPage; page++) {
      try {
        console.log(`Fetching page ${page}/${endPage}...`);
        const response = await jikanService.getTopAnime(page, 25);

        if (response.anime && response.anime.length > 0) {
          const pageStoredCount = await storeAnimeData(response.anime);
          totalStored += pageStoredCount;
          console.log(
            `Progress: ${totalStored} total anime stored. Added ${pageStoredCount} from page ${page}`
          );

          // Add delay to respect Jikan API rate limits
          await new Promise((resolve) => setTimeout(resolve, 6000));
        } else {
          console.log("No more anime to fetch");
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        // Continue with next page even if this one failed
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    const finalCount = await Anime.count();
    return res.json({
      message: "Data load completed",
      totalStored,
      finalCount,
    });
  } catch (error) {
    console.error("Error in forced data load:", error);
    res.status(500).json({
      message: "Error loading anime data",
      error: error.message,
    });
  }
});

export default router;
