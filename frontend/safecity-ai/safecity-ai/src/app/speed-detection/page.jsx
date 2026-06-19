"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/SpeedDetection.css";

export default function SpeedDetectionPage() {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [cameras, setCameras] = useState([]);
  const [loadingCams, setLoadingCams] = useState(true);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await api.get("/cameras");
      if (res.status === 200) {
        setCameras(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch cameras:", err);
    } finally {
      setLoadingCams(false);
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setErrorMsg("File size exceeds 100MB limit");
        return;
      }
      if (!file.type.startsWith("video/")) {
        setErrorMsg("Please select a valid video file");
        return;
      }
      setSelectedVideo(file);
      setResult(null);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedVideo) return;
    setIsUploading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("video", selectedVideo);
      if (selectedCameraId) {
        formData.append("camera_id", selectedCameraId);
      }

      const res = await api.post("/upload_video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
    } catch (err) {
      if (err.response) {
        setErrorMsg(`Server Error: ${err.response.data?.message || err.response.statusText}`);
      } else if (err.request) {
        setErrorMsg("Network Error: Unable to reach server");
      } else {
        setErrorMsg(`Error: ${err.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="pol-container">
      <div className="pol-header">
        <button className="pol-back-btn" onClick={() => router.back()}>
          &#8592;
        </button>
        <div className="pol-header-center">
          <div className="pol-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
          </div>
          <h1 className="pol-title">Safe City &nbsp; AI</h1>
        </div>
        <div className="pol-header-spacer"></div>
      </div>

      <div className="pol-main-wrapper">
        <div className="pol-greet-section">
          <div className="pol-greet-content">
            <h3>Operational Intelligence</h3>
            <h2>Speed Detection Analysis</h2>
            <p>Monitor traffic flow and detect over-speeding violations with advanced AI.</p>
          </div>
        </div>

        <div className="pol-content-card upload-card">
          <div className="upload-icon-circle">
            <span className="upload-icon">🎬</span>
          </div>
          <h3 className="upload-card-title">Upload Traffic Video</h3>
          <p className="upload-card-subtitle">Select a video to detect car speeds</p>

          {selectedVideo && (
            <div className="selected-video-badge">
              <span className="video-icon">📹</span>
              <span className="video-name">{selectedVideo.name}</span>
            </div>
          )}

          <div className="upload-buttons-row">
            <label className="pol-btn pol-btn-outlined">
              📂 Select Video
              <input type="file" accept="video/*" onChange={handleVideoSelect} hidden />
            </label>
            <button
              className={`pol-btn pol-btn-filled ${(!selectedVideo || isUploading) ? "pol-btn-disabled" : ""}`}
              onClick={handleUpload}
              disabled={!selectedVideo || isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner-small"></span>
                  Processing...
                </>
              ) : (
                "🚀 Detect"
              )}
            </button>
          </div>
        </div>

        <div className="camera-section">
          <label className="camera-label">Select Camera (optional)</label>
          {loadingCams ? (
            <div className="camera-loading">
              <span className="spinner-small"></span>
              Loading cameras...
            </div>
          ) : (
            <div className="camera-dropdown-wrapper">
              <select
                className="camera-dropdown"
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
              >
                <option value="">No Camera</option>
                {cameras.map((cam) => (
                  <option key={cam.id} value={cam.id}>
                    Camera #{cam.id} — {cam.direction || ""} ({cam.status || ""})
                  </option>
                ))}
              </select>
              <span className="dropdown-arrow">▼</span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="processing-card">
            <div className="processing-card-content">
              <span className="spinner"></span>
              <div className="processing-text">
                <h4>Processing video...</h4>
                <p>Detecting speed & car details</p>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
          </div>
        )}

        {result && (
          <>
            <div className="total-cars-banner">
              <span className="banner-label">Total Cars Detected</span>
              <span className="banner-count">{result.total_cars}</span>
            </div>

            <div className="speed-summary">
              <div className="summary-item">
                <span className="summary-label">Limit</span>
                <span className="summary-value">{result.speed_limit || 80} km/h</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item summary-item-warning">
                <span className="summary-icon">⚠️</span>
                <span className="summary-label">Overspeed</span>
                <span className="summary-value">{result.overspeed_count || 0}</span>
              </div>
            </div>

            <h3 className="results-title">Speed Results</h3>

            <div className="vehicle-list">
              {result.speeds.map((car) => {
                const speed = car.speed_kmh;
                const isOver = car.is_over_speed === true;
                const company = car.company || "Unknown";
                const model = car.model || "Unknown";
                const color = car.color || "Unknown";
                const noPlate = car.no_plate || "N/A";
                const generation = car.generation;
                const hasAlert = car.alert_generated === true;
                const alertId = car.alert_id;

                return (
                  <div key={car.car_id} className={`vehicle-card ${isOver ? "vehicle-overspeed" : "vehicle-normal"}`}>
                    <div className={`vehicle-card-header ${isOver ? "header-red" : "header-green"}`}>
                      <div className="vehicle-icon-circle">🚗</div>
                      <div className="vehicle-basic-info">
                        <h4>Car #{car.car_id}</h4>
                        <p>{company} {model}</p>
                      </div>
                      <div className="vehicle-speed-block">
                        <span className="speed-number">{speed.toFixed(1)}</span>
                        <span className="speed-unit">km/h</span>
                        {isOver && <span className="badge-overspeed">⚠ Over Speed!</span>}
                        {hasAlert && alertId && <span className="badge-alert">🚨 Alert #{alertId}</span>}
                      </div>
                    </div>

                    <div className="vehicle-card-body">
                      <div className="chips-row">
                        <div className="detail-chip">
                          <span className="chip-icon">🏭</span>
                          <span className="chip-text">{company}</span>
                        </div>
                        <div className="detail-chip">
                          <span className="chip-icon">🔧</span>
                          <span className="chip-text">{model}</span>
                        </div>
                      </div>
                      <div className="chips-row">
                        <div className="detail-chip">
                          <span className="chip-icon">🎨</span>
                          <span className="chip-text">{color}</span>
                        </div>
                        <div className="detail-chip">
                          <span className="chip-icon">🔢</span>
                          <span className="chip-text">{noPlate}</span>
                        </div>
                      </div>
                      {generation && (
                        <div className="chips-row">
                          <div className="detail-chip">
                            <span className="chip-icon">⚙️</span>
                            <span className="chip-text">{generation} Gen</span>
                          </div>
                        </div>
                      )}

                      <div className="timeline">
                        <div className="timeline-row">
                          <div className="timeline-dot timeline-dot-start"></div>
                          <div className="timeline-info">
                            <span className="timeline-label">Line A (Start)</span>
                            <span className="timeline-value">{car.time_A || "--"}</span>
                          </div>
                        </div>
                        <div className="timeline-line"></div>
                        <div className="timeline-row">
                          <div className="timeline-dot timeline-dot-end"></div>
                          <div className="timeline-info">
                            <span className="timeline-label">Line B (End)</span>
                            <span className="timeline-value">{car.time_B || "--"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// "use client";
// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import api from "@/utils/api";
// import "@/styles/SpeedDetection.css"; 

// export default function SpeedDetectionPage() {
//   const router = useRouter();
//   const [selectedVideo, setSelectedVideo] = useState(null);
//   const [isUploading, setIsUploading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [errorMsg, setErrorMsg] = useState(null);

//   const handleVideoSelect = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setSelectedVideo(file);
//       setResult(null);
//       setErrorMsg(null);
//     }
//   };

//   const handleUpload = async () => {
//     if (!selectedVideo) return;
//     setIsUploading(true);
//     setResult(null);

//     try {
//       const formData = new FormData();
//       formData.append("video", selectedVideo);

//       // Aapka backend endpoint
//       const res = await api.post("/upload_video", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       setResult(res.data);
//     } catch (err) {
//       setErrorMsg(`Detection Failed: ${err.message}`);
//     } finally {
//       setIsUploading(false);
//     }
//   };

//   return (
//     <div className="pol-container">
//       {/* BRAND HEADER - Exactly like your Dashboard */}
//       <div className="pol-header">
//         <button className="pol-back-btn" onClick={() => router.back()}>
//           &#8592;
//         </button>
//         <div className="pol-header-center">
//           <div className="pol-logo-white">
//             <Image src="/images/logo.svg" alt="Logo" width={35} height={35} />
//           </div>
//           <h1 className="pol-title">Safe City &nbsp; AI</h1>
//         </div>
//         <div style={{ width: "40px" }}></div>
//       </div>

//       <div className="pol-main-wrapper">
//         {/* Page Title Section */}
//         <div className="pol-greet-section">
//           <div className="pol-greet-content">
//             <h3>Operational Intelligence</h3>
//             <h2>Speed Detection Analysis</h2>
//             <p>Monitor traffic flow and detect over-speeding violations in real-time.</p>
//           </div>
//         </div>

//         {/* UPLOAD SECTION - Styled like your Content Card */}
//         <div className="pol-content-card">
//           <h3 className="section-label">Video Processing Unit</h3>
          
//           <div style={{ textAlign: "center", padding: "20px 0" }}>
//             <div className="row-icon-box" style={{ margin: "0 auto 20px" }}>🎥</div>
            
//             {selectedVideo && (
//               <div className="status-badge bg-green" style={{ marginBottom: "20px", display: "inline-block" }}>
//                 Selected: {selectedVideo.name}
//               </div>
//             )}

//             <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
//               <label className="mark-recovered-btn" style={{ background: "#4e73df", cursor: "pointer" }}>
//                 📂 Select Footage
//                 <input type="file" accept="video/*" onChange={handleVideoSelect} hidden />
//               </label>

//               <button 
//                 className="mark-recovered-btn" 
//                 onClick={handleUpload} 
//                 disabled={!selectedVideo || isUploading}
//               >
//                 {isUploading ? "Analyzing..." : "🚀 Start Detection"}
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* LOADING & ERROR STATES */}
//         {isUploading && (
//           <div className="pr-loading">AI is processing frames and calculating speed...</div>
//         )}
//         {errorMsg && <div className="status-badge bg-orange" style={{ width: "100%", textAlign: "center", padding: "15px" }}>{errorMsg}</div>}

//         {/* RESULTS LIST - Using your pol-row-item style */}
//         {result && (
//           <div className="pol-content-card">
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
//               <h3 className="section-label" style={{ margin: 0 }}>Detected Vehicles</h3>
//               <div className="status-badge bg-green" style={{ fontSize: "14px" }}>Total: {result.total_cars}</div>
//             </div>

//             <div className="pol-action-list">
//               {result.speeds.map((car) => {
//                 const isOverSpeed = car.speed_kmh > 60; // Aapki limit
//                 return (
//                   <div key={car.car_id} className="pol-row-item">
//                     <div className="row-left">
//                       <div className="row-icon-box" style={{ background: isOverSpeed ? "#ffebee" : "#e8f5e9" }}>
//                         {isOverSpeed ? "⚠️" : "🚗"}
//                       </div>
//                       <div className="row-info">
//                         <h4>Vehicle #ID-{car.car_id}</h4>
//                         <div className="row-status-container">
//                           <span className={`status-badge ${isOverSpeed ? 'bg-orange' : 'bg-green'}`}>
//                             {isOverSpeed ? "Over Speed" : "Normal"}
//                           </span>
//                           <p className="row-subtext">Detection completed at Line B</p>
//                         </div>
                        
//                         {/* Details Grid like your Details page */}
//                         <div className="details-grid">
//                           <div className="detail-item"><strong>Start:</strong> {car.time_A}s (F-{car.frame_A})</div>
//                           <div className="detail-item"><strong>End:</strong> {car.time_B}s (F-{car.frame_B})</div>
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div style={{ textAlign: "right" }}>
//                       <div className="speed-value" style={{ color: isOverSpeed ? "#e53935" : "#1cc88a" }}>
//                         {car.speed_kmh.toFixed(1)} <small>km/h</small>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }