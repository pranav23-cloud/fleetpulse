import random
import os
import requests
import math
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

# ⚡ Charging stations with LOAD
charging_stations = []

for i in range(15):
    capacity = random.randint(5, 15)
    occupied = random.randint(0, capacity)

    charging_stations.append({
        "id": i,
        "name": f"Station {i}",
        "lat": 12.97 + random.uniform(-0.06, 0.06),
        "lng": 77.59 + random.uniform(-0.06, 0.06),
        "type": random.choice(["fast", "slow"]),
        "capacity": capacity,
        "occupied": occupied
    })

# 🌦️ Weather cache
weather_cache = {}

def get_weather(lat, lng):
    key = f"{round(lat,2)}_{round(lng,2)}"

    if key in weather_cache:
        return weather_cache[key]

    url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={API_KEY}&units=metric"

    try:
        res = requests.get(url)
        data = res.json()
        temp = data["main"]["temp"]

        weather_cache[key] = temp

        if len(weather_cache) > 50:
            weather_cache.clear()

        return temp
    except:
        return 25


# 🔋 Battery prediction
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

    return round(v["battery"] / total_drain, 2)


# 🚨 Alerts
def generate_alert(v):
    if v["status"] == "CRITICAL":
        return f"Vehicle {v['id']} needs charging in {round(v['time_to_empty'])} min"
    return None


# 🔄 Update vehicles + simulate station load
def update_vehicles():
    for v in vehicles:
        v["lat"] += random.uniform(-0.0005, 0.0005)
        v["lng"] += random.uniform(-0.0005, 0.0005)

        v["speed"] += random.uniform(-5, 5)
        v["speed"] = max(10, min(v["speed"], 80))

        temp = get_weather(v["lat"], v["lng"])
        v["temp"] = temp

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

    # ⚡ simulate station usage
    for s in charging_stations:
        change = random.randint(-1, 1)
        s["occupied"] = max(0, min(s["capacity"], s["occupied"] + change))


# 🟢 Status
def get_status(predicted_battery):
    if predicted_battery > 30:
        return "SAFE"
    elif predicted_battery > 15:
        return "WARNING"
    else:
        return "CRITICAL"


# ⚡ SMART: Best station (distance + type + load)
def find_best_station(lat, lng):
    best = None
    best_score = float("inf")

    for station in charging_stations:
        dist = math.sqrt((lat - station["lat"])**2 + (lng - station["lng"])**2)

        # ⚡ fast charger preference
        type_bonus = 0 if station["type"] == "fast" else 0.02

        # 📊 load penalty
        load_ratio = station["occupied"] / station["capacity"]
        load_penalty = load_ratio * 0.05

        score = dist + type_bonus + load_penalty

        if score < best_score:
            best_score = score
            best = station

    return best, round(best_score, 4)


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

        # ⚡ Smart recommendation
        if v["battery"] < 25:
            station, dist = find_best_station(v["lat"], v["lng"])
            v["recommended_station"] = station
            v["distance_to_station"] = dist
        else:
            v["recommended_station"] = None

    return vehicles


# ⚡ Optional API
@app.get("/recommend-charging")
def recommend_charging(lat: float, lng: float):
    station, dist = find_best_station(lat, lng)
    return {
        "station": station,
        "distance": dist
    }