"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/ForwardedAlert.css";

export default function ForwardedAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const officerId = typeof window !== "undefined" 
    ? parseInt(localStorage.getItem("user_id") || "0", 10) 
    : 0;

  useEffect(() => {
    if (officerId) {
      fetchAlerts();
    }
  }, [officerId]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/forwarded-alert/officer/${officerId}`);
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching forwarded alerts:", err);
      setErrorMsg(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (forwardId, status) => {
    setUpdatingId(forwardId);
    try {
      await api.patch(`/forwarded-alert/${forwardId}/status`, { status });
      fetchAlerts();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#ff9800";
      case "Received": return "#2196f3";
      case "Action Taken": return "#4caf50";
      default: return "#9e9e9e";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return "⏳";
      case "Received": return "✓";
      case "Action Taken": return "✅";
      default: return "ℹ️";
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="fa-container">
      {/* HEADER */}
      <header className="fa-header">
        <button className="fa-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="fa-header-center">
          <div className="fa-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="fa-title">📨 Forwarded Alerts</h1>
            <p className="fa-subtitle">Alerts forwarded to your checkpoint</p>
          </div>
        </div>
        <button className="fa-refresh-btn" onClick={fetchAlerts}>
          🔄
        </button>
      </header>

      <div className="fa-content">
        {loading ? (
          <div className="fa-loader"><div className="fa-spinner"></div></div>
        ) : errorMsg ? (
          <div className="fa-error">
            <span>⚠️</span>
            <p>{errorMsg}</p>
            <button onClick={fetchAlerts} className="fa-retry-btn">Retry</button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="fa-empty">
            <div className="fa-empty-icon">📭</div>
            <h3>No Forwarded Alerts</h3>
            <p>No alerts have been forwarded to your checkpoint</p>
          </div>
        ) : (
          <div className="fa-list">
            {alerts.map((fa) => {
              const alert = fa.alert || {};
              const vehicle = alert.vehicle || {};
              const detection = alert.detection || {};
              const camera = alert.camera || {};
              const status = fa.status || "Pending";
              const forwardId = fa.forward_id;

              return (
                <div key={forwardId} className="fa-card">
                  {/* Header */}
                  <div 
                    className="fa-card-header"
                    style={{ backgroundColor: getStatusColor(status) + "08" }}
                  >
                    <div className="fa-header-left">
                      <div 
                        className="fa-status-icon"
                        style={{ backgroundColor: getStatusColor(status) + "15" }}
                      >
                        <span>{getStatusIcon(status)}</span>
                      </div>
                      <div className="fa-header-info">
                        <div className="fa-from-to">
                          From: {fa.from_checkpoint || "Unknown"} → To: {fa.to_checkpoint || "Unknown"}
                        </div>
                      </div>
                    </div>
                    <div 
                      className="fa-status-badge"
                      style={{ backgroundColor: getStatusColor(status) }}
                    >
                      {status}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="fa-card-body">
                    {/* Vehicle Info */}
                    {vehicle && Object.keys(vehicle).length > 0 && (
                      <>
                        <div className="fa-info-section">
                          <div className="fa-section-title">🚗 Vehicle Information</div>
                          <div className="fa-info-row">
                            <span className="fa-info-label">Vehicle:</span>
                            <span className="fa-info-value">
                              {vehicle.company || ""} {vehicle.model || ""}
                            </span>
                          </div>
                          <div className="fa-info-row">
                            <span className="fa-info-label">Color:</span>
                            <span className="fa-info-value">{vehicle.color || "N/A"}</span>
                          </div>
                          <div className="fa-info-row">
                            <span className="fa-info-label">Plate:</span>
                            <span className="fa-info-value">{vehicle.no_plate || "N/A"}</span>
                          </div>
                        </div>
                        <div className="fa-divider"></div>
                      </>
                    )}

                    {/* Detection Info */}
                    {detection && Object.keys(detection).length > 0 && (
                      <>
                        <div className="fa-info-section">
                          <div className="fa-section-title">🔍 Detection Details</div>
                          <div className="fa-info-row">
                            <span className="fa-info-label">Detected Plate:</span>
                            <span className="fa-info-value">{detection.no_plate || "N/A"}</span>
                          </div>
                          <div className="fa-info-row">
                            <span className="fa-info-label">Detected At:</span>
                            <span className="fa-info-value">{formatDateTime(detection.detected_at)}</span>
                          </div>
                        </div>
                        <div className="fa-divider"></div>
                      </>
                    )}

                    {/* Camera Info */}
                    {camera && Object.keys(camera).length > 0 && (
                      <div className="fa-info-section">
                        <div className="fa-section-title">📷 Camera Information</div>
                        <div className="fa-info-row">
                          <span className="fa-info-label">Camera:</span>
                          <span className="fa-info-value">{camera.place_name || "N/A"}</span>
                        </div>
                      </div>
                    )}

                    {/* Forwarded Info */}
                    <div className="fa-info-section">
                      <div className="fa-section-title">📨 Forwarded Information</div>
                      <div className="fa-info-row">
                        <span className="fa-info-label">Forwarded By:</span>
                        <span className="fa-info-value">{fa.forwarded_by_user || "N/A"}</span>
                      </div>
                      <div className="fa-info-row">
                        <span className="fa-info-label">Forwarded At:</span>
                        <span className="fa-info-value">{formatDateTime(fa.forwarded_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(status === "Pending" || status === "Received") && (
                    <div className="fa-card-footer">
                      {status === "Pending" && (
                        <button
                          className="fa-btn fa-btn-received"
                          onClick={() => updateStatus(forwardId, "Received")}
                          disabled={updatingId === forwardId}
                        >
                          {updatingId === forwardId ? "..." : "✓ Mark Received"}
                        </button>
                      )}
                      {status === "Received" && (
                        <button
                          className="fa-btn fa-btn-action"
                          onClick={() => updateStatus(forwardId, "Action Taken")}
                          disabled={updatingId === forwardId}
                        >
                          {updatingId === forwardId ? "..." : "✅ Action Taken"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}