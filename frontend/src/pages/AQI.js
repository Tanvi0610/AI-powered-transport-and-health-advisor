import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const AQIMarkerIcon = (aqi) => {
  let color = "green";
  if (aqi > 100) color = "orange";
  if (aqi > 200) color = "red";

  return new L.Icon({
    iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=${aqi}|${color}|000000`,
    iconSize: [35, 55],
  });
};

function AQIChart() {
  const [city, setCity] = useState("");
  const [chartData, setChartData] = useState(null);
  const [peak, setPeak] = useState(null);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchHistoricalData = async () => {
    if (!city.trim()) {
      setError("Please enter a city.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://127.0.0.1:5000/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
      const data = await response.json();

      if (!data || !data.timestamps?.length) {
        setError("No data found for this city.");
        setLoading(false);
        return;
      }

      // Fetch city coordinates using OpenWeather API
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=fc77b14684513ef027f4902b8f9d24a1`
      );
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        setCoords([geoData[0].lat, geoData[0].lon]);
      }

      setChartData({
        labels: data.timestamps.map((t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        datasets: [
          {
            label: "Temperature (°C)",
            data: data.temperature,
            borderColor: "#FF5733",
            tension: 0.3,
            fill: false,
          },
          {
            label: "Humidity (%)",
            data: data.humidity,
            borderColor: "#007BFF",
            tension: 0.3,
            fill: false,
          },
          {
            label: "Wind Speed (m/s)",
            data: data.wind_speed,
            borderColor: "#28A745",
            tension: 0.3,
            fill: false,
          },
          {
            label: "AQI",
            data: data.aqi,
            borderColor: "#FFC107",
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      });

      setPeak({
        time: data.peak_time,
        aqi: data.peak_aqi,
      });
    } catch (err) {
      setError("Failed to fetch data");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 className="text-2xl font-bold mb-3">🌫️ Air Quality Index (AQI) Predictor</h2>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: "6px 8px", marginRight: "10px", borderRadius: "5px", border: "1px solid gray" }}
        />
        <button
          onClick={fetchHistoricalData}
          disabled={loading}
          style={{
            padding: "6px 12px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {loading ? "Loading..." : "Get AQI"}
        </button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {coords && (
        <div style={{ height: "400px", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
          <MapContainer center={coords} zoom={10} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution="© OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {peak && (
              <Marker position={coords} icon={AQIMarkerIcon(Math.round(peak.aqi || 0))}>
                <Popup>
                  <b>{city.toUpperCase()}</b><br />
                  Peak AQI: {peak.aqi ? peak.aqi.toFixed(2) : "N/A"}<br />
                  Time: {peak.time || "N/A"}
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}

      {chartData && (
        <div style={{ background: "#fafafa", padding: "20px", borderRadius: "10px", boxShadow: "0 0 8px rgba(0,0,0,0.1)" }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: `AQI and Weather Trends for ${city}` },
              },
              scales: {
                y: {
                  type: "linear",
                  position: "left",
                  title: { display: true, text: "Temp/Humidity/Wind" },
                },
                y1: {
                  type: "linear",
                  position: "right",
                  grid: { drawOnChartArea: false },
                  title: { display: true, text: "AQI" },
                },
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AQIChart;
