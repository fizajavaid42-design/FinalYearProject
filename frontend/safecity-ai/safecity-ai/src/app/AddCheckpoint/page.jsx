"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/AddCheckpoint.css";

export default function AddCheckpointPage() {
  const router = useRouter();
  
  // Data States
  const [places, setPlaces] = useState([]);
  const [cameras, setCameras] = useState([]);
  
  // Form States
  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [placeRes, camRes] = await Promise.all([
        api.get("/places"),
        api.get("/cameras")
      ]);
      setPlaces(Array.isArray(placeRes.data) ? placeRes.data : []);
      setCameras(Array.isArray(camRes.data) ? camRes.data : []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  // Toggle Logic for Multiple Selection
  const toggleCamera = (id) => {
    if (selectedCameras.includes(id)) {
      setSelectedCameras(selectedCameras.filter(c => c !== id));
    } else {
      setSelectedCameras([...selectedCameras, id]);
    }
  };

  const saveCheckpoint = async () => {
    // Basic Validation
    if (!name || !placeId || selectedCameras.length === 0) {
      alert("Please fill all fields and select at least one camera.");
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('name', name);
      formData.append('place_id', placeId);
      formData.append('camera_ids', selectedCameras.join(","));

      await api.post("/checkpoint", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      alert("✅ Checkpoint Added!");
      router.push("/checkpoints");
    } catch (err) {
      console.error("Save Error:", err.response?.data);
      alert("Failed to save checkpoint.");
    } finally {
      setLoading(false);
    }
  };

  const getPlaceName = (placeId) => {
    const place = places.find(p => p.id === placeId);
    return place?.name || "Unknown";
  };

  return (
    <div className="acp-container">
      {/* HEADER */}
      <header className="acp-header">
        <button className="acp-back-btn" onClick={() => router.push("/checkpoints")}>
          ←
        </button>
        <div className="acp-header-center">
          <div className="acp-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="acp-title">🚩 Add CheckPoint</h1>
            <p className="acp-subtitle">Create a new city checkpoint</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="acp-content">
        {/* NAME SECTION */}
        <div className="acp-card">
          <div className="acp-card-title">
            <span className="acp-card-icon">📝</span>
            <h3>Checkpoint Name</h3>
          </div>
          <div className="acp-divider"></div>
          <input
            className="acp-input"
            placeholder="Enter checkpoint name (e.g. North Entry)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* LOCATION SECTION */}
        <div className="acp-card">
          <div className="acp-card-title">
            <span className="acp-card-icon">📍</span>
            <h3>Select Location</h3>
          </div>
          <div className="acp-divider"></div>
          <select
            className="acp-select"
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
          >
            <option value="">-- Select Location --</option>
            {places.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* CAMERAS SELECTION GRID */}
        <div className="acp-card">
          <div className="acp-card-title">
            <span className="acp-card-icon">📹</span>
            <h3>Select Cameras</h3>
          </div>
          <div className="acp-divider"></div>
          <div className="acp-camera-grid">
            {cameras.length === 0 ? (
              <p className="acp-no-cameras">No cameras available. Please add cameras first.</p>
            ) : (
              cameras.map(cam => {
                const isSelected = selectedCameras.includes(cam.id);
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => toggleCamera(cam.id)}
                    className={`acp-camera-btn ${isSelected ? "selected" : ""}`}
                  >
                    📹 {getPlaceName(cam.place_id)} ({cam.direction})
                  </button>
                );
              })
            )}
          </div>
          {selectedCameras.length > 0 && (
            <p className="acp-selected-count">
              ✅ {selectedCameras.length} camera(s) selected
            </p>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="acp-btn-container">
          <button 
            className="acp-submit-btn" 
            onClick={saveCheckpoint}
            disabled={loading}
          >
            {loading ? "Saving..." : "💾 Save Checkpoint"}
          </button>
        </div>
      </div>
    </div>
  );
}