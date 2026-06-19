"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/ReportStatus.css";

// ✅ Status badge with better colors
function getStatusClass(status) {
  if (status === "Recovered") return "rs-badge rs-badge-recovered";
  if (status === "Rejected") return "rs-badge rs-badge-rejected";
  if (status === "Pending") return "rs-badge rs-badge-pending";
  if (status === "Resolved") return "rs-badge rs-badge-resolved";
  return "rs-badge rs-badge-pending";
}

export default function ReportStatusPage() {
  const router = useRouter();

  const [theftReports, setTheftReports] = useState([]);
  const [accidentReports, setAccidentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    const id = parseInt(localStorage.getItem("user_id") || "0", 10);
    if (!id) { setLoading(false); return; }

    try {
      const theftRes = await api.get(`/reports/user/${id}`);
      let theftData = Array.isArray(theftRes.data) ? theftRes.data : [];
      
      const accidentRes = await api.get(`/reports/witness/user/${id}`);
      let accidentData = Array.isArray(accidentRes.data) ? accidentRes.data : [];
      
      accidentData = accidentData.map(report => ({
        ...report,
        status: report.status || "Pending",
        incident_type: "Accident"
      }));
      
      // Sort: Pending first, then others
      const sortByStatus = (a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return 0;
      };
      
      theftData.sort(sortByStatus);
      accidentData.sort(sortByStatus);
      
      setTheftReports(theftData);
      setAccidentReports(accidentData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const allEmpty = theftReports.length === 0 && accidentReports.length === 0;

  return (
    <div className="rs-container web-view">
      {/* Header */}
      <div className="rs-header">
        <button className="rs-back-btn" onClick={() => router.back()}>&#8592;</button>
        <div className="rs-header-center">
          <div className="rs-logo-white">
            <img src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <span className="rs-title">My Reports 📋</span>
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      <div className="rs-body web-layout">
        {loading ? (
          <div className="rs-loader"><div className="rs-spinner" /></div>
        ) : allEmpty ? (
          <div className="rs-empty">
            <span className="rs-empty-icon">📋</span>
            <p>No reports filed yet.</p>
          </div>
        ) : (
          <div className="rs-sections-grid">
            
            {/* Theft Reports Section */}
            {theftReports.length > 0 && (
              <div className="rs-section">
                <h2 className="section-title theft-title">🚨 Theft Reports</h2>
                {theftReports.map((r, i) => (
                  <ReportCard key={`theft-${r.report_id || i}`} r={r} />
                ))}
              </div>
            )}

            {/* Accident Reports Section */}
            {accidentReports.length > 0 && (
              <div className="rs-section">
                <h2 className="section-title accident-title">💥 Accident Reports</h2>
                {accidentReports.map((r, i) => (
                  <ReportCard key={`accident-${r.witness_report_id || i}`} r={r} isAccident />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Report Card Component - Better UI with ID display
function ReportCard({ r, isAccident }) {
  const reportStatus = r.status || "Pending";
  const isRecovered = reportStatus === "Recovered";
  const reportId = isAccident ? r.witness_report_id : r.report_id;

  return (
    <div className={`rs-card ${isRecovered ? "rs-card-recovered" : ""}`}>
      {/* Card Header with Type and Status */}
      <div className="rs-card-header">
        <div className="rs-card-type">
          <span className="rs-type-icon">{isAccident ? "🚗" : "🚨"}</span>
          <span className="rs-type-text">
            {isAccident ? "Accident Report" : "Theft Report"}
          </span>
          <span className="rs-type-id">#{reportId}</span>
        </div>
        <div className={getStatusClass(reportStatus)}>
          {reportStatus === "Recovered" && "✓ "}
          {reportStatus}
        </div>
      </div>

      {/* Vehicle Info - For Accident Reports */}
      {isAccident && r.no_plate && (
        <div className="rs-vehicle-info">
          <span className="rs-vehicle-plate">🚗 {r.no_plate}</span>
          {r.company && <span className="rs-vehicle-model">{r.company} {r.model}</span>}
          {r.vehicle_type && <span className="rs-vehicle-type">({r.vehicle_type})</span>}
        </div>
      )}

      {/* Description */}
      <p className="rs-description">{r.description ?? "No description provided"}</p>
      
      {/* Footer with Location and Date */}
      <div className="rs-card-footer">
        <div className="rs-footer-item">
          <span className="rs-footer-icon">📍</span>
          <span>{r.place_name || "Location not specified"}</span>
        </div>
        <div className="rs-footer-item">
          <span className="rs-footer-icon">📅</span>
          <span>{r.date ? new Date(r.date).toLocaleDateString() : "Date not available"}</span>
        </div>
      </div>
    </div>
  );
}

// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/utils/api";
// import "@/styles/ReportStatus.css";

// function getStatusClass(status) {
//   if (status === "Resolved") return "rs-badge rs-badge-resolved";
//   if (status === "Rejected") return "rs-badge rs-badge-rejected";
//   if (status === "Recovered") return "rs-badge rs-badge-resolved"; // ✅ Add Recovered
//   if (status === "Active")   return "rs-badge rs-badge-active";
//   return "rs-badge rs-badge-pending";
// }

// export default function ReportStatusPage() {
//   const router = useRouter();

//   const [theftReports, setTheftReports] = useState([]);
//   const [accidentReports, setAccidentReports] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchAllReports();
//   }, []);

//   const fetchAllReports = async () => {
//   const id = parseInt(localStorage.getItem("user_id") || "0", 10);
//   if (!id) { setLoading(false); return; }

//   try {
//     // ✅ Theft reports fetch
//     const theftRes = await api.get(`/reports/user/${id}`);
//     let theftData = Array.isArray(theftRes.data) ? theftRes.data : [];
    
//     // ✅ Accident reports fetch
//     const accidentRes = await api.get(`/reports/witness/user/${id}`);
//     let accidentData = Array.isArray(accidentRes.data) ? accidentRes.data : [];
    
//     // ✅ FIX: Accident reports ka status ensure karo
//     accidentData = accidentData.map(report => ({
//       ...report,
//       status: report.status || "Pending",  // Ensure status exists
//       incident_type: "Accident"
//     }));
    
//     // ✅ Sort
//     const sortByStatus = (a, b) => {
//       if (a.status === "Pending" && b.status !== "Pending") return -1;
//       if (a.status !== "Pending" && b.status === "Pending") return 1;
//       return 0;
//     };
    
//     theftData.sort(sortByStatus);
//     accidentData.sort(sortByStatus);
    
//     setTheftReports(theftData);
//     setAccidentReports(accidentData);
//   } catch (err) {
//     console.error("Fetch error:", err);
//   } finally {
//     setLoading(false);
//   }
// };

//   const allEmpty = theftReports.length === 0 && accidentReports.length === 0;

//   return (
//     <div className="rs-container web-view">
//       <div className="rs-header">
//         <button className="rs-back-btn" onClick={() => router.back()}>&#8592;</button>
//         <span className="rs-title">My Reports 📋</span>
//       </div>

//       <div className="rs-body web-layout">
//         {loading ? (
//           <div className="rs-loader"><div className="rs-spinner" /></div>
//         ) : allEmpty ? (
//           <div className="rs-empty">
//             <span className="rs-empty-icon">📋</span>
//             <p>No reports filed yet.</p>
//           </div>
//         ) : (
//           <div className="rs-sections-grid">
            
//             {/* Theft Reports Section */}
//             {theftReports.length > 0 && (
//               <div className="rs-section">
//                 <h2 className="section-title theft-title">🚨 Theft Reports</h2>
//                 {theftReports.map((r, i) => (
//                   <ReportCard key={`theft-${r.report_id || i}`} r={r} />
//                 ))}
//               </div>
//             )}

//             {/* Accident Reports Section */}
//             {accidentReports.length > 0 && (
//               <div className="rs-section">
//                 <h2 className="section-title accident-title">💥 Accident Reports</h2>
//                 {accidentReports.map((r, i) => (
//                   <ReportCard key={`accident-${r.witness_report_id || i}`} r={r} isAccident />
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function ReportCard({ r, isAccident }) {
//   // ✅ Get correct status
//   const reportStatus = r.status || "Pending";
//   const isRecovered = reportStatus === "Recovered";
  
//   return (
//     <div className="rs-card" style={{ 
//       opacity: isRecovered ? 0.7 : 1,
//       backgroundColor: isRecovered ? "#f0f0f0" : "white"
//     }}>
//       <div className="rs-card-top">
//         <span className="rs-incident-type">
//           {isAccident ? "Accident / Hit-and-Run" : (r.incident_type ?? "Theft")}
//         </span>
//         <span className={getStatusClass(reportStatus)}>
//           {reportStatus}
//         </span>
//       </div>
      
//       {isAccident && r.no_plate && (
//         <div className="rs-car-mini-info">
//           <span>🚗 {r.no_plate}</span>
//           {r.company && <span> • {r.company} {r.model}</span>}
//         </div>
//       )}

//       <p className="rs-description">{r.description ?? ""}</p>
      
//       <div className="rs-card-footer">
//         <span className="footer-item">📍 {r.place_name ?? "-"}</span>
//         <span className="footer-item">📅 {r.date ? r.date.toString().substring(0, 10) : "-"}</span>
//       </div>
      
//       {/* ✅ Show recovered badge */}
//       {isRecovered && (
//         <div className="recovered-badge" style={{
//           marginTop: "10px",
//           padding: "5px 10px",
//           backgroundColor: "#4caf50",
//           color: "white",
//           borderRadius: "5px",
//           textAlign: "center",
//           fontSize: "12px"
//         }}>
//           ✓ Vehicle Recovered
//         </div>
//       )}
//     </div>
//   );
// }