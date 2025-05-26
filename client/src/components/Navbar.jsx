import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          AniLibrary
        </Link>
      </div>

      <div className="navbar-menu">
        <Link to="/" className="navbar-item">
          Home
        </Link>
        <Link to="/anime" className="navbar-item">
          Anime List
        </Link>
        {user && (
          <Link to="/watchlist" className="navbar-item">
            Watch List
          </Link>
        )}
        {user?.isAdmin && (
          <Link to="/admin" className="navbar-item">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="navbar-auth">
        {user ? (
          <div className="auth-buttons">
            <span className="navbar-item">Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
