"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/RegisterCheckpoint.css";

export default function RegisterCheckpointPage() {
  const router = useRouter();

  // Data States
  const [allPlaces, setAllPlaces] = useState([]);
  const [allCameras, setAllCameras] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);

  // Form States
  const [name, setName] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedCameraIds, setSelectedCameraIds] = useState([]);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    setIsMounted(true);
    if (!isAdmin) {
      router.push("/login");
      return;
    }
    loadData();
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [placesRes, camerasRes, officersRes] = await Promise.all([
        api.get("/places"),
        api.get("/cameras"),
        api.get("/users/police"),
      ]);
      setAllPlaces(Array.isArray(placesRes.data) ? placesRes.data : []);
      setAllCameras(Array.isArray(camerasRes.data) ? camerasRes.data : []);
      setAllOfficers(Array.isArray(officersRes.data) ? officersRes.data : []);
    } catch (err) {
      console.error("Error loading data:", err);
      alert("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id, list, setList) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("Please enter checkpoint name");
      return;
    }
    if (!selectedPlaceId) {
      alert("Please select a place");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("place_id", selectedPlaceId);
      formData.append("camera_ids", selectedCameraIds.join(","));
      formData.append("officer_ids", selectedOfficerIds.join(","));

      await api.post("/checkpoint", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      alert("✅ Checkpoint created successfully!");
      router.push("/RegisterCheckpoint");
    } catch (err) {
      console.error("Error creating checkpoint:", err);
      alert("Failed to create checkpoint");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted || loading) {
    return <div className="rc-loader"><div className="rc-spinner"></div></div>;
  }

  return (
    <div className="rc-container">
      {/* Header */}
      <header className="rc-header">
        <button className="rc-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="rc-header-center">
          <div className="rc-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="rc-title">🚩 Register Checkpoint</h1>
            <p className="rc-subtitle">Create a new checkpoint with cameras and officers</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="rc-content">
        {/* Name Card */}
        <div className="rc-card">
          <div className="rc-card-title">📍 Checkpoint Name</div>
          <input
            type="text"
            className="rc-input"
            placeholder="Enter checkpoint name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Place Card */}
        <div className="rc-card">
          <div className="rc-card-title">🏙 Place</div>
          <select
            className="rc-select"
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
          >
            <option value="">-- Select Place --</option>
            {allPlaces.map((place) => (
              <option key={place.id || place.place_id} value={place.id || place.place_id}>
                {place.name} - {place.city}
              </option>
            ))}
          </select>
        </div>

        {/* Cameras Card */}
        <div className="rc-card">
          <div className="rc-card-title">📷 Cameras (Select at least one)</div>
          <div className="rc-list-container">
            {allCameras.length === 0 ? (
              <div className="rc-no-data">No cameras available</div>
            ) : (
              allCameras.map((cam) => {
                const id = cam.id || cam.camera_id;
                const isSelected = selectedCameraIds.includes(id);
                return (
                  <div
                    key={id}
                    className={`rc-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelection(id, selectedCameraIds, setSelectedCameraIds)}
                  >
                    {/* ✅ Checkbox with tick */}
                    <div className={`rc-checkbox ${isSelected ? "checked" : ""}`}>
                      {isSelected && <span className="rc-check-tick">✓</span>}
                    </div>
                    <div className="rc-item-info">
                      <div className="rc-item-title">Location: {cam.place || "Unknown Place"}</div>
                      <div className="rc-item-subtitle">Camera ID: {id} | {cam.direction || "N/A"}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedCameraIds.length > 0 && (
            <div className="rc-selected-count">✅ {selectedCameraIds.length} camera(s) selected</div>
          )}
        </div>

        {/* Officers Card */}
        <div className="rc-card">
          <div className="rc-card-title">👮 Officers</div>
          <div className="rc-list-container">
            {allOfficers.length === 0 ? (
              <div className="rc-no-data">No officers available</div>
            ) : (
              allOfficers.map((officer) => {
                const id = officer.user_id;
                const isSelected = selectedOfficerIds.includes(id);
                return (
                  <div
                    key={id}
                    className={`rc-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelection(id, selectedOfficerIds, setSelectedOfficerIds)}
                  >
                    {/* ✅ Checkbox with tick */}
                    <div className={`rc-checkbox ${isSelected ? "checked" : ""}`}>
                      {isSelected && <span className="rc-check-tick">✓</span>}
                    </div>
                    <div className="rc-item-info">
                      <div className="rc-item-title">{officer.name || `Officer ${id}`}</div>
                      <div className="rc-item-subtitle">ID: {id} | Role: Police</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedOfficerIds.length > 0 && (
            <div className="rc-selected-count">👮 {selectedOfficerIds.length} officer(s) selected</div>
          )}
        </div>

        {/* Summary Card */}
        <div className="rc-card rc-summary">
          <div className="rc-card-title">📝 Summary</div>
          <div className="rc-summary-item">✓ Name: {name || "Not set"}</div>
          <div className="rc-summary-item">✓ Place: {selectedPlaceId ? "Selected" : "Not selected"}</div>
          <div className="rc-summary-item">✓ Cameras: {selectedCameraIds.length} selected</div>
          <div className="rc-summary-item">✓ Officers: {selectedOfficerIds.length} selected</div>
        </div>

        {/* Submit Button */}
        <button
          className="rc-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "CREATE CHECKPOINT"}
        </button>
      </div>
    </div>
  );
}