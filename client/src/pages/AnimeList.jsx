import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import AnimeFilters from "../components/AnimeFilters";
import { useAuth } from "../context/AuthContext";
import "../styles/AnimeList.css";

const AnimeList = () => {
  const { user } = useAuth();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionStatus, setActionStatus] = useState({ message: "", type: "" });
  const [userRatings, setUserRatings] = useState({});
  const [watchedList, setWatchedList] = useState([]);
  const [addingAnime, setAddingAnime] = useState(null);
  const [addingToPlanned, setAddingToPlanned] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    rating: "",
    comment: "",
  });
  const [plannedForm, setPlannedForm] = useState({
    comment: "",
  });
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    status: "",
  });

  const fetchAnimes = async (searchTerm = "", page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get("/api/anime", {
        params: {
          page,
          search: searchTerm,
          genre: filters.genre,
          year: filters.year,
          status: filters.status,
        },
      });

      // Get the anime list with overall ratings
      const animeList = response.data.anime;
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);

      // Fetch user ratings and watched list separately
      if (user) {
        try {
          const watchedResponse = await axios.get("/api/user/watched");

          // Set user ratings and watched list from the same response
          const ratings = {};
          const watchedIds = [];
          watchedResponse.data.forEach((item) => {
            ratings[item.anime.id] = {
              rating: item.rating,
              comment: item.comment,
            };
            watchedIds.push(item.anime.id);
          });
          setUserRatings(ratings);
          setWatchedList(watchedIds);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }

      // Set the anime list after getting user ratings
      setAnimes(animeList);
      setError(null);
    } catch (error) {
      setError("Error fetching anime list. Please try again later.");
      console.error("Error fetching animes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatched = async (animeId) => {
    try {
      if (!ratingForm.rating) {
        setActionStatus({
          message: "Please select a rating before adding to watched list",
          type: "error",
        });
        return;
      }

      const ratingValue = parseInt(ratingForm.rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
        setActionStatus({
          message: "Invalid rating value",
          type: "error",
        });
        return;
      }

      await axios.post(`/api/user/anime/${animeId}`, {
        status: "watched",
        rating: ratingValue,
        comment: ratingForm.comment || null,
      });

      setActionStatus({
        message: "Successfully added to watched list!",
        type: "success",
      });

      setAddingAnime(null);
      setRatingForm({ rating: "", comment: "" });

      // Wait for the fetch to complete before clearing the status
      await fetchAnimes("", currentPage);

      setTimeout(() => {
        setActionStatus({ message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Error adding to watched:", error.response?.data || error);
      setActionStatus({
        message:
          error.response?.data?.message || "Error adding to watched list",
        type: "error",
      });
      setTimeout(() => {
        setActionStatus({ message: "", type: "" });
      }, 3000);
    }
  };

  const addToPlanned = async (animeId) => {
    try {
      await axios.post(`/api/user/anime/${animeId}`, {
        status: "planned",
        rating: null,
        comment: plannedForm.comment,
      });

      setActionStatus({
        message: "Successfully added to plan to watch list!",
        type: "success",
      });

      setAddingToPlanned(null);
      setPlannedForm({ comment: "" });

      // Refresh the anime list to update the UI
      await fetchAnimes("", currentPage);

      setTimeout(() => {
        setActionStatus({ message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error(
        "Error adding to plan list:",
        error.response?.data || error
      );
      setActionStatus({
        message: error.response?.data?.message || "Error adding to plan list",
        type: "error",
      });
      setTimeout(() => {
        setActionStatus({ message: "", type: "" });
      }, 3000);
    }
  };

  useEffect(() => {
    fetchAnimes("", currentPage);
  }, [filters]); // Re-fetch when filters change

  const handleSearch = (searchTerm) => {
    fetchAnimes(searchTerm, 1); // Reset to first page on new search
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page) => {
    fetchAnimes("", page);
  };

  const handleRatingFormChange = (e) => {
    const { name, value } = e.target;
    setRatingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlannedFormChange = (e) => {
    const { name, value } = e.target;
    setPlannedForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderRating = (rating, count) => {
    if (!rating && !count) return "No ratings yet";
    return (
      <>
        <span className="rating-value">{parseFloat(rating).toFixed(1)}</span>
        <span className="rating-count">({count} ratings)</span>
      </>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="page-container">
      <h1>Anime List</h1>
      <div className="filters-container">
        <SearchBar onSearch={handleSearch} />
        <AnimeFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {actionStatus.message && (
        <div className={`status-message ${actionStatus.type}`}>
          {actionStatus.message}
        </div>
      )}

      {animes.length === 0 ? (
        <div className="no-results">
          No anime found. Try a different search term.
        </div>
      ) : (
        <>
          <div className="anime-grid">
            {animes.map((anime) => (
              <div key={anime.id} className="anime-card">
                {anime.imageUrl && (
                  <div className="anime-image">
                    <img src={anime.imageUrl} alt={anime.title} />
                  </div>
                )}
                <div className="anime-content">
                  <h3>{anime.title}</h3>
                  <p className="anime-description">{anime.description}</p>
                  <div className="anime-details">
                    <span>Genre: {anime.genre.join(", ")}</span>
                    <span>Year: {anime.releaseYear}</span>
                    <span>Episodes: {anime.episodes}</span>
                    <div className="rating-info">
                      <span className="rating-label">Overall Rating: </span>
                      {renderRating(anime.rating, anime.ratingCount)}
                    </div>
                  </div>

                  {user ? (
                    !watchedList.includes(anime.id) ? (
                      addingAnime === anime.id ? (
                        <div className="rating-form">
                          <div className="form-group">
                            <label htmlFor="rating">Rating (1-10):</label>
                            <select
                              id="rating"
                              name="rating"
                              value={ratingForm.rating}
                              onChange={handleRatingFormChange}
                            >
                              <option value="">Select rating</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="comment">Comment:</label>
                            <textarea
                              id="comment"
                              name="comment"
                              value={ratingForm.comment}
                              onChange={handleRatingFormChange}
                              placeholder="Write your thoughts about this anime..."
                              rows="3"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => addToWatched(anime.id)}
                            >
                              Save & Add to Watched
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                setAddingAnime(null);
                                setRatingForm({ rating: "", comment: "" });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : addingToPlanned === anime.id ? (
                        <div className="rating-form">
                          <div className="form-group">
                            <label htmlFor="planned-comment">Add a Note:</label>
                            <textarea
                              id="planned-comment"
                              name="comment"
                              value={plannedForm.comment}
                              onChange={handlePlannedFormChange}
                              placeholder="Write why you want to watch this anime..."
                              rows="3"
                            />
                          </div>
                          <div className="form-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => addToPlanned(anime.id)}
                            >
                              Save & Add to Plan
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => {
                                setAddingToPlanned(null);
                                setPlannedForm({ comment: "" });
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="anime-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => setAddingAnime(anime.id)}
                          >
                            Add to Watched
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={() => setAddingToPlanned(anime.id)}
                          >
                            Add to Plan
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="already-watched">
                        Already in your watched list
                      </div>
                    )
                  ) : (
                    <div className="login-prompt">
                      Log in to add this anime to your list
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnimeList;
