import { getPredictedAqiSeries } from "../services/aqiService.js";

export const getAqiPredictions = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ message: "Latitude and longitude required" });
    }

    const data = await getPredictedAqiSeries(lat, lon);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getAqiPredictions:", error);
    res.status(500).json({ message: "Error fetching AQI predictions" });
  }
};
