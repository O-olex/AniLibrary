import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/AdminPanel.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/admin/users");
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.response?.data?.message || "Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleAdmin = async (userId, currentIsAdmin) => {
    try {
      await axios.put(`/api/admin/users/${userId}/role`, {
        isAdmin: !currentIsAdmin,
      });
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, isAdmin: !user.isAdmin } : user
        )
      );
    } catch (err) {
      console.error("Error updating user role:", err);
      alert(err.response?.data?.message || "Failed to update user role");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!users.length) {
    return <div className="no-users">No users found</div>;
  }

  return (
    <div className="user-management">
      <h2>User Management</h2>
      <div className="user-list">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.isAdmin ? "Admin" : "User"}</td>
                <td>
                  <div className="user-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                    >
                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && searchTerm && (
          <div className="no-results">No users found matching your search.</div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
