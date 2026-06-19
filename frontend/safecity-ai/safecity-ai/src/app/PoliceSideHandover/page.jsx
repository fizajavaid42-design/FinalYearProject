"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/PoliceHandover.css";

export default function PoliceHandoverPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchHandoverRequests();
  }, []);

  const fetchHandoverRequests = async () => {
    try {
      const res = await api.get("/recovery/handover/all");
      const data = Array.isArray(res.data) ? res.data : [];
      setRequests(data);
      
      const pending = data.filter(r => r.status === "Pending").length;
      const approved = data.filter(r => r.status === "Approved").length;
      const rejected = data.filter(r => r.status === "Rejected").length;
      setStats({ pending, approved, rejected });
      
    } catch (err) {
      console.error(err);
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateHandoverStatus = async (handoverId, status) => {
    try {
      await api.patch(`/recovery/handover/${handoverId}/status`, { status });
      showToast(`Request ${status} successfully!`, "success");
      fetchHandoverRequests();
    } catch (err) {
      showToast("Error updating status", "error");
    }
  };

  const showToast = (message, type) => {
    const toast = document.createElement("div");
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // ✅ Get filename from path
  const getFilenameFromPath = (docPath) => {
    let filename = docPath.split("/").pop();
    filename = filename.split("\\").pop();
    return filename;
  };

  // ✅ Document view function - Using backend download endpoint
  const handleViewDocument = (docPath) => {
    if (!docPath) {
      showToast("No document path available", "error");
      return;
    }
    
    const filename = getFilenameFromPath(docPath);
    const fullUrl = `http://localhost:8000/recovery/download-document/${filename}`;
    
    console.log("Opening document:", fullUrl);
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="handover-container">
      <div className="header-gradient-hr">
        <div className="header-left-hr">
          <button className="back-btn-hr" onClick={() => router.back()}>
            ←
          </button>
          <h1 className="main-title-hr">Handover Requests</h1>
        </div>
        <button className="refresh-btn-hr" onClick={fetchHandoverRequests}>
          🔄
        </button>
      </div>

      <div className="handover-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>

        <div className="info-banner info-banner-blue">
          <span className="banner-icon">🤝</span>
          <p className="banner-text">
            Review and manage vehicle handover requests from citizens who have recovered their vehicles.
          </p>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="empty-container">
            <div className="empty-icon">📋</div>
            <p>No handover requests found</p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="handover-list">
            {requests.map((req) => (
              <HandoverCard
                key={req.handover_id}
                request={req}
                onUpdateStatus={updateHandoverStatus}
                onViewDocument={handleViewDocument}
              />
            ))}
          </div>
        )}
      </div>

      {/* Document Modal - Using backend download endpoint */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Document Preview</h3>
              <button className="modal-close" onClick={() => setSelectedDoc(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p><strong>File:</strong> {selectedDoc.split("/").pop()}</p>
              <p><strong>Path:</strong> {selectedDoc}</p>
              
              {/* Image preview if it's an image - using backend endpoint */}
              {selectedDoc.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                <div className="image-preview" style={{ marginTop: "15px" }}>
                  <img 
                    src={`http://localhost:8000/recovery/download-document/${getFilenameFromPath(selectedDoc)}`}
                    alt="Document Preview"
                    style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      console.error("Image load error");
                    }}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="btn-approve" 
                onClick={() => {
                  const filename = getFilenameFromPath(selectedDoc);
                  const fullUrl = `http://localhost:8000/recovery/download-document/${filename}`;
                  window.open(fullUrl, "_blank");
                }}
              >
                Open File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HandoverCard({ request, onUpdateStatus, onViewDocument }) {
  const documents = request.document_paths ? request.document_paths.split(",") : [];

  // Get filename from path
  const getFilenameFromPath = (docPath) => {
    let filename = docPath.split("/").pop();
    filename = filename.split("\\").pop();
    return filename;
  };

  // Document click handler - Using backend download endpoint
  const handleDocumentClick = (doc) => {
    const filename = getFilenameFromPath(doc);
    const fullUrl = `http://localhost:8000/recovery/download-document/${filename}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="handover-card">
      <div className="handover-header">
        <span className="handover-id">Request #{request.handover_id}</span>
        <span className={`handover-status ${request.status}`}>
          {request.status}
        </span>
      </div>

      <div className="handover-details">
        <p><strong>Owner CNIC:</strong> {request.owner_cnic}</p>
        <p><strong>Police Station:</strong> {request.police_station_name || "N/A"}</p>
        <p><strong>Request Date:</strong> {request.handover_date || "N/A"}</p>
      </div>

      <div className="vehicle-info">
        <p><strong>🚗 Vehicle:</strong> {request.vehicle_no_plate || "N/A"}</p>
      </div>

      {documents.length > 0 && (
        <div className="documents-section">
          <div className="documents-title">
            <span>📎</span> Attached Documents ({documents.length})
          </div>
          <div className="documents-list-small">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="doc-badge"
                onClick={() => handleDocumentClick(doc)}
              >
                📄 Document {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {request.status === "Pending" && (
        <div className="handover-actions">
          <button
            className="btn-approve"
            onClick={() => onUpdateStatus(request.handover_id, "Approved")}
          >
            ✓ Approve Request
          </button>
          <button
            className="btn-reject"
            onClick={() => onUpdateStatus(request.handover_id, "Rejected")}
          >
            ✗ Reject Request
          </button>
        </div>
      )}
    </div>
  );
}