const fetch = require("node-fetch");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Get AQI from OpenWeather
const getAQI = async (lat, lon) => {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
    );
    const fetch = require("node-fetch");

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    // Get AQI from OpenWeather
    const getAQI = async (lat, lon) => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
        );
        const data = await res.json();

        if (!data.list || data.list.length === 0) {
          console.error("No AQI data available");
          return null;
        }

        return data.list[0].main.aqi;
      } catch (err) {
        console.error("Error fetching AQI:", err);
        return null;
      }
    };

    // Calculate average AQI for a route by sampling multiple points
    const getRouteAQI = async (steps) => {
      try {
        // Sample AQI at start, middle, and end of route for better accuracy
        const samplePoints = [
          steps[0].start_location, // Start
          steps[Math.floor(steps.length / 2)].start_location, // Middle
          steps[steps.length - 1].end_location, // End
        ];

        const aqiValues = await Promise.all(
          samplePoints.map((point) => getAQI(point.lat, point.lng))
        );

        // Filter out null values and calculate average
        const validAQIs = aqiValues.filter((aqi) => aqi !== null);

        if (validAQIs.length === 0) return null;

        return Math.round(
          validAQIs.reduce((sum, aqi) => sum + aqi, 0) / validAQIs.length
        );
      } catch (err) {
        console.error("Error calculating route AQI:", err);
        return null;
      }
    };

    const getRoutes = async (req, res) => {
      const { start, end } = req.body;

      if (!start || !end) {
        return res.status(400).json({ message: "Start and End required" });
      }

      try {
        const directionsURL = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          start
        )}&destination=${encodeURIComponent(
          end
        )}&alternatives=true&key=${GOOGLE_API_KEY}`;

        const directionsRes = await fetch(directionsURL);
        const directionsData = await directionsRes.json();

        if (directionsData.status !== "OK") {
          return res.status(500).json({
            message: "Error fetching directions",
            error: directionsData.error_message || directionsData.status,
          });
        }

        if (!directionsData.routes || directionsData.routes.length === 0) {
          return res.status(404).json({ message: "No routes found" });
        }

        // Fetch AQI for all routes
        const routesWithAQI = await Promise.all(
          directionsData.routes.slice(0, 3).map(async (route) => {
            const leg = route.legs[0];
            const steps = leg.steps;
            const aqi = await getRouteAQI(steps);

            return {
              eta: Math.round(leg.duration.value / 60), // ETA in minutes
              distance: Math.round(leg.distance.value / 1000), // Distance in km
              aqi,
              overview_polyline: route.overview_polyline.points,
              summary: route.summary || "Route",
            };
          })
        );

        // Sort and label routes
        const sortedByETA = [...routesWithAQI].sort((a, b) => a.eta - b.eta);
        const sortedByAQI = [...routesWithAQI]
          .filter((r) => r.aqI !== null)
          .sort((a, b) => a.aqi - b.aqi);

        // Assign names based on characteristics
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
            // Calculate a balanced score (normalize and weight)
            const etaScore = route.eta / sortedByETA[0].eta;
            const aqiScore = route.aqi ? route.aqi / sortedByAQI[0].aqi : 2;
            const balancedScore = etaScore * 0.6 + aqiScore * 0.4;

            route.balancedScore = balancedScore;
          }

          return { ...route, name };
        });

        // Find the most balanced route if none are labeled as such
        const hasBalanced = routes.some((r) => r.name === "Alternative Route");
        if (hasBalanced && routes.length >= 3) {
          const routesWithScores = routes.filter((r) => r.balancedScore);
          if (routesWithScores.length > 0) {
            const bestBalanced = routesWithScores.sort(
              (a, b) => a.balancedScore - b.balancedScore
            )[0];
            bestBalanced.name = "Balanced Route";
          }
        }

        // Clean up temporary properties
        routes.forEach((route) => delete route.balancedScore);

        res.json({ routes });
      } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
      }
    };

    module.exports = { getRoutes };
    const data = await res.json();
    return data.list[0].main.aqi;
  } catch (err) {
    console.error("Error fetching AQI:", err);
    return null;
  }
};

const getRoutes = async (req, res) => {
  const { start, end } = req.body;
  if (!start || !end)
    return res.status(400).json({ message: "Start and End required" });

  try {
    const directionsURL = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      start
    )}&destination=${encodeURIComponent(
      end
    )}&alternatives=true&key=${GOOGLE_API_KEY}`;

    const directionsRes = await fetch(directionsURL);
    const directionsData = await directionsRes.json();

    if (directionsData.status !== "OK") {
      return res.status(500).json({ message: "Error fetching directions" });
    }

    const routes = await Promise.all(
      directionsData.routes.slice(0, 3).map(async (route, index) => {
        const leg = route.legs[0];
        const steps = leg.steps;
        const midStep = steps[Math.floor(steps.length / 2)];
        const midpoint = midStep.start_location;

        const aqi = await getAQI(midpoint.lat, midpoint.lng);
        const name =
          index === 0 ? "Best ETA" : index === 1 ? "Lowest AQI" : "Balanced";

        return {
          name,
          eta: Math.round(leg.duration.value / 60),
          aqi,
          overview_polyline: route.overview_polyline.points,
        };
      })
    );

    res.json({ routes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getRoutes };
