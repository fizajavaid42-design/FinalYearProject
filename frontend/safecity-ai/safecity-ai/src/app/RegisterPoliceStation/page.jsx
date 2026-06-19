"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api"; 
import "@/styles/PoliceStation.css";

export default function RegisterPoliceStation() {
  const router = useRouter();
  
  // Data States
  const [allPlaces, setAllPlaces] = useState([]);
  const [allOfficers, setAllOfficers] = useState([]);
  
  // Form States
  const [name, setName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedPlaceIds, setSelectedPlaceIds] = useState([]);
  const [selectedOfficerIds, setSelectedOfficerIds] = useState([]);
  
  // Search States
  const [areaSearchTerm, setAreaSearchTerm] = useState("");
  const [officerSearchTerm, setOfficerSearchTerm] = useState("");
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [placesRes, officersRes] = await Promise.all([
        api.get("/places"),
        api.get("/users/police")
      ]);
      setAllPlaces(placesRes.data);
      setAllOfficers(officersRes.data);
    } catch (error) {
      console.error("Failed to load data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id, list, setList) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !selectedLocationId || selectedPlaceIds.length === 0) {
      alert("Please fill name, location and select at least one area.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("place_id", selectedLocationId);
    formData.append("place_ids", selectedPlaceIds.join(","));
    formData.append("officer_ids", selectedOfficerIds.join(","));

    try {
      const res = await api.post("/police-station", formData);
      if (res.status === 200 || res.status === 201) {
        alert("Police Station registered successfully!");
        router.push("/adminDashboard");
      }
    } catch (error) {
      alert("Error: " + (error.response?.data?.detail || "Submission failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Filter areas based on search - "Starts with"
  const filteredPlaces = allPlaces.filter(place => {
    if (areaSearchTerm.trim() === "") return [];
    const searchTerm = areaSearchTerm.toLowerCase().trim();
    const placeName = place.name?.toLowerCase() || "";
    return placeName.startsWith(searchTerm);
  });

  // ✅ Filter officers based on search - "Starts with"
  const filteredOfficers = allOfficers.filter(officer => {
    if (officerSearchTerm.trim() === "") return [];
    const searchTerm = officerSearchTerm.toLowerCase().trim();
    const officerName = officer.name?.toLowerCase() || "";
    return officerName.startsWith(searchTerm);
  });

  const clearAreaSearch = () => setAreaSearchTerm("");
  const clearOfficerSearch = () => setOfficerSearchTerm("");

  if (!isMounted || isLoading) return <div className="loader">Loading...</div>;

  return (
    <div className="ps-container">
      {/* Header with Back Button */}
      <div className="ps-header">
        <div className="ps-header-left">
          <button className="ps-back-btn" onClick={() => router.back()}>
            ←
          </button>
          <div className="ps-header-text">
            <h1><span>🚓</span> Register Police Station</h1>
            <p>Add and configure a new police station</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ps-form">
        
        {/* Card 1: Station Name */}
        <div className="ps-card">
          <div className="ps-card-title-box">
            <span className="ps-card-icon">🏛️</span>
            <div>
              <div className="ps-card-title">Station Name</div>
            </div>
          </div>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Enter station name (e.g. G10)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Card 2: Station Location (Dropdown) */}
        <div className="ps-card">
          <div className="ps-card-title-box">
            <span className="ps-card-icon">📍</span>
            <div>
              <div className="ps-card-title">Station Location</div>
              <p className="ps-subtitle-text">Where is this police station located?</p>
            </div>
          </div>
          <div className="input-group">
            <select 
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              required
            >
              <option value="">-- Select Location --</option>
              {allPlaces.map(place => (
                <option key={place.id || place.place_id} value={place.id || place.place_id}>
                  {place.name} - {place.city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Card 3: Assign Areas with Search */}
        <div className="ps-card">
          <div className="ps-card-title-box">
            <span className="ps-card-icon">🗺️</span>
            <div>
              <div className="ps-card-title">Assign Areas</div>
              <p className="ps-subtitle-text">Which areas will this station cover?</p>
            </div>
          </div>
          
          {/* Search Input for Areas */}
          <div className="ps-search-input-wrapper">
            <span className="ps-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search areas (e.g., 'S' for Saddar)..."
              value={areaSearchTerm}
              onChange={(e) => setAreaSearchTerm(e.target.value)}
              className="ps-search-input"
            />
            {areaSearchTerm && (
              <button type="button" className="ps-clear-search" onClick={clearAreaSearch}>
                ✕
              </button>
            )}
          </div>

          <div className="ps-list-container">
            {areaSearchTerm.trim() === "" ? (
              <p className="empty-text" style={{ textAlign: "center", padding: "20px" }}>
                🔍 Type at least one letter to search areas
              </p>
            ) : filteredPlaces.length === 0 ? (
              <p className="empty-text" style={{ textAlign: "center", padding: "20px" }}>
                ❌ No area starts with "{areaSearchTerm}"
              </p>
            ) : (
              filteredPlaces.map(place => {
                const id = place.id || place.place_id;
                const isSelected = selectedPlaceIds.includes(id);
                return (
                  <div 
                    key={id} 
                    className={`ps-selection-item ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleSelection(id, selectedPlaceIds, setSelectedPlaceIds)}
                  >
                    <div className={`ps-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && "✓"}
                    </div>
                    <div className="ps-item-info">
                      <span className="ps-main-text">{place.name}</span>
                      <span className="ps-sub-text">{place.city}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedPlaceIds.length > 0 && (
            <div className="ps-selected-count">
              ✅ {selectedPlaceIds.length} area(s) selected
            </div>
          )}
        </div>

        {/* Card 4: Assign Police Officers with Search */}
        <div className="ps-card">
          <div className="ps-card-title-box">
            <span className="ps-card-icon">👮</span>
            <div>
              <div className="ps-card-title">Assign Police Officers</div>
              <p className="ps-subtitle-text">Officers assigned to this station</p>
            </div>
          </div>
          
          {/* Search Input for Officers */}
          <div className="ps-search-input-wrapper">
            <span className="ps-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search officers by name..."
              value={officerSearchTerm}
              onChange={(e) => setOfficerSearchTerm(e.target.value)}
              className="ps-search-input"
            />
            {officerSearchTerm && (
              <button type="button" className="ps-clear-search" onClick={clearOfficerSearch}>
                ✕
              </button>
            )}
          </div>

          <div className="ps-list-container">
            {officerSearchTerm.trim() === "" ? (
              <p className="empty-text" style={{ textAlign: "center", padding: "20px" }}>
                🔍 Type at least one letter to search officers
              </p>
            ) : filteredOfficers.length === 0 ? (
              <p className="empty-text" style={{ textAlign: "center", padding: "20px" }}>
                ❌ No officer starts with "{officerSearchTerm}"
              </p>
            ) : (
              filteredOfficers.map(officer => {
                const isSelected = selectedOfficerIds.includes(officer.user_id);
                return (
                  <div 
                    key={officer.user_id} 
                    className={`ps-selection-item ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleSelection(officer.user_id, selectedOfficerIds, setSelectedOfficerIds)}
                  >
                    <div className={`ps-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && "✓"}
                    </div>
                    <div className="ps-avatar">{(officer.name || "P")[0]}</div>
                    <div className="ps-item-info">
                      <span className="ps-main-text">{officer.name}</span>
                      <span className="ps-sub-text">{officer.designation || "Inspector"}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {selectedOfficerIds.length > 0 && (
            <div className="ps-selected-count">
              👮 {selectedOfficerIds.length} officer(s) selected
            </div>
          )}
        </div>
        
        <button type="submit" className="ps-submit-btn" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Police Station"}
        </button>
      </form>
    </div>
  );
}