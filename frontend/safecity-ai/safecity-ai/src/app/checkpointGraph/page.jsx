"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "@/styles/CheckpointGraph.css";

export default function CheckpointGraphPage() {
  const router = useRouter();
  const [checkpoints, setCheckpoints] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);
  const [saving, setSaving] = useState(false);

  const role = typeof window !== "undefined" ? localStorage.getItem("role") : null;
  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/checkpoints");
      const data = Array.isArray(res.data) ? res.data : [];
      setCheckpoints(data);
      
      // Build edges from checkpoint data
      const edges = [];
      for (const cp of data) {
        const fromId = cp.id;
        const nextIds = cp.next_checkpoint_ids || [];
        for (const toId of nextIds) {
          edges.push({
            from_id: fromId,
            from_name: cp.name || "Unknown",
            to_id: toId,
            to_name: getCheckpointNameById(toId, data),
          });
        }
      }
      setGraphEdges(edges);
    } catch (err) {
      console.error("Error loading checkpoints:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCheckpointNameById = (id, data) => {
    const cp = data.find(c => c.id === id);
    return cp?.name || "Unknown";
  };

  const getCheckpointLabel = (cp) => {
    const name = cp.name || "Unknown";
    const placeId = cp.place_id || "N/A";
    const cameras = cp.linked_camera_ids || [];
    const officers = cp.linked_officer_ids || [];
    return `${name} (Place: ${placeId} | Cameras: ${cameras.length} | Officers: ${officers.length})`;
  };

  const saveEdge = async () => {
    if (!selectedFrom || !selectedTo) return;
    if (selectedFrom === selectedTo) {
      alert("Cannot connect checkpoint to itself");
      return;
    }

    const exists = graphEdges.some(e => e.from_id === selectedFrom && e.to_id === selectedTo);
    if (exists) {
      alert("This connection already exists");
      return;
    }

    setSaving(true);
    try {
      const formData = new URLSearchParams();
      formData.append("from_checkpoint_id", selectedFrom.toString());
      formData.append("to_checkpoint_id", selectedTo.toString());
      formData.append("order", "1");

      await api.post("/checkpoint-graph", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      alert("Connection saved successfully!");
      setSelectedFrom(null);
      setSelectedTo(null);
      loadData();
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  const filteredToCheckpoints = checkpoints.filter(c => c.id !== selectedFrom);

  return (
    <div className="cg-container">
      {/* HEADER */}
      <header className="cg-header">
        <button className="cg-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="cg-header-center">
          <div className="cg-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="cg-title">🔗 Checkpoint Connections</h1>
            <p className="cg-subtitle">Create route between adjacent checkpoints</p>
          </div>
        </div>
        <button className="cg-refresh-btn" onClick={loadData}>
          🔄
        </button>
      </header>

      <div className="cg-content">
        {loading ? (
          <div className="cg-loader"><div className="cg-spinner"></div></div>
        ) : (
          <>
            {/* Header Icon */}
            <div className="cg-icon-header">
              <div className="cg-icon-circle">
                <span>🔗</span>
              </div>
              <h2 className="cg-icon-title">Connect Checkpoints</h2>
              <p className="cg-icon-subtitle">Create route between adjacent checkpoints</p>
            </div>

            {/* ✅ ADMIN: Show form - POLICE: Hide form */}
            {isAdmin ? (
              <>
                {/* From Checkpoint */}
                <div className="cg-form-group">
                  <label className="cg-label">From Checkpoint</label>
                  <div className="cg-select-wrapper">
                    <span className="cg-select-icon">🚩</span>
                    <select
                      className="cg-select"
                      value={selectedFrom || ""}
                      onChange={(e) => {
                        setSelectedFrom(e.target.value ? parseInt(e.target.value) : null);
                        setSelectedTo(null);
                      }}
                    >
                      <option value="">Select source checkpoint</option>
                      {checkpoints.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {getCheckpointLabel(cp)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* To Checkpoint */}
                <div className="cg-form-group">
                  <label className="cg-label">To Checkpoint</label>
                  {selectedFrom === null ? (
                    <div className="cg-info-box">
                      <span>ℹ️</span>
                      <p>Select a source checkpoint first</p>
                    </div>
                  ) : filteredToCheckpoints.length === 0 ? (
                    <div className="cg-warning-box">
                      <span>⚠️</span>
                      <p>No other checkpoints available</p>
                    </div>
                  ) : (
                    <div className="cg-select-wrapper">
                      <span className="cg-select-icon">🏁</span>
                      <select
                        className="cg-select"
                        value={selectedTo || ""}
                        onChange={(e) => setSelectedTo(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Select destination checkpoint</option>
                        {filteredToCheckpoints.map((cp) => (
                          <option key={cp.id} value={cp.id}>
                            {getCheckpointLabel(cp)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Info Note */}
                <div className="cg-info-note">
                  <span>ℹ️</span>
                  <p>Only adjacent checkpoints can be connected. The route follows physical sequence.</p>
                </div>

                {/* Save Button */}
                <button
                  className="cg-save-btn"
                  onClick={saveEdge}
                  disabled={!selectedFrom || !selectedTo || saving}
                >
                  {saving ? "Saving..." : "💾 Save Connection"}
                </button>
              </>
            ) : (
              /* ✅ POLICE VIEW: Sirf message dikhega */
              <div className="cg-readonly-message">
                <div className="cg-readonly-icon">👮</div>
                <h3>View Only Mode</h3>
                <p>You are viewing the checkpoint network. Only administrators can add or modify connections.</p>
              </div>
            )}

            {/* Existing Connections Section - Dono roles ke liye visible */}
            <div className="cg-existing-section">
              <div className="cg-existing-header">
                <div className="cg-existing-icon">🔗</div>
                <h3 className="cg-existing-title">Existing Connections</h3>
                <span className="cg-existing-count">{graphEdges.length}</span>
              </div>

              {graphEdges.length === 0 ? (
                <div className="cg-empty-state">
                  <span className="cg-empty-icon">🔌</span>
                  <p>No connections found</p>
                  <p className="cg-empty-sub">
                    {isAdmin 
                      ? "Create your first checkpoint connection above"
                      : "No connections available in the system"}
                  </p>
                </div>
              ) : (
                <div className="cg-edges-list">
                  {graphEdges.map((edge, index) => (
                    <div key={index} className="cg-edge-card">
                      <div className="cg-edge-left">
                        <div className="cg-edge-icon">📍</div>
                        <div className="cg-edge-info">
                          <div className="cg-edge-from">{edge.from_name}</div>
                          <div className="cg-edge-arrow">
                            <span>→</span>
                            <span className="cg-edge-to">{edge.to_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="cg-edge-badge">Direct</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}