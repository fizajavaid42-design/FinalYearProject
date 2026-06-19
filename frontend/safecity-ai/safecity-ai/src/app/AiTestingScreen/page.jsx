"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/AiTesting.css";

export default function AiTestingScreen() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loadingCams, setLoadingCams] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [isPopupFullscreen, setIsPopupFullscreen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const res = await api.get("/cameras");
      console.log("Camera API Response:", res.data);
      setCameras(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching cameras:", err);
    } finally {
      setLoadingCams(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...images, ...files];
      setImages(newImages);

      files.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImagePreviews((prev) => {
            const updated = [...prev];
            updated[images.length + idx] = ev.target.result;
            return updated;
          });
        };
        reader.readAsDataURL(file);
      });

      setAllResults([]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setAllResults([]);
  };

  const clearAllImages = () => {
    setImages([]);
    setImagePreviews([]);
    setAllResults([]);
  };

  const processAllImages = async () => {
    if (images.length === 0) {
      alert("Please select at least one image");
      return;
    }

    setProcessing(true);
    setAllResults([]);
    setProgress(0);

    const results = [];

    for (let i = 0; i < images.length; i++) {
      setCurrentProcessingIndex(i + 1);
      setProgress(((i + 1) / images.length) * 100);

      try {
        const formData = new FormData();
        if (selectedCameraId) {
          formData.append("camera_id", selectedCameraId.toString());
        }
        formData.append("image", images[i]);

        const response = await api.post("/detection/process", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        results.push({
          image_index: i + 1,
          file_name: images[i].name,
          result: response.data,
          error: null,
        });
      } catch (err) {
        console.error("Error processing image:", err);
        results.push({
          image_index: i + 1,
          file_name: images[i].name,
          result: null,
          error: err.message || "Failed to process",
        });
      }
    }

    setAllResults(results);
    setProcessing(false);
    setCurrentProcessingIndex(0);
    setProgress(0);
  };

  const fetchAlertDetails = async (alertId) => {
    setLoadingAlert(true);
    setSelectedAlert(null);
    setIsPopupFullscreen(false);
    try {
      const response = await api.get(`/ai-alerts/${alertId}`);
      setSelectedAlert(response.data);
    } catch (err) {
      console.error("Error fetching alert details:", err);
      alert("Failed to load alert details");
    } finally {
      setLoadingAlert(false);
    }
  };

  const closeAlertPopup = () => {
    setSelectedAlert(null);
    setIsPopupFullscreen(false);
  };

  const togglePopupFullscreen = () => {
    setIsPopupFullscreen(!isPopupFullscreen);
  };

  const calculateTotals = () => {
    let totalCars = 0;
    let totalAlerts = 0;

    for (const r of allResults) {
      if (r.result) {
        totalCars += r.result.total_cars_detected || 0;
        const cars = r.result.results || [];
        for (const car of cars) {
          totalAlerts += car.alerts_generated || 0;
        }
      }
    }

    return { totalCars, totalAlerts, totalImages: allResults.length };
  };

  const totals = calculateTotals();

  // ✅ Helper function to clean camera direction (remove extra text)
  const cleanDirection = (direction) => {
    if (!direction) return "";
    return direction
      .replace("Camera Direction: ", "")
      .replace("Camera Direction:", "")
      .trim();
  };

  // ✅ Helper function to get camera display name
  const getCameraDisplayName = (cam) => {
    const cameraName = cam.place || cam.name || `Camera #${cam.id || cam.camera_id}`;
    const direction = cleanDirection(cam.direction);
    const status = cam.status || "";
    
    let displayText = cameraName;
    if (direction) displayText += `: ${direction}`;
    if (status) displayText += ` (${status})`;
    
    return displayText;
  };

  return (
    <div className="ai-test-container">
      <header className="ai-test-header">
        <button className="ai-test-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="ai-test-header-center">
          <div className="ai-test-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="ai-test-title">AI Detection Testing 🤖</h1>
            <p className="ai-test-subtitle">Upload and process vehicle images</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="ai-test-main-wrapper">
        <div className="ai-test-section-title">1. Upload Car Images 📸</div>

        {images.length > 0 ? (
          <>
            <div className="ai-test-image-grid">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="ai-test-image-card" onClick={() => setFullScreenImage(preview)}>
                  <img src={preview} alt={`Car ${idx + 1}`} className="ai-test-grid-img" />
                  <button className="ai-test-remove-img" onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>✕</button>
                  <span className="ai-test-img-number">{idx + 1}</span>
                </div>
              ))}
              <div className="ai-test-add-more" onClick={triggerFileInput}>
                <span>📷</span>
                <span>Add More</span>
              </div>
            </div>
            <div className="ai-test-action-buttons">
              <button className="ai-test-add-btn" onClick={triggerFileInput}>➕ Add More</button>
              <button className="ai-test-clear-btn" onClick={clearAllImages}>🗑 Clear All</button>
            </div>
          </>
        ) : (
          <div className="ai-test-upload-box" onClick={triggerFileInput}>
            <div className="ai-test-upload-icon">📷</div>
            <p className="ai-test-upload-text">Tap to select images</p>
            <p className="ai-test-upload-hint">Select multiple images</p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <div className="ai-test-section-title" style={{ marginTop: "24px" }}>
          2. Select Camera (optional) 🎥
        </div>

        {loadingCams ? (
          <div className="ai-test-loader"><div className="ai-test-spinner"></div></div>
        ) : (
          <div className="ai-test-select-wrap">
            <select
              className="ai-test-select"
              value={selectedCameraId || ""}
              onChange={(e) => setSelectedCameraId(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">📹 No Camera</option>
              {cameras.map((cam) => {
                const cameraId = cam.id || cam.camera_id;
                const displayText = getCameraDisplayName(cam);
                
                return (
                  <option key={cameraId} value={cameraId}>
                    {displayText}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <button
          className="ai-test-process-btn"
          onClick={processAllImages}
          disabled={processing || images.length === 0}
        >
          {processing ? (
            <>
              <span className="ai-test-spinner-small"></span>
              Processing {currentProcessingIndex}/{images.length}...
            </>
          ) : (
            <>
              <span>▶</span> Process {images.length} Image{images.length > 1 ? "s" : ""}
            </>
          )}
        </button>

        {processing && images.length > 1 && (
          <div className="ai-test-progress">
            <div className="ai-test-progress-bar" style={{ width: `${progress}%` }}></div>
            <p>Processing image {currentProcessingIndex} of {images.length}</p>
          </div>
        )}

        {allResults.length > 0 && (
          <div className="ai-test-results-section">
            <div className="ai-test-section-title">Results Summary 📊</div>

            <div className="ai-test-summary-banner">
              <div className="ai-test-summary-item">
                <span className="ai-test-summary-value">{totals.totalImages}</span>
                <span className="ai-test-summary-label">Images</span>
              </div>
              <div className="ai-test-summary-item">
                <span className="ai-test-summary-value">{totals.totalCars}</span>
                <span className="ai-test-summary-label">Cars</span>
              </div>
              <div className="ai-test-summary-item">
                <span className="ai-test-summary-value">{totals.totalAlerts}</span>
                <span className="ai-test-summary-label">Alerts</span>
              </div>
            </div>

            {allResults.map((imgResult, idx) => (
              <ImageResultCard 
                key={idx} 
                imgResult={imgResult} 
                onViewAlert={fetchAlertDetails}
              />
            ))}
          </div>
        )}
      </div>

      {fullScreenImage && (
        <div className="ai-test-fullscreen-modal" onClick={() => setFullScreenImage(null)}>
          <button className="ai-test-fullscreen-close" onClick={() => setFullScreenImage(null)}>
            ✕
          </button>
          <img 
            src={fullScreenImage} 
            alt="Full screen preview" 
            className="ai-test-fullscreen-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {selectedAlert && (
        <div 
          className={`ai-test-alert-popup-overlay ${isPopupFullscreen ? 'fullscreen' : ''}`} 
          onClick={closeAlertPopup}
        >
          <div 
            className={`ai-test-alert-popup ${isPopupFullscreen ? 'fullscreen-popup' : ''}`} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ai-test-alert-popup-header">
              <div className="ai-test-alert-popup-title">
                <span>🔔</span>
                <span>Alert Details</span>
              </div>
              <div className="ai-test-alert-popup-header-actions">
                <button 
                  className="ai-test-popup-fullscreen-btn"
                  onClick={togglePopupFullscreen}
                  title={isPopupFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isPopupFullscreen ? "🗗" : "🗖"}
                </button>
                <button className="ai-test-alert-popup-close" onClick={closeAlertPopup}>
                  ✕
                </button>
              </div>
            </div>
            <div className="ai-test-alert-popup-body">
              {loadingAlert ? (
                <div className="ai-test-loader"><div className="ai-test-spinner"></div></div>
              ) : (
                <>
                  <div className="ai-test-popup-section">📋 Alert Info</div>
                  <div className="ai-test-popup-row">
                    <span className="ai-test-popup-label">Alert ID:</span>
                    <span className="ai-test-popup-value">#{selectedAlert.alert_id}</span>
                  </div>
                  <div className="ai-test-popup-row">
                    <span className="ai-test-popup-label">Time:</span>
                    <span className="ai-test-popup-value">{selectedAlert.alert_time}</span>
                  </div>
                  <div className="ai-test-popup-row">
                    <span className="ai-test-popup-label">Match:</span>
                    <span className="ai-test-popup-value">{selectedAlert.match_text}</span>
                  </div>
                  <div className="ai-test-popup-row">
                    <span className="ai-test-popup-label">Type:</span>
                    <span className="ai-test-popup-value">{selectedAlert.matched_on}</span>
                  </div>

                  {selectedAlert.report_details && (
                    <>
                      <div className="ai-test-popup-divider"></div>
                      <div className="ai-test-popup-section">📝 Report Details</div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Report Type:</span>
                        <span className="ai-test-popup-value">{selectedAlert.report_details.report_type}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Report ID:</span>
                        <span className="ai-test-popup-value">#{selectedAlert.report_details.report_id}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Status:</span>
                        <span className="ai-test-popup-value">{selectedAlert.report_details.status}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Description:</span>
                        <span className="ai-test-popup-value">{selectedAlert.report_details.description}</span>
                      </div>
                      {selectedAlert.report_details.contact && (
                        <div className="ai-test-popup-row">
                          <span className="ai-test-popup-label">Contact:</span>
                          <span className="ai-test-popup-value">{selectedAlert.report_details.contact}</span>
                        </div>
                      )}
                      {selectedAlert.report_details.place_name && (
                        <div className="ai-test-popup-row">
                          <span className="ai-test-popup-label">Place:</span>
                          <span className="ai-test-popup-value">{selectedAlert.report_details.place_name}</span>
                        </div>
                      )}
                    </>
                  )}

                  {selectedAlert.vehicle && (
                    <>
                      <div className="ai-test-popup-divider"></div>
                      <div className="ai-test-popup-section">🚗 Vehicle Info</div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Company:</span>
                        <span className="ai-test-popup-value">{selectedAlert.vehicle.company}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Model:</span>
                        <span className="ai-test-popup-value">{selectedAlert.vehicle.model}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Color:</span>
                        <span className="ai-test-popup-value">{selectedAlert.vehicle.color}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Plate:</span>
                        <span className="ai-test-popup-value">{selectedAlert.vehicle.no_plate}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Source:</span>
                        <span className="ai-test-popup-value">{selectedAlert.vehicle.source}</span>
                      </div>
                    </>
                  )}

                  {selectedAlert.camera && (
                    <>
                      <div className="ai-test-popup-divider"></div>
                      <div className="ai-test-popup-section">📹 Camera Info</div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Camera ID:</span>
                        <span className="ai-test-popup-value">#{selectedAlert.camera.camera_id}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Direction:</span>
                        <span className="ai-test-popup-value">{selectedAlert.camera.direction}</span>
                      </div>
                      <div className="ai-test-popup-row">
                        <span className="ai-test-popup-label">Place:</span>
                        <span className="ai-test-popup-value">{selectedAlert.camera.place_name || selectedAlert.camera.place_id}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="ai-test-alert-popup-footer">
              <button className="ai-test-popup-close-btn" onClick={closeAlertPopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageResultCard({ imgResult, onViewAlert }) {
  const hasError = imgResult.error;
  const result = imgResult.result;
  const totalCars = result?.total_cars_detected || 0;
  const cars = result?.results || [];

  if (hasError) {
    return (
      <div className="ai-test-error-card">
        <div className="ai-test-error-header">
          <span>⚠️</span>
          <span>Image #{imgResult.image_index}: {imgResult.file_name}</span>
        </div>
        <div className="ai-test-error-body">Error: {imgResult.error}</div>
      </div>
    );
  }

  return (
    <div className="ai-test-result-card">
      <div className="ai-test-result-header">
        <div className="ai-test-result-title">
          <span>📷</span>
          <span>Image #{imgResult.image_index}: {imgResult.file_name}</span>
        </div>
        <div className="ai-test-result-badge">{totalCars} car(s)</div>
      </div>
      <div className="ai-test-result-body">
        {cars.map((car, idx) => (
          <CarCard 
            key={idx} 
            car={car} 
            imgIdx={imgResult.image_index} 
            carIdx={idx + 1}
            onViewAlert={onViewAlert}
          />
        ))}
      </div>
    </div>
  );
}

function CarCard({ car, imgIdx, carIdx, onViewAlert }) {
  const alerts = car.matches || [];
  const hasAlerts = alerts.length > 0;
  const alertCount = car.alerts_generated || 0;
  const legalStatus = car.legal_status;
  const legalMessage = car.legal_message;

  return (
    <div className={`ai-test-car-card ${hasAlerts ? "has-alert" : ""}`}>
      <div className={`ai-test-car-header ${hasAlerts ? "alert-header" : "normal-header"}`}>
        <span>🚗 Car #{imgIdx}.{carIdx}</span>
        {hasAlerts ? (
          <span className="ai-test-alert-badge">🚨 {alertCount} Alert{alertCount > 1 ? "s" : ""}</span>
        ) : (
          <span className="ai-test-safe-badge">✅ Safe</span>
        )}
      </div>
      <div className="ai-test-car-body">
        <div className="ai-test-det-row">
          <span className="ai-test-det-label">Company:</span>
          <span className="ai-test-det-value">{car.company || "-"}</span>
        </div>
        <div className="ai-test-det-row">
          <span className="ai-test-det-label">Model:</span>
          <span className="ai-test-det-value">{car.model || "-"}</span>
        </div>
        <div className="ai-test-det-row">
          <span className="ai-test-det-label">Color:</span>
          <span className="ai-test-det-value">{car.color || "-"}</span>
        </div>
        <div className="ai-test-det-row">
          <span className="ai-test-det-label">Plate:</span>
          <span className="ai-test-det-value">{car.no_plate || "-"}</span>
        </div>

        {legalStatus && (
          <div className={`ai-test-legal-badge ${legalStatus === "legal" ? "legal" : "suspicious"}`}>
            <span>{legalStatus === "legal" ? "✅" : "⚠️"}</span>
            <span>{legalMessage || (legalStatus === "legal" ? "Legal Vehicle Verified" : "Suspicious Vehicle")}</span>
          </div>
        )}

        {hasAlerts && (
          <div className="ai-test-alerts-section">
            <div className="ai-test-alerts-title">⚠️ Matched Reports ({alerts.length})</div>
            <div className="ai-test-alerts-list">
              {alerts.map((alert, idx) => (
                <AlertCard 
                  key={idx} 
                  alert={alert} 
                  onViewAlert={onViewAlert}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onViewAlert }) {
  const type = alert.report_type || "";
  const reportId = alert.report_id || "";
  const matchedOn = alert.matched_on || "";
  const alertId = alert.alert_id;

  let icon, cardClass, title, description;

  if (matchedOn === "illegal_plate") {
    icon = "🚫";
    cardClass = "illegal-alert";
    title = "🚨 ILLEGAL PLATE DETECTED";
    description = "This vehicle has an illegal or fake license plate.";
  } else if (matchedOn === "plate_mismatch") {
    icon = "⚠️";
    cardClass = "mismatch-alert";
    title = "⚠️ PLATE MISMATCH";
    description = "The detected plate doesn't match vehicle records.";
  } else if (matchedOn === "legal_verified") {
    icon = "✅";
    cardClass = "verified-alert";
    title = "✅ LEGAL VEHICLE VERIFIED";
    description = "This vehicle is verified and legal.";
  } else {
    const isTheft = type === "UserReport" || type === "user";
    icon = isTheft ? "🚗" : "🚨";
    cardClass = isTheft ? "theft-alert" : "accident-alert";
    title = isTheft ? `🔍 THEFT REPORT #${reportId}` : `⚠️ ACCIDENT REPORT #${reportId}`;
    description = isTheft 
      ? "This vehicle has been reported as stolen." 
      : "This vehicle was involved in an accident report.";
  }

  return (
    <div className={`ai-test-alert-card ${cardClass}`}>
      <div className="ai-test-alert-card-icon">{icon}</div>
      <div className="ai-test-alert-card-content">
        <div className="ai-test-alert-card-title">{title}</div>
        <div className="ai-test-alert-card-description">{description}</div>
        <div className="ai-test-alert-card-meta">
          <span>🆔 Report ID: {reportId || "N/A"}</span>
          <span>📌 Matched on: {matchedOn}</span>
        </div>
        {alertId && (
          <button 
            className="ai-test-view-details-btn"
            onClick={() => onViewAlert(alertId)}
          >
            🔍 View Details
          </button>
        )}
      </div>
    </div>
  );
}