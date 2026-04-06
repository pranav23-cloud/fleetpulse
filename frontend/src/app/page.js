"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

export default function Home() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://fleetpulse-backend-c04w.onrender.com/vehicles");
      const data = await res.json();
      setVehicles(data);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  const total = vehicles.length;
  const critical = vehicles.filter(v => v.status === "CRITICAL").length;
  const alerts = vehicles.filter(v => v.alert).length;

  const avgBattery =
    vehicles.length > 0
      ? (
          vehicles.reduce((sum, v) => sum + v.battery, 0) /
          vehicles.length
        ).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">
        FleetPulse Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-gray-900 p-4 rounded-2xl shadow">
          <p className="text-gray-400 text-sm">Total Vehicles</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl shadow">
          <p className="text-gray-400 text-sm">Critical</p>
          <h2 className="text-2xl font-bold text-red-400">{critical}</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl shadow">
          <p className="text-gray-400 text-sm">Avg Battery</p>
          <h2 className="text-2xl font-bold">{avgBattery}%</h2>
        </div>

        <div className="bg-gray-900 p-4 rounded-2xl shadow">
          <p className="text-gray-400 text-sm">Active Alerts</p>
          <h2 className="text-2xl font-bold text-yellow-400">{alerts}</h2>
        </div>

      </div>

      {/* Alerts Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Alerts</h2>

        {vehicles.filter(v => v.alert).length === 0 ? (
          <p className="text-gray-400">No active alerts</p>
        ) : (
          vehicles
            .filter(v => v.alert)
            .sort((a, b) => a.time_to_empty - b.time_to_empty)
            .map((v, index) => (
              <div
                key={v.id}
                className={`p-4 mb-3 rounded-xl border ${
                  index === 0
                    ? "bg-red-900 border-red-500 animate-pulse"
                    : "bg-gray-900 border-red-400"
                }`}
              >
                <p className="font-semibold text-red-300">
                  {v.alert}
                </p>
                <p className="text-sm text-gray-400">
                  Time left: {Math.round(v.time_to_empty)} min
                </p>
              </div>
            ))
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-800">
        <Map vehicles={vehicles} />
      </div>

    </div>
  );
}