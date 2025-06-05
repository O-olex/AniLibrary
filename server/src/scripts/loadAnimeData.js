import { sequelize } from "../config/database.js";
import * as jikanService from "../services/jikanService.js";
import Anime from "../models/Anime.js";

const storeAnimeData = async (animeList) => {
  try {
    const validAnime = animeList.filter((anime) => anime && anime.title);
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

const loadAnimeData = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log("Connected to database");

    const startPage = 1;
    const pageCount = 20;
    const endPage = startPage + pageCount - 1;
    let totalStored = 0;

    console.log(`Starting data load from page ${startPage} to ${endPage}`);

    for (let page = startPage; page <= endPage; page++) {
      try {
        console.log(`\nFetching page ${page}/${endPage}...`);
        const response = await jikanService.getTopAnime(page, 25);

        if (response.anime && response.anime.length > 0) {
          const pageStoredCount = await storeAnimeData(response.anime);
          totalStored += pageStoredCount;
          console.log(
            `Progress: ${totalStored} total anime stored. Added ${pageStoredCount} from page ${page}`
          );

          // Add delay to respect Jikan API rate limits
          if (page < endPage) {
            console.log("Waiting 6 seconds before next request...");
            await new Promise((resolve) => setTimeout(resolve, 6000));
          }
        } else {
          console.log("No more anime to fetch");
          break;
        }
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        // Continue with next page even if this one failed
        console.log("Waiting 10 seconds before retrying...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    const finalCount = await Anime.count();
    console.log(
      `\nData load completed. Total anime in database: ${finalCount}`
    );

    // Close database connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
};

// Run the script
loadAnimeData();
