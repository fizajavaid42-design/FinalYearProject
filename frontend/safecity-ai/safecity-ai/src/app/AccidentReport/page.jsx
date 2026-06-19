"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/AccidentReport.css";

const COLORS = ["White","Black","Silver","Grey","Red","Blue","Green","Brown","Beige","Gold"];
const TYPES  = ["Sedan","SUV","Hatchback"];
const COMPANIES = ["Honda", "Toyota", "Suzuki"];

// Models based on company selection
const MODELS_BY_COMPANY = {
  Honda: ["Civic", "City", "BR-V", "HR-V", "Accord"],
  Toyota: ["Corolla", "Yaris", "Fortuner", "Hilux", "Camry"],
  Suzuki: ["Alto", "Cultus", "Swift", "Wagon R", "Vitara"],
  // Hyundai: ["Tucson", "Elantra", "Sonata", "i10", "Creta"],
  // Kia: ["Sportage", "Picanto", "Stonic", "Sorento", "Carnival"],
  // Audi: ["A3", "A4", "A6", "Q5", "Q7"],
  // BMW: ["3 Series", "5 Series", "X3", "X5", "M3"],
  Other: ["Other"],
};

// Generation options based on company + model
const GENERATIONS_BY_MODEL = {
  "Honda Civic": ["8th Gen", "10th Gen"],
  "Honda City": ["5th Gen", "6th Gen"],
  "Toyota Corolla": ["9th Gen", "10th Gen", "11th Gen"],
  "Toyota Yaris": ["1st Gen"],
  "Suzuki Alto": ["2nd Gen", "8th Gen"],
  "Suzuki Cultus": ["2nd Gen", "3rd Gen"],
};

export default function AccidentReportPage() {
  const router = useRouter();

  const [userId, setUserId]             = useState(0);
  const [places, setPlaces]             = useState([]);
  const [plate, setPlate]               = useState("");
  const [color, setColor]               = useState("");
  const [type, setType]                 = useState("");
  const [company, setCompany]           = useState("");
  const [model, setModel]               = useState("");
  const [generationOptions, setGenerationOptions] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [description, setDescription]   = useState("");
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [successMsg, setSuccessMsg]     = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const fileInput = useRef();

  // Get available models based on selected company
  const availableModels = company ? MODELS_BY_COMPANY[company] || [] : [];

  // Update generation options when company and model change
  useEffect(() => {
    if (company && model) {
      const key = `${company} ${model}`;
      const options = GENERATIONS_BY_MODEL[key] || [];
      setGenerationOptions(options);
      setSelectedGeneration("");
    } else {
      setGenerationOptions([]);
      setSelectedGeneration("");
    }
  }, [company, model]);

  useEffect(() => {
    const id = parseInt(localStorage.getItem("user_id") || "0", 10);
    setUserId(id);

    api.get("/places")
      .then((res) => setPlaces(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  // Handle company change (reset model and generation)
  const handleCompanyChange = (e) => {
    setCompany(e.target.value);
    setModel("");
    setGenerationOptions([]);
    setSelectedGeneration("");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPlaceId) { setErrorMsg("Please select accident location"); return; }
    if (!description.trim()) { setErrorMsg("Please enter description"); return; }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      if (userId) formData.append("user_id", userId.toString());
      formData.append("incident_type", "Accident");
      if (plate.trim()) formData.append("no_plate", plate.trim());
      if (color) formData.append("color", color);
      if (type) formData.append("vehicle_type", type);
      
      if (company) formData.append("company", company);
      if (model) formData.append("model", model);
      if (selectedGeneration) formData.append("generation", selectedGeneration);
      
      formData.append("description", description.trim());
      formData.append("place_id", selectedPlaceId);
      if (imageFile) formData.append("car_image", imageFile);

      const res = await api.post("/reports/accident", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg(res.data.message ?? "Report submitted successfully!");
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      console.error("Error:", err);
      setErrorMsg("Error: " + (err.response?.data?.detail ?? "Failed to submit report"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ar-container web-view">
      
      <div className="ar-header">
        <button className="ar-back-btn" onClick={() => router.back()}>&#8592;</button>
        <span className="ar-title">Create Accident Report 🚗</span>
      </div>

      {successMsg && <div className="ar-alert-success">{successMsg}</div>}
      {errorMsg   && <div className="ar-alert-error">{errorMsg}</div>}

      <form className="ar-body" onSubmit={handleSubmit}>
        
        <div className="ar-web-grid">
          
          <div className="ar-upload-section">
            <p className="ar-section-title">Step 1: Upload Photo Evidence</p>
            <div className="ar-upload-box">
              <div className="ar-preview" onClick={() => fileInput.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Car preview" />
                ) : (
                  <>
                    <span className="ar-preview-icon">📷</span>
                    <p className="ar-preview-text">Click to Upload</p>
                    <p className="ar-preview-hint">Clear photo of the vehicle helps in better recognition</p>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" ref={fileInput} 
                     style={{ display: "none" }} onChange={handleImageChange} />
              <button type="button" className="ar-upload-btn" 
                      onClick={() => fileInput.current?.click()}>
                {imagePreview ? "Change Photo" : "Select Photo"}
              </button>
            </div>
          </div>

          <div className="ar-form-fields">
            <p className="ar-section-title">Step 2: Vehicle & Incident Details</p>
            
            <div className="ar-field">
              <label>Number Plate (optional)</label>
              <input placeholder="e.g., LEA-1234" value={plate} onChange={(e) => setPlate(e.target.value)} />
            </div>

            <div className="ar-row">
              <div className="ar-field">
                <label>Vehicle Color</label>
                <div className="ar-select-wrap">
                  <select value={color} onChange={(e) => setColor(e.target.value)}>
                    <option value="">Select Color</option>
                    {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="ar-field">
                <label>Vehicle Type</label>
                <div className="ar-select-wrap">
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Select Type</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Company & Model Row */}
            <div className="ar-row">
              <div className="ar-field">
                <label>Company (Optional)</label>
                <div className="ar-select-wrap">
                  <select value={company} onChange={handleCompanyChange}>
                    <option value="">Select Company</option>
                    {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="ar-field">
                <label>Model (Optional)</label>
                <div className="ar-select-wrap">
                  <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!company}>
                    <option value="">Select Model</option>
                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Generation Field - Always visible, disabled until company+model selected */}
            <div className="ar-field">
              <label>Generation (Optional)</label>
              <div className="ar-select-wrap">
                <select 
                  value={selectedGeneration} 
                  onChange={(e) => setSelectedGeneration(e.target.value)}
                  disabled={generationOptions.length === 0}
                  style={{ 
                    backgroundColor: generationOptions.length === 0 ? "#f5f5f5" : "white",
                    cursor: generationOptions.length === 0 ? "not-allowed" : "pointer"
                  }}
                >
                  <option value="">Select Generation</option>
                  {generationOptions.map((gen) => (
                    <option key={gen} value={gen}>{gen}</option>
                  ))}
                </select>
              </div>
              <small style={{ color: "#666", marginTop: "4px", display: "block" }}>
                {generationOptions.length === 0 
                  ? "💡 Select company and model first to see generation options" 
                  : "Select the generation of the vehicle"}
              </small>
            </div>

            <div className="ar-field">
              <label>Accident Location</label>
              <div className="ar-select-wrap">
                <select 
                  value={selectedPlaceId} 
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                >
                  <option value="">Select Location</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ar-field">
              <label>Brief Description</label>
              <textarea 
                placeholder="What happened? (e.g. Hit and run, minor collision at 2 PM)" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
          </div>

        </div>

        <button type="submit" className="ar-submit-btn" disabled={submitting}>
          {submitting ? <span className="ar-spinner" /> : "Submit Report"}
        </button>

      </form>
    </div>
  );
}