
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/MyCars.css";

function StatusBadge({ status }) {
  // let cls = "mc-badge mc-badge-pending";
  // if (status === "Approved") cls = "mc-badge mc-badge-approved";
  // if (status === "Rejected") cls = "mc-badge mc-badge-rejected";
  // return <span className={cls}>{status ?? "Pending"}</span>;
     return null;
}

function InfoRow({ label, value }) {
  return (
    <div className="mc-info-row">
      <span className="mc-info-label">{label}</span>
      <span className="mc-info-value">{value ?? "-"}</span>
    </div>
  );
}

export default function MyCarsPage() {
  const router = useRouter();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = parseInt(localStorage.getItem("user_id") || "0", 10);
    if (!id) { setLoading(false); return; }

    api.get(`/registration/vehicles/user/${id}`)
      .then((res) => setCars(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mc-container">
      {/* Header matching other Web Views */}
      <div className="mc-header">
        <button className="mc-back-btn" onClick={() => router.back()}>&#8592;</button>
        <span className="mc-title">My Registered Cars 🚙</span>
      </div>

      <div className="mc-body">
        {loading ? (
          <div className="mc-loader"><div className="mc-spinner" /></div>
        ) : cars.length === 0 ? (
          <div className="mc-empty">
            <span className="mc-empty-icon">🚗</span>
            <p>No vehicles found in your account.</p>
          </div>
        ) : (
          cars.map((car, i) => (
            <div key={car.vehicle_id ?? i} className="mc-card">
              <div className="mc-card-top">
                <span className="mc-car-icon">🚗</span>
                <span className="mc-car-name">
                  {String(car.company ?? "").toUpperCase()} {String(car.model ?? "").toUpperCase()}
                </span>
              </div>
              
              <div className="mc-info-grid">
                <InfoRow label="Registration Number" value={car.no_plate} />
                <InfoRow label="Manufacturing Year" value={car.car_year?.toString()} />
                <InfoRow label="Engine Number" value={car.engine_no} />
                <InfoRow label="Chassis Number" value={car.chassis_no} />
                <InfoRow label="Vehicle Color" value={String(car.color ?? "").toUpperCase()} />
              </div>

              <div className="mc-card-footer">
                <StatusBadge status={car.approval_status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}