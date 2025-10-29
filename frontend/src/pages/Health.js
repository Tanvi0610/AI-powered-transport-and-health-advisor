import React, { useState } from "react";

function Health() {
  const [city, setCity] = useState("");
  const [aqi, setAqi] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(""); // Error state for fetch errors

  const fetchRecommendations = async () => {
    setError(""); // Clear prior errors
    try {
      const response = await fetch("http://127.0.0.1:5001/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, aqi: parseFloat(aqi) }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Failed to fetch data. Please check console for details and try again.");
      setRecommendations([]);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Health Recommendations</h1>

      <input
        type="text"
        placeholder="Enter City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="border p-2 rounded mr-2"
      />  
      <button
        onClick={fetchRecommendations}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Get Tips
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {recommendations.length > 0 ? (
        <div className="mt-4 max-w-md mx-auto bg-white border border-gray-300 p-6 rounded-lg shadow-md overflow-auto" style={{ maxHeight: "300px" }}>
          <h2 className="font-semibold mb-3 text-lg">Recommendations:</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-800">
            {recommendations.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-gray-600">No recommendations to display</p>
      )}
    </div>
  );
}

export default Health;
