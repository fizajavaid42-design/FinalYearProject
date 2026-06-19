"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/PoliceReports.css";

export default function ReportDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");
  const isWitness = searchParams.get("is_witness") === "true";

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reportId) fetchReportDetails();
  }, [reportId]);

  const fetchReportDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (isWitness) {
        res = await api.get(`/reports/witness/${reportId}`);
      } else {
        res = await api.get(`/reports/${reportId}`);
      }
      setReport(res.data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.detail || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status, actionType) => {
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("is_witness", isWitness ? "true" : "false");
      
      await api.patch(`/reports/${reportId}/status`, formData);
      
      alert(`${actionType} successfully!`);
      router.back();
      
    } catch (err) {
      console.error("Error details:", err.response?.data);
      alert("Error: " + (err.response?.data?.detail || "Something went wrong"));
    } finally {
      setUpdating(false);
    }
  };

  const markAsRecovered = () => updateStatus("Recovered", "✅ Vehicle marked as Recovered");
  const markAsRejected = () => updateStatus("Rejected", "❌ Report rejected");

  if (loading) {
    return (
      <div className="pol-container">
        <div className="pol-header">
          <button className="pol-back-btn" onClick={() => router.back()}>&#8592;</button>
          <div className="pol-header-center">
            <div className="pol-logo-white">
              <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
            </div>
            <h1 className="pol-title">Safe City &nbsp; AI</h1>
          </div>
          <div style={{ width: "40px" }}></div>
        </div>
        <div className="pr-loading">Loading details...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="pol-container">
        <div className="pol-header">
          <button className="pol-back-btn" onClick={() => router.back()}>&#8592;</button>
          <div className="pol-header-center">
            <div className="pol-logo-white">
              <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
            </div>
            <h1 className="pol-title">Safe City &nbsp; AI</h1>
          </div>
          <div style={{ width: "40px" }}></div>
        </div>
        <div className="pol-main-wrapper">
          <div className="pol-content-card">
            <p className="error-text">{error || "Report not found."}</p>
            <button onClick={fetchReportDetails} className="retry-btn">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const status = report.status?.toLowerCase() || "pending";
  const isRecovered = status === "recovered";
  const isRejected = status === "rejected";
  const isApproved = status === "approved";
  const isPending = status === "pending";

  return (
    <div className="pol-container">
      {/* HEADER */}
      <div className="pol-header">
        <button className="pol-back-btn" onClick={() => router.back()}>&#8592;</button>
        <div className="pol-header-center">
          <div className="pol-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <h1 className="pol-title">Safe City &nbsp; AI</h1>
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      <div className="pol-main-wrapper">
        <div className="pol-greet-section">
          <div className="pol-greet-content">
            <h3>Case Details</h3>
            <h2>{isWitness ? "Accident Report" : "Theft Report"} #{report.report_id}</h2>
            <p>Review incident information and update recovery status.</p>
          </div>
        </div>

        <div className="pol-content-card">
          {/* Incident Information Section */}
          <h3 className="section-label">Incident Information</h3>
          <div className="details-grid">
            <InfoRow label="Type" value={isWitness ? "Accident" : report.incident_type} />
            <InfoRow label="Status" value={report.status} isStatus={true} />
            <InfoRow label="Description" value={report.description} />
            <InfoRow label="Location" value={report.place_name} />
            {!isWitness && <InfoRow label="Contact" value={report.contact} />}
            <InfoRow label="Date" value={report.date ? new Date(report.date).toLocaleDateString() : "N/A"} />
          </div>

          {/* Vehicle Details - Theft Report */}
          {!isWitness && report.vehicle && (
            <>
              <h3 className="section-label" style={{ marginTop: "30px" }}>Vehicle Details</h3>
              <div className="details-grid">
                <InfoRow label="Company" value={report.vehicle.company} />
                <InfoRow label="Model" value={report.vehicle.model} />
                <InfoRow label="Plate No" value={report.vehicle.no_plate} />
                <InfoRow label="Color" value={report.vehicle.color} />
                <InfoRow label="Year" value={report.vehicle.car_year} />
                <InfoRow label="Engine No" value={report.vehicle.engine_no} />
                <InfoRow label="Chassis No" value={report.vehicle.chassis_no} />
              </div>
            </>
          )}

          {/* Vehicle Details - Accident Report */}
          {isWitness && report.vehicle && (
            <>
              <h3 className="section-label" style={{ marginTop: "30px" }}>Vehicle Details</h3>
              <div className="details-grid">
                <InfoRow label="Vehicle Type" value={report.vehicle.vehicle_type || "N/A"} />
                <InfoRow label="Company" value={report.vehicle.company || "N/A"} />
                <InfoRow label="Model" value={report.vehicle.model || "N/A"} />
                <InfoRow label="Generation" value={report.vehicle.generation || "N/A"} />
                <InfoRow label="Color" value={report.vehicle.color || "N/A"} />
                <InfoRow label="Plate No" value={report.vehicle.no_plate || "N/A"} />
              </div>
            </>
          )}

          {/* Accident Image */}
          {isWitness && report.car_image_path && (
            <>
              <h3 className="section-label" style={{ marginTop: "30px" }}>Accident Image</h3>
              <div className="image-container" style={{ textAlign: "center", marginTop: "10px" }}>
                <img 
                  src={`http://localhost:8000/${report.car_image_path}`}
                  alt="Accident Scene"
                  style={{ 
                    maxWidth: "100%", 
                    maxHeight: "300px", 
                    borderRadius: "8px",
                    objectFit: "cover",
                    border: "1px solid #ddd"
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    console.error("Image load error");
                  }}
                />
              </div>
            </>
          )}

          {/* Action Buttons - Only for Pending Status */}
          {isPending && (
            <div className="detail-action-footer">
              <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                {isWitness ? (
                  // Accident Report: Approve + Reject
                  <>
                    <button 
                      className="mark-recovered-btn" 
                      onClick={() => updateStatus("Approved", "✅ Report approved")}
                      disabled={updating}
                      style={{ backgroundColor: "#4caf50" }}
                    >
                      {updating ? "Updating..." : "✓ Approve Report"}
                    </button>
                    <button 
                      className="mark-recovered-btn" 
                      onClick={markAsRejected}
                      disabled={updating}
                      style={{ backgroundColor: "#f44336" }}
                    >
                      {updating ? "Updating..." : "✗ Reject Report"}
                    </button>
                  </>
                ) : (
                  // Theft Report: Mark as Recovered + Reject
                  <>
                    <button 
                      className="mark-recovered-btn" 
                      onClick={markAsRecovered}
                      disabled={updating}
                      style={{ backgroundColor: "#4caf50" }}
                    >
                      {updating ? "Updating..." : "✓ Mark as Recovered"}
                    </button>
                    <button 
                      className="mark-recovered-btn" 
                      onClick={markAsRejected}
                      disabled={updating}
                      style={{ backgroundColor: "#f44336" }}
                    >
                      {updating ? "Updating..." : "✗ Reject Report"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isRecovered && (
            <div className="detail-action-footer">
              <div className="recovered-success-msg" style={{ backgroundColor: "#4caf50" }}>
                ✓ Vehicle has been Recovered
              </div>
            </div>
          )}

          {isApproved && (
            <div className="detail-action-footer">
              <div className="recovered-success-msg" style={{ backgroundColor: "#4caf50" }}>
                ✓ Report has been Approved
              </div>
            </div>
          )}

          {isRejected && (
            <div className="detail-action-footer">
              <div className="recovered-success-msg" style={{ backgroundColor: "#f44336" }}>
                ✗ Report has been Rejected
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isStatus }) {
  const getStatusColor = (status) => {
    const lowerStatus = status?.toLowerCase() || "";
    if (lowerStatus === "recovered" || lowerStatus === "approved") return "#4caf50";
    if (lowerStatus === "rejected") return "#f44336";
    return "#ff9800";
  };

  return (
    <div className="detail-info-row">
      <span className="detail-label">{label}:</span>
      <span 
        className={`detail-value ${isStatus ? 'status-text' : ''}`}
        style={isStatus ? { color: getStatusColor(value), fontWeight: "bold" } : {}}
      >
        {value || "N/A"}
      </span>
    </div>
  );
}