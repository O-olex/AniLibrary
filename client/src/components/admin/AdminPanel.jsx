import React from "react";
import UserManagement from "./UserManagement";
import "../../styles/AdminPanel.css";

const AdminPanel = () => {
  return (
    <div className="page-container">
      <h1>Admin Panel</h1>
      <div className="tab-content">
        <div className="tab-pane">
          <UserManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
