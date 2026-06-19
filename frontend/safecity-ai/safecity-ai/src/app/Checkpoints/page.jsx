"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/Checkpoints.css";

export default function CheckpointsPage() {
  const router = useRouter();
  const [checkpoints, setCheckpoints] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userRole = localStorage.getItem("role");
    setRole(userRole);
    setIsAdmin(userRole?.toLowerCase() === "admin");
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cpRes, placeRes, camRes] = await Promise.all([
        api.get("/checkpoints"),
        api.get("/places"),
        api.get("/cameras")
      ]);
      
      setCheckpoints(Array.isArray(cpRes.data) ? cpRes.data : []);
      setPlaces(Array.isArray(placeRes.data) ? placeRes.data : []);
      setCameras(Array.isArray(camRes.data) ? camRes.data : []);
    } catch (err) {
      console.error("Error fetching checkpoint data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isAdmin) router.push("/adminDashboard");
    else router.push("/policeDashboard");
  };

  // ✅ Clean direction text
  const cleanDirection = (direction) => {
    if (!direction) return "";
    return direction
      .replace("Camera Direction: ", "")
      .replace("Camera Direction:", "")
      .trim();
  };

  // ✅ Get place name by place_id
  const getPlaceName = (placeId) => {
    const place = places.find(p => p.id === placeId);
    return place?.name || "Unknown Location";
  };

  // ✅ Get camera info by camera_id
  const getCameraInfo = (cameraId) => {
    const cam = cameras.find(c => (c.id || c.camera_id) === cameraId);
    return {
      id: cam?.id || cam?.camera_id || cameraId,
      direction: cleanDirection(cam?.direction),
      place: cam?.place || "Unknown",
    };
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="cp-container">
        <header className="cp-header">
          <button className="cp-back-btn" onClick={handleBack}>←</button>
          <div className="cp-header-center">
            <div className="cp-logo-white">
              <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="cp-title">🚩 CheckPoints</h1>
              <p className="cp-subtitle">Manage your city checkpoints</p>
            </div>
          </div>
          <div style={{ width: "40px" }}></div>
        </header>
        <div className="cp-loader-container">
          <div className="cp-spinner"></div>
          <p>Loading checkpoints...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-container">
      {/* HEADER */}
      <header className="cp-header">
        <button className="cp-back-btn" onClick={handleBack}>←</button>
        <div className="cp-header-center">
          <div className="cp-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="cp-title">🚩 CheckPoints</h1>
            <p className="cp-subtitle">Manage your city checkpoints</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="cp-content">
        <div className="cp-list">
          {checkpoints.length === 0 ? (
            <div className="cp-empty-state">
              <div className="cp-empty-icon">📭</div>
              <p className="cp-empty-text">No checkpoints registered yet.</p>
              {isAdmin && (
                <button 
                  className="cp-create-first-btn"
                  onClick={() => router.push("/add-checkpoint")}
                >
                  + Create First Checkpoint
                </button>
              )}
            </div>
          ) : (
            checkpoints.map(cp => {
              const placeName = getPlaceName(cp.place_id);
              const cameraIds = cp.linked_camera_ids || cp.camera_ids || [];
              const officerIds = cp.linked_officer_ids || [];

              return (
                <div key={cp.id} className="cp-card">
                  {/* Card Header: Name + Location + ID Badge */}
                  <div className="cp-card-header">
                    <div className="cp-card-icon">🚩</div>
                    <div className="cp-card-info">
                      <h4 className="cp-card-title">{cp.name}</h4>
                      <p className="cp-card-location">
                        <span className="location-icon">📍</span> 
                        {placeName}
                      </p>
                    </div>
                    <span className="cp-id-badge">ID: {cp.id}</span>
                  </div>

                  <hr className="cp-divider" />

                  {/* Cameras Section */}
                  <div className="cp-section">
                    <span className="cp-section-icon">📹</span>
                    <span className="cp-section-label">Cameras:</span>
                    {cameraIds.length === 0 ? (
                      <span className="cp-none-text">None</span>
                    ) : (
                      <div className="cp-chip-container">
                        {cameraIds.map(id => {
                          const cam = getCameraInfo(id);
                          return (
                            <div key={id} className="cp-chip-item-detailed">
                              <div className="cp-chip-row">
                                <span className="cp-chip-icon">📹</span>
                                <span className="cp-chip-camera-id">Camera #{cam.id}</span>
                              </div>
                              <div className="cp-chip-row">
                                <span className="cp-chip-sub">📍 {cam.place}</span>
                              </div>
                              <div className="cp-chip-row">
                                <span className="cp-chip-sub">➤ {cam.direction}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Officers Section */}
                  <div className="cp-section-officers">
                    <span className="cp-section-icon">👮</span>
                    <span className="cp-section-label">
                      Officers: {officerIds.length} assigned
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ADD BUTTON - Admin Only */}
        {isAdmin && checkpoints.length > 0 && (
          <div className="cp-button-wrapper">
            <button 
              className="cp-add-btn"
              onClick={() => router.push("/add-checkpoint")}
            >
              <span>+</span> Add New CheckPoint
            </button>
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
// import "@/styles/Checkpoints.css";

// export default function CheckpointsPage() {
//   const router = useRouter();
//   const [checkpoints, setCheckpoints] = useState([]);
//   const [places, setPlaces] = useState([]);
//   const [cameras, setCameras] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
//   const isAdmin = role?.toLowerCase() === "admin";

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     try {
//       const [cpRes, placeRes, camRes] = await Promise.all([
//         api.get("/checkpoints"),
//         api.get("/places"),
//         api.get("/cameras")
//       ]);
//       setCheckpoints(Array.isArray(cpRes.data) ? cpRes.data : []);
//       setPlaces(Array.isArray(placeRes.data) ? placeRes.data : []);
//       setCameras(Array.isArray(camRes.data) ? camRes.data : []);
//     } catch (err) {
//       console.error("Error fetching checkpoint data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     if (isAdmin) router.push("/adminDashboard");
//     else router.push("/policeDashboard");
//   };

//   return (
//     <div className="cp-container">
//       {/* HEADER */}
//       <header className="cp-header">
//         <button className="cp-back-btn" onClick={handleBack}>←</button>
//         <div className="cp-header-center">
//           {/* <div className="cp-logo-white">
//             <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
//           </div> */}
//           <div>
//             <h1 className="cp-title">🚩 CheckPoints</h1>
//             <p className="cp-subtitle">Manage your city checkpoints</p>
//           </div>
//         </div>
//         <div style={{ width: "40px" }}></div>
//       </header>

//       <div className="cp-content">
//         <div className="cp-list">
//           {loading ? (
//             <div className="cp-loader"><div className="cp-spinner"></div></div>
//           ) : checkpoints.length === 0 ? (
//             <div className="cp-empty">
//               <p>No checkpoints registered yet.</p>
//             </div>
//           ) : (
//             checkpoints.map(cp => {
//               const place = places.find(p => p.id === cp.place_id);
              
//               return (
//                 <div key={cp.id} className="cp-card">
//                   <div className="cp-card-info">
//                     <h4>{cp.name}</h4>
//                     <p className="cp-card-location">📍 {place?.name || "Unknown Location"}</p>
//                   </div>

//                   {/* Camera Chips */}
//                   <div className="cp-chip-container">
//                     {cp.camera_ids && cp.camera_ids.length > 0 ? (
//                       cp.camera_ids.map(id => {
//                         const cam = cameras.find(c => c.id === id);
//                         return (
//                           <span key={id} className="cp-chip">
//                             📹 {cam?.direction || "Unknown Dir"}
//                           </span>
//                         );
//                       })
//                     ) : (
//                       <span className="cp-chip cp-chip-empty">No cameras assigned</span>
//                     )}
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* ACTION BUTTON - Admin Only */}
//         {isAdmin && (
//           <div className="cp-button-wrapper">
//             <button className="cp-add-btn" onClick={() => router.push("/AddCheckpoint")}>
//               + Add New CheckPoint
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }