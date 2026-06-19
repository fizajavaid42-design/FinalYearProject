"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/RegisterCarScreen.css";

const CAR_MODELS = {
  Honda:   ["Civic", "City", "BR-V", "HR-V", "Accord"],
  Toyota:  ["Corolla", "Yaris", "Fortuner", "Hilux", "Camry"],
  Suzuki:  ["Alto", "Cultus", "Swift", "Wagon R", "Vitara"],
  Hyundai: ["Tucson", "Elantra", "Sonata", "i10", "Creta"],
  Kia:     ["Sportage", "Picanto", "Stonic", "Sorento", "Carnival"],
  Audi:    ["A3", "A4", "A6", "Q5", "Q7"],
  BMW:     ["3 Series", "5 Series", "X3", "X5", "M3"],
};

const CAR_COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

export default function RegisterVehiclePage() {
  const router = useRouter();

  const [userId, setUserId] = useState(0);
  const [form, setForm] = useState({
    company: "", model: "", car_year: "", import_year: "",
    color: "", no_plate: "", engine_no: "", chassis_no: "",
  });
  const [documents, setDocuments]   = useState([]);
  const [errors, setErrors]         = useState({});
  const [isLoading, setIsLoading]   = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg]     = useState("");

  useEffect(() => {
    const id = parseInt(localStorage.getItem("user_id") || "0", 10);
    setUserId(id);
  }, []);

  const models = form.company ? CAR_MODELS[form.company] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value, ...(name === "company" ? { model: "" } : {}) }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    setDocuments((prev) => [...prev, ...Array.from(e.target.files)]);
    e.target.value = "";
  };

  const removeFile = (index) => setDocuments((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    const e = {};
    if (!form.company)  e.company  = "Company is required";
    if (!form.model)    e.model    = "Model is required";
    if (!form.car_year) e.car_year = "Year is required";
    if (!form.color)    e.color    = "Color is required";
    if (!form.no_plate) e.no_plate = "Number plate is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(""); setErrorMsg("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!userId) { setErrorMsg("User not logged in. Please login again."); return; }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id",  userId);
      formData.append("company",  form.company);
      formData.append("model",    form.model);
      formData.append("car_year", form.car_year);
      formData.append("color",    form.color);
      formData.append("no_plate", form.no_plate);
      if (form.import_year) formData.append("import_year", form.import_year);
      if (form.engine_no)   formData.append("engine_no",   form.engine_no);
      if (form.chassis_no)  formData.append("chassis_no",  form.chassis_no);
      documents.forEach((file) => formData.append("documents", file));

      await api.post("/registration/register-vehicle", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Vehicle registered successfully!");
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="full-screen-container">
      <div className="register-vehicle-card">

        <div className="header-gradient-rv">
          <span className="car-icon">🚗</span>
          <h1>Register Vehicle</h1>
          <p>Fill in your vehicle details below</p>
        </div>

        <div className="form-wrapper-rv">
          {successMsg && <div className="alert-success-rv">{successMsg}</div>}
          {errorMsg   && <div className="alert-error-rv">{errorMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>

            <div className="input-group-custom">
              <label>Company <span className="required-star">*</span></label>
              <div className={`input-box-shadow ${errors.company ? "error-border" : ""}`}>
                <span className="field-icon">🏭</span>
                <select name="company" value={form.company} onChange={handleChange}>
                  <option value="">Select Company</option>
                  {Object.keys(CAR_MODELS).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {errors.company && <span className="error-text-rv">{errors.company}</span>}
            </div>

            <div className="input-group-custom">
              <label>Vehicle Model <span className="required-star">*</span></label>
              <div className={`input-box-shadow ${errors.model ? "error-border" : ""}`}>
                <span className="field-icon">🚘</span>
                <select name="model" value={form.model} onChange={handleChange} disabled={!form.company}>
                  <option value="">Select Model</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {errors.model && <span className="error-text-rv">{errors.model}</span>}
            </div>

            <div className="row-two-cols">
              <div className="input-group-custom">
                <label>Mfg. Year <span className="required-star">*</span></label>
                <div className={`input-box-shadow ${errors.car_year ? "error-border" : ""}`}>
                  <span className="field-icon">📅</span>
                  <select name="car_year" value={form.car_year} onChange={handleChange}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {errors.car_year && <span className="error-text-rv">{errors.car_year}</span>}
              </div>

              <div className="input-group-custom">
                <label>Color <span className="required-star">*</span></label>
                <div className={`input-box-shadow ${errors.color ? "error-border" : ""}`}>
                  <span className="field-icon">🎨</span>
                  <select name="color" value={form.color} onChange={handleChange}>
                    <option value="">Color</option>
                    {CAR_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {errors.color && <span className="error-text-rv">{errors.color}</span>}
              </div>
            </div>

            <div className="input-group-custom">
              <label>Number Plate <span className="required-star">*</span></label>
              <div className={`input-box-shadow ${errors.no_plate ? "error-border" : ""}`}>
                <span className="field-icon">🔖</span>
                <input type="text" name="no_plate" placeholder="CF 420"
                  value={form.no_plate} onChange={handleChange} />
              </div>
              {errors.no_plate && <span className="error-text-rv">{errors.no_plate}</span>}
            </div>

            <div className="input-group-custom">
              <label>Engine Number</label>
              <div className="input-box-shadow">
                <span className="field-icon">⚙️</span>
                <input type="text" name="engine_no" placeholder="ENG78456231KPL"
                  value={form.engine_no} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group-custom">
              <label>Chassis Number</label>
              <div className="input-box-shadow">
                <span className="field-icon">🔩</span>
                <input type="text" name="chassis_no" placeholder="ABC123456789XYZ01"
                  value={form.chassis_no} onChange={handleChange} />
              </div>
            </div>

            <div className="input-group-custom">
              <label>Import Year</label>
              <div className="input-box-shadow">
                <span className="field-icon">🚢</span>
                <select name="import_year" value={form.import_year} onChange={handleChange}>
                  <option value="">Select Year (Optional)</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group-custom">
              <label>Upload Car Documents</label>
              <label className="upload-box-rv">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple onChange={handleFileChange} />
                <div className="upload-left">
                  <span>📎</span>
                  <span>
                    <span className="upload-label-text">Click to upload</span>
                    <span className="upload-sub-text">PDF, JPG, PNG accepted</span>
                  </span>
                </div>
                <span className="upload-arrow">›</span>
              </label>
              {documents.length > 0 && (
                <div className="file-chips-list">
                  {documents.map((file, i) => (
                    <div key={i} className="file-chip-rv">
                      <span>📄</span>
                      <span>{file.name}</span>
                      <button type="button" className="file-remove-btn" onClick={() => removeFile(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="main-submit-btn" disabled={isLoading}>
              {isLoading ? <span className="btn-spinner" /> : "Submit Registration"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}