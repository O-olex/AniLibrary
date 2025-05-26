import React, { useState } from "react";
import AnimeManagement from "./AnimeManagement";
import UserManagement from "./UserManagement";
import "../../styles/AdminPanel.css";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("anime");

  return (
    <div className="page-container">
      <h1>Admin Panel</h1>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "anime" ? "active" : ""}`}
          onClick={() => setActiveTab("anime")}
        >
          Anime Management
        </button>
        <button
          className={`tab-button ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "anime" ? (
          <div className="tab-pane">
            <AnimeManagement />
          </div>
        ) : (
          <div className="tab-pane">
            <UserManagement />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
