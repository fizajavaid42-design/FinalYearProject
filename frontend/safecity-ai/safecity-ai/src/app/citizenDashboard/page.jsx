"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/CitizenDashboard.css";

export default function CitizenDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Citizen");
  const [reportCount, setReportCount] = useState(0);
  const [recoveriesCount, setRecoveriesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("user_id");
    const name = localStorage.getItem("name");

    if (!role || role !== "citizen") {
      router.push("/login");
      return;
    }

    setUserName(name || "Citizen");

    if (userId) {
      const id = parseInt(userId);
      
      // ✅ Sirf 2 APIs call karo
      Promise.all([
        api.get(`/reports/count/${id}`),              // Reports count
        api.get(`/recovery/user-vehicles/${id}`)      // Recoveries count
      ])
        .then(([reportsRes, recoveriesRes]) => {
          setReportCount(reportsRes.data?.count ?? 0);
          
          const recoveries = Array.isArray(recoveriesRes.data) ? recoveriesRes.data : [];
          const recoveredCount = recoveries.filter(v => v.is_recovered === true).length;
          setRecoveriesCount(recoveredCount);
        })
        .catch((err) => {
          console.error("Error fetching counts:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [router]);

  return (
    <div className="ctz-container">
      {/* BRAND HEADER */}
      <div className="ctz-header">
        <div className="ctz-header-center">
          <div className="ctz-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="ctz-title">Safe City &nbsp; AI</h1>
        </div>
        <button className="ctz-logout-btn" onClick={() => { localStorage.clear(); router.push("/login"); }}>
          Logout ↩
        </button>
      </div>

      {/* WEB NAV */}
      <div className="ctz-web-nav">
        <div className="nav-item active" onClick={() => router.push("/citizenDashboard")}>
          <span>🏠</span><p>Home</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/ReportStatus")}>
          <span>📋</span><p>Reports</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/registerVehicle")}>
          <span>🚗</span><p>Register</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/MyCars")}>
          <span>🚘</span><p>My Cars</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/Recoveries")}>
          <span>🔍</span><p>Recoveries</p>
        </div>
      </div>

      <div className="ctz-main-wrapper">
        {/* Greet Section */}
        <div className="ctz-greet-section">
          <div className="ctz-greet-content">
            <h3>Stay Safe,</h3>
            <h2>Welcome, {userName}!</h2>
            <p>Monitor your vehicles and report incidents in real-time.</p>
          </div>
          <div className="ctz-status-badge">
            📈 {loading ? "..." : `${reportCount} Reports Filed`}
          </div>
        </div>

        {/* Action Rows */}
        <div className="ctz-content-card">
          <h3 className="section-label">Citizen Services</h3>
          <div className="ctz-action-list">
            <ServiceRow 
              icon="🚗" title="Register Your Car" count="New" sub="Add vehicle for AI monitoring" 
              onClick={() => router.push("/registerVehicle")} 
            />
            <ServiceRow 
              icon="⚠️" title="Report an Incident" count="Action" sub="File a new incident report" 
              onClick={() => router.push("/IncidentReport")} 
            />
            <ServiceRow 
              icon="💡" title="View Report Status" count={reportCount} sub="Check updates on your reports" 
              onClick={() => router.push("/ReportStatus")} 
            />
            <ServiceRow 
              icon="🔍" title="Recoveries" count={recoveriesCount} sub="View recovered vehicles & handover" 
              onClick={() => router.push("/Recoveries")} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({ icon, title, count, sub, onClick }) {
  return (
    <div className="ctz-row-item" onClick={onClick}>
      <div className="row-left">
        <div className="row-icon-box">{icon}</div>
        <div className="row-info">
          <h4>{title}</h4>
          <div className="row-status-container">
            <span className="count-badge-blue">{count}</span>
            <p className="row-subtext">{sub}</p>
          </div>
        </div>
      </div>
      <span className="row-arrow">〉</span>
    </div>
  );
}