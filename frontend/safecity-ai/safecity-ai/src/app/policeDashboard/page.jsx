"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/PoliceDashboard.css";

export default function PoliceDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Officer");
  const [userId, setUserId] = useState("0");
  const [handoverCount, setHandoverCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const officerId = localStorage.getItem("user_id");
    const name = localStorage.getItem("name");
    
    setUserName(name || "Police Officer");
    setUserId(officerId || "0");

    if (officerId) {
      const id = parseInt(officerId);
      
      // ✅ Sirf 2 APIs call karo
      Promise.all([
        api.get(`/recovery/handover/all`),           // Handover requests count
        api.get(`/reports/police/assigned-reports?officer_id=${id}`) // Reports count
      ])
        .then(([handoverRes, reportsRes]) => {
          const handovers = Array.isArray(handoverRes.data) ? handoverRes.data : [];
          const pendingHandovers = handovers.filter(h => h.status === "Pending").length;
          setHandoverCount(pendingHandovers);
          
          const reports = reportsRes.data?.reports || [];
          setReportsCount(reports.length);
        })
        .catch((err) => {
          console.error("Error fetching counts:", err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="pol-container">
      {/* BRAND HEADER */}
      <div className="pol-header">
        <div className="pol-header-center">
          <div className="pol-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="pol-title">Safe City &nbsp; AI</h1>
        </div>
        <button className="pol-logout-btn" onClick={() => { localStorage.clear(); router.push("/login"); }}>
          Logout ↩
        </button>
      </div>

      {/* WEB NAV */}
      <div className="pol-web-nav">
        <div className="nav-item active" onClick={() => router.push("/policeDashboard")}>
          <span>🔔</span><p>AIAlerts</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/policeReportScreen")}>
          <span>📋</span><p>Reports</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/CCTVCamera")}>
          <span>📹</span><p>CCTVCamera</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/cameraGraph")}>
          <span>📊</span><p>Camera Graph</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/handover")}>
          <span>🤝</span><p>PoliceSideHandover</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/speed-detection")}>
          <span>🏎️</span><p>Speed</p>
        </div>
      </div>

      <div className="pol-main-wrapper">
        {/* Greet Section */}
        <div className="pol-greet-section">
          <div className="pol-greet-content">
            <h3>System Active,</h3>
            <h2>Welcome back, {userName}!</h2>
            <p>Real-time surveillance and incident management dashboard.</p>
          </div>
          <div className="pol-status-badge">
            🛡️ Officer ID: {userId}
          </div>
        </div>

        {/* Operational Actions Section */}
        <div className="pol-content-card">
          <h3 className="section-label">Operational Actions</h3>
          <div className="pol-action-list">
            <ActionRow 
              icon="🔔" title="AI Alerts" count="3" sub="New threats detected" 
              onClick={() => router.push("/AiAlerts")} 
            />
            <ActionRow 
              icon="📹" title="Live CCTV" count="12" sub="Active camera feeds" 
              onClick={() => router.push("/CCTVCamera")} 
            />
            <ActionRow 
              icon="🚩" title="Check Points" count="2" sub="Active CheckPoints" 
              onClick={() => router.push("/Checkpoints")} 
            />
            
            {/* Handover Request Card - Dynamic Count */}
            <ActionRow 
              icon="🤝" title="Handover Requests" count={loading ? "..." : handoverCount} sub="Pending vehicle handovers" 
              onClick={() => router.push("/PoliceSideHandover")} 
            />

            {/* Speed Detection Card */}
            <ActionRow 
              icon="🏎️" title="Speed Detection" count="8" sub="Overspeeding violations" 
              onClick={() => router.push("/speed-detection")} 
            />

            <ActionRow 
              icon="📊" title="Camera Graph" count="1" sub="System Analytics" 
              onClick={() => router.push("/cameraGraph")} 
            />
            
            {/* Recent Reports Card - Dynamic Count */}
            <ActionRow 
              icon="📋" title="Recent Reports" count={loading ? "..." : reportsCount} sub="Total submitted" 
              onClick={() => router.push("/policeReportScreen")} 
            />
            
            <ActionRow  
              icon="📊" title="Checkpoint Graph" count="0" 
              onClick={() => router.push("/checkpointGraph")} 
            />

            <ActionRow 
              icon="📨" title="Forward Alert Details" count="0" 
              onClick={() => router.push("/ForwardedAlert")} 
            />

            <ActionRow 
              icon="🛣️" title="Car Tracking" count="0" 
              onClick={() => router.push("/CarTracking")} 
            />
                    <ActionRow 
               icon="🤖" title="AI Testing" count="0" 
             onClick={() => router.push("/AiTestingScreen")} 
  
/>
            <ActionRow 
               icon="📊" title="Police Station Summary" count="0" 
             onClick={() => router.push("/StationSummary")} 
  
/>
<ActionRow 
               icon="📊" title="Statistics Report 1" count="0" 
             onClick={() => router.push("/Random")} 
  
/>

<ActionRow 
               icon="📊" title="Statistics Report 2" count="0" 
             onClick={() => router.push("/random2")} 
  
/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ icon, title, count, sub, onClick }) {
  return (
    <div className="pol-row-item" onClick={onClick}>
      <div className="row-left">
        <div className="row-icon-box">{icon}</div>
        <div className="row-info">
          <h4>{title}</h4>
          <div className="row-status-container">
            <span className="count-badge-blue">{count} {typeof count === 'number' ? 'Items' : ''}</span>
            <p className="row-subtext">{sub}</p>
          </div>
        </div>
      </div>
      <span className="row-arrow">〉</span>
    </div>
  );
}