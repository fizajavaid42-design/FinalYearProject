"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/cameras.css";

// Webcam Component
function WebcamView() {
  const videoRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera access denied:", err);
        setError(true);
      });

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  if (error) {
    return (
      <div className="cam-no-stream">
        <p>❌ Camera access denied. Please allow camera permission.</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="cam-stream"
    />
  );
}

export default function CamerasPage() {
  const router = useRouter();
  const [cameras, setCameras] = useState([]);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCam, setSelectedCam] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [camRes, placeRes] = await Promise.all([
        api.get("/cameras"),
        api.get("/places")
       
      ]);
      setCameras(Array.isArray(camRes.data) ? camRes.data : []);
      setPlaces(Array.isArray(placeRes.data) ? placeRes.data : []);
    } catch (err) {
      console.error("Error loading cameras/places:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isAdmin) router.push("/adminDashboard");
    else router.push("/policeDashboard");
  };

  const handleView = (cam) => {
    setSelectedCam(cam);
  };

  const handleCloseModal = () => {
    setSelectedCam(null);
  };

  const filteredCameras = cameras.filter(cam => {
    const place = places.find(p => p.id === cam.place_id);
    return place?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="cam-container">
      {/* HEADER */}
      <header className="cam-header">
        <button className="cam-back-btn" onClick={handleBack}>←</button>
        <div className="cam-header-center">
          <div className="cam-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="cam-title">CCTV Manager 📹</h1>
            <p className="cam-subtitle">Monitor and manage your surveillance cameras</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      {/* SEARCH BAR */}
      <div className="cam-search-container">
        <input
          className="cam-search-input"
          placeholder="🔍 Search by location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CAMERA LIST */}
      <div className="cam-list">
        {loading ? (
          <div className="cam-loader"><div className="cam-spinner"></div></div>
        ) : filteredCameras.length === 0 ? (
          <div className="cam-empty">
            <p>No cameras found matching your search.</p>
          </div>
        ) : (
          filteredCameras.map(cam => {
            const place = places.find(p => p.id === cam.place_id);
            return (
              <div key={cam.id || cam.camera_id} className="cam-card">
                <div className="cam-card-details">
                  <h4>{place?.name || "Unknown Location"}</h4>
                  <p>{cam.direction} | {place?.city || "N/A"}</p>
                </div>
                <button
                  className="cam-view-btn"
                  onClick={() => handleView(cam)}
                >
                  👁 View
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Camera - Admin Only */}
      {isAdmin && (
        <div className="cam-button-group">
          <button className="cam-add-btn" onClick={() => router.push("/AddCamera")}>
            + Add Camera
          </button>
        </div>
      )}

      {/* LIVE CAMERA MODAL */}
      {selectedCam && (
        <div className="cam-modal-overlay" onClick={handleCloseModal}>
          <div className="cam-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="cam-modal-header">
              <h3>📹 Live Feed</h3>
              <button className="cam-modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            {/* Camera Info */}
            <p className="cam-modal-info">
              {places.find(p => p.id === selectedCam.place_id)?.name || "Unknown"} —{" "}
              {selectedCam.direction}
            </p>

            {/* If stream_url exists use iframe, else device camera */}
            {selectedCam.stream_url ? (
              <iframe
                src={selectedCam.stream_url}
                title="Live Camera Feed"
                className="cam-stream-iframe"
                allowFullScreen
              />
            ) : (
              <WebcamView />
            )}
          </div>
        </div>
      )}
    </div>
  );
}