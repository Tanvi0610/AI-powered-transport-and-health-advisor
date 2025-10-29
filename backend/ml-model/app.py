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

        # Fetch weather data
        weather_res = requests.get(WEATHER_URL, params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"})
        if weather_res.status_code != 200:
            return jsonify({"error": "Failed to fetch weather", "details": weather_res.json()}), 500
        w = weather_res.json()
        temp, hum, wind = w["main"]["temp"], w["main"]["humidity"], w["wind"]["speed"]

        # Predict AQI using model
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
            "predicted_aqi": pred_aqi,
            "health_message": health_msg
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----------- Historical (Simulated via API) -----------
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

        # Get current weather and air pollution data
        weather_now = requests.get(WEATHER_URL, params={"q": city, "appid": OPENWEATHER_API_KEY, "units": "metric"}).json()
        pollution_now = requests.get(AIR_POLLUTION_URL, params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY}).json()

        # Simulate 24-hour history (based on random variation)
        temps, hums, winds, aqis, timestamps = [], [], [], [], []
        base_temp = weather_now["main"]["temp"]
        base_hum = weather_now["main"]["humidity"]
        base_wind = weather_now["wind"]["speed"]
        base_aqi = pollution_now["list"][0]["main"]["aqi"]

        now = datetime.utcnow()
        for i in range(24):
            hour = now - timedelta(hours=i)
            temps.append(round(base_temp + np.random.uniform(-2, 2), 2))
            hums.append(round(base_hum + np.random.uniform(-5, 5), 2))
            winds.append(round(max(0, base_wind + np.random.uniform(-1, 1)), 2))
            aqis.append(base_aqi * 20 + np.random.uniform(-10, 10))
            timestamps.append(hour.strftime("%H:%M"))

        temps.reverse()
        hums.reverse()
        winds.reverse()
        aqis.reverse()
        timestamps.reverse()

        peak_aqi = max(aqis)
        peak_time = timestamps[aqis.index(peak_aqi)]

        return jsonify({
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
