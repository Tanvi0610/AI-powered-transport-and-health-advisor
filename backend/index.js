const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");

const AuthRouter = require("./Routes/AuthRouter");
const productRouter = require("./Routes/productRouter");

require("dotenv").config();
require("./Models/db");

const ORS_API_KEY = process.env.ORS_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes
app.use("/auth", AuthRouter);
app.use("/products", productRouter);

app.get("/ping", (req, res) => {
  res.send("PING");
});

// ============================================
// ROUTE FINDING HELPER FUNCTIONS
// ============================================

// Geocode city name to coordinates using ORS
const geocodeCity = async (cityName) => {
  try {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
      cityName
    )}&size=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [lon, lat] = data.features[0].geometry.coordinates;
      return { lon, lat };
    }
    throw new Error(`Could not geocode: ${cityName}`);
  } catch (err) {
    console.error(`Geocoding error for ${cityName}:`, err);
    throw err;
  }
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get AQI from OpenWeather
const getAQI = async (lat, lon) => {
  try {
    console.log(`Fetching AQI for coordinates: ${lat}, ${lon}`);
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    console.log(`AQI Response for ${lat},${lon}:`, JSON.stringify(data));

    if (data.cod && data.cod !== 200) {
      console.error(`AQI API Error: ${data.message}`);
      return null;
    }

    if (data.list && data.list.length > 0) {
      const aqi = data.list[0].main.aqi;
      console.log(`AQI value: ${aqi}`);
      return aqi;
    }

    console.warn("No AQI data in response");
    return null;
  } catch (err) {
    console.error("Error fetching AQI:", err.message);
    return null;
  }
};

// Calculate average AQI for a route
const getRouteAQI = async (coordinates) => {
  try {
    if (!coordinates || coordinates.length === 0) {
      console.log("No coordinates provided for AQI calculation");
      return null;
    }

    console.log(`Calculating AQI for route with ${coordinates.length} points`);

    // Sample 3 points: start, middle, end
    const sampleIndices = [
      0,
      Math.floor(coordinates.length / 2),
      coordinates.length - 1,
    ];

    const samplePoints = sampleIndices.map((i) => coordinates[i]);
    console.log("Sample points (lon,lat):", samplePoints);

    // ORS returns [lon, lat], but getAQI expects (lat, lon)
    const aqiValues = await Promise.all(
      samplePoints.map((point) => {
        const lon = point[0];
        const lat = point[1];
        console.log(`Calling getAQI with lat=${lat}, lon=${lon}`);
        return getAQI(lat, lon);
      })
    );

    console.log("AQI values collected:", aqiValues);

    const validAQIs = aqiValues.filter(
      (aqi) => aqi !== null && aqi !== undefined
    );

    if (validAQIs.length === 0) {
      console.warn("No valid AQI values found");
      return null;
    }

    const avgAQI = Math.round(
      validAQIs.reduce((sum, aqi) => sum + aqi, 0) / validAQIs.length
    );

    console.log(
      `Average AQI: ${avgAQI} (from ${validAQIs.length} valid readings)`
    );
    return avgAQI;
  } catch (err) {
    console.error("Error calculating route AQI:", err);
    return null;
  }
};

// ============================================
// ROUTE FINDING ENDPOINT
// ============================================
app.post("/api/routes", async (req, res) => {
  const { start, end } = req.body;

  console.log("Received request:", { start, end });

  if (!start || !end) {
    return res.status(400).json({ message: "Start and End required" });
  }

  if (!ORS_API_KEY) {
    return res.status(500).json({ message: "ORS API key not configured" });
  }

  if (!OPENWEATHER_API_KEY) {
    return res
      .status(500)
      .json({ message: "OpenWeather API key not configured" });
  }

  try {
    console.log("Geocoding locations...");
    const startCoords = await geocodeCity(start);
    const endCoords = await geocodeCity(end);

    console.log("Start coords:", startCoords);
    console.log("End coords:", endCoords);

    const distance = calculateDistance(
      startCoords.lat,
      startCoords.lon,
      endCoords.lat,
      endCoords.lon
    );
    console.log(`Route distance: ${distance.toFixed(2)} km`);

    const directionsURL = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}`;

    let coordinates = [
      [startCoords.lon, startCoords.lat],
      [endCoords.lon, endCoords.lat],
    ];

    if (distance > 140) {
      const midLat = (startCoords.lat + endCoords.lat) / 2;
      const midLon = (startCoords.lon + endCoords.lon) / 2;
      coordinates = [
        [startCoords.lon, startCoords.lat],
        [midLon, midLat],
        [endCoords.lon, endCoords.lat],
      ];
      console.log("Added waypoint for long route");
    }

    const requestBody = {
      coordinates: coordinates,
      alternative_routes:
        distance > 140
          ? undefined
          : {
              share_factor: 0.6,
              target_count: 3,
              weight_factor: 1.4,
            },
      format: "json",
    };

    console.log("Fetching routes from OpenRouteService...");
    const directionsRes = await fetch(directionsURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const directionsData = await directionsRes.json();

    if (directionsData.error) {
      console.error("ORS Error:", directionsData.error);
      return res.status(500).json({
        message: "Error fetching directions",
        error: directionsData.error.message || "Unknown error",
      });
    }

    if (!directionsData.routes || directionsData.routes.length === 0) {
      return res.status(404).json({ message: "No routes found" });
    }

    console.log(`Found ${directionsData.routes.length} routes`);

    const routesWithAQI = await Promise.all(
      directionsData.routes.map(async (route) => {
        const coordinates = route.geometry?.coordinates || [];
        const aqi =
          coordinates.length > 0 ? await getRouteAQI(coordinates) : null;

        return {
          eta: Math.round(route.summary.duration / 60),
          distance: Math.round(route.summary.distance / 1000),
          aqi,
          coordinates: coordinates,
          summary: `${Math.round(
            route.summary.distance / 1000
          )} km, ${Math.round(route.summary.duration / 60)} min`,
        };
      })
    );

    const sortedByETA = [...routesWithAQI].sort((a, b) => a.eta - b.eta);
    const sortedByAQI = [...routesWithAQI]
      .filter((r) => r.aqi !== null)
      .sort((a, b) => a.aqi - b.aqi);

    const routes = routesWithAQI.map((route) => {
      let name = "Alternative Route";

      if (route.eta === sortedByETA[0].eta) {
        name = "Fastest Route";
      } else if (
        route.aqi &&
        sortedByAQI.length > 0 &&
        route.aqi === sortedByAQI[0].aqi
      ) {
        name = "Cleanest Air Route";
      } else if (sortedByAQI.length > 0) {
        const etaScore = route.eta / sortedByETA[0].eta;
        const aqiScore = route.aqi ? route.aqi / sortedByAQI[0].aqi : 2;
        route.balancedScore = etaScore * 0.6 + aqiScore * 0.4;
      }

      return { ...route, name };
    });

    const routesWithScores = routes.filter((r) => r.balancedScore);
    if (routesWithScores.length > 0) {
      const bestBalanced = routesWithScores.sort(
        (a, b) => a.balancedScore - b.balancedScore
      )[0];
      if (bestBalanced.name === "Alternative Route") {
        bestBalanced.name = "Balanced Route";
      }
    }

    routes.forEach((route) => delete route.balancedScore);

    console.log("Sending routes:", routes.length);
    res.json({ routes });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`🔑 ORS API Key: ${ORS_API_KEY ? "✓ Set" : "✗ Not set"}`);
  console.log(
    `🔑 OpenWeather API Key: ${OPENWEATHER_API_KEY ? "✓ Set" : "✗ Not set"}`
  );
});
