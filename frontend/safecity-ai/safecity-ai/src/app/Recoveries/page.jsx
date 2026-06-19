// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/utils/api";
// import "@/styles/Recoveries.css";

// export default function RecoveriesPage() {
//   const router = useRouter();
//   const [vehicles, setVehicles] = useState([]);
//   const [filteredVehicles, setFilteredVehicles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     fetchUserVehicles();
//   }, []);

//   const fetchUserVehicles = async () => {
//     const userId = localStorage.getItem("user_id");
//     setLoading(true);
//     setError(null);
    
//     try {
//       const res = await api.get(`/recovery/user-vehicles/${userId}`);
//       const data = Array.isArray(res.data) ? res.data : [];
//       setVehicles(data);
      
//       // ✅ Sab vehicles show karo jo recovered hain (Approved/Rejected wali bhi)
//       const recoveredVehicles = data.filter(v => v.is_recovered === true);
//       setFilteredVehicles(recoveredVehicles);
      
//     } catch (err) {
//       console.error("Fetch Error:", err);
//       setError(err.message || "Failed to load vehicles");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (e) => {
//     const query = e.target.value.toLowerCase();
//     setSearchQuery(query);
//     setFilteredVehicles(
//       vehicles.filter((v) =>
//         (v.no_plate || "").toLowerCase().includes(query) &&
//         v.is_recovered === true
//       )
//     );
//   };

//   // Status message function
//   const getHandoverStatusMessage = (status) => {
//     switch (status) {
//       case "Pending":
//         return "⏳ Handover Request Submitted - Awaiting Police Verification";
//       case "Approved":
//         return "✅ Car Handover Complete! Vehicle collected successfully";
//       case "Rejected":
//         return "❌ Request Rejected - Please contact police station";
//       default:
//         return "📝 Recovery Available - Apply for Handover";
//     }
//   };

//   // Status color function
//   const getHandoverStatusColor = (status) => {
//     switch (status) {
//       case "Pending":
//         return "#ff9800";
//       case "Approved":
//         return "#4caf50";
//       case "Rejected":
//         return "#f44336";
//       default:
//         return "#2196f3";  // Blue color for "Apply" state
//     }
//   };

//   // Status icon function
//   const getHandoverStatusIcon = (status) => {
//     switch (status) {
//       case "Pending":
//         return "⏳";
//       case "Approved":
//         return "✅";
//       case "Rejected":
//         return "❌";
//       default:
//         return "📝";
//     }
//   };

//   return (
//     <div className="pol-container">
//       <div className="header-gradient-rv">
//         <div className="header-left-rv">
//           <button className="back-btn-rv" onClick={() => router.back()}>
//             ←
//           </button>
//           <h1 className="main-title-rv">Recoveries</h1>
//         </div>
//         <button className="refresh-btn-rv" onClick={fetchUserVehicles}>
//           🔄
//         </button>
//       </div>

//       <div className="pol-main-wrapper">
//         <div className="pol-search-box">
//           <span>🔍</span>
//           <input
//             type="text"
//             placeholder="Search your Car by No.Plate"
//             value={searchQuery}
//             onChange={handleSearch}
//             className="pol-search-input"
//           />
//         </div>

//         {loading && (
//           <div className="loading-container">
//             <div className="loading-spinner"></div>
//           </div>
//         )}

//         {error && !loading && (
//           <div className="error-container">
//             <p>Error: {error}</p>
//           </div>
//         )}

//         {!loading && !error && filteredVehicles.length === 0 && (
//           <div className="empty-container">
//             <p>No recovered vehicles found</p>
//           </div>
//         )}

//         {!loading && !error && filteredVehicles.map((v, index) => (
//           <VehicleCard
//             key={v.recovery_id ? `rec-${v.recovery_id}` : index}
//             v={v}
//             router={router}
//             getHandoverStatusMessage={getHandoverStatusMessage}
//             getHandoverStatusColor={getHandoverStatusColor}
//             getHandoverStatusIcon={getHandoverStatusIcon}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// // Vehicle Card Component
// function VehicleCard({ v, router, getHandoverStatusMessage, getHandoverStatusColor, getHandoverStatusIcon }) {
//   const handoverStatus = v.handover_status;
//   const isAlreadyRecovered = v.is_recovered === true || v.is_recovered === 1;
//   const isAccident = v.is_accident === true;

//   const handleApplyForRecovery = () => {
//     const vehicleData = {
//       no_plate: v.no_plate || "",
//       company: v.company || "",
//       model: v.model || "",
//       color: v.color || "",
//       car_year: v.car_year || "",
//       engine_no: v.engine_no || "",
//       chassis_no: v.chassis_no || "",
//       recovery_id: v.recovery_id || null,
//       is_accident: isAccident,
//     };
    
//     const vehicleEncoded = encodeURIComponent(JSON.stringify(vehicleData));
//     router.push(`/VehicleHandoverRequest?vehicle=${vehicleEncoded}&recoveryId=${v.recovery_id || 0}&isAlreadyRecovered=${isAlreadyRecovered}&isAccident=${isAccident}`);
//   };

//   // ✅ Check if button should be shown (only when no handover request exists)
//   const showApplyButton = !handoverStatus && v.is_recovered === true;

//   return (
//     <div className="pol-content-card">
//       <div className="card-header">
//         <h2 className="plate-number-display">{v.no_plate || "N/A"}</h2>
//         {isAccident && (
//           <span className="accident-badge" style={{
//             backgroundColor: "#dc3545",
//             color: "white",
//             padding: "4px 10px",
//             borderRadius: "20px",
//             fontSize: "12px",
//             marginLeft: "10px"
//           }}>
//             🚗 Accident Report
//           </span>
//         )}
//       </div>

//       <p className="car-model-text">
//         {v.company || ""} {v.model || ""}
//       </p>

//       <div className="divider"></div>

//       <div className="details-section">
//         <h4 className="section-title">Car Details:</h4>
//         <div className="vehicle-specs-grid">
//           <div className="detail-row">
//             <span className="detail-label">Company:</span>
//             <span className="detail-value">{v.company || "N/A"}</span>
//           </div>
//           <div className="detail-row">
//             <span className="detail-label">Model:</span>
//             <span className="detail-value">{v.model || "N/A"}</span>
//           </div>
//           <div className="detail-row">
//             <span className="detail-label">Color:</span>
//             <span className="detail-value">{v.color || "N/A"}</span>
//           </div>
//           <div className="detail-row">
//             <span className="detail-label">Year:</span>
//             <span className="detail-value">{v.car_year || "N/A"}</span>
//           </div>
//           <div className="detail-row">
//             <span className="detail-label">Number Plate:</span>
//             <span className="detail-value">{v.no_plate || "N/A"}</span>
//           </div>
          
//           {!isAccident && (
//             <>
//               <div className="detail-row">
//                 <span className="detail-label">Engine Number:</span>
//                 <span className="detail-value">{v.engine_no || "N/A"}</span>
//               </div>
//               <div className="detail-row">
//                 <span className="detail-label">Chassis Number:</span>
//                 <span className="detail-value">{v.chassis_no || "N/A"}</span>
//               </div>
//             </>
//           )}
          
//           {isAccident && v.car_image_path && (
//             <div className="detail-row">
//               <span className="detail-label">Accident Image:</span>
//               <div className="detail-value">
//                 <a 
//                   href={`http://localhost:8000/${v.car_image_path}`} 
//                   target="_blank" 
//                   rel="noopener noreferrer"
//                   style={{ color: "#007bff", textDecoration: "underline" }}
//                 >
//                   📸 View Image
//                 </a>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ✅ Status Banner - Always show if handoverStatus exists */}
//       {handoverStatus && (
//         <div
//           className="status-banner"
//           style={{
//             backgroundColor: getHandoverStatusColor(handoverStatus) + "20",
//             borderLeftColor: getHandoverStatusColor(handoverStatus),
//           }}
//         >
//           <span className="status-icon">{getHandoverStatusIcon(handoverStatus)}</span>
//           <span
//             className="status-message"
//             style={{ color: getHandoverStatusColor(handoverStatus) }}
//           >
//             {getHandoverStatusMessage(handoverStatus)}
//           </span>
//         </div>
//       )}

//       {/* ✅ Show message when no handover request */}
//       {!handoverStatus && v.is_recovered === true && (
//         <div
//           className="status-banner"
//           style={{
//             backgroundColor: "#2196f3" + "20",
//             borderLeftColor: "#2196f3",
//           }}
//         >
//           <span className="status-icon">📝</span>
//           <span className="status-message" style={{ color: "#2196f3" }}>
//             Recovery Available - Apply for Handover
//           </span>
//         </div>
//       )}

//       {/* ✅ Button - Sirf tab dikhao jab handoverStatus null ho */}
//       {showApplyButton && (
//         <button className="pol-btn-primary" onClick={handleApplyForRecovery}>
//           Apply for Recovery
//         </button>
//       )}
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/Recoveries.css";

export default function RecoveriesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchUserVehicles();
  }, []);

  const fetchUserVehicles = async () => {
    const userId = localStorage.getItem("user_id");
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.get(`/recovery/user-vehicles/${userId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setVehicles(data);
      
      // ✅ Sab vehicles show karo jo recovered hain
      const recoveredVehicles = data.filter(v => v.is_recovered === true);
      setFilteredVehicles(recoveredVehicles);
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredVehicles(
      vehicles.filter((v) =>
        (v.no_plate || "").toLowerCase().includes(query) &&
        v.is_recovered === true
      )
    );
  };

  // Status message function
  const getHandoverStatusMessage = (status) => {
    switch (status) {
      case "Pending":
        return "⏳ Handover Request Submitted - Awaiting Police Verification";
      case "Approved":
        return "✅ Car Handover Complete! Vehicle collected successfully";
      case "Rejected":
        return "❌ Request Rejected - Please contact police station";
      default:
        return "📝 Recovery Available - Apply for Handover";
    }
  };

  // Status color function
  const getHandoverStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#ff9800";
      case "Approved":
        return "#4caf50";
      case "Rejected":
        return "#f44336";
      default:
        return "#2196f3";
    }
  };

  // Status icon function
  const getHandoverStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "⏳";
      case "Approved":
        return "✅";
      case "Rejected":
        return "❌";
      default:
        return "📝";
    }
  };

  return (
    <div className="pol-container">
      <div className="header-gradient-rv">
        <div className="header-left-rv">
          <button className="back-btn-rv" onClick={() => router.back()}>
            ←
          </button>
          <h1 className="main-title-rv">Recoveries</h1>
        </div>
        <button className="refresh-btn-rv" onClick={fetchUserVehicles}>
          🔄
        </button>
      </div>

      <div className="pol-main-wrapper">
        <div className="pol-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search your Car by No.Plate"
            value={searchQuery}
            onChange={handleSearch}
            className="pol-search-input"
          />
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {error && !loading && (
          <div className="error-container">
            <p>Error: {error}</p>
          </div>
        )}

        {!loading && !error && filteredVehicles.length === 0 && (
          <div className="empty-container">
            <p>No recovered vehicles found</p>
          </div>
        )}

        {!loading && !error && filteredVehicles.map((v, index) => (
          <VehicleCard
            key={v.recovery_id ? `rec-${v.recovery_id}` : index}
            v={v}
            router={router}
            getHandoverStatusMessage={getHandoverStatusMessage}
            getHandoverStatusColor={getHandoverStatusColor}
            getHandoverStatusIcon={getHandoverStatusIcon}
          />
        ))}
      </div>
    </div>
  );
}

// Vehicle Card Component
function VehicleCard({ v, router, getHandoverStatusMessage, getHandoverStatusColor, getHandoverStatusIcon }) {
  const handoverStatus = v.handover_status;
  const isAlreadyRecovered = v.is_recovered === true || v.is_recovered === 1;
  const isAccident = v.is_accident === true;

  const handleApplyForRecovery = () => {
    const vehicleData = {
      no_plate: v.no_plate || "",
      company: v.company || "",
      model: v.model || "",
      color: v.color || "",
      car_year: v.car_year || "",
      engine_no: v.engine_no || "",
      chassis_no: v.chassis_no || "",
      recovery_id: v.recovery_id || null,
      is_accident: isAccident,
    };
    
    const vehicleEncoded = encodeURIComponent(JSON.stringify(vehicleData));
    router.push(`/VehicleHandoverRequest?vehicle=${vehicleEncoded}&recoveryId=${v.recovery_id || 0}&isAlreadyRecovered=${isAlreadyRecovered}&isAccident=${isAccident}`);
  };

  const showApplyButton = !handoverStatus && v.is_recovered === true;

  return (
    <div className="pol-content-card">
      <div className="card-header">
        <h2 className="plate-number-display">{v.no_plate || "N/A"}</h2>
        {isAccident && (
          <span className="accident-badge" style={{
            backgroundColor: "#dc3545",
            color: "white",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            marginLeft: "10px"
          }}>
            🚗 Accident Report
          </span>
        )}
      </div>

      <p className="car-model-text">
        {v.company || ""} {v.model || ""}
      </p>

      <div className="divider"></div>

      <div className="details-section">
        <h4 className="section-title">Car Details:</h4>
        <div className="vehicle-specs-grid">
          <div className="detail-row">
            <span className="detail-label">Company:</span>
            <span className="detail-value">{v.company || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Model:</span>
            <span className="detail-value">{v.model || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Color:</span>
            <span className="detail-value">{v.color || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Year:</span>
            <span className="detail-value">{v.car_year || "N/A"}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Number Plate:</span>
            <span className="detail-value">{v.no_plate || "N/A"}</span>
          </div>
          
          {/* ✅ RECOVERY DATE ADDED HERE */}
          <div className="detail-row">
            <span className="detail-label">Recovery Date:</span>
            <span className="detail-value">{v.recovery_date ? new Date(v.recovery_date).toLocaleDateString() : "N/A"}</span>
          </div>
          
          {!isAccident && (
            <>
              <div className="detail-row">
                <span className="detail-label">Engine Number:</span>
                <span className="detail-value">{v.engine_no || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Chassis Number:</span>
                <span className="detail-value">{v.chassis_no || "N/A"}</span>
              </div>
            </>
          )}
          
          {isAccident && v.car_image_path && (
            <div className="detail-row">
              <span className="detail-label">Accident Image:</span>
              <div className="detail-value">
                <a 
                  href={`http://localhost:8000/${v.car_image_path}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline" }}
                >
                  📸 View Image
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner - Always show if handoverStatus exists */}
      {handoverStatus && (
        <div
          className="status-banner"
          style={{
            backgroundColor: getHandoverStatusColor(handoverStatus) + "20",
            borderLeftColor: getHandoverStatusColor(handoverStatus),
          }}
        >
          <span className="status-icon">{getHandoverStatusIcon(handoverStatus)}</span>
          <span
            className="status-message"
            style={{ color: getHandoverStatusColor(handoverStatus) }}
          >
            {getHandoverStatusMessage(handoverStatus)}
          </span>
        </div>
      )}

      {/* Show message when no handover request */}
      {!handoverStatus && v.is_recovered === true && (
        <div
          className="status-banner"
          style={{
            backgroundColor: "#2196f3" + "20",
            borderLeftColor: "#2196f3",
          }}
        >
          <span className="status-icon">📝</span>
          <span className="status-message" style={{ color: "#2196f3" }}>
            Recovery Available - Apply for Handover
          </span>
        </div>
      )}

      {/* Button - Sirf tab dikhao jab handoverStatus null ho */}
      {showApplyButton && (
        <button className="pol-btn-primary" onClick={handleApplyForRecovery}>
          Apply for Handover
        </button>
      )}
    </div>
  );
}
