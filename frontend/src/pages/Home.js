import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Home.css";

function Home() {
  const [loggedInUser, setLoggedInUser] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (user) {
      setLoggedInUser(user);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    toast.success("Logged out");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo-section">
          <img
            src="/logo.png" // 👈 Replace with your real logo or use placeholder
            alt="EcoGuardian Logo"
            className="logo"
          />
          <h1 className="brand-name">EcoGuardian</h1>
        </div>

        <div className="user-section">
          <span>Hello, {loggedInUser} 👋</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="intro">
        <p>
          Welcome to your AI-powered health and transport assistant. Plan
          cleaner routes, monitor air quality, and get personalized health tips
          — all in one place.
        </p>
      </section>

      <section className="cards">
        <Link to="/routes" className="card">
          <h3>🛣 AI Transport Advisor</h3>
          <p>Find the best route for your health and the planet.</p>
        </Link>

        <Link to="/aqi" className="card">
          <h3>🌫 Live Air Quality</h3>
          <p>Check AQI for your current or target location.</p>
        </Link>

        <Link to="/health" className="card">
          <h3>💊 Health Tips</h3>
          <p>Daily personalized suggestions based on your environment.</p>
        </Link>
      </section>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} AI Health & Transport Advisor</p>
      </footer>

      <ToastContainer />
    </div>
  );
}

export default Home;
