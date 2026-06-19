"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/PoliceReports.css";

export default function PoliceReportScreen() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stationInfo, setStationInfo] = useState(null);

  useEffect(() => {
    fetchAssignedReports();
  }, []);

  const fetchAssignedReports = async () => {
    const officerId = localStorage.getItem("user_id");
    
    try {
      // ✅ Sirf assigned reports fetch karo
      const res = await api.get(`/reports/police/assigned-reports?officer_id=${officerId}`);
      
      console.log("Assigned reports:", res.data);
      
      setReports(res.data.reports || []);
      setStationInfo({
        id: res.data.station_id,
        count: res.data.count
      });
      
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pol-container">
      {/* HEADER */}
      <div className="pol-header">
        <button className="pol-back-btn" onClick={() => router.back()}>
          &#8592;
        </button>
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
            <h3>Incident Management</h3>
            <h2>My Station Reports</h2>
            <p>Reports assigned to your police station</p>
            {stationInfo && (
              <p className="station-badge" style={{ marginTop: "8px", fontSize: "0.85rem", color: "#4e73df" }}>
                🏢 Station ID: {stationInfo.id} | Total: {stationInfo.count} reports
              </p>
            )}
          </div>
        </div>

        <div className="pol-content-card">
          <h3 className="section-label">Report History</h3>
          
          {loading ? (
            <div className="pr-loading">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="empty-state" style={{ textAlign: "center", padding: "40px" }}>
              <p>No reports assigned to your station yet.</p>
            </div>
          ) : (
            <div className="pol-action-list">
              {reports.map((report) => (
                <div 
                  key={`${report.report_id}_${report.is_witness ? 'witness' : 'theft'}`}
                  className="pol-row-item" 
                  onClick={() => {
                    router.push(`/policeReportDetails?id=${report.report_id}&is_witness=${report.is_witness}`);
                  }}
                >
                  <div className="row-left">
                    <div className="row-icon-box">
                      {report.is_witness ? "🚗" : "📋"}
                    </div>
                    <div className="row-info">
                      <h4>
                        {report.incident_type} - #{report.report_id}
                        {report.is_witness && (
                          <span style={{ 
                            backgroundColor: "#dc3545", 
                            color: "white", 
                            padding: "2px 8px", 
                            borderRadius: "12px", 
                            fontSize: "10px", 
                            marginLeft: "8px" 
                          }}>
                            Accident
                          </span>
                        )}
                      </h4>
                      <div className="row-status-container">
                        <span className={`status-badge ${report.status?.toLowerCase() === 'recovered' ? 'bg-green' : 'bg-orange'}`}>
                          {report.status || "Pending"}
                        </span>
                        <p className="row-subtext">{report.description || "No details available"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="row-right">
                    <p className="row-location">{report.place_name || "Unknown"}</p>
                    <p className="row-date">{report.date ? report.date.split('T')[0] : "-"}</p>
                  </div>
                  <span className="row-arrow">〉</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}