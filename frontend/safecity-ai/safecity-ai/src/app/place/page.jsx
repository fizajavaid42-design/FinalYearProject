"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api"; 
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css"; 
import "@/styles/Place.css"; 

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });

export default function AddLocationPage() {
  const router = useRouter();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [L, setL] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: "", city: "", latitude: 33.6844, longitude: 73.0479
  });

  useEffect(() => {
    setIsMounted(true);
    import("leaflet").then((leaflet) => { setL(leaflet); });
    loadExistingPlaces();
  }, []);

  const loadExistingPlaces = async () => {
    try {
      const res = await api.get("/places");
      setPlaces(res.data);
    } catch (error) {
      console.error("Error loading places:", error);
    }
  };

  const customIcon = L ? new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    iconSize: [25, 41], iconAnchor: [12, 41],
  }) : null;

  const handleSearchLocation = async () => {
    if (!newPlace.name) return alert("Please enter a location name");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${newPlace.name}, ${newPlace.city}`);
      const data = await response.json();
      if (data.length > 0) {
        setNewPlace({ ...newPlace, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
      } else { alert("Location not found!"); }
    } catch (error) { alert("Search failed"); }
  };

  const MapContent = () => {
    const { useMapEvents, useMap } = require("react-leaflet");
    const map = useMap();
    useEffect(() => { map.flyTo([newPlace.latitude, newPlace.longitude], 15); }, [newPlace.latitude, newPlace.longitude]);
    useMapEvents({
      click(e) { setNewPlace(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng })); },
    });
    return null;
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    
    if (!newPlace.name || !newPlace.city) return alert("Please fill all fields!");

    const isDuplicate = places.some(
      (p) => p.name.toLowerCase().trim() === newPlace.name.toLowerCase().trim()
    );

    if (isDuplicate) {
      alert(`The location "${newPlace.name}" already exists. Please use a unique name.`);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("name", newPlace.name);
    formData.append("city", newPlace.city);
    formData.append("latitude", String(newPlace.latitude)); 
    formData.append("longitude", String(newPlace.longitude));

    try {
      const res = await api.post("/place", formData);
      if (res.status === 200 || res.status === 201) {
        alert("Location added successfully!");
        router.push("/cameras");
      }
    } catch (error) { 
        alert("Error: Could not save location."); 
    } finally { 
        setLoading(false); 
    }
  };

  if (!isMounted) return null;

  return (
    <div className="al-container">
      {/* Header */}
      <header className="al-header">
        <button className="al-back-btn" onClick={() => router.back()}>
          ←
        </button>
        <div className="al-header-center">
          <div className="al-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="al-title">📍 Add New Location</h1>
            <p className="al-subtitle">Register a new location for cameras and checkpoints</p>
          </div>
        </div>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className="al-content">
        {/* Search Box */}
        <div className="al-search-box">
          <div className="al-search-inputs">
            <input 
              type="text" 
              placeholder="Location Name (e.g. Faizabad)" 
              value={newPlace.name} 
              onChange={(e) => setNewPlace({...newPlace, name: e.target.value})}
              className="al-input"
            />
            <input 
              type="text" 
              placeholder="City (e.g. Islamabad)" 
              value={newPlace.city} 
              onChange={(e) => setNewPlace({...newPlace, city: e.target.value})}
              className="al-input"
            />
            <button type="button" onClick={handleSearchLocation} className="al-search-btn">
              🔍 Search
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="al-map-wrapper">
          <MapContainer center={[newPlace.latitude, newPlace.longitude]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {customIcon && <Marker position={[newPlace.latitude, newPlace.longitude]} icon={customIcon} />}
            <MapContent />
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="al-footer">
          <p className="al-coords">
            📍 Selected Coordinates: {newPlace.latitude.toFixed(6)}, {newPlace.longitude.toFixed(6)}
          </p>
          <button 
            type="button" 
            className="al-save-btn" 
            onClick={handleAddPlace} 
            disabled={loading}
          >
            {loading ? "Saving..." : "💾 Save Location"}
          </button>
        </div>
      </div>
    </div>
  );
}

