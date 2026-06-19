"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/AddCamera.css";

export default function AddCameraPage() {
  const router = useRouter();
  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [direction, setDirection] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch places from API
  const loadPlaces = async () => {
    try {
      const res = await api.get("/places");
      setPlaces(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load places:", err);
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  // Direction suggestions based on other places
  const directionSuggestions = places
    .filter(p => String(p.id) !== String(selectedPlaceId))
    .map(p => `Towards ${p.name}`);

  const saveCamera = async () => {
    if (!selectedPlaceId || !direction) {
      alert("Please select location and enter direction!");
      return;
    }

    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("place_id", selectedPlaceId);
      formData.append("direction", direction);
      formData.append("status", "Active");

      await api.post("/camera", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      alert("✅ Camera Saved!");
      router.push("/CCTVCamera");
    } catch (err) {
      console.error("Error saving camera:", err);
      alert("Failed to save camera");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-cam-container">
      {/* HEADER */}
      <header className="add-cam-header">
        <button className="add-cam-back-btn" onClick={() => router.push("/CCTVCamera")}>
          ←
        </button>
        <div className="add-cam-header-center">
          <div className="add-cam-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="add-cam-title">📷 Add Camera</h1>
            <p className="add-cam-subtitle">Configure and register a new surveillance camera</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      {/* FORM CARD */}
      <div className="add-cam-card">
        {/* LOCATION SELECTOR */}
        <div className="add-cam-form-group">
          <label>📍 Select Location</label>
          <select
            className="add-cam-select"
            value={selectedPlaceId}
            onChange={(e) => {
              setSelectedPlaceId(e.target.value);
              setDirection("");
            }}
          >
            <option value="">-- Select Location --</option>
            {places.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* DIRECTION INPUT (Conditionally Rendered) */}
        {selectedPlaceId && (
          <div className="add-cam-form-group animate-fade-in">
            <label>🧭 Camera Direction</label>
            <input
              className="add-cam-input"
              placeholder="Select or type direction..."
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            />

            {/* DIRECTION CHIPS */}
            {directionSuggestions.length > 0 && (
              <div className="add-cam-direction-chips">
                {directionSuggestions.map((dir) => (
                  <button
                    key={dir}
                    className={`add-cam-dir-chip ${direction === dir ? "active" : ""}`}
                    onClick={() => setDirection(dir)}
                    type="button"
                  >
                    {dir}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="add-cam-btn-wrapper">
          <button 
            className="add-cam-submit-btn" 
            onClick={saveCamera}
            disabled={loading}
          >
            {loading ? "Saving..." : "💾 Save Camera"}
          </button>
        </div>
      </div>
    </div>
  );
}