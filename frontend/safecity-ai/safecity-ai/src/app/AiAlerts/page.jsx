"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/AIAlerts.css";

export default function AIAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officerId, setOfficerId] = useState(null);   // ✅ NEW

  // ✅ Officer ID localStorage se uthao (SSR-safe) — Flutter ka getLoggedInUserId() equivalent
  useEffect(() => {
    const id = typeof window !== "undefined"
      ? (localStorage.getItem("user_id") || localStorage.getItem("officer_id"))
      : null;
    setOfficerId(id ? parseInt(id, 10) : 0);
  }, []);

  // ✅ Officer ID resolve hone ke baad fetch karo
  useEffect(() => {
    if (officerId === null) return;   // abhi tak resolve nahi hua
    fetchAlerts();
  }, [officerId]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      // ✅ Officer ID hai to query param mein bhejo (Flutter jaisa)
      const url = officerId > 0
        ? `/ai-alerts/?officer_id=${officerId}`
        : "/ai-alerts/";
      const res = await api.get(url);
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  // Colors based on matched_on type (Flutter jaisa)
  const getAlertColor = (matchedOn) => {
    switch (matchedOn) {
      case "no_plate": return "#f44336";
      case "color": return "#ff9800";
      case "model": return "#2196f3";
      case "company": return "#9c27b0";
      default: return "#4e73df";
    }
  };

  // Icons based on matched_on type (Flutter jaisa)
  const getAlertIcon = (matchedOn) => {
    switch (matchedOn) {
      case "no_plate": return "🎟️";
      case "color": return "🎨";
      case "model": return "🚗";
      case "company": return "🏭";
      default: return "🔔";
    }
  };

  // Report Type Label (Flutter jaisa)
  const getReportTypeLabel = (reportType) => {
    const normalized = (reportType || "").toLowerCase().replace("report", "");
    if (normalized === "witness") return "Witness Report";
    if (normalized === "user") return "User Report";
    return "Alert";
  };

  // Report Type Color (Flutter jaisa)
  const getReportTypeColor = (reportType) => {
    const normalized = (reportType || "").toLowerCase().replace("report", "");
    if (normalized === "witness") return "#ff9800";
    if (normalized === "user") return "#4caf50";
    return "#4e73df";
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    return date.toLocaleString();
  };

  return (
    <div className="ai-alerts-container">
      {/* HEADER */}
      <div className="ai-alerts-header">
        <button className="ai-alerts-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="ai-alerts-header-center">
          <div className="ai-alerts-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
          </div>
          <div>
            <h1 className="ai-alerts-title">AI Alerts</h1>
            <div className="ai-alerts-subtitle-header">Real-time AI-generated vehicle alerts</div>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      <div className="ai-alerts-main-wrapper">
        {loading ? (
          <div className="ai-alerts-loader">
            <div className="ai-alerts-spinner"></div>
          </div>
        ) : error ? (
          <div className="ai-alerts-error">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="ai-alerts-empty">
            <span className="ai-alerts-empty-icon">🔔</span>
            <p>No Alerts Found</p>
          </div>
        ) : (
          <div className="ai-alerts-list">
            {alerts.map((alert, index) => {
              const matchedOn = alert.matched_on || "";
              const reportType = alert.report_type || "";
              const reportId = alert.report_id || "";
              const matchText = alert.match_text || "Match Found";

              return (
                <div
                  key={alert.alert_id || index}
                  className="ai-alerts-card"
                  onClick={() => router.push(`/AiAlertDetail?id=${alert.alert_id}&data=${encodeURIComponent(JSON.stringify(alert))}`)}
                >
                  <div className="ai-alerts-card-left">
                    {/* Avatar/Circle Icon (Flutter jaisa) */}
                    <div
                      className="ai-alerts-avatar"
                      style={{
                        backgroundColor: getAlertColor(matchedOn),
                        opacity: 0.15
                      }}
                    >
                      <span style={{ fontSize: "22px" }}>
                        {getAlertIcon(matchedOn)}
                      </span>
                    </div>
                    
                    <div className="ai-alerts-info">
                      {/* Title with Report ID and Type Badge */}
                      <div className="ai-alerts-title">
                        {reportType && (reportType.toLowerCase().includes("witness") || reportType.toLowerCase().includes("user"))
                          ? `Report #${reportId}`
                          : "OverSpeeding Alert"
                        }
                        <span 
                          className="ai-alerts-type-badge"
                          style={{
                            backgroundColor: getReportTypeColor(reportType),
                            color: "white"
                          }}
                        >
                          {getReportTypeLabel(reportType)}
                        </span>
                      </div>
                      
                      {/* Match Text */}
                      <div className="ai-alerts-subtitle">
                        {matchText}
                      </div>
                      
                      {/* Time */}
                      <div className="ai-alerts-time">
                        {formatTime(alert.alert_time)}
                      </div>
                    </div>
                  </div>
                  <span className="ai-alerts-arrow">›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import api from "@/utils/api";
// import "@/styles/AIAlerts.css";

// export default function AIAlertsPage() {
//   const router = useRouter();
//   const [alerts, setAlerts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     fetchAlerts();
//   }, []);

//   const fetchAlerts = async () => {
//     try {
//       const res = await api.get("/ai-alerts/");
//       setAlerts(Array.isArray(res.data) ? res.data : []);
//     } catch (err) {
//       console.error("Error fetching alerts:", err);
//       setError(err.message || "Failed to load alerts");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Colors based on matched_on type (Flutter jaisa)
//   const getAlertColor = (matchedOn) => {
//     switch (matchedOn) {
//       case "no_plate": return "#f44336";
//       case "color": return "#ff9800";
//       case "model": return "#2196f3";
//       case "company": return "#9c27b0";
//       default: return "#4e73df";
//     }
//   };

//   // Icons based on matched_on type (Flutter jaisa)
//   const getAlertIcon = (matchedOn) => {
//     switch (matchedOn) {
//       case "no_plate": return "🎟️";
//       case "color": return "🎨";
//       case "model": return "🚗";
//       case "company": return "🏭";
//       default: return "🔔";
//     }
//   };

//   // Report Type Label (Flutter jaisa)
//   const getReportTypeLabel = (reportType) => {
//     const normalized = (reportType || "").toLowerCase().replace("report", "");
//     if (normalized === "witness") return "Witness Report";
//     if (normalized === "user") return "User Report";
//     return "Alert";
//   };

//   // Report Type Color (Flutter jaisa)
//   const getReportTypeColor = (reportType) => {
//     const normalized = (reportType || "").toLowerCase().replace("report", "");
//     if (normalized === "witness") return "#ff9800";
//     if (normalized === "user") return "#4caf50";
//     return "#4e73df";
//   };

//   const formatTime = (timeStr) => {
//     if (!timeStr) return "";
//     const date = new Date(timeStr);
//     return date.toLocaleString();
//   };

//   return (
//     <div className="ai-alerts-container">
//       {/* HEADER */}
//       <div className="ai-alerts-header">
//         <button className="ai-alerts-back-btn" onClick={() => router.back()}>
//           ←
//         </button>
//         <div className="ai-alerts-header-center">
//           <div className="ai-alerts-logo-white">
//             <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
//           </div>
//           <div>
//             <h1 className="ai-alerts-title">AI Alerts</h1>
//             <div className="ai-alerts-subtitle-header">Real-time AI-generated vehicle alerts</div>
//           </div>
//         </div>
//         <div style={{ width: "40px" }}></div>
//       </div>

//       <div className="ai-alerts-main-wrapper">
//         {loading ? (
//           <div className="ai-alerts-loader">
//             <div className="ai-alerts-spinner"></div>
//           </div>
//         ) : error ? (
//           <div className="ai-alerts-error">{error}</div>
//         ) : alerts.length === 0 ? (
//           <div className="ai-alerts-empty">
//             <span className="ai-alerts-empty-icon">🔔</span>
//             <p>No Alerts Found</p>
//           </div>
//         ) : (
//           <div className="ai-alerts-list">
//             {alerts.map((alert, index) => {
//               const matchedOn = alert.matched_on || "";
//               const reportType = alert.report_type || "";
//               const reportId = alert.report_id || "";
//               const matchText = alert.match_text || "Match Found";

//               return (
//                 <div
//                   key={alert.alert_id || index}
//                   className="ai-alerts-card"
//                   onClick={() => router.push(`/AiAlertDetail?id=${alert.alert_id}&data=${encodeURIComponent(JSON.stringify(alert))}`)}
//                 >
//                   <div className="ai-alerts-card-left">
//                     {/* Avatar/Circle Icon (Flutter jaisa) */}
//                     <div
//                       className="ai-alerts-avatar"
//                       style={{
//                         backgroundColor: getAlertColor(matchedOn),
//                         opacity: 0.15
//                       }}
//                     >
//                       <span style={{ fontSize: "22px" }}>
//                         {getAlertIcon(matchedOn)}
//                       </span>
//                     </div>
                    
//                     <div className="ai-alerts-info">
//                       {/* Title with Report ID and Type Badge */}
//                       <div className="ai-alerts-title">
//                         {reportType && (reportType.toLowerCase().includes("witness") || reportType.toLowerCase().includes("user"))
//                           ? `Report #${reportId}`
//                           : "OverSpeeding Alert"
//                         }
//                         <span 
//                           className="ai-alerts-type-badge"
//                           style={{
//                             backgroundColor: getReportTypeColor(reportType),
//                             color: "white"
//                           }}
//                         >
//                           {getReportTypeLabel(reportType)}
//                         </span>
//                       </div>
                      
//                       {/* Match Text */}
//                       <div className="ai-alerts-subtitle">
//                         {matchText}
//                       </div>
                      
//                       {/* Time */}
//                       <div className="ai-alerts-time">
//                         {formatTime(alert.alert_time)}
//                       </div>
//                     </div>
//                   </div>
//                   <span className="ai-alerts-arrow">›</span>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }