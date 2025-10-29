const express = require("express");
const app = express();
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();
require("./Models/db");

const AuthRouter = require("./Routes/AuthRouter");
const productRouter = require("./Routes/productRouter");

const ORS_API_KEY = process.env.ORS_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ------------------------------
// Routes
// ------------------------------
app.use("/auth", AuthRouter);
app.use("/products", productRouter);

app.get("/ping", (req, res) => res.send("PING"));

// ------------------------------
// Helper Functions
// ------------------------------

// 1️⃣ Geocode a city name to coordinates (ORS Geocoding)
const geocodeCity = async (cityName) => {
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(cityName)}&size=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.features && data.features.length > 0) {
    const [lon, lat] = data.features[0].geometry.coordinates;
    return { lat, lon };
  }
  throw new Error(`Could not geocode: ${cityName}`);
};

// 2️⃣ Calculate distance (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 3️⃣ Fetch AQI from OpenWeather
const getAQI = async (lat, lon) => {
  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.list && data.list.length > 0) {
      return data.list[0].main.aqi;
    }
    return null;
  } catch (err) {
    console.error("AQI fetch error:", err.message);
    return null;
  }
};

// ------------------------------
// 🗺️ Route Finding Endpoint
// ------------------------------
app.post("/api/routes", async (req, res) => {
  const { start, end } = req.body;
  if (!start || !end) {
    return res.status(400).json({ message: "Start and End required" });
  }

  try {
    console.log(`🧭 Geocoding: ${start} → ${end}`);
    const startCoords = await geocodeCity(start);
    const endCoords = await geocodeCity(end);

    const distance = calculateDistance(
      startCoords.lat,
      startCoords.lon,
      endCoords.lat,
      endCoords.lon
    );

    console.log(`📏 Distance: ${distance.toFixed(2)} km`);

    // ORS allows alt routes only under ~100 km
    const allowAlternatives = distance <= 100;

    const directionsURL = `https://api.openrouteservice.org/v2/directions/driving-car/geojson?api_key=${ORS_API_KEY}`;

    const requestBody = {
      coordinates: [
        [startCoords.lon, startCoords.lat],
        [endCoords.lon, endCoords.lat],
      ],
    };

    if (allowAlternatives) {
      requestBody.alternative_routes = {
        share_factor: 0.6,
        target_count: 3,
        weight_factor: 1.4,
      };
    } else {
      console.log("⚠️ Long route detected – skipping alternative routes");
    }

    const directionsRes = await fetch(directionsURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/geo+json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await directionsRes.json();
    if (!data.features || data.features.length === 0) {
      return res.status(404).json({ message: "No routes found" });
    }

    console.log(`✅ Found ${data.features.length} route(s)`);

    const routesWithAQI = await Promise.all(
      data.features.map(async (feature) => {
        const coords = feature.geometry?.coordinates || [];
        const samplePoints = [coords[0], coords[coords.length - 1]];

        const aqiValues = await Promise.all(
          samplePoints.map(([lon, lat]) => getAQI(lat, lon))
        );

        const validAQIs = aqiValues.filter((v) => v !== null);
        const avgAQI =
          validAQIs.length > 0
            ? Math.round(validAQIs.reduce((a, b) => a + b, 0) / validAQIs.length)
            : 3;

        return {
          eta: Math.round(feature.properties.summary.duration / 60),
          distance: Math.round(feature.properties.summary.distance / 1000),
          aqi: avgAQI,
          coordinates: coords,
          name: "Alternative Route",
          summary: `${Math.round(
            feature.properties.summary.distance / 1000
          )} km, ${Math.round(feature.properties.summary.duration / 60)} min`,
          googleMapsUrl: encodeURI(
            `https://www.google.com/maps/dir/?api=1&origin=${startCoords.lat},${startCoords.lon}&destination=${endCoords.lat},${endCoords.lon}&travelmode=driving`
          ),
        };
      })
    );

    // Sort for labels
    const fastest = [...routesWithAQI].sort((a, b) => a.eta - b.eta)[0];
    const cleanest = [...routesWithAQI].sort((a, b) => a.aqi - b.aqi)[0];

    routesWithAQI.forEach((r) => {
      if (r === fastest) r.name = "Fastest Route";
      else if (r === cleanest) r.name = "Cleanest Air Route";
    });

    res.json({ routes: routesWithAQI });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

// ------------------------------
// Server
// ------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 ORS Key: ${ORS_API_KEY ? "✓ Set" : "✗ Missing"}`);
  console.log(`🔑 OpenWeather Key: ${OPENWEATHER_API_KEY ? "✓ Set" : "✗ Missing"}`);
});
