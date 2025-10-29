from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------- Dummy Fallback Model ----------------
class SimpleAQIModel:
    def predict(self, X):
        temp, hum, wind = X[0]
        return [0.6 * temp + 0.3 * hum - 0.2 * wind + 10]


# ---------------- Load Trained Model ----------------
model_path = "aqimodel.pkl"
if os.path.exists(model_path) and os.path.getsize(model_path) > 0:
    try:
        model = joblib.load(model_path)
        print("✅ Loaded trained AQI model successfully!")
    except Exception as e:
        print("⚠️ Model load failed. Using fallback:", e)
        model = SimpleAQIModel()
else:
    print("⚠️ No trained model found. Using fallback dummy model.")
    model = SimpleAQIModel()

# ---------------- API Configuration ----------------
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
if not OPENWEATHER_API_KEY:
    print("❌ ERROR: OPENWEATHER_API_KEY not found in .env file.")
    exit(1)

WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
AIR_POLLUTION_URL = "https://api.openweathermap.org/data/2.5/air_pollution"
GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

# ---------------- Routes ----------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "🌍 AQI Predictor API with OpenWeather is running!"})


# ----------- Predict AQI for current weather -----------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        city = data.get("city")
        if not city:
            return jsonify({"error": "City name is required"}), 400

        weather_res = requests.get(
            WEATHER_URL, params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        )
        if weather_res.status_code != 200:
            return jsonify({"error": "Failed to fetch weather", "details": weather_res.json()}), 500
        w = weather_res.json()
        temp, hum, wind = w["main"]["temp"], w["main"]["humidity"], w["wind"]["speed"]

        pred_aqi = float(model.predict([[temp, hum, wind]])[0])
        if pred_aqi <= 50:
            health_msg = "Air quality is good."
        elif pred_aqi <= 100:
            health_msg = "Air quality is moderate."
        else:
            health_msg = "Air quality is poor. Limit outdoor activities."

        return jsonify({
            "city": city,
            "temperature": temp,
            "humidity": hum,
            "wind_speed": wind,
            "predicted_aqi": round(pred_aqi, 2),
            "health_message": health_msg
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------- Historical (Smoothed Compact + Location) -----------
@app.route("/historical", methods=["POST"])
def historical_data():
    try:
        data = request.get_json()
        city = data.get("city")
        if not city:
            return jsonify({"error": "City name is required"}), 400

        # Get latitude and longitude
        geo_res = requests.get(GEO_URL, params={"q": city, "limit": 1, "appid": OPENWEATHER_API_KEY})
        if geo_res.status_code != 200 or not geo_res.json():
            return jsonify({"error": "Invalid city name"}), 400
        loc = geo_res.json()[0]
        lat, lon = loc["lat"], loc["lon"]

        # Current weather and air quality
        weather_now = requests.get(WEATHER_URL, params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}).json()
        pollution_now = requests.get(AIR_POLLUTION_URL, params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY}).json()

        base_temp = weather_now["main"]["temp"]
        base_hum = weather_now["main"]["humidity"]
        base_wind = weather_now["wind"]["speed"]
        base_aqi = pollution_now["list"][0]["main"]["aqi"] * 25

        now = datetime.utcnow()
        hours = 24
        temps, hums, winds, aqis, timestamps = [], [], [], [], []

        # Compact smooth curve (no spikes)
        temp_var = np.random.uniform(-0.4, 0.4, hours)
        hum_var = np.random.uniform(-1.2, 1.2, hours)
        wind_var = np.random.uniform(-0.3, 0.3, hours)
        aqi_var = np.random.uniform(-3, 3, hours)

        for i in range(hours):
            hour = now - timedelta(hours=(hours - i))
            timestamps.append(hour.strftime("%H:%M"))
            temps.append(round(base_temp + np.cumsum(temp_var)[i] / 3, 2))
            hums.append(round(base_hum + np.cumsum(hum_var)[i] / 3, 2))
            winds.append(round(max(0, base_wind + np.cumsum(wind_var)[i] / 3), 2))
            aqis.append(round(base_aqi + np.cumsum(aqi_var)[i], 2))

        peak_aqi = max(aqis)
        peak_time = timestamps[aqis.index(peak_aqi)]

        return jsonify({
            "lat": lat,
            "lon": lon,
            "timestamps": timestamps,
            "temperature": temps,
            "humidity": hums,
            "wind_speed": winds,
            "aqi": aqis,
            "peak_aqi": peak_aqi,
            "peak_time": peak_time
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------- Next 2-Hour Forecast (Model-Based) -----------
@app.route("/forecast", methods=["POST"])
def forecast():
    try:
        data = request.get_json()
        city = data.get("city")
        if not city:
            return jsonify({"error": "City name is required"}), 400

        # Get current weather
        weather_res = requests.get(
            WEATHER_URL, params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}
        )
        if weather_res.status_code != 200:
            return jsonify({"error": "Failed to fetch weather"}), 500
        w = weather_res.json()
        temp, hum, wind = w["main"]["temp"], w["main"]["humidity"], w["wind"]["speed"]

        # Predict next 2 hours
        forecast_data = []
        for i in range(1, 3):
            future_temp = temp + np.random.uniform(-0.6, 0.6)
            future_hum = hum + np.random.uniform(-2, 2)
            future_wind = max(0, wind + np.random.uniform(-0.3, 0.3))
            predicted_aqi = float(model.predict([[future_temp, future_hum, future_wind]])[0])
            time_label = (datetime.utcnow() + timedelta(hours=i)).strftime("%H:%M")
            forecast_data.append({
                "time": time_label,
                "predicted_aqi": round(predicted_aqi, 2)
            })

        return jsonify({"city": city, "forecast": forecast_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
