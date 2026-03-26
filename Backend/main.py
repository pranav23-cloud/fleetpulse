import random
import os
import requests
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")

app = FastAPI()

#CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vehicles = [
    {"id": 3, "lat": 12.96, "lng": 77.60, "battery": 15, "speed": 40, "driver_score": 9},
    {"id": 2, "lat": 12.98, "lng": 77.58, "battery": 65, "speed": 25, "driver_score": 7},
]
#1–3 → good driver 4–6 → average 7–10 → aggressive

#API OPTIMIZATION Call weather API once per vehicle (or less)  Reuse data using cache
weather_cache = {}

#GET weather
def get_weather(lat, lng):
    key = f"{round(lat,2)}_{round(lng,2)}"  # group nearby locations

    # ✅ return cached value if exists
    if key in weather_cache:
        return weather_cache[key]

    print("API CALL → Fetching weather...")  # now only prints when real call happens

    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEY}&units=metric"

    try:
        res = requests.get(url)
        data = res.json()
        temp = data["main"]["temp"]

        # ✅ store in cache
        weather_cache[key] = temp

        return temp
    except:
        return 25

# Function to predict battery after 15 minutes based on current speed
def predict_battery(v):
    drain = v["speed"] * 0.01
    driver_penalty = v["driver_score"] * 0.02

    temp = v.get("temp", 25)  # ✅ use stored value

    weather_penalty = 0
    if temp > 35:
        weather_penalty = 0.05
    elif temp < 10:
        weather_penalty = 0.03

    total_drain = drain + driver_penalty + weather_penalty

    predicted = v["battery"] - (total_drain * 15)
    predicted = max(predicted, 0)

    return round(predicted, 2)

#Time-to-Empty Prediction (in minutes)
def predict_time_to_empty(v):
    drain = v["speed"] * 0.01
    driver_penalty = v["driver_score"] * 0.02

    total_drain = drain + driver_penalty

    if total_drain == 0:
        return 999  # avoid division error

    time_left = v["battery"] / total_drain
    return round(time_left, 2)

#Alerts
def generate_alert(v):
    if v["status"] == "CRITICAL":
        return f"Vehicle {v['id']} needs charging in {round(v['time_to_empty'])} min"
    return None

#API ROUTES
def update_vehicles():
    for v in vehicles:
        # movement
        v["lat"] += random.uniform(-0.001, 0.001)
        v["lng"] += random.uniform(-0.001, 0.001)

        # 🌦️ get weather ONCE
        temp = get_weather(v["lat"], v["lng"])
        v["temp"] = temp   # store it

        # base drain
        drain = v["speed"] * 0.01

        # driver impact
        driver_penalty = v["driver_score"] * 0.02

        # weather impact
        weather_penalty = 0
        if temp > 35:
            weather_penalty = 0.05
        elif temp < 10:
            weather_penalty = 0.03

        v["battery"] -= (drain + driver_penalty + weather_penalty)

        if v["battery"] < 0:
            v["battery"] = 0

#Status (SAFE / WARNING / CRITICAL)
def get_status(predicted_battery):
    if predicted_battery > 30:
        return "SAFE"
    elif predicted_battery > 15:
        return "WARNING"
    else:
        return "CRITICAL"

@app.get("/")
def home():
    return {"message": "Backend running"}

@app.get("/vehicles")
def get_vehicles():
    update_vehicles()

    for v in vehicles:
        predicted = predict_battery(v)
        v["predicted_battery"] = predicted
        v["status"] = get_status(predicted)

        v["time_to_empty"] = predict_time_to_empty(v)

        v["alert"] = generate_alert(v)  # 👈 new

    return vehicles