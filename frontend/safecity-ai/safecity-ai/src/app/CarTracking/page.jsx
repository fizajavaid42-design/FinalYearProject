'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import '@/styles/CarTrackingSearch.css';

export default function CarTrackingSearchScreen() {
    const router = useRouter();

    // ── States ──
    const [searchPlate, setSearchPlate] = useState("");
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState(null);

    // ── Back navigation ──
    const handleBack = () => {
        router.push('/policeDashboard');
    };

    // ── Search function ──
    const handleSearch = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        const plate = searchPlate.trim();
        
        if (plate.length < 2) {
            setError('Please enter at least 2 characters');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const res = await api.get(`/car-tracking/search?plate=${plate}`);

            if (res.data) {
                const carData = res.data.cars || res.data || [];
                setCars(Array.isArray(carData) ? carData : []);
            } else {
                setCars([]);
            }
        } catch (err) {
            const detail = err.response?.data?.detail || err.response?.data?.message;
            let errorMsg = 'Search failed. Please try again.';
            
            if (detail) {
                errorMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
            } else if (err.message) {
                errorMsg = err.message;
            }
            
            setError(errorMsg);
            setCars([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Navigate to tracking route ──
    const handleCarClick = (car) => {
        const plateNo = car.no_plate || car.plate || '';
        router.push(`CarTracking/${encodeURIComponent(plateNo)}`);
    };

    // ── Clear error ──
    const handleClearError = () => {
        setError(null);
    };

    return (
        <div className="cts-screen">
            {/* HEADER */}
            <header className="cts-header">
                <button className="cts-back-btn" onClick={handleBack}>
                    ← Back
                </button>
                <div className="cts-header-center">
                    <h1>🚗 Car Tracking</h1>
                    <p className="cts-header-sub">Search vehicle by plate number</p>
                </div>
                <div style={{ width: "40px" }}></div>
            </header>

            {/* BODY */}
            <div className="cts-body">
                {/* ── Search Card ── */}
                <div className="cts-card cts-search-card">
                    <div className="cts-search-icon-circle">
                        <span className="cts-search-icon">🔍</span>
                    </div>
                    
                    <h3 className="cts-card-title">Search Vehicle by Plate</h3>
                    
                    <form onSubmit={handleSearch} className="cts-search-form">
                        <input
                            type="text"
                            className="cts-search-input"
                            placeholder="Enter plate number (e.g. ABC-123)"
                            value={searchPlate}
                            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                            style={{ letterSpacing: '2px' }}
                            autoFocus
                        />
                        
                        <button 
                            type="submit"
                            className="cts-search-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="cts-btn-spinner"></span>
                                    <span>Searching...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔍</span>
                                    <span>Search</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ── Error Display ── */}
                {error && (
                    <div className="cts-error-box">
                        <span className="cts-error-icon">⚠️</span>
                        <span className="cts-error-text">{error}</span>
                        <button 
                            className="cts-error-close"
                            onClick={handleClearError}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ── Results Section ── */}
                {searched && !loading && (
                    <>
                        {cars.length === 0 ? (
                            <div className="cts-empty-state">
                                <span className="cts-empty-icon">🔍</span>
                                <h3 className="cts-empty-title">No vehicles found</h3>
                                <p className="cts-empty-text">
                                    No vehicles match plate number "{searchPlate}"
                                </p>
                            </div>
                        ) : (
                            <div className="cts-results-section">
                                <p className="cts-results-count">
                                    {cars.length} vehicle(s) found
                                </p>
                                
                                <div className="cts-cars-list">
                                    {cars.map((car, index) => (
                                        <div
                                            key={car.id || car.car_id || index}
                                            className="cts-car-card"
                                            onClick={() => handleCarClick(car)}
                                        >
                                            <div className="cts-car-icon-box">
                                                <span className="cts-car-icon">🚗</span>
                                            </div>
                                            
                                            <div className="cts-car-info">
                                                <h4 className="cts-car-name">
                                                    {car.company || ''} {car.model || ''}
                                                </h4>
                                                <p className="cts-car-plate">
                                                    Plate: {car.no_plate || 'N/A'}
                                                </p>
                                                {car.last_camera && (
                                                    <p className="cts-car-location">
                                                        📍 Last seen: {car.last_camera.place_name || car.last_camera.direction || 'Unknown'}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <div className="cts-car-meta">
                                                <span className="cts-detection-count">
                                                    {car.total_detections || 0} times
                                                </span>
                                                <span className="cts-chevron">›</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── Initial State (No search yet) ── */}
                {!searched && !loading && (
                    <div className="cts-initial-state">
                        <span className="cts-initial-icon">🔎</span>
                        <h3 className="cts-initial-title">Track Vehicles</h3>
                        <p className="cts-initial-text">
                            Enter a plate number above to search and track vehicle movements
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}