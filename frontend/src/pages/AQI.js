import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ChartJS registration
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Legend, Tooltip, Filler);

// Custom Map Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

function AQIChart() {
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const [peak, setPeak] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [forecast, setForecast] = useState(null);

  const fetchHistoricalData = async () => {
    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }
    setLoading(true);
    setError("");
    setData(null);
    setPeak(null);
    setCoords(null);
    setForecast(null);

    try {
      const histRes = await fetch("http://127.0.0.1:5000/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
      const histData = await histRes.json();

      if (histData.error) throw new Error(histData.error);

<<<<<<< HEAD
      // Fetch city coordinates using OpenWeather API
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=Your_api_key`
      );
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        setCoords([geoData[0].lat, geoData[0].lon]);
      }

      setChartData({
        labels: data.timestamps.map((t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
=======
      setData({
        labels: histData.timestamps,
>>>>>>> 96e15b1 (finallll)
        datasets: [
          {
            label: "Temperature (°C)",
            data: histData.temperature,
            borderColor: "#ff6384",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Humidity (%)",
            data: histData.humidity,
            borderColor: "#36a2eb",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "Wind Speed (m/s)",
            data: histData.wind_speed,
            borderColor: "#4bc0c0",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: "AQI",
            data: histData.aqi,
            borderColor: "#ff9f40",
            backgroundColor: "rgba(255, 159, 64, 0.2)",
            borderDash: [6, 4],
            yAxisID: "y1",
            tension: 0.4,
            fill: true,
          },
        ],
      });

      setPeak({
        aqi: histData.peak_aqi,
        time: histData.peak_time,
      });

      if (histData.coordinates) setCoords(histData.coordinates);

      const forecastRes = await fetch("http://127.0.0.1:5000/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });

      if (forecastRes.ok) {
        const forecastData = await forecastRes.json();
        setForecast(forecastData.forecast);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Try again later.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "95vw",
        margin: "auto",
        boxSizing: "border-box",
      }}
    >
      <h2 style={{ marginBottom: "15px", textAlign: "center" }}>
        🌆 Air Quality & Weather Tracker
      </h2>

      {/* Input Section */}
      <div
        style={{
          marginBottom: "15px",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            minWidth: "220px",
          }}
        />
        <button
          onClick={fetchHistoricalData}
          disabled={loading}
          style={{
            padding: "10px 15px",
            borderRadius: "6px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Get Data"}
        </button>
      </div>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      {/* Peak AQI Info */}
      {peak && (
        <p style={{ textAlign: "center", marginBottom: "15px" }}>
          🌍 <strong>{city.toUpperCase()}</strong> — Peak AQI:{" "}
          <strong>{peak.aqi ? peak.aqi.toFixed(2) : "N/A"}</strong> at{" "}
          <strong>{peak.time || "N/A"}</strong>
        </p>
      )}

      {/* Chart Section */}
      {data && (
        <div
          style={{
            height: "350px",
            width: "100%",
            background: "#fafafa",
            borderRadius: "10px",
            padding: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Line
            key={city}
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: "top" },
                title: {
                  display: true,
                  text: `24-Hour Weather & AQI Trend for ${city}`,
                  font: { size: 16 },
                },
              },
              scales: {
                x: {
                  ticks: { maxTicksLimit: 8 },
                  title: { display: true, text: "Time (Hours)" },
                },
                y: {
                  type: "linear",
                  position: "left",
                  title: { display: true, text: "Temp / Humidity / Wind" },
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

      {/* Map Section */}
      {coords && (
        <div
          style={{
            height: "400px",
            width: "100%",
            marginTop: "30px",
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <MapContainer
            key={`${coords.lat}-${coords.lon}`}
            center={[coords.lat, coords.lon]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[coords.lat, coords.lon]} icon={markerIcon}>
              <Popup>
                <strong>📍 {city.toUpperCase()}</strong>
                <br />
                🌫️ Peak AQI: {peak?.aqi?.toFixed(2)}
                <br />
                🕓 Time: {peak?.time}
                {forecast && (
                  <>
                    <hr />
                    <b>Next 2-Hour AQI Forecast:</b>
                    <ul style={{ paddingLeft: "15px", margin: "5px 0" }}>
                      {forecast.map((f, i) => (
                        <li key={i}>
                          {f.time} → {f.predicted_aqi}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default AQIChart;
