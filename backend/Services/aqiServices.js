import axios from "axios";

const FLASK_API_BASE = "http://127.0.0.1:5000"; // Flask server URL

export const getPredictedAqiSeries = async (lat, lon) => {
  try {
    const res = await axios.get(`${FLASK_API_BASE}/predict_aqi_series`, {
      params: { lat, lon },
    });
    return res.data;
  } catch (err) {
    console.error("Error fetching AQI prediction:", err.message);
    throw new Error("Failed to fetch AQI prediction");
  }
};
