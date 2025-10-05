import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "1rem", background: "#282c34", color: "white" }}>
      <Link to="/" style={{ margin: "0 1rem", color: "white" }}>
        Home
      </Link>
      <Link to="/routes" style={{ margin: "0 1rem", color: "white" }}>
        Routes
      </Link>
      <Link to="/aqi" style={{ margin: "0 1rem", color: "white" }}>
        AQI
      </Link>
      <Link to="/health" style={{ margin: "0 1rem", color: "white" }}>
        Health
      </Link>
      <Link to="/login" style={{ margin: "0 1rem", color: "white" }}>
        Login
      </Link>
      <Link to="/signup" style={{ margin: "0 1rem", color: "white" }}>
        Signup
      </Link>
    </nav>
  );
}

export default Navbar;
