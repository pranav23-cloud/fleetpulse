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

  // 🔥 Pulsing effect (recommended way)
  const getRadius = (v) => {
    if (v.status === "CRITICAL") {
      return 12 + Math.random() * 4; // dynamic pulse
    }
    return 10;
  };

  return (
    <MapContainer
      center={[12.97, 77.59]}
      zoom={13}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {vehicles.map((v) => (
        <CircleMarker
          key={v.id}
          center={[v.lat, v.lng]}
          radius={getRadius(v)}   // 👈 animated radius
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

              {v.alert && (
                <p style={{ color: "red", marginTop: "5px" }}>
                  {v.alert}
                </p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}