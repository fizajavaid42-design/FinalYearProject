"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import "@/styles/StationSummary.css";

export default function StationSummaryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stationId, setStationId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Resolve stationId (URL → localStorage) ──
  useEffect(() => {
    const fromUrl = searchParams.get("stationId");
    const fromStorage =
      typeof window !== "undefined"
        ? localStorage.getItem("station_id")
        : null;

    const id = fromUrl || fromStorage;

    if (id) {
      setStationId(id);
    } else {
      setError("No station assigned to this officer.");
      setLoading(false);
    }
  }, [searchParams]);

  // ── Fetch when stationId resolved ──
  useEffect(() => {
    if (stationId) fetchSummary();
  }, [stationId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/station-summary/${stationId}`);
      setData(response.data);
    } catch (err) {
      console.error("Error fetching station summary:", err);
      const detail =
        err.response?.data?.detail || err.response?.data?.message;
      setError(
        typeof detail === "string"
          ? detail
          : err.message || "Failed to load station summary"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Reusable Header ──
  const renderHeader = () => (
    <header className="ss-header">
      <button className="ss-back-btn" onClick={() => router.back()}>←</button>
      <div className="ss-header-center">
        <h1 className="ss-title">📊 Station Summary</h1>
        <p className="ss-subtitle">Reports comparison across stations</p>
      </div>
      <div style={{ width: "40px" }}></div>
    </header>
  );

  // ── Loading ──
  if (loading) {
    return (
      <div className="ss-container">
        {renderHeader()}
        <div className="ss-loader">
          <div className="ss-spinner"></div>
          <p>Loading station summary...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="ss-container">
        {renderHeader()}
        <div className="ss-error">
          <span>⚠️</span>
          <p>{error}</p>
          {stationId && (
            <button onClick={fetchSummary}>🔄 Retry</button>
          )}
        </div>
      </div>
    );
  }

  // ── No data ──
  if (!data || !data.my_station) {
    return (
      <div className="ss-container">
        {renderHeader()}
        <div className="ss-error">
          <span>ℹ️</span>
          <p>No data available for this station</p>
        </div>
      </div>
    );
  }

  const myStation = data.my_station;
  const allStations = data.all_stations || [];
  const maxTotal = Math.max(
    ...allStations.map((s) => s.total_reports || 0),
    0
  );

  return (
    <div className="ss-container">
      {renderHeader()}

      <div className="ss-main-wrapper">
        {/* My Station */}
        <div className="ss-section-title">My Station</div>

        <div className="ss-my-station-card">
          <h2 className="ss-station-name">{myStation.station_name}</h2>

          <div className="ss-stats-row">
            <div className="ss-stat-item">
              <span className="ss-stat-value">{myStation.total_reports ?? 0}</span>
              <span className="ss-stat-label">Total</span>
            </div>
            <div className="ss-stat-item">
              <span className="ss-stat-value">{myStation.theft_reports ?? 0}</span>
              <span className="ss-stat-label">Theft</span>
            </div>
            <div className="ss-stat-item">
              <span className="ss-stat-value">{myStation.accident_reports ?? 0}</span>
              <span className="ss-stat-label">Accident</span>
            </div>
          </div>

          <div className="ss-stats-row">
            <div className="ss-stat-item">
              <span className="ss-stat-value ss-pending">{myStation.pending ?? 0}</span>
              <span className="ss-stat-label">Pending</span>
            </div>
            <div className="ss-stat-item">
              <span className="ss-stat-value ss-resolved">{myStation.resolved ?? 0}</span>
              <span className="ss-stat-label">Resolved</span>
            </div>
            <div className="ss-stat-item">
              <span className="ss-stat-value ss-rejected">{myStation.rejected ?? 0}</span>
              <span className="ss-stat-label">Rejected</span>
            </div>
          </div>
        </div>

        {/* All Stations Comparison */}
        <div className="ss-section-title" style={{ marginTop: "24px" }}>
          All Stations Comparison
        </div>

        {allStations.length === 0 ? (
          <div className="ss-error">
            <span>ℹ️</span>
            <p>No other stations available to compare</p>
          </div>
        ) : (
          <>
            <div className="ss-table-header">
              <div className="ss-col-station">Station</div>
              <div className="ss-col-total">Total</div>
              <div className="ss-col-theft">Theft</div>
              <div className="ss-col-acc">Acc.</div>
              <div className="ss-col-pending">Pend.</div>
            </div>

            <div className="ss-table-body">
              {allStations.map((station) => {
                const isMyStation = station.station_id === myStation.station_id;
                const total = station.total_reports || 0;
                const progressPercent =
                  maxTotal > 0 ? (total / maxTotal) * 100 : 0;

                return (
                  <div
                    key={station.station_id}
                    className={`ss-table-row ${isMyStation ? "ss-my-station-row" : ""}`}
                  >
                    <div className="ss-col-station">
                      {isMyStation && <span className="ss-check-icon">✓</span>}
                      <span
                        className={`ss-station-name-text ${isMyStation ? "ss-bold" : ""}`}
                      >
                        {station.station_name}
                      </span>
                    </div>
                    <div className="ss-col-total">
                      <div className="ss-progress-bar-container">
                        <div
                          className="ss-progress-bar"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                        <span className="ss-total-value">
                          {station.total_reports ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="ss-col-theft">{station.theft_reports ?? 0}</div>
                    <div className="ss-col-acc">{station.accident_reports ?? 0}</div>
                    <div
                      className={`ss-col-pending ${(station.pending || 0) > 0 ? "ss-has-pending" : ""}`}
                    >
                      {station.pending ?? 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}