'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/utils/api';
import '@/styles/CarTrackingRoute.css';

export default function CarTrackingRouteScreen() {
    const router = useRouter();
    const params = useParams();
    const plateNo = params.plateNo;

    // ── States ──
    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReport, setShowReport] = useState(false);

    // ── Fetch route data on mount ──
    useEffect(() => {
        if (plateNo) {
            fetchRoute();
        } else {
            setError('No plate number provided');
            setLoading(false);
        }
    }, [plateNo]);

    const fetchRoute = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.get(`/car-tracking/route/${plateNo}`);

            if (res.data) {
                setRouteData(res.data);
            } else {
                setError('No route data received');
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.message;
            let errorMsg = 'Failed to fetch route data';
            
            if (detail) {
                errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // ── Back navigation ──
    const handleBack = () => {
        router.back();
    };

    // ── Format time ──
    const formatTime = (timeStr) => {
        if (!timeStr) return 'Unknown';
        try {
            const date = new Date(timeStr);
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return timeStr;
        }
    };

    // ── Loading State ──
    if (loading) {
        return (
            <div className="ctr-screen">
                <header className="ctr-header">
                    <button className="ctr-back-btn" onClick={handleBack}>← Back</button>
                    <div className="ctr-header-center">
                        <h1>🚗 Vehicle Route</h1>
                        <p className="ctr-header-sub">Loading tracking data...</p>
                    </div>
                    <div style={{ width: "40px" }}></div>
                </header>
                <div className="ctr-loader">
                    <div className="ctr-spinner"></div>
                    <p>Loading route information...</p>
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (error) {
        return (
            <div className="ctr-screen">
                <header className="ctr-header">
                    <button className="ctr-back-btn" onClick={handleBack}>← Back</button>
                    <div className="ctr-header-center">
                        <h1>🚗 Vehicle Route</h1>
                    </div>
                    <div style={{ width: "40px" }}></div>
                </header>
                <div className="ctr-error-state">
                    <span className="ctr-error-icon">⚠️</span>
                    <h3 className="ctr-error-title">Error Loading Route</h3>
                    <p className="ctr-error-text">{error}</p>
                    <button className="ctr-retry-btn" onClick={fetchRoute}>
                        🔄 Retry
                    </button>
                    <button className="ctr-back-btn-secondary" onClick={handleBack}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );
    }

    // ── Destructure data ──
    const carInfo = routeData?.car_info || {};
    const route = routeData?.route || [];
    const totalCheckpoints = routeData?.total_checkpoints || 0;
    const timeSpan = routeData?.time_span_minutes;
    const totalDetections = routeData?.total_detections || 0;
    const firstSeen = routeData?.first_seen;
    const lastSeen = routeData?.last_seen;

    return (
        <div className="ctr-screen">
            {/* HEADER */}
            <header className="ctr-header">
                <button className="ctr-back-btn" onClick={handleBack}>← Back</button>
                <div className="ctr-header-center">
                    <h1>🚗 Vehicle Route</h1>
                    <p className="ctr-header-sub">Tracking history & timeline</p>
                </div>
                <div style={{ width: "40px" }}></div>
            </header>

            {/* BODY */}
            <div className="ctr-body">
                {/* ── Car Info Card ── */}
                <div className="ctr-car-info-card">
                    <div className="ctr-car-icon-circle">
                        <span className="ctr-car-icon">🚗</span>
                    </div>
                    <h2 className="ctr-car-name">
                        {carInfo.company || ''} {carInfo.model || ''}
                    </h2>
                    <div className="ctr-plate-badge">
                        {carInfo.no_plate || 'N/A'}
                    </div>
                    {carInfo.color && (
                        <p className="ctr-car-color">Color: {carInfo.color}</p>
                    )}
                    
                    {/* First & Last Seen */}
                    <div className="ctr-time-info">
                        {firstSeen && (
                            <div className="ctr-time-item">
                                <span className="ctr-time-label">First Seen</span>
                                <span className="ctr-time-value">{formatTime(firstSeen)}</span>
                            </div>
                        )}
                        {lastSeen && (
                            <div className="ctr-time-item">
                                <span className="ctr-time-label">Last Seen</span>
                                <span className="ctr-time-value">{formatTime(lastSeen)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="ctr-stats-row">
                    <div className="ctr-stat-card">
                        <span className="ctr-stat-value">{totalDetections}</span>
                        <span className="ctr-stat-label">Total Sightings</span>
                    </div>
                    <div className="ctr-stat-card">
                        <span className="ctr-stat-value">{totalCheckpoints}</span>
                        <span className="ctr-stat-label">Checkpoints</span>
                    </div>
                    <div className="ctr-stat-card">
                        <span className="ctr-stat-value">
                            {timeSpan ? `${timeSpan}min` : 'N/A'}
                        </span>
                        <span className="ctr-stat-label">Time Span</span>
                    </div>
                </div>

                {/* ── Route Timeline Title ── */}
                <h3 className="ctr-section-title">📍 Route Timeline</h3>

                {/* ── Timeline ── */}
                {route.length === 0 ? (
                    <div className="ctr-empty-route">
                        <span className="ctr-empty-icon">🗺️</span>
                        <p className="ctr-empty-text">No route data available for this vehicle</p>
                    </div>
                ) : (
                    <div className="ctr-timeline">
                        {route.map((stop, index) => {
                            const isFirst = index === 0;
                            const isLast = index === route.length - 1;
                            const camera = stop.camera || {};
                            const checkpoint = stop.checkpoint || {};
                            const imagePath = stop.image_path;

                            return (
                                <div key={index} className="ctr-timeline-item">
                                    {/* Timeline Indicator */}
                                    <div className="ctr-timeline-indicator">
                                        <div className={`ctr-timeline-dot ${isFirst ? 'first' : ''}`}></div>
                                        {!isLast && <div className="ctr-timeline-line"></div>}
                                    </div>

                                    {/* Timeline Content */}
                                    <div className={`ctr-timeline-content ${isFirst ? 'first' : ''}`}>
                                        {/* Image if available */}
                                        {imagePath && (
                                            <div className="ctr-timeline-image">
                                                <img 
                                                    src={`${process.env.NEXT_PUBLIC_API_URL || ''}${imagePath}`}
                                                    alt={`Stop at ${camera.place_name || camera.direction || 'Unknown'}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Checkpoint Name */}
                                        {checkpoint.name && (
                                            <div className="ctr-checkpoint-row">
                                                <span className="ctr-icon">🚩</span>
                                                <span className="ctr-checkpoint-name">
                                                    {checkpoint.name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Camera Name */}
                                        <div className="ctr-camera-row">
                                            <span className="ctr-icon">📷</span>
                                            <span className="ctr-camera-name">
                                                {camera.place_name || camera.direction || 'Unknown Camera'}
                                            </span>
                                        </div>

                                        {/* Detection Time */}
                                        <div className="ctr-time-row">
                                            <span className="ctr-icon">🕐</span>
                                            <span className="ctr-detection-time">
                                                {formatTime(stop.detected_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Generate Report Button ── */}
                <button className="ctr-report-btn" onClick={() => setShowReport(true)}>
                    <span className="ctr-report-icon">📄</span>
                    <span>Generate Report</span>
                </button>
            </div>

            {/* ── Report Modal ── */}
            {showReport && (
                <div className="ctr-modal-overlay" onClick={() => setShowReport(false)}>
                    <div className="ctr-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="ctr-modal-header">
                            <h3>📋 Route Report</h3>
                            <button 
                                className="ctr-modal-close"
                                onClick={() => setShowReport(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="ctr-modal-body">
                            <div className="ctr-report-row">
                                <span className="ctr-report-label">Vehicle:</span>
                                <span className="ctr-report-value">
                                    {carInfo.company || ''} {carInfo.model || ''}
                                </span>
                            </div>
                            <div className="ctr-report-row">
                                <span className="ctr-report-label">Plate:</span>
                                <span className="ctr-report-value">{carInfo.no_plate || 'N/A'}</span>
                            </div>
                            {carInfo.color && (
                                <div className="ctr-report-row">
                                    <span className="ctr-report-label">Color:</span>
                                    <span className="ctr-report-value">{carInfo.color}</span>
                                </div>
                            )}
                            <div className="ctr-report-row">
                                <span className="ctr-report-label">Total Sightings:</span>
                                <span className="ctr-report-value">{totalDetections}</span>
                            </div>
                            <div className="ctr-report-row">
                                <span className="ctr-report-label">Checkpoints:</span>
                                <span className="ctr-report-value">{totalCheckpoints}</span>
                            </div>
                            <div className="ctr-report-row">
                                <span className="ctr-report-label">Time Span:</span>
                                <span className="ctr-report-value">
                                    {timeSpan ? `${timeSpan} min` : 'N/A'}
                                </span>
                            </div>
                            {firstSeen && (
                                <div className="ctr-report-row">
                                    <span className="ctr-report-label">First Seen:</span>
                                    <span className="ctr-report-value">{formatTime(firstSeen)}</span>
                                </div>
                            )}
                            {lastSeen && (
                                <div className="ctr-report-row">
                                    <span className="ctr-report-label">Last Seen:</span>
                                    <span className="ctr-report-value">{formatTime(lastSeen)}</span>
                                </div>
                            )}
                        </div>

                        <div className="ctr-modal-footer">
                            <button 
                                className="ctr-modal-btn"
                                onClick={() => setShowReport(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}