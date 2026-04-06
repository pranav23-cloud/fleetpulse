import random
import os
import requests
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
API_KEY = os.getenv("WEATHER_API_KEY")

app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔥 Generate 20 dynamic vehicles
vehicles = []

for i in range(20):
    vehicles.append({
        "id": i,
        "lat": 12.97 + random.uniform(-0.05, 0.05),
        "lng": 77.59 + random.uniform(-0.05, 0.05),
        "battery": random.randint(30, 100),
        "speed": random.randint(20, 80),
        "driver_score": random.randint(1, 10)
    })

# 🌦️ Weather cache
weather_cache = {}

def get_weather(lat, lng):
    key = f"{round(lat,2)}_{round(lng,2)}"

    if key in weather_cache:
        return weather_cache[key]

    print("API CALL → Fetching weather...")

    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEY}&units=metric"

    try:
        res = requests.get(url)
        data = res.json()
        temp = data["main"]["temp"]

        weather_cache[key] = temp

        # limit cache size
        if len(weather_cache) > 50:
            weather_cache.clear()

        return temp
    except:
        return 25


# 🔋 Battery prediction (15 min)
def predict_battery(v):
    drain = v["speed"] * 0.01
    driver_penalty = v["driver_score"] * 0.02

    temp = v.get("temp", 25)

    weather_penalty = 0
    if temp > 35:
        weather_penalty = 0.05
    elif temp < 10:
        weather_penalty = 0.03

    total_drain = drain + driver_penalty + weather_penalty

    predicted = v["battery"] - (total_drain * 15)
    return round(max(predicted, 0), 2)


# ⏱️ Time-to-empty
def predict_time_to_empty(v):
    drain = v["speed"] * 0.01
    driver_penalty = v["driver_score"] * 0.02

    total_drain = drain + driver_penalty

    if total_drain == 0:
        return 999

    time_left = v["battery"] / total_drain
    return round(time_left, 2)


# 🚨 Alerts
def generate_alert(v):
    if v["status"] == "CRITICAL":
        return f"Vehicle {v['id']} needs charging in {round(v['time_to_empty'])} min"
    return None


# 🔄 Update vehicles
def update_vehicles():
    for v in vehicles:
        # smooth movement
        v["lat"] += random.uniform(-0.0005, 0.0005)
        v["lng"] += random.uniform(-0.0005, 0.0005)

        # simulate speed change
        v["speed"] += random.uniform(-5, 5)
        v["speed"] = max(10, min(v["speed"], 80))

        # 🌦️ weather
        temp = get_weather(v["lat"], v["lng"])
        v["temp"] = temp

        # battery drain
        drain = v["speed"] * 0.01
        driver_penalty = v["driver_score"] * 0.02

        weather_penalty = 0
        if temp > 35:
            weather_penalty = 0.05
        elif temp < 10:
            weather_penalty = 0.03

        v["battery"] -= (drain + driver_penalty + weather_penalty)

        if v["battery"] < 0:
            v["battery"] = 0


# 🟢 Status
def get_status(predicted_battery):
    if predicted_battery > 30:
        return "SAFE"
    elif predicted_battery > 15:
        return "WARNING"
    else:
        return "CRITICAL"


# 🌐 Routes
@app.get("/")
def home():
    return {"message": "Backend running 🚀"}


@app.get("/vehicles")
def get_vehicles():
    update_vehicles()

    for v in vehicles:
        predicted = predict_battery(v)
        v["predicted_battery"] = predicted
        v["status"] = get_status(predicted)
        v["time_to_empty"] = predict_time_to_empty(v)
        v["alert"] = generate_alert(v)

    return vehicles