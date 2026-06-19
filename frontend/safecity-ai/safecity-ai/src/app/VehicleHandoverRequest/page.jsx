"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import "@/styles/VehicleHandover.css";

export default function VehicleHandoverRequest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const vehicleParam = searchParams.get("vehicle");
  const recoveryId = searchParams.get("recoveryId");
  const isAlreadyRecovered = searchParams.get("isAlreadyRecovered") === "true";
  const isAccident = searchParams.get("isAccident") === "true";  // ✅ Check if accident
  
  const vehicle = vehicleParam ? JSON.parse(decodeURIComponent(vehicleParam)) : null;

  const [cnic, setCnic] = useState("");
  const [selectedPoliceStationId, setSelectedPoliceStationId] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingStations, setLoadingStations] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Block accident reports
  useEffect(() => {
    if (isAccident) {
      showMessage("You cannot apply for handover of an accident report as this is not your vehicle.", "error");
      setTimeout(() => {
        router.back();
      }, 2000);
    }
  }, [isAccident]);

  useEffect(() => {
    fetchPoliceStations();
  }, []);

  useEffect(() => {
    console.log("Recovery ID from URL:", recoveryId);
    console.log("Is Already Recovered:", isAlreadyRecovered);
    console.log("Is Accident:", isAccident);
    
    if (!recoveryId || recoveryId === "0" || recoveryId === "null") {
      showMessage("No recovery record found. Please contact police first.", "error");
    }
  }, [recoveryId]);

  const fetchPoliceStations = async () => {
    try {
      const res = await api.get("/police-stations");
      setPoliceStations(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching police stations:", error);
    } finally {
      setLoadingStations(false);
    }
  };

  const pickDocument = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setDocuments([...documents, file]);
      }
    };
    input.click();
  };

  const removeDocument = (index) => {
    const newDocuments = [...documents];
    newDocuments.splice(index, 1);
    setDocuments(newDocuments);
  };

  const submitRequest = async () => {
    if (!cnic.trim()) {
      showMessage("Please enter CNIC", "error");
      return;
    }
    if (!selectedPoliceStationId) {
      showMessage("Please select police station", "error");
      return;
    }
    if (!isConfirmed) {
      showMessage("Please confirm the information", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("recovery_id", recoveryId ? recoveryId.toString() : "");
      formData.append("police_station_id", selectedPoliceStationId.toString());
      formData.append("owner_cnic", cnic.trim());

      if (documents.length > 0) {
        documents.forEach((doc) => {
          formData.append("documents", doc);
        });
      }

      const response = await api.post("/recovery/handover", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        showMessage("Handover request submitted successfully!", "success");
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error) {
      console.error("Submission error details:", error.response?.data);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      showMessage("Failed: " + errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMessage = (msg, type) => {
    const messageDiv = document.createElement("div");
    messageDiv.textContent = msg;
    messageDiv.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: ${type === "error" ? "#f44336" : "#4caf50"};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  };

  const getTodayDate = () => {
    const now = new Date();
    return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  };

  const DetailRow = ({ label, value }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || "N/A"}</span>
    </div>
  );

  // ✅ Show block message for accident reports
  if (isAccident) {
    return (
      <div className="handover-container">
        <div className="error-box" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🚫</div>
          <h2>Cannot Apply for Handover</h2>
          <p>This is an accident report. You cannot apply for handover as this vehicle does not belong to you.</p>
          <button onClick={() => router.back()} className="btn-primary" style={{ marginTop: "20px" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="handover-container">
        <div className="error-box">
          <p>No vehicle data found. Please go back and try again.</p>
          <button onClick={() => router.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="handover-container">
      <div className="header-gradient-hr">
        <div className="header-left-hr">
          <button className="back-btn-hr" onClick={() => router.back()}>
            ←
          </button>
          <h1 className="main-title-hr">Vehicle Handover</h1>
        </div>
      </div>

      <div className="handover-content">
        <div className={`info-banner ${isAlreadyRecovered ? "success-banner" : "info-banner-blue"}`}>
          <div className="banner-icon">
            {isAlreadyRecovered ? "✅" : "ℹ️"}
          </div>
          <p className="banner-text">
            {isAlreadyRecovered
              ? "Your vehicle has been recovered! Please complete handover process."
              : "Apply for vehicle recovery. Fill the details below."}
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Enter CNIC</label>
          <input
            type="text"
            className="form-input"
            placeholder="12345-6789011-9"
            value={cnic}
            onChange={(e) => setCnic(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Select Police Station</label>
          {loadingStations ? (
            <div className="loading-small"></div>
          ) : (
            <select
              className="form-select"
              value={selectedPoliceStationId || ""}
              onChange={(e) => setSelectedPoliceStationId(parseInt(e.target.value))}
            >
              <option value="">Select Police Station</option>
              {policeStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Upload Vehicle Documents</label>
          <p className="form-hint">(e.g. Registration Book / FIR Report / Ownership Proof)</p>
          
          <div className="upload-area">
            <button className="upload-btn" onClick={pickDocument}>
              📤 Upload Document
            </button>
            
            {documents.length === 0 ? (
              <p className="no-file-text">No file chosen</p>
            ) : (
              <div className="documents-list">
                {documents.map((doc, i) => (
                  <div key={i} className="document-item">
                    <span className="doc-icon">📄</span>
                    <span className="doc-name">{doc.name}</span>
                    <button
                      className="remove-doc-btn"
                      onClick={() => removeDocument(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="details-card">
          <h4 className="card-title">Vehicle Details</h4>
          <DetailRow label="Vehicle Number Plate:" value={vehicle.no_plate} />
          <DetailRow label="Vehicle Model:" value={`${vehicle.company || ""} ${vehicle.model || ""}`.trim()} />
          <DetailRow label="Recovery Date:" value={getTodayDate()} />
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="confirmCheckbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
          />
          <label htmlFor="confirmCheckbox">
            I confirm that I have recovered my vehicle and the information provided is correct.
          </label>
        </div>

        <div className="action-buttons">
          <button
            className="btn-cancel"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={submitRequest}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="spinner-small"></span>
            ) : (
              "Submit Handover Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}