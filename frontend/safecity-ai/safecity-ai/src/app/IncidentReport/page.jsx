"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "@/styles/ReportIncident.css";

export default function ReportIncidentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Flutter logic: userId check karna zaroori hai
    const id = localStorage.getItem("user_id");
    if (id) {
      setUserId(id);
    }
  }, []);

  return (
    <div className="ri-web-container">
      {/* Header / Navbar */}
      <div className="ri-header">
        <div className="ri-header-left">
          <button className="ri-back-btn" onClick={() => router.push("/citizenDashboard")}>
            ←
          </button>
          <span className="ri-title">Report An Incident🛡️</span>
        </div>
        {/* Aapka logo yahan aa skta hai */}
        {/* <div className="ri-logo-placeholder">🛡️</div> */}
      </div>

      <main className="ri-main-content">
        {/* Intro Section - Full Width on Web */}
        <div className="ri-intro-section">
          <span className="ri-intro-icon">📊</span>
          <div className="ri-intro-text">
            <h1>What do you want to Report?</h1>
            <p>Select the type of incident to help our AI system take quick action.</p>
          </div>
        </div>

        {/* Note Box */}
        <div className="ri-note-box">
          <span className="warning-emoji">⚠️</span>
          <p>
            <strong>Note:</strong> If your vehicle is stolen, choose <strong>Theft</strong>. 
            If you witnessed an accident or hit-and-run, choose <strong>Accident</strong>.
          </p>
        </div>

        {/* Cards Grid - Web view mein side-by-side ayein ge */}
        <div className="ri-cards-grid">
          {/* Card 1: Theft */}
          <div className="ri-card">
            <div className="ri-card-body">
              <span className="ri-card-emoji">🚨</span>
              <div className="ri-card-info">
                <h3>Vehicle Theft</h3>
                <p>For registered vehicle owners</p>
                <p className="detail-text">Report stolen cars quickly to the network</p>
              </div>
            </div>
            <div className="ri-card-footer">
              <button className="ri-btn-primary" onClick={() => router.push(`/TheftReport?userId=${userId}`)}>
                Continue
              </button>
            </div>
          </div>

          {/* Card 2: Accident */}
          <div className="ri-card">
            <div className="ri-card-body">
              <span className="ri-card-emoji">💥</span>
              <div className="ri-card-info">
                <h3>Accident / Hit-and-Run</h3>
                <p>For witnesses or citizens</p>
                <p className="detail-text">Upload car images for AI feature recognition</p>
              </div>
            </div>
            <div className="ri-card-footer">
              <button className="ri-btn-primary" onClick={() => router.push(`/AccidentReport?userId=${userId}`)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}