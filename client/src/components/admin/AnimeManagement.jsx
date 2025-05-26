import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/AnimeManagement.css";

const AnimeManagement = () => {
  const [animes, setAnimes] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    releaseYear: "",
    episodes: "",
    image: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAnimes();
  }, [currentPage]);

  const fetchAnimes = async () => {
    try {
      const response = await axios.get(`/api/anime?page=${currentPage}`);
      setAnimes(response.data.anime);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error fetching animes:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      image: e.target.files[0],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      if (editingId) {
        await axios.put(`/api/anime/${editingId}`, formDataToSend);
      } else {
        await axios.post("/api/anime", formDataToSend);
      }

      fetchAnimes();
      resetForm();
    } catch (error) {
      console.error("Error saving anime:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this anime?")) {
      try {
        await axios.delete(`/api/admin/anime/${id}`);
        fetchAnimes();
      } catch (error) {
        console.error("Error deleting anime:", error);
      }
    }
  };

  const handleEdit = (anime) => {
    setEditingId(anime.id);
    setFormData({
      title: anime.title,
      description: anime.description,
      genre: anime.genre,
      releaseYear: anime.releaseYear,
      episodes: anime.episodes,
      image: null,
    });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      genre: "",
      releaseYear: "",
      episodes: "",
      image: null,
    });
    setEditingId(null);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="anime-management">
      <h2>{editingId ? "Edit Anime" : "Add New Anime"}</h2>

      <form onSubmit={handleSubmit} className="anime-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="genre">Genre</label>
          <input
            type="text"
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="releaseYear">Release Year</label>
          <input
            type="number"
            id="releaseYear"
            name="releaseYear"
            value={formData.releaseYear}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="episodes">Episodes</label>
          <input
            type="number"
            id="episodes"
            name="episodes"
            value={formData.episodes}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? "Update Anime" : "Add Anime"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>Anime List</h2>
      <div className="anime-list">
        {animes && animes.length > 0 ? (
          <>
            {animes.map((anime) => (
              <div key={anime.id} className="anime-item">
                <div className="anime-info">
                  <h3>{anime.title}</h3>
                  <p>{anime.description}</p>
                  <p>
                    Genre:{" "}
                    {Array.isArray(anime.genre)
                      ? anime.genre.join(", ")
                      : anime.genre}
                  </p>
                  <p>Release Year: {anime.releaseYear}</p>
                  <p>Episodes: {anime.episodes}</p>
                </div>
                <div className="anime-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(anime)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(anime.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            <div className="pagination">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p>No anime found.</p>
        )}
      </div>
    </div>
  );
};

export default AnimeManagement;
