"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/TheftReport.css";

export default function TheftReportPage() {
  const router = useRouter();

  const [userId, setUserId] = useState(0);
  const [cars, setCars] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");  // ✅ CHANGE: store place_id
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState(null);
  const snackTimer = useRef(null);

  useEffect(() => {
    const id = parseInt(localStorage.getItem("user_id") || "0", 10);
    setUserId(id);
    if (!id) return;

    Promise.all([
      api.get(`/registration/vehicles/user/${id}`),
      api.get("/places"),
    ])
      .then(([carsRes, placesRes]) => {
        setCars(Array.isArray(carsRes.data) ? carsRes.data : []);
        setPlaces(Array.isArray(placesRes.data) ? placesRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoadingCars(false));
  }, []);

  function showSnack(msg, success = false) {
    setSnack({ msg, success });
    clearTimeout(snackTimer.current);
    snackTimer.current = setTimeout(() => setSnack(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedCar)        { showSnack("Please select a car"); return; }
    if (!selectedPlaceId)    { showSnack("Please select a location"); return; }  // ✅ CHANGE
    if (!contact.trim())     { showSnack("Contact is required"); return; }
    if (!description.trim()) { showSnack("Description is required"); return; }

    setSubmitting(true);
    try {
      const body = new URLSearchParams({
        user_id: userId.toString(),
        vehicle_id: selectedCar.vehicle_id.toString(),
        incident_type: "Theft",
        place_id: selectedPlaceId,  // ✅ CHANGE: send place_id instead of place_name
        description: description.trim(),
        contact: contact.trim(),
      });

      const res = await api.post("/reports/theft", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      showSnack(res.data.message ?? "Report submitted successfully!", true);
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showSnack("Error: " + (err.response?.data?.detail ?? "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tr-container web-view">
      <div className="tr-header">
        <button className="tr-back-btn" onClick={() => router.back()}>&#8592;</button>
        <span className="tr-title">Create Theft Report 📋</span>
      </div>

      <form className="tr-body web-layout" onSubmit={handleSubmit}>
        <div className="form-grid">
          
          <div className="form-column">
            <p className="tr-section-title">Car Details:</p>
            <p className="tr-section-sub">Select your Registered Car by Number Plate</p>

            {loadingCars ? (
              <div className="tr-loader"><div className="tr-spinner" /></div>
            ) : (
              <div className="tr-field">
                <label>Number Plate</label>
                <div className="tr-select-wrap">
                  <select
                    value={selectedCar ? selectedCar.vehicle_id : ""}
                    onChange={(e) => {
                      const found = cars.find((c) => String(c.vehicle_id) === e.target.value);
                      setSelectedCar(found ?? null);
                    }}
                  >
                    <option value="">Select Number Plate</option>
                    {cars.map((c) => (
                      <option key={c.vehicle_id} value={c.vehicle_id}>{c.no_plate}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedCar && (
              <div className="tr-car-info">
                <p className="tr-car-name">{selectedCar.company} {selectedCar.model}</p>
                <div className="tr-car-meta">
                  <span>{selectedCar.no_plate}</span>
                  <span>{selectedCar.car_year}</span>
                  <span>{selectedCar.color}</span>
                </div>
              </div>
            )}

            <div className="tr-field">
              <label>Last Seen Location</label>
              <div className="tr-select-wrap">
                <select 
                  value={selectedPlaceId} 
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                >
                  <option value="">Select Location</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.city}</option>  // ✅ CHANGE: value is id
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-column">
            <p className="tr-section-title">Incident Details:</p>
            <div style={{ height: 8 }} />

            <div className="tr-field">
              <label>Incident Type</label>
              <div className="tr-type-tag">Theft</div>
            </div>

            <div className="tr-field">
              <label>Contact</label>
              <input
                type="tel"
                placeholder="03xx-xxxxxxx"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>

            <div className="tr-field">
              <label>Description</label>
              <textarea
                placeholder="Describe what happened (time, situation, any details)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="tr-submit-btn" disabled={submitting}>
          {submitting ? <span className="tr-spinner" /> : "Submit Report"}
        </button>
      </form>

      {snack && (
        <div className={`tr-snack ${snack.success ? "success" : "error"}`}>
          {snack.msg}
        </div>
      )}
    </div>
  );
}