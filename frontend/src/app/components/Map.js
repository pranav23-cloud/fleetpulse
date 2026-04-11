"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function Map({ vehicles = [] }) {

  // 🛑 SAFETY: prevent crash
  if (!vehicles || vehicles.length === 0) {
    return <p style={{ color: "gray" }}>Loading map...</p>;
  }

  const getMarkerColor = (status, temp) => {
    if (status === "CRITICAL" || temp > 40) return "red";
    if (status === "WARNING" || temp > 35) return "yellow";
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

  // ⚡ SAFE unique stations
  const uniqueStationsMap = new Map();

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
      {vehicles.map((v) => (
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