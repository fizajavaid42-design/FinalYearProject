"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/ForwardAlertAction.css";

export default function ForwardAlertActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── States ──
  const [alert, setAlert] = useState(null);
  const [selectedDepth, setSelectedDepth] = useState(2);
  const [isForwarding, setIsForwarding] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // ── Parse alert from URL ──
  useEffect(() => {
    const data = searchParams.get("alert");
    if (data) {
      try {
        setAlert(JSON.parse(decodeURIComponent(data)));
      } catch (err) {
        console.error("Error parsing alert data:", err);
      }
    }
  }, [searchParams]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  // ── Forward API Call ──
  const forwardAlert = async () => {
    if (!alert?.alert_id) {
      setErrorMsg("Alert data missing");
      return;
    }

    const officerId =
      typeof window !== "undefined"
        ? (localStorage.getItem("user_id") || localStorage.getItem("officer_id"))
        : null;

    if (!officerId) {
      setErrorMsg("Officer ID not found. Please login again.");
      return;
    }

    setIsForwarding(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const params = new URLSearchParams();
      params.append("alert_id", alert.alert_id.toString());
      params.append("forwarded_by", officerId.toString());
      params.append("depth", selectedDepth.toString());

      const cameraId = alert?.camera?.camera_id;
      if (cameraId) params.append("camera_id", cameraId.toString());

      const res = await api.post("/forwarded-alert/forward", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      setResult(res.data);
    } catch (e) {
      const detail = e.response?.data?.detail || e.response?.data?.message;
      setErrorMsg(
        typeof detail === "string"
          ? detail
          : (e.message || "Failed to forward alert")
      );
    } finally {
      setIsForwarding(false);
    }
  };

  // ── Header (reusable for loading + main) ──
  const renderHeader = () => (
    <div className="fa-header">
      <button className="fa-back-btn" onClick={() => router.back()}>←</button>
      <div className="fa-header-center">
        <div className="fa-logo-white">
          <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
        </div>
        <div>
          <h1 className="fa-title">Forward Alert</h1>
          <div className="fa-subtitle">Forward alert to concerned authority</div>
        </div>
      </div>
      <div style={{ width: "40px" }}></div>
    </div>
  );

  // ── Loading shell ──
  if (!alert) {
    return (
      <div className="fa-container">
        {renderHeader()}
        <div className="fa-loading">Loading...</div>
      </div>
    );
  }

  const vehicle = alert.vehicle || {};
  const camera = alert.camera || {};
  const detection = alert.detection || {};
  const forwardedTo = result?.forwarded_to ?? [];

  return (
    <div className="fa-container">
      {renderHeader()}

      <div className="fa-content">
        {/* Alert Summary */}
        <div className="fa-summary-card">
          <div className="fa-summary-header">
            <div className="fa-summary-icon">📋</div>
            <h2 className="fa-summary-title">Alert Summary</h2>
          </div>

          <div className="fa-info-row">
            <span className="fa-info-label">Report Type:</span>
            <span className="fa-info-value">{alert.report_type || "N/A"}</span>
          </div>
          <div className="fa-info-row">
            <span className="fa-info-label">Alert Time:</span>
            <span className="fa-info-value">{formatTime(alert.alert_time) || "N/A"}</span>
          </div>
          <div className="fa-info-row">
            <span className="fa-info-label">Match Info:</span>
            <span className="fa-info-value">{alert.match_text || "N/A"}</span>
          </div>
        </div>

        {/* Vehicle Information */}
        {(vehicle.company || vehicle.model || vehicle.color || vehicle.no_plate) && (
          <div className="fa-summary-card">
            <div className="fa-summary-header">
              <div className="fa-summary-icon">🚗</div>
              <h2 className="fa-summary-title">Vehicle Information</h2>
            </div>
            {vehicle.company && (
              <div className="fa-info-row">
                <span className="fa-info-label">Company:</span>
                <span className="fa-info-value">{vehicle.company}</span>
              </div>
            )}
            {vehicle.model && (
              <div className="fa-info-row">
                <span className="fa-info-label">Model:</span>
                <span className="fa-info-value">{vehicle.model}</span>
              </div>
            )}
            {vehicle.color && (
              <div className="fa-info-row">
                <span className="fa-info-label">Color:</span>
                <span className="fa-info-value">{vehicle.color}</span>
              </div>
            )}
            {vehicle.no_plate && (
              <div className="fa-info-row">
                <span className="fa-info-label">Plate Number:</span>
                <span className="fa-info-value">{vehicle.no_plate}</span>
              </div>
            )}
          </div>
        )}

        {/* Detection Information */}
        {(detection.no_plate || detection.detected_at) && (
          <div className="fa-summary-card">
            <div className="fa-summary-header">
              <div className="fa-summary-icon">🔍</div>
              <h2 className="fa-summary-title">Detection Information</h2>
            </div>
            {detection.no_plate && (
              <div className="fa-info-row">
                <span className="fa-info-label">Detected Plate:</span>
                <span className="fa-info-value">{detection.no_plate}</span>
              </div>
            )}
            {detection.detected_at && (
              <div className="fa-info-row">
                <span className="fa-info-label">Detected At:</span>
                <span className="fa-info-value">{formatTime(detection.detected_at)}</span>
              </div>
            )}
          </div>
        )}

        {/* Camera Information */}
        {(camera.camera_id || camera.place_id || camera.place_name || camera.direction) && (
          <div className="fa-summary-card">
            <div className="fa-summary-header">
              <div className="fa-summary-icon">📷</div>
              <h2 className="fa-summary-title">Camera Information</h2>
            </div>
            {camera.camera_id && (
              <div className="fa-info-row">
                <span className="fa-info-label">Camera ID:</span>
                <span className="fa-info-value">{camera.camera_id}</span>
              </div>
            )}
            {(camera.place_name || camera.place_id) && (
              <div className="fa-info-row">
                <span className="fa-info-label">Place:</span>
                <span className="fa-info-value">{camera.place_name || camera.place_id}</span>
              </div>
            )}
            {camera.direction && (
              <div className="fa-info-row">
                <span className="fa-info-label">Direction:</span>
                <span className="fa-info-value">{camera.direction}</span>
              </div>
            )}
          </div>
        )}

        {/* Depth Selection Card */}
        <div className="fa-depth-card">
          <p className="fa-depth-title">Forward to how many checkpoints?</p>
          <div className="fa-depth-chips">
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                className={`fa-depth-chip ${selectedDepth === d ? "active" : ""}`}
                onClick={() => setSelectedDepth(d)}
                disabled={isForwarding}
              >
                {d} Checkpoint{d > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Forward Button */}
        <button
          className="fa-forward-btn"
          onClick={forwardAlert}
          disabled={isForwarding}
        >
          {isForwarding ? "Forwarding..." : "➤ Forward Alert"}
        </button>

        {/* Processing */}
        {isForwarding && (
          <div className="fa-processing">
            <div className="fa-spinner-small"></div>
            <p style={{ margin: 0 }}>Forwarding alert to next checkpoints...</p>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div className="fa-error-box">
            <span>❌</span>
            <p style={{ margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {/* Success + Forwarded Checkpoints */}
        {result && forwardedTo.length > 0 && (
          <div className="fa-success-section">
            <div className="fa-success-box">
              <span>✅</span>
              <p style={{ margin: 0 }}>
                {result.message ?? "Alert Forwarded Successfully!"}
              </p>
            </div>

            <h3 className="fa-forwarded-title">Forwarded To:</h3>

            {forwardedTo.map((cp, index) => (
              <div key={cp.to_checkpoint_id ?? index} className="fa-forwarded-card">
                <div className="fa-forwarded-icon">📍</div>
                <div className="fa-forwarded-info">
                  <div className="fa-forwarded-name">
                    {cp.to_checkpoint_name ?? "Unknown"}
                  </div>
                  <div className="fa-forwarded-officers">
                    {cp.officers?.length ?? 0} officers assigned
                  </div>
                </div>
                <span className="fa-forwarded-arrow">›</span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state — API succeeded but no checkpoints */}
        {result && forwardedTo.length === 0 && (
          <div className="fa-error-box" style={{ background: "#fff8e1", color: "#f57c00" }}>
            <span>ℹ️</span>
            <p style={{ margin: 0 }}>Alert forwarded but no downstream checkpoints found.</p>
          </div>
        )}
      </div>
    </div>
  );
}