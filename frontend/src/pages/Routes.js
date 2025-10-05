import React, { useState } from "react";

export default function RouteFinder() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAQILabel = (aqi) => {
    if (!aqi) return "N/A";
    if (aqi === 1) return "Good";
    if (aqi === 2) return "Fair";
    if (aqi === 3) return "Moderate";
    if (aqi === 4) return "Poor";
    return "Very Poor";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRoutes([]);
    setSelectedRoute(null);

    if (!startLocation.trim() || !endLocation.trim()) {
      setError("Please enter both start and end locations");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          start: startLocation,
          end: endLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Server returned ${response.status}`
        );
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        setRoutes(data.routes);
        setSelectedRoute(0); // Auto-select first route
      } else {
        setError("No routes found between these locations");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(
        `Connection failed: ${err.message}. Make sure your backend server is running on port 8080.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = (index) => {
    setSelectedRoute(index);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right, #dcfce7, #f0fdf4, #ecfccb)",
        padding: "1.5rem 1rem",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.75rem" }}>🧭</span>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                color: "#065f46",
                margin: 0,
              }}
            >
              EcoRoute Finder
            </h1>
          </div>
          <p style={{ color: "#047857", fontSize: "0.9rem", margin: 0 }}>
            Find the best route considering air quality
          </p>
        </div>

        {/* Search Form */}
        <div
          style={{
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ marginBottom: "0.875rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.375rem",
              }}
            >
              Starting Location
            </label>
            <input
              type="text"
              placeholder="e.g., Kothrud, Pune"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div style={{ marginBottom: "0.875rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151",
                marginBottom: "0.375rem",
              }}
            >
              Destination
            </label>
            <input
              type="text"
              placeholder="e.g., Kondhwa, Pune"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10b981")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#9ca3af" : "#10b981",
              color: "white",
              fontWeight: "600",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
            }}
            onMouseOver={(e) =>
              !loading && (e.target.style.background = "#059669")
            }
            onMouseOut={(e) =>
              !loading && (e.target.style.background = "#10b981")
            }
          >
            {loading ? (
              <>
                <div
                  style={{
                    width: "1rem",
                    height: "1rem",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                Finding Routes...
              </>
            ) : (
              <>🗺️ Find Routes</>
            )}
          </button>

          {error && (
            <div
              style={{
                marginTop: "0.875rem",
                padding: "0.875rem",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "0.5rem",
              }}
            >
              <p style={{ color: "#991b1b", fontSize: "0.8rem", margin: 0 }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Routes List */}
        {routes.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#065f46",
                  margin: 0,
                }}
              >
                Available Routes
              </h2>
              {selectedRoute !== null && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "#047857",
                    background: "#d1fae5",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontWeight: "500",
                  }}
                >
                  ✓ Route {selectedRoute + 1} Selected
                </span>
              )}
            </div>

            {routes.map((route, index) => (
              <div
                key={index}
                onClick={() => handleSelectRoute(index)}
                style={{
                  background: selectedRoute === index ? "#d1fae5" : "white",
                  border:
                    selectedRoute === index
                      ? "2px solid #3e6c3d"
                      : "2px solid transparent",
                  borderRadius: "0.75rem",
                  boxShadow:
                    selectedRoute === index
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "0 2px 4px rgba(0,0,0,0.1)",
                  padding: "1.25rem",
                  marginBottom: "0.875rem",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  position: "relative",
                }}
                onMouseOver={(e) => {
                  if (selectedRoute !== index) {
                    e.currentTarget.style.boxShadow =
                      "0 4px 8px rgba(0,0,0,0.15)";
                    e.currentTarget.style.borderColor = "#10b981";
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedRoute !== index) {
                    e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0,0,0,0.1)";
                    e.currentTarget.style.borderColor = "transparent";
                  }
                }}
              >
                {selectedRoute === index && (
                  <div
                    style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: "#10b981",
                      color: "white",
                      borderRadius: "50%",
                      width: "1.5rem",
                      height: "1.5rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                    }}
                  >
                    ✓
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "0.875rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: "bold",
                        color: "#065f46",
                        margin: "0 0 0.25rem 0",
                      }}
                    >
                      {route.name}
                    </h3>
                    {route.summary && typeof route.summary === "string" && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {route.summary}
                      </p>
                    )}
                  </div>
                  <div
                    style={{
                      color: "white",
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      marginLeft: "1rem",
                      backgroundColor:
                        route.aqi <= 2
                          ? "#22c55e"
                          : route.aqi <= 3
                          ? "#eab308"
                          : route.aqi <= 4
                          ? "#f97316"
                          : route.aqi
                          ? "#ef4444"
                          : "#6b7280",
                    }}
                  >
                    AQI: {route.aqi || "N/A"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      background:
                        selectedRoute === index ? "#a7f3d0" : "#d1fae5",
                      borderRadius: "0.5rem",
                      padding: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>⏱️</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#065f46",
                          fontWeight: "500",
                        }}
                      >
                        ETA
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#065f46",
                        margin: 0,
                      }}
                    >
                      {route.eta} min
                    </p>
                  </div>

                  <div
                    style={{
                      background:
                        selectedRoute === index ? "#a7f3d0" : "#d1fae5",
                      borderRadius: "0.5rem",
                      padding: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>📍</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#065f46",
                          fontWeight: "500",
                        }}
                      >
                        Distance
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#065f46",
                        margin: 0,
                      }}
                    >
                      {route.distance} km
                    </p>
                  </div>

                  <div
                    style={{
                      background:
                        route.aqi <= 2
                          ? selectedRoute === index
                            ? "#86efac"
                            : "#d1fae5"
                          : route.aqi <= 3
                          ? "#fef9c3"
                          : route.aqi <= 4
                          ? "#fed7aa"
                          : route.aqi
                          ? "#fecaca"
                          : "#f3f4f6",
                      borderRadius: "0.5rem",
                      padding: "0.625rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span style={{ fontSize: "0.875rem" }}>💨</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "#065f46",
                          fontWeight: "500",
                        }}
                      >
                        Air Quality
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#065f46",
                        margin: 0,
                      }}
                    >
                      {getAQILabel(route.aqi)}
                    </p>
                  </div>
                </div>

                {selectedRoute === index && (
                  <button
                    style={{
                      marginTop: "0.875rem",
                      width: "100%",
                      background: "#10b981",
                      color: "white",
                      fontWeight: "600",
                      padding: "0.625rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                    onMouseOver={(e) => (e.target.style.background = "#059669")}
                    onMouseOut={(e) => (e.target.style.background = "#10b981")}
                  >
                    🚗 Start Navigation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && routes.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <span
              style={{
                fontSize: "3rem",
                display: "block",
                marginBottom: "0.75rem",
                opacity: 0.3,
              }}
            >
              🧭
            </span>
            <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
              Enter locations to find eco-friendly routes
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
