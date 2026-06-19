"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import api from "@/utils/api"; 
import "../../styles/Signup.css";

export default function SignupPage() {
  const router = useRouter();
  const fileRef = useRef(null);

  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contact, setContact] = useState("");
  const [designation, setDesignation] = useState("");
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    if (!role) {
      alert("Please select a role!");
      return;
    }
    
    if (role === "police" && !designation) {
      alert("Please enter your designation!");
      return;
    }
    
    if (!document) {
      alert("Please upload your CNIC!");
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("confirm_password", confirmPassword);
      formData.append("role", role);
      formData.append("contact", contact);
      
      if (designation) {
        formData.append("designation", designation);
      }
      
      if (document) {
        formData.append("document", document);
      }
      
      const response = await api.post("/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Response:", response.data);
      
      if (response.data) {
        alert(response.data.message || "Signup successful!");
        router.push("/login");
      }
      
    } catch (error) {
      console.log("Error:", error);
      if (error.response?.data?.detail) {
        alert(error.response.data.detail);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-full-page">
      {/* Header - Same as Login */}
      <div className="signup-header-sync">
        <div className="header-center-box">
          <div className="logo-white-circle">
            <Image src="/images/logo.svg" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="header-title-text">Safe City &nbsp; AI</h1>
        </div>
      </div>

      <div className="signup-main-content">
        <div className="signup-form-container">
          <div className="form-head-section">
            <h2>Create Account</h2>
            <p>Join Safe City AI to protect your community</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-actual-form">
            <div className="signup-input-group">
              <label>Select your Role</label>
              <div className="input-with-icon">
                <span className="icon-span">👤</span>
                <select value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="">Select Role</option>
                  <option value="citizen">Citizen</option>
                  <option value="police">Police</option>
                </select>
              </div>
            </div>

            <div className="signup-input-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <span className="icon-span">📝</span>
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="signup-input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="icon-span">📧</span>
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            {role === "police" && (
              <div className="signup-input-group">
                <label>Designation</label>
                <div className="input-with-icon">
                  <span className="icon-span">👮</span>
                  <input 
                    type="text" 
                    placeholder="e.g. Inspector, SHO, Constable" 
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    required 
                  />
                </div>
              </div>
            )}

            <div className="signup-row">
              <div className="signup-input-group half">
                <label>Password</label>
                <div className="input-with-icon">
                  <span className="icon-span">🔒</span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="signup-input-group half">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <span className="icon-span">🔒</span>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="signup-input-group">
              <label>Contact Number</label>
              <div className="input-with-icon">
                <span className="icon-span">📞</span>
                <input 
                  type="tel" 
                  placeholder="03xxxxxxxxx" 
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="signup-input-group">
              <label>Upload CNIC</label>
              <div className="input-with-icon upload-input">
                <span className="icon-span">📄</span>
                <span className="file-name-display">
                  {document ? document.name : "No file chosen"}
                </span>
                <button type="button" className="upload-btn-signup" onClick={() => fileRef.current.click()}>
                  Browse
                </button>
              </div>
              <input type="file" ref={fileRef} hidden onChange={(e) => setDocument(e.target.files[0])} accept="image/*,.pdf" required />
              <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Upload your CNIC (JPG, PNG, or PDF)</small>
            </div>

            <button type="submit" className="signup-submit-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="signup-footer-links">
            <p>Already have an account? <span onClick={() => router.push("/login")}>Log in</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}