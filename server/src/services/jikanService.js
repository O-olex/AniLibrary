import axios from 'axios';

const JIKAN_API_BASE_URL = 'https://api.jikan.moe/v4';

// Helper function to map Jikan API data to our database schema
const mapJikanAnimeToSchema = (jikanAnime) => {
  return {
    title: jikanAnime.title_english || jikanAnime.title,
    originalTitle: jikanAnime.title_japanese,
    description: jikanAnime.synopsis,
    imageUrl: jikanAnime.images?.jpg?.large_image_url,
    genre: jikanAnime.genres?.map(g => g.name) || [],
    releaseYear: new Date(jikanAnime.aired?.from).getFullYear(),
    episodes: jikanAnime.episodes || 0,
    duration: parseInt(jikanAnime.duration?.split(' ')[0]) || null,
    status: jikanAnime.status === "Currently Airing" ? "ONGOING" : 
           jikanAnime.status === "Not yet aired" ? "UPCOMING" : "COMPLETED",
    rating: jikanAnime.score || 0,
    ratingCount: jikanAnime.scored_by || 0
  };
};

export const searchAnime = async (query, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/anime`, {
      params: {
        q: query,
        page: page,
        limit: limit
      }
    });

    const { data, pagination } = response.data;
    
    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page
    };
  } catch (error) {
    console.error('Error searching anime:', error);
    throw error;
  }
};

export const getAnimeById = async (malId) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/anime/${malId}/full`);
    return mapJikanAnimeToSchema(response.data.data);
  } catch (error) {
    console.error('Error fetching anime details:', error);
    throw error;
  }
};

export const getTopAnime = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/top/anime`, {
      params: {
        page: page,
        limit: limit
      }
    });

    const { data, pagination } = response.data;
    
    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page
    };
  } catch (error) {
    console.error('Error fetching top anime:', error);
    throw error;
  }
};

export const getSeasonalAnime = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${JIKAN_API_BASE_URL}/seasons/now`, {
      params: {
        page: page,
        limit: limit
      }
    });

    const { data, pagination } = response.data;
    
    return {
      anime: data.map(mapJikanAnimeToSchema),
      total: pagination.items.total,
      currentPage: pagination.current_page,
      totalPages: pagination.last_visible_page
    };
  } catch (error) {
    console.error('Error fetching seasonal anime:', error);
    throw error;
  }
}; 