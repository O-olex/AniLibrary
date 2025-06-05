import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import AnimeFilters from "../components/AnimeFilters";
import "../styles/WatchList.css";

const WatchList = () => {
  const [activeTab, setActiveTab] = useState("watched");
  const [watchedList, setWatchedList] = useState([]);
  const [plannedList, setPlannedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAnime, setEditingAnime] = useState(null);
  const [editComment, setEditComment] = useState("");
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    status: "",
  });

  const fetchLists = async (search = "") => {
    try {
      setLoading(true);
      const [watchedResponse, plannedResponse] = await Promise.all([
        axios.get(`/api/user/watched`, {
          params: {
            search,
            genre: filters.genre,
            year: filters.year,
            status: filters.status,
          },
        }),
        axios.get(`/api/user/planned`, {
          params: {
            search,
            genre: filters.genre,
            year: filters.year,
            status: filters.status,
          },
        }),
      ]);

      setWatchedList(watchedResponse.data);
      setPlannedList(plannedResponse.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching lists:", error);
      setError("Error fetching your lists. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists(searchTerm);
  }, [searchTerm, filters]); // Re-fetch when filters change

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleRemoveFromList = async (animeId) => {
    try {
      await axios.delete(`/api/user/anime/${animeId}`);
      fetchLists(searchTerm);
    } catch (error) {
      console.error("Error removing anime:", error);
      setError("Failed to remove anime from list");
    }
  };

  const handleUpdateStatus = async (animeId, newStatus) => {
    try {
      await axios.post(`/api/user/anime/${animeId}`, {
        status: newStatus,
        rating: null,
        comment: null,
      });
      fetchLists(searchTerm);
    } catch (error) {
      console.error("Error updating anime status:", error);
      setError("Failed to update anime status");
    }
  };

  const handleRatingChange = async (animeId, rating) => {
    try {
      console.log("Updating rating:", { animeId, rating });
      const anime = watchedList.find((a) => a.anime.id === animeId);

      // Validate rating
      const ratingValue = parseInt(rating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
        setError("Invalid rating value");
        return;
      }

      await axios.post(`/api/user/anime/${animeId}`, {
        status: "watched",
        rating: ratingValue,
        comment: anime?.comment || null,
      });

      await fetchLists(searchTerm);
      setError(null);
    } catch (error) {
      console.error("Error updating rating:", error.response?.data || error);
      setError(error.response?.data?.details || "Failed to update rating");
    }
  };

  const handleCommentSubmit = async (animeId) => {
    try {
      const anime =
        activeTab === "watched"
          ? watchedList.find((a) => a.anime.id === animeId)
          : plannedList.find((a) => a.anime.id === animeId);

      await axios.post(`/api/user/anime/${animeId}`, {
        status: activeTab === "watched" ? "watched" : "planned",
        rating: anime?.rating || null,
        comment: editComment,
      });
      setEditingAnime(null);
      setEditComment("");
      fetchLists(searchTerm);
    } catch (error) {
      console.error("Error updating comment:", error);
      setError("Failed to update comment");
    }
  };

  if (loading) {
    return <div className="loading">Loading your lists...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const currentList = activeTab === "watched" ? watchedList : plannedList;

  return (
    <div className="page-container">
      <h1>My Lists</h1>
      <div className="filters-container">
        <SearchBar onSearch={handleSearch} />
        <AnimeFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div className="list-tabs">
        <button
          className={`tab-button ${activeTab === "watched" ? "active" : ""}`}
          onClick={() => setActiveTab("watched")}
        >
          Watched
        </button>
        <button
          className={`tab-button ${activeTab === "planned" ? "active" : ""}`}
          onClick={() => setActiveTab("planned")}
        >
          Plan to Watch
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="no-results">
          {searchTerm
            ? `No ${activeTab} anime found matching "${searchTerm}"`
            : `Your ${activeTab} list is empty`}
        </div>
      ) : (
        <div className="anime-grid">
          {currentList.map((userAnime) => (
            <div key={userAnime.anime.id} className="anime-card">
              {userAnime.anime.imageUrl && (
                <div className="anime-image">
                  <img
                    src={userAnime.anime.imageUrl}
                    alt={userAnime.anime.title}
                  />
                </div>
              )}
              <div className="anime-content">
                <h3>{userAnime.anime.title}</h3>
                <p className="anime-description">
                  {userAnime.anime.description}
                </p>
                <div className="anime-details">
                  <span>
                    Genre:{" "}
                    {Array.isArray(userAnime.anime.genre)
                      ? userAnime.anime.genre.join(", ")
                      : userAnime.anime.genre}
                  </span>
                  <span>Year: {userAnime.anime.releaseYear}</span>
                  <span>Episodes: {userAnime.anime.episodes}</span>
                </div>

                {activeTab === "watched" && (
                  <div className="rating-section">
                    <div className="rating-input">
                      <label>Your Rating:</label>
                      <select
                        value={userAnime.rating || ""}
                        onChange={(e) =>
                          handleRatingChange(userAnime.anime.id, e.target.value)
                        }
                      >
                        <option value="">Select rating</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={num} value={num}>
                            {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="comment-section">
                  {editingAnime === userAnime.anime.id ? (
                    <div className="comment-edit">
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Write your comment..."
                        rows="3"
                      />
                      <div className="comment-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            handleCommentSubmit(userAnime.anime.id)
                          }
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setEditingAnime(null);
                            setEditComment("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-display">
                      <p>
                        {userAnime.comment ? (
                          <>
                            <strong>Your Comment: </strong>
                            {userAnime.comment}
                          </>
                        ) : (
                          "No comment yet"
                        )}
                      </p>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setEditingAnime(userAnime.anime.id);
                          setEditComment(userAnime.comment || "");
                        }}
                      >
                        {userAnime.comment ? "Edit Comment" : "Add Comment"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="anime-actions">
                  {activeTab === "watched" ? (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleUpdateStatus(userAnime.anime.id, "planned")
                      }
                    >
                      Move to Plan to Watch
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        handleUpdateStatus(userAnime.anime.id, "watched")
                      }
                    >
                      Mark as Watched
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    onClick={() => handleRemoveFromList(userAnime.anime.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WatchList;
