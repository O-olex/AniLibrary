import React from "react";
import "../styles/AnimeFilters.css";

const AnimeFilters = ({ filters, onFilterChange }) => {
  const genres = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
  ];

  const years = Array.from({ length: 2024 - 1970 + 1 }, (_, i) => 2024 - i);

  const statuses = ["ONGOING", "COMPLETED", "UPCOMING"];

  return (
    <div className="anime-filters">
      <div className="filter-group">
        <label>Genre:</label>
        <select
          value={filters.genre || ""}
          onChange={(e) => onFilterChange("genre", e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Year:</label>
        <select
          value={filters.year || ""}
          onChange={(e) => onFilterChange("year", e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Status:</label>
        <select
          value={filters.status || ""}
          onChange={(e) => onFilterChange("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-secondary"
        onClick={() => {
          onFilterChange("genre", "");
          onFilterChange("year", "");
          onFilterChange("status", "");
        }}
      >
        Clear Filters
      </button>
    </div>
  );
};

export default AnimeFilters;
