"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/CarVerification.css";

export default function CarVerificationPage() {
  const router = useRouter();
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    try {
      const res = await api.get("/admin/vehicles/all");
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(vehicleId, status) {
    setSubmitting(vehicleId);
    setSuccessMsg(""); setErrorMsg("");
    try {
      await api.patch(`/admin/vehicles/${vehicleId}/approval`, { status });
      setSuccessMsg(`Vehicle ${status} successfully!`);
      fetchVehicles();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? "Something went wrong");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="cv-container">

      {/* Header */}
      <div className="cv-header">
        <button className="cv-back-btn" onClick={() => router.back()}>&#8592;</button>
        <span className="cv-title">Car Verification</span>
      </div>

      <div className="cv-body">
        {successMsg && <div className="cv-alert-success">{successMsg}</div>}
        {errorMsg   && <div className="cv-alert-error">{errorMsg}</div>}

        {loading ? (
          <div className="cv-loader"><div className="cv-spinner" /></div>
        ) : vehicles.length === 0 ? (
          <div className="cv-empty">
            <span>🚗</span><p>No vehicles found.</p>
          </div>
        ) : (
          vehicles.map((v, i) => (
            <div key={v.vehicle_id ?? i}>
              <p className="cv-car-label">Car{i + 1}:</p>
              <div className="cv-card">

                {/* Car Name */}
                <div className="cv-car-top">
                  <span>🚙</span>
                  <span className="cv-car-name">
                    {String(v.company ?? "").toUpperCase()} {String(v.model ?? "").toUpperCase()}
                  </span>
                </div>

                {/* Details */}
                <CvRow label="Number Plate" value={v.no_plate} />
                <CvRow label="Year"         value={v.car_year?.toString()} />
                <CvRow label="Engine No"    value={v.engine_no} />
                <CvRow label="Chasis No"    value={v.chassis_no} />
                <CvRow label="Color"        value={String(v.color ?? "").toUpperCase()} />

                {/* Documents */}
                <div className="cv-docs-row">
                  <span className="cv-docs-label">Cars Documents:</span>
                  <button className="cv-view-btn">View</button>
                </div>

                {/* Approve / Reject */}
                <div className="cv-action-row">
                  <button
                    className="cv-reject-btn"
                    disabled={submitting === v.vehicle_id}
                    onClick={() => updateStatus(v.vehicle_id, "Rejected")}
                  >
                    {submitting === v.vehicle_id ? <span className="cv-btn-spinner" /> : "Reject"}
                  </button>
                  <button
                    className="cv-approve-btn"
                    disabled={submitting === v.vehicle_id}
                    onClick={() => updateStatus(v.vehicle_id, "Approved")}
                  >
                    {submitting === v.vehicle_id ? <span className="cv-btn-spinner" /> : "Approve"}
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CvRow({ label, value }) {
  return (
    <div className="cv-row">
      <span className="cv-row-label">{label}:</span>
      <span className="cv-row-value">{value ?? "-"}</span>
    </div>
  );
}