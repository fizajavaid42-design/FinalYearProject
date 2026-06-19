"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/CameraGraph.css";

export default function CameraGraphPage() {
  const router = useRouter();
  const [cameras, setCameras] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Admin Form States
  const [fromCamera, setFromCamera] = useState("");
  const [toCameras, setToCameras] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [camRes, graphRes] = await Promise.all([
        api.get("/cameras"),
        api.get("/camera-graph")
      ]);
      setCameras(Array.isArray(camRes.data) ? camRes.data : []);
      setLinks(Array.isArray(graphRes.data) ? graphRes.data : []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id) => {
    if (toCameras.includes(id)) {
      setToCameras(toCameras.filter(item => item !== id));
    } else {
      setToCameras([...toCameras, id]);
    }
  };

  const handleAddLinks = async (e) => {
    e.preventDefault();
    if (!fromCamera || toCameras.length === 0) {
      alert("Please select Source and Destinations!");
      return;
    }
    
    setSubmitting(true);
    try {
      for (const toId of toCameras) {
        if (parseInt(fromCamera) === toId) continue;
        await api.post(`/camera-graph?from_camera_id=${fromCamera}&to_camera_id=${toId}`);
      }
      alert("Connections successfully added!");
      setFromCamera("");
      setToCameras([]);
      fetchData();
    } catch (err) {
      alert("Error adding connections.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLinks = links.filter((link) => {
    const fromName = link.from_camera?.place?.toLowerCase() || "";
    const toName = link.to_camera?.place?.toLowerCase() || "";
    return fromName.includes(search.toLowerCase()) || toName.includes(search.toLowerCase());
  });

  return (
    <div className="cg-container">
      {/* HEADER */}
      <header className="cg-header">
        <button className="cg-back-btn" onClick={() => router.back()}>←</button>
        <div className="cg-header-center">
          <div className="cg-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="cg-title">🔗 Camera Network</h1>
            <p className="cg-subtitle">View and manage camera connections</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="cg-content">
        {/* Search Bar */}
        <div className="cg-search-container">
          <div className="cg-search-box">
            <span className="cg-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search connections by location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cg-search-input"
            />
          </div>
        </div>

        {/* ✅ ADMIN: Add New Connection Form - Sirf Admin Ko Dikhega */}
        {isAdmin && (
          <div className="cg-add-section">
            <h2 className="cg-section-title">
              <span>➕</span> Add New Connection
            </h2>
            
            <form onSubmit={handleAddLinks} className="cg-admin-form">
              {/* Source Selection */}
              <div className="cg-form-group">
                <label>From Camera (Source Location)</label>
                <div className="cg-select-wrapper">
                  <span className="cg-input-icon">📍</span>
                  <select 
                    value={fromCamera} 
                    onChange={(e) => setFromCamera(e.target.value)}
                    className="cg-select"
                  >
                    <option value="">-- Select Source Camera --</option>
                    {cameras.map((cam) => (
                      <option key={`from-${cam.id}`} value={cam.id}>
                        {cam.place} ({cam.direction})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Selection */}
              <div className="cg-form-group">
                <label>To Cameras (Destinations)</label>
                <div className="cg-cameras-grid">
                  {cameras.map((cam) => (
                    <div 
                      key={`to-${cam.id}`} 
                      className={`cg-camera-card ${toCameras.includes(cam.id) ? 'selected' : ''}`}
                      onClick={() => handleCheckboxChange(cam.id)}
                    >
                      <div className="cg-camera-check">
                        {toCameras.includes(cam.id) ? "✓" : "○"}
                      </div>
                      <div className="cg-camera-info">
                        <strong>{cam.place}</strong>
                        <span>{cam.direction}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {toCameras.length > 0 && (
                  <p className="cg-selected-count">✅ {toCameras.length} camera(s) selected</p>
                )}
              </div>

              <button type="submit" className="cg-submit-btn" disabled={submitting}>
                {submitting ? "Creating..." : `🔗 Create ${toCameras.length} Connection${toCameras.length !== 1 ? 's' : ''}`}
              </button>
            </form>
          </div>
        )}

        {/* Active Network Links Section */}
        <div className="cg-links-section">
          <h2 className="cg-section-title">
            <span>🔗</span> Active Network Links
            <span className="cg-link-count">{filteredLinks.length} connections</span>
          </h2>

          {loading ? (
            <div className="cg-loader"><div className="cg-spinner"></div></div>
          ) : filteredLinks.length === 0 ? (
            <div className="cg-empty">
              <span className="cg-empty-icon">🔌</span>
              <p>No camera connections found.</p>
            </div>
          ) : (
            <div className="cg-links-grid">
              {filteredLinks.map((link, index) => (
                <div key={link.link_id || index} className="cg-link-card">
                  <div className="cg-link-node cg-link-from">
                    <div className="cg-node-icon">📹</div>
                    <div className="cg-node-info">
                      <strong>{link.from_camera?.place || "Unknown"}</strong>
                      <span>{link.from_camera?.direction || "N/A"}</span>
                    </div>
                  </div>
                  <div className="cg-link-arrow">→</div>
                  <div className="cg-link-node cg-link-to">
                    <div className="cg-node-icon">🎯</div>
                    <div className="cg-node-info">
                      <strong>{link.to_camera?.place || "Unknown"}</strong>
                      <span>{link.to_camera?.direction || "N/A"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}