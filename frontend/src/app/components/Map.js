"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";

export default function Map({ vehicles = [] }) {

  // 🛑 SAFETY
  if (!vehicles || vehicles.length === 0) {
    return <p style={{ color: "gray" }}>Loading map...</p>;
  }

  // 🚀 ROUTES STATE
  const [routes, setRoutes] = useState({});

  // 🎯 Fetch real routes from OSRM
  useEffect(() => {
    const fetchRoutes = async () => {
      let newRoutes = {};

      for (let v of vehicles) {
        if (!v.recommended_station) continue;

        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${v.lng},${v.lat};${v.recommended_station.lng},${v.recommended_station.lat}?overview=full&geometries=geojson`;

          const res = await fetch(url);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            newRoutes[v.id] = data.routes[0].geometry.coordinates.map(coord => [
              coord[1], // lat
              coord[0], // lng
            ]);
          }
        } catch (err) {
          console.error("Route fetch error:", err);
        }
      }

      setRoutes(newRoutes);
    };

    if (vehicles.length > 0) {
      fetchRoutes();
    }
  }, [vehicles]);

  // 🎨 Marker color
  const getMarkerColor = (status, temp) => {
    if (status === "CRITICAL" || temp > 40) return "red";
    if (status === "WARNING" || temp > 35) return "yellow";
    return "green";
  };

  const getRouteColor = (status) => {
    if (status === "CRITICAL") return "red";
    if (status === "WARNING") return "orange";
    return "green";
  };

  const getTempColor = (temp) => {
    if (temp > 35) return "red";
    if (temp < 15) return "cyan";
    return "lightgreen";
  };

  const getRadius = (v) => {
    if (v.status === "CRITICAL") {
      return 12 + Math.random() * 4;
    }
    return 10;
  };

  // ⚡ Unique stations
  const uniqueStationsMap = new globalThis.Map();

  vehicles.forEach(v => {
    if (v?.recommended_station) {
      uniqueStationsMap.set(v.recommended_station.id, v.recommended_station);
    }
  });

  const stations = Array.from(uniqueStationsMap.values());

  const getStationColor = (s) => {
    if (!s.capacity) return "blue";

    const load = s.occupied / s.capacity;

    if (load > 0.8) return "red";
    if (load > 0.5) return "orange";
    return "blue";
  };

  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 🚗 VEHICLES */}
      {(vehicles || []).map((v) => (
        <CircleMarker
          key={v.id}
          center={[v.lat, v.lng]}
          radius={getRadius(v)}
          pathOptions={{
            color: getMarkerColor(v.status, v.temp),
            fillOpacity: v.status === "CRITICAL" ? 0.9 : 0.6,
          }}
        >
          <Popup>
            <div>
              <p><b>ID:</b> {v.id}</p>
              <p><b>Battery:</b> {v.battery}%</p>
              <p><b>Status:</b> {v.status}</p>
              <p><b>Time left:</b> {Math.round(v.time_to_empty)} min</p>

              <p>
                <b>Temp:</b>{" "}
                <span style={{ color: getTempColor(v.temp) }}>
                  {v.temp ? `${v.temp}°C` : "Loading..."}
                </span>
              </p>

              {v.recommended_station && (
                <div style={{ marginTop: "6px" }}>
                  <p style={{ color: "cyan" }}>
                    ⚡ {v.recommended_station.name} ({v.recommended_station.type})
                  </p>
                  <p style={{ fontSize: "12px" }}>
                    Load: {v.recommended_station.occupied}/{v.recommended_station.capacity}
                  </p>
                </div>
              )}

              {v.alert && (
                <p style={{ color: "red", marginTop: "5px" }}>
                  {v.alert}
                </p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* 🚀 REAL ROUTES */}
      {Object.keys(routes).map((id) => {
        const v = vehicles.find(v => v.id == id);
        if (!v) return null;

        return (
          <Polyline
            key={"route-" + id}
            positions={routes[id]}
            pathOptions={{
              color: getRouteColor(v.status),
              weight: v.status === "CRITICAL" ? 5 : 3,
              opacity: 0.8,
            }}
          />
        );
      })}

      {/* ⚡ STATIONS */}
      {stations.map((s) => (
        <CircleMarker
          key={"station-" + s.id}
          center={[s.lat, s.lng]}
          radius={10}
          pathOptions={{
            color: getStationColor(s),
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div>
              <p><b>⚡ {s.name}</b></p>
              <p>Type: {s.type}</p>
              <p>Load: {s.occupied}/{s.capacity}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

    </MapContainer>
  );
}