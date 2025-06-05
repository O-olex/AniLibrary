import axios from "axios";

const JIKAN_API_BASE_URL = "https://api.jikan.moe/v4";

// Helper function to map Jikan API data to our database schema
const mapJikanAnimeToSchema = (jikanAnime) => {
  // Ensure genre is always an array
  const genres = jikanAnime.genres?.map((g) => g.name) || [];
  if (jikanAnime.explicit_genres) {
    genres.push(...jikanAnime.explicit_genres.map((g) => g.name));
  }
  if (jikanAnime.themes) {
    genres.push(...jikanAnime.themes.map((g) => g.name));
  }
  if (jikanAnime.demographics) {
    genres.push(...jikanAnime.demographics.map((g) => g.name));
  }

  // Calculate release year safely
  let releaseYear = null;
  try {
    if (jikanAnime.aired?.from) {
      const date = new Date(jikanAnime.aired.from);
      if (!isNaN(date.getTime())) {
        releaseYear = date.getFullYear();
      }
    }
  } catch (error) {
    console.error("Error parsing release year:", error);
  }

  // Parse duration to minutes
  let duration = null;
  try {
    if (jikanAnime.duration) {
      const durationStr = jikanAnime.duration.toLowerCase();

      // Handle "Unknown" duration
      if (durationStr === "unknown") {
        duration = null;
      }
      // Handle "per ep" format
      else if (durationStr.includes("per ep")) {
        const minutes = parseInt(durationStr);
        duration = isNaN(minutes) ? null : minutes;
      }
      // Handle hour and minute format
      else {
        const hours = durationStr.match(/(\d+)\s*hr/);
        const minutes = durationStr.match(/(\d+)\s*min/);

        let totalMinutes = 0;
        if (hours) totalMinutes += parseInt(hours[1]) * 60;
        if (minutes) totalMinutes += parseInt(minutes[1]);

        duration = totalMinutes > 0 ? totalMinutes : null;
      }
    }
  } catch (error) {
    console.error(
      "Error parsing duration:",
      error,
      "for duration:",
      jikanAnime.duration
    );
    duration = null;
  }

  // Map status to our format
  let status;
  switch (jikanAnime.status?.toLowerCase()) {
    case "currently airing":
      status = "ONGOING";
      break;
    case "finished airing":
      status = "COMPLETED";
      break;
    case "not yet aired":
      status = "UPCOMING";
      break;
    default:
      status = "COMPLETED";
  }

  // Ensure rating and rating count are valid numbers
  const rating = parseFloat(jikanAnime.score) || 0;
  const ratingCount = parseInt(jikanAnime.scored_by) || 0;

  return {
    title: jikanAnime.title_english || jikanAnime.title,
    originalTitle: jikanAnime.title_japanese,
    description: jikanAnime.synopsis || "No description available.",
    imageUrl:
      jikanAnime.images?.jpg?.large_image_url ||
      jikanAnime.images?.jpg?.image_url,
    genre: genres,
    releaseYear,
    episodes: parseInt(jikanAnime.episodes) || null,
    duration,
    status,
    rating,
    ratingCount,
  };
};

export const searchAnime = async (query, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/anime`, {
      params: {
        q: query,
        page: page,
        limit: limit,
      },
    });

    const { data, pagination } = response.data;

    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page,
    };
  } catch (error) {
    console.error("Error searching anime:", error);
    throw error;
  }
};

export const getAnimeById = async (malId) => {
  try {
    const response = await axios.get(
      `${JIKAN_API_BASE_URL}/anime/${malId}/full`
    );
    return mapJikanAnimeToSchema(response.data.data);
  } catch (error) {
    console.error("Error fetching anime details:", error);
    throw error;
  }
};

export const getTopAnime = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/top/anime`, {
      params: {
        page: page,
        limit: limit,
      },
    });

    const { data, pagination } = response.data;

    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page,
    };
  } catch (error) {
    console.error("Error fetching top anime:", error);
    throw error;
  }
};

export const getSeasonalAnime = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/seasons/now`, {
      params: {
        page: page,
        limit: limit,
      },
    });

    const { data, pagination } = response.data;

    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page,
    };
  } catch (error) {
    console.error("Error fetching seasonal anime:", error);
    throw error;
  }
};
