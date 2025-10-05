import { Route, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import RoutesPage from "./pages/Routes";
import AQI from "./pages/AQI";
import Health from "./pages/Health";

import RefreshHandler from "./refreshHandler";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const PrivateRoute = ({ element }) => {
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <div className="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes */}
        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
        <Route
          path="/routes"
          element={<PrivateRoute element={<RoutesPage />} />}
        />
        <Route path="/aqi" element={<PrivateRoute element={<AQI />} />} />
        <Route path="/health" element={<PrivateRoute element={<Health />} />} />
      </Routes>
    </div>
  );
}

export default App;
