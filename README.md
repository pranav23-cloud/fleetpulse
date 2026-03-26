# FleetPulse

Real-time EV fleet monitoring dashboard with live map tracking, battery prediction, weather-aware energy modeling, and alerting.

## Demo features

- **🗺️ Live Map**: each vehicle is tracked in real-time with map markers
- **🔋 Battery Prediction**: predicts battery ~15 minutes ahead
- **🌦️ Weather Impact**: integrates real temperature data (OpenWeather) to model weather-based drain
- **🚨 Alerts**: critical vehicles are automatically flagged with urgency-first UI
- **🎯 Smart Visualization**: color + animation to show urgency instantly

## Tech stack

### Frontend

- **Next.js (React Framework)**: App Router, dynamic components
- **React**: `useState`, `useEffect`
- **Leaflet.js**: map visualization + real-time markers
- **Tailwind CSS**: UI styling (optional)

### Backend

- **FastAPI**: high-performance Python REST API
- **Uvicorn**: ASGI server
- **Endpoints**: `GET /vehicles`

### APIs

- **OpenWeather API**: real-time temperature data

### Logic layer

- **Battery prediction algorithm**
- **Driver behavior impact modeling**
- **Weather-based energy modeling**
- **Time-to-empty calculation**
- **Alert generation system**

### Optimization

- **Location-based API caching**
- **Reduced redundant external API calls**

## Project structure

```text
Backend/                # FastAPI service
frontend/               # Next.js app
main.py                 # Render entrypoint (imports Backend.main:app)
requirements.txt        # Points to Backend/requirements.txt (Render-friendly)
```

## Running locally

### Backend (FastAPI)

1. Create `.env` (not committed):

```bash
WEATHER_API_KEY=your_openweather_key
```

2. Install + run:

```bash
pip install -r Backend/requirements.txt
uvicorn Backend.main:app --reload --host 127.0.0.1 --port 8000
```

Backend should be available at `http://127.0.0.1:8000` and vehicles at `http://127.0.0.1:8000/vehicles`.

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Deployment

- **Backend**: Render (Web Service)
  - **Build**: `pip install -r requirements.txt`
  - **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - **Env vars**: set `WEATHER_API_KEY` in Render dashboard
- **Frontend**: Vercel
  - Update API URL in `frontend/src/app/page.js` to your Render service:
    - `https://fleetpulse-backend-c04w.onrender.com/vehicles`

## Dev tools

- Git & GitHub
- VS Code
- Conda environment (local development)