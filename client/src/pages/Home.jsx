import { Link } from "react-router-dom";
import "../styles/Home.css";

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to AniLibrary</h1>
        <p>Track, rate, and discover your favorite anime series</p>
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Track Your Anime</h3>
            <p>
              Keep track of what you're watching, plan to watch, and have
              completed
            </p>
          </div>
          <div className="feature-card">
            <h3>Rate & Review</h3>
            <p>Share your thoughts and ratings for the anime you've watched</p>
          </div>
          <div className="feature-card">
            <h3>Discover New Series</h3>
            <p>Browse through our extensive collection of anime series</p>
          </div>
          <div className="feature-card">
            <h3>Personal Lists</h3>
            <p>Create and manage your personal anime watchlist</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Get Started Today</h2>
        <p>Join our community and start tracking your anime journey!</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Sign Up Now
          </Link>
          <Link to="/anime" className="btn btn-secondary">
            Browse Anime
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
