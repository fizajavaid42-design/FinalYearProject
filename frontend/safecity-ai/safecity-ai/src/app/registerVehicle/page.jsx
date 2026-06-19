// "use client";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import api from "@/utils/api";
// import "@/styles/RegisterVehicle.css";

// const CAR_MODELS = {
//   Honda: ["Civic", "City", "BR-V", "HR-V", "Accord"],
//   Toyota: ["Corolla", "Yaris", "Fortuner", "Hilux", "Camry"],
//   Suzuki: ["Alto", "Cultus", "Swift", "Wagon R", "Vitara"],
//   Hyundai: ["Tucson", "Elantra", "Sonata", "i10", "Creta"],
//   Kia: ["Sportage", "Picanto", "Stonic", "Sorento", "Carnival"],
//   Audi: ["A3", "A4", "A6", "Q5", "Q7"],
//   BMW: ["3 Series", "5 Series", "X3", "X5", "M3"],
// };

// const CAR_COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];
// const YEARS = Array.from({ length: 45 }, (_, i) => new Date().getFullYear() - i); // Auto-generates last 45 years

// export default function RegisterVehiclePage() {
//   const router = useRouter();
//   const [userId, setUserId] = useState(0);
//   const [documents, setDocuments] = useState([]);
//   const [errors, setErrors] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   const [form, setForm] = useState({
//     company: "", model: "", car_year: "", import_year: "", color: "", no_plate: "", engine_no: "", chassis_no: "",
//   });

//   // Next.js hydration error se bachne ke liye localStorage hamesha useEffect mein use karte hain
//   useEffect(() => {
//     setUserId(parseInt(localStorage.getItem("user_id") || "0", 10));
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({
//       ...prev,
//       [name]: value,
//       ...(name === "company" && { model: "" }) // Agar company change ho, toh model reset kardo
//     }));
//     setErrors(prev => ({ ...prev, [name]: "" })); // Error clear kardo type karte waqt
//   };

//   const handleFileChange = (e) => setDocuments(prev => [...prev, ...Array.from(e.target.files)]);

//   const validate = () => {
//     const newErrors = {};
//     if (!form.company) newErrors.company = "Company is required";
//     if (!form.model) newErrors.model = "Model is required";
//     if (!form.car_year) newErrors.car_year = "Year is required";
//     if (!form.color) newErrors.color = "Color is required";
//     if (!form.no_plate) newErrors.no_plate = "Number plate is required";
//     return newErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const validationErrors = validate();
//     if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("user_id", userId);
//       Object.keys(form).forEach(key => {
//         if (form[key]) formData.append(key, form[key]); // Sirf bhari hui fields bhejo
//       });
//       documents.forEach(file => formData.append("documents", file));

//       await api.post("/registration/register-vehicle", formData);
//       router.back();
//     } catch (err) {
//       console.error("Submission Failed:", err);
//       alert("Error saving vehicle. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="tr-container web-view">
//       <div className="tr-header">
//         <button className="tr-back-btn" onClick={() => router.back()}>&#8592;</button>
//         <span className="tr-title">Register Vehicle 📋</span>
//       </div>

//       <form className="tr-body web-layout" onSubmit={handleSubmit}>
//         <div className="form-grid">
          
//           {/* Column 1: Core Details */}
//           <div className="form-column">
//             <p className="tr-section-title">Vehicle Specs:</p>
//             <p className="tr-section-sub">Basic information about the car</p>

//             <div className="tr-field">
//               <label>Company *</label>
//               <select name="company" value={form.company} onChange={handleChange} className={errors.company ? "error-border" : ""}>
//                 <option value="">Select Company</option>
//                 {Object.keys(CAR_MODELS).map(c => <option key={c} value={c}>{c}</option>)}
//               </select>
//               {errors.company && <span className="error-text-rv">{errors.company}</span>}
//             </div>

//             <div className="tr-field">
//               <label>Vehicle Model *</label>
//               <select name="model" value={form.model} onChange={handleChange} disabled={!form.company} className={errors.model ? "error-border" : ""}>
//                 <option value="">Select Model</option>
//                 {(CAR_MODELS[form.company] || []).map(m => <option key={m} value={m}>{m}</option>)}
//               </select>
//               {errors.model && <span className="error-text-rv">{errors.model}</span>}
//             </div>

//             <div className="tr-field">
//               <label>Mfg. Year *</label>
//               <select name="car_year" value={form.car_year} onChange={handleChange} className={errors.car_year ? "error-border" : ""}>
//                 <option value="">Year</option>
//                 {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
//               </select>
//             </div>

//             <div className="tr-field">
//               <label>Color *</label>
//               <select name="color" value={form.color} onChange={handleChange} className={errors.color ? "error-border" : ""}>
//                 <option value="">Color</option>
//                 {CAR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
//               </select>
//             </div>
//           </div>

//           {/* Column 2: Technical & Docs */}
//           <div className="form-column">
//             <p className="tr-section-title">Technical Details:</p>
//             <p className="tr-section-sub">Engine, Chassis and Documents</p>

//             <div className="tr-field">
//               <label>Number Plate *</label>
//               <input type="text" name="no_plate" placeholder="e.g. LEC-1234" value={form.no_plate} onChange={handleChange} className={errors.no_plate ? "error-border" : ""} />
//               {errors.no_plate && <span className="error-text-rv">{errors.no_plate}</span>}
//             </div>

//             <div className="tr-field">
//               <label>Engine Number</label>
//               <input type="text" name="engine_no" placeholder="e.g. 1NZFE-987654" value={form.engine_no} onChange={handleChange} />
//             </div>

//             <div className="tr-field">
//               <label>Chassis Number</label>
//               <input type="text" name="chassis_no" placeholder="e.g. 1HGCM8..." value={form.chassis_no} onChange={handleChange} />
//             </div>

//             <div className="tr-field">
//               <label>Ownership Documents</label>
//               <input type="file" multiple onChange={handleFileChange} />
//               <div style={{marginTop: '10px'}}>
//                 {documents.map((file, i) => (
//                   <div key={i} style={{fontSize: '12px', color: '#4e73df'}}>📄 {file.name}</div>
//                 ))}
//               </div>
//             </div>
//           </div>

//         </div>
//         <button type="submit" className="tr-submit-btn" disabled={isLoading}>
//           {isLoading ? "Wait..." : "Submit Registration"}
//         </button>
//       </form>
//     </div>
//   );
// }



"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/utils/api";
import "@/styles/RegisterVehicle.css";

const CAR_MODELS = {
  Honda: ["Civic", "City", "BR-V", "HR-V", "Accord"],
  Toyota: ["Corolla", "Yaris", "Fortuner", "Hilux", "Camry"],
  Suzuki: ["Alto", "Cultus", "Swift", "Wagon R", "Vitara"],
  Hyundai: ["Tucson", "Elantra", "Sonata", "i10", "Creta"],
  Kia: ["Sportage", "Picanto", "Stonic", "Sorento", "Carnival"],
  Audi: ["A3", "A4", "A6", "Q5", "Q7"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "M3"],
};

const CAR_COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Green", "Brown", "Beige", "Gold"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1979 }, (_, i) => currentYear - i);

export default function RegisterVehiclePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    company: "", model: "", car_year: "",
    import_year: "", color: "", no_plate: "",
    engine_no: "", chassis_no: "",
  });

  const [documents, setDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const USER_ID = typeof window !== "undefined" 
    ? parseInt(localStorage.getItem("user_id") || "0", 10) 
    : 0;

  const models = form.company ? CAR_MODELS[form.company] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "company" ? { model: "" } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    setDocuments((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e = {};
    if (!form.company) e.company = "Company is required";
    if (!form.model) e.model = "Model is required";
    if (!form.car_year) e.car_year = "Year is required";
    if (!form.color) e.color = "Color is required";
    if (!form.no_plate) e.no_plate = "Number plate is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id", USER_ID);
      formData.append("company", form.company);
      formData.append("model", form.model);
      formData.append("car_year", form.car_year);
      formData.append("color", form.color);
      formData.append("no_plate", form.no_plate);
      if (form.import_year) formData.append("import_year", form.import_year);
      if (form.engine_no) formData.append("engine_no", form.engine_no);
      if (form.chassis_no) formData.append("chassis_no", form.chassis_no);
      documents.forEach((file) => formData.append("documents", file));

      await api.post("/registration/register-vehicle", formData);
      router.back();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tr-container web-view">
      <div className="tr-header">
        <button className="tr-back-btn" onClick={() => router.back()}>&#8592;</button>
        <span className="tr-title">Register Vehicle 📋</span>
      </div>

      <form className="tr-body web-layout" onSubmit={handleSubmit}>
        <div className="form-grid">
          
          {/* Column 1: Core Details */}
          <div className="form-column">
            <p className="tr-section-title">Vehicle Specs:</p>
            <p className="tr-section-sub">Basic information about the car</p>

            <div className="tr-field">
              <label>Company *</label>
              <select name="company" value={form.company} onChange={handleChange} className={errors.company ? "error-border" : ""}>
                <option value="">Select Company</option>
                {Object.keys(CAR_MODELS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.company && <span className="error-text-rv">{errors.company}</span>}
            </div>

            <div className="tr-field">
              <label>Vehicle Model *</label>
              <select name="model" value={form.model} onChange={handleChange} disabled={!form.company} className={errors.model ? "error-border" : ""}>
                <option value="">Select Model</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.model && <span className="error-text-rv">{errors.model}</span>}
            </div>

            <div className="tr-field">
              <label>Mfg. Year *</label>
              <select name="car_year" value={form.car_year} onChange={handleChange} className={errors.car_year ? "error-border" : ""}>
                <option value="">Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="tr-field">
              <label>Color *</label>
              <select name="color" value={form.color} onChange={handleChange} className={errors.color ? "error-border" : ""}>
                <option value="">Color</option>
                {CAR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="tr-field">
              <label>Import Year (Optional)</label>
              <select name="import_year" value={form.import_year} onChange={handleChange}>
                <option value="">Select Year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Column 2: Technical & Docs */}
          <div className="form-column">
            <p className="tr-section-title">Technical Details:</p>
            <p className="tr-section-sub">Engine, Chassis and Documents</p>

            <div className="tr-field">
              <label>Number Plate *</label>
              <input type="text" name="no_plate" placeholder="e.g. LEC-1234" value={form.no_plate} onChange={handleChange} className={errors.no_plate ? "error-border" : ""} />
              {errors.no_plate && <span className="error-text-rv">{errors.no_plate}</span>}
            </div>

            <div className="tr-field">
              <label>Engine Number</label>
              <input type="text" name="engine_no" placeholder="e.g.1NZFE-987654" value={form.engine_no} onChange={handleChange} />
            </div>

            <div className="tr-field">
              <label>Chassis Number</label>
              <input type="text" name="chassis_no" placeholder="e.g.1HGCM82633A123456" value={form.chassis_no} onChange={handleChange} />
            </div>

            <div className="tr-field">
              <label>Ownership Documents</label>
              <input type="file" multiple onChange={handleFileChange} />
              <div style={{marginTop: '10px'}}>
                {documents.map((file, i) => (
                  <div key={i} style={{fontSize: '12px', color: '#4e73df'}}>📄 {file.name}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="tr-submit-btn" disabled={isLoading}>
          {isLoading ? "Wait..." : "Submit Registration"}
        </button>
      </form>
    </div>
  );
}