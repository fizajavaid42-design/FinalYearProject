"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/AIAlertDetail.css";

export default function AIAlertDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [alert, setAlert] = useState(null);
  const [officerId, setOfficerId] = useState(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        setAlert(JSON.parse(decodeURIComponent(data)));
      } catch (err) {
        console.error("Error parsing alert data:", err);
      }
    }
    const officer = localStorage.getItem("user_id");
    if (officer) setOfficerId(parseInt(officer));
  }, [searchParams]);

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  const getReportTypeInfo = (reportType) => {
    const normalized = (reportType || "").toLowerCase().replace("report", "");
    switch (normalized) {
      case "witness":
        return { label: "Witness Report Alert", color: "#ff9800", icon: "👥" };
      case "user":
        return { label: "User Report Alert", color: "#4caf50", icon: "👤" };
      default:
        return { label: "Camera Detection Alert", color: "#4e73df", icon: "📷" };
    }
  };

  // ✅ Forward Alert Handler - Direct route to ForwardAlertAction
  const handleForwardAlert = () => {
    if (!alert) return;
    const encodedAlert = encodeURIComponent(JSON.stringify(alert));
    router.push(`/ForwardAlertAction?alert=${encodedAlert}`);
  };

  if (!alert) {
    return (
      <div className="ai-detail-container">
        <div className="ai-detail-header">
          <button className="ai-detail-back-btn" onClick={() => router.back()}>
            ←
          </button>
          <div className="ai-detail-header-center">
            <div className="ai-detail-logo-white">
              <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
            </div>
            <div>
              <h1 className="ai-detail-title">Alert Details</h1>
              <div className="ai-detail-subtitle-header">Comprehensive vehicle incident report</div>
            </div>
          </div>
          <div style={{ width: "40px" }}></div>
        </div>
        <div className="ai-detail-loading">Loading...</div>
      </div>
    );
  }

  const vehicle = alert.vehicle || {};
  const camera = alert.camera || {};
  const detection = alert.detection || {};
  const reportType = alert.report_type || "";
  const reportTypeInfo = getReportTypeInfo(reportType);

  return (
    <div className="ai-detail-container">
      {/* Header with Forward Button */}
      <div className="ai-detail-header">
        <button className="ai-detail-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="ai-detail-header-center">
          <div className="ai-detail-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
          </div>
          <div>
            <h1 className="ai-detail-title">Alert Details</h1>
            <div className="ai-detail-subtitle-header">Comprehensive vehicle incident report</div>
          </div>
        </div>
        {/* ✅ Forward Button - Direct Route */}
        <button className="ai-detail-forward-btn" onClick={handleForwardAlert}>
          ➤ Forward Alert
        </button>
      </div>

      <div className="ai-detail-main-wrapper">
        {/* Report Type Badge */}
        <div 
          className="ai-detail-badge"
          style={{ backgroundColor: reportTypeInfo.color + "10", borderColor: reportTypeInfo.color + "30" }}
        >
          <span>{reportTypeInfo.icon}</span>
          <span style={{ color: reportTypeInfo.color }}>{reportTypeInfo.label}</span>
        </div>

        {/* Match Info Section */}
        <div className="ai-detail-card">
          <h3 className="ai-detail-section-title">🎯 Match Info</h3>
          <div className="ai-detail-match-box">
            {alert.match_text || "No match info"}
          </div>
        </div>

        {/* Alert Time Section */}
        <div className="ai-detail-card">
          <h3 className="ai-detail-section-title">⏰ Alert Time</h3>
          <div className="ai-detail-time">{formatTime(alert.alert_time)}</div>
        </div>

        {/* Vehicle Information */}
        {Object.keys(vehicle).length > 0 && (
          <div className="ai-detail-card">
            <h3 className="ai-detail-section-title">
              🚗 VEHICLE INFORMATION
              {vehicle.source === "witness_report" && (
                <span className="ai-detail-warning-badge">⚠️ Witness Report</span>
              )}
            </h3>
            {vehicle.source === "witness_report" && (
              <div className="ai-detail-warning">
                ⚠️ Information provided by witness, may be incomplete
              </div>
            )}
            <div className="ai-detail-grid">
              {vehicle.company && <InfoRow label="Company" value={vehicle.company} />}
              {vehicle.model && <InfoRow label="Model" value={vehicle.model} />}
              {vehicle.generation && <InfoRow label="Generation" value={vehicle.generation} />}
              {vehicle.vehicle_type && <InfoRow label="Vehicle Type" value={vehicle.vehicle_type} />}
              {vehicle.color && <InfoRow label="Color" value={vehicle.color} />}
              {vehicle.no_plate && <InfoRow label="Plate Number" value={vehicle.no_plate} />}
              {vehicle.car_year && <InfoRow label="Car Year" value={vehicle.car_year} />}
              {vehicle.engine_no && <InfoRow label="Engine No" value={vehicle.engine_no} />}
              {vehicle.chassis_no && <InfoRow label="Chassis No" value={vehicle.chassis_no} />}
              {vehicle.vehicle_id && <InfoRow label="Vehicle ID" value={vehicle.vehicle_id} />}
            </div>
          </div>
        )}

        {/* Camera Information */}
        {Object.keys(camera).length > 0 && (
          <div className="ai-detail-card">
            <h3 className="ai-detail-section-title">📷 CAMERA INFORMATION</h3>
            <div className="ai-detail-grid">
              {camera.camera_id && <InfoRow label="Camera ID" value={camera.camera_id} />}
              {camera.direction && <InfoRow label="Direction" value={camera.direction} />}
              {camera.place_id && <InfoRow label="Place" value={camera.place_id} />}
            </div>
          </div>
        )}

        {/* Detection Information */}
        {Object.keys(detection).length > 0 && (
          <div className="ai-detail-card">
            <h3 className="ai-detail-section-title">🔍 DETECTION INFORMATION</h3>
            <div className="ai-detail-grid">
              {detection.detection_id && <InfoRow label="Detection ID" value={detection.detection_id} />}
              {detection.company && <InfoRow label="Detected Company" value={detection.company} />}
              {detection.model && <InfoRow label="Detected Model" value={detection.model} />}
              {detection.color && <InfoRow label="Detected Color" value={detection.color} />}
              {detection.no_plate && <InfoRow label="Detected Plate" value={detection.no_plate} />}
              {detection.detected_at && <InfoRow label="Detected At" value={formatTime(detection.detected_at)} />}
            </div>
          </div>
        )}

        {/* No Info Message */}
        {Object.keys(vehicle).length === 0 && Object.keys(camera).length === 0 && Object.keys(detection).length === 0 && (
          <div className="ai-detail-no-info">
            No detailed information available for this alert
          </div>
        )}
      </div>
    </div>
  );
}

// InfoRow Component
function InfoRow({ label, value }) {
  return (
    <div className="ai-detail-row">
      <span className="ai-detail-label">{label}:</span>
      <span className="ai-detail-value">{value || "N/A"}</span>
    </div>
  );
}