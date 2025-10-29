from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# 🔑 Replace with your actual OpenWeatherMap API key
OPENWEATHER_API_KEY = "fc77b14684513ef027f4902b8f9d24a1"

# -------------------------------
# Function to get AQI from OpenWeatherMap
# -------------------------------
def get_aqi_from_openweather(city):
    try:
        # 1️⃣ Get latitude and longitude of the city
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
        geo_res = requests.get(geo_url).json()

        if not geo_res or "lat" not in geo_res[0]:
            return None, None, None

        lat = geo_res[0]["lat"]
        lon = geo_res[0]["lon"]

        # 2️⃣ Get AQI using lat & lon
        aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}"
        aqi_res = requests.get(aqi_url).json()

        if "list" not in aqi_res or not aqi_res["list"]:
            return None, lat, lon

        aqi_value = aqi_res["list"][0]["main"]["aqi"]

        # Convert AQI scale (OpenWeather uses 1–5)
        aqi_mapping = {1: 50, 2: 100, 3: 150, 4: 200, 5: 300}
        return aqi_mapping.get(aqi_value, 100), lat, lon

    except Exception as e:
        print("Error fetching AQI:", e)
        return None, None, None


# -------------------------------
# Health Tips Logic
# -------------------------------
def get_health_tips(aqi):
    if aqi <= 50:
        return [
            "Air quality is good. Enjoy outdoor activities!",
            "Keep windows open for fresh air.",
            "Maintain regular exercise."
        ]
    elif aqi <= 100:
        return [
            "Air quality is moderate. Sensitive groups should be cautious.",
            "Avoid outdoor exercise if you feel irritation.",
            "Drink more water to stay hydrated."
        ]
    elif aqi <= 200:
        return [
            "Air quality is unhealthy for sensitive groups.",
            "Wear a mask when outdoors.",
            "Use an air purifier indoors."
        ]
    elif aqi <= 300:
        return [
            "Air quality is poor. Limit outdoor exposure.",
            "Avoid outdoor exercise.",
            "Keep doors and windows closed."
        ]
    else:
        return [
            "Air quality is hazardous!",
            "Stay indoors as much as possible.",
            "Use an N95 mask if you must go out.",
            "Consult a doctor if you have breathing issues."
        ]


# -------------------------------
# /recommend endpoint
# -------------------------------
@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    city = data.get('city')

    if not city:
        return jsonify({"error": "City name is required."}), 400

    aqi, lat, lon = get_aqi_from_openweather(city)

    if aqi is None:
        return jsonify({"error": f"Could not fetch AQI for {city}."}), 404

    tips = get_health_tips(aqi)

    return jsonify({
        "city": city,
        "aqi": aqi,
        "coordinates": {"lat": lat, "lon": lon},
        "recommendations": tips
    })


# -------------------------------
# Run the app
# -------------------------------
if __name__ == '__main__':
    app.run(port=5001, debug=True)
