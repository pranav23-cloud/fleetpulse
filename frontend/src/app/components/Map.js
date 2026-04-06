"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export default function Map({ vehicles }) {

  // 🔋 + 🌡️ combined logic
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

  // 🔥 Pulsing effect
  const getRadius = (v) => {
    if (v.status === "CRITICAL") {
      return 12 + Math.random() * 4;
    }
    return 10;
  };

  // ⚡ Extract recommended stations
  const stations = vehicles
    .filter(v => v.recommended_station)
    .map(v => v.recommended_station);

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

              {/* ⚡ NEW: Recommended station info */}
              {v.recommended_station && (
                <p style={{ color: "cyan", marginTop: "5px" }}>
                  ⚡ Go to: {v.recommended_station.name} ({v.recommended_station.type})
                </p>
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

      {/* ⚡ CHARGING STATIONS (BLUE) */}
      {stations.map((s, i) => (
        <CircleMarker
          key={"station-" + i}
          center={[s.lat, s.lng]}
          radius={8}
          pathOptions={{
            color: "blue",
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            ⚡ {s.name} ({s.type})
          </Popup>
        </CircleMarker>
      ))}

    </MapContainer>
  );
}