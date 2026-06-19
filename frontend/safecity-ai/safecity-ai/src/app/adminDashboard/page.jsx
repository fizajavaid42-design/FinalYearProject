"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "@/styles/AdminDashboard.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Admin");
  const [userId, setUserId] = useState("0");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role || role.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }
    setUserName(localStorage.getItem("name") || "Admin");
    setUserId(localStorage.getItem("user_id") || "0");
  }, [router]);

  return (
    <div className="adm-container">
      {/* BRAND HEADER */}
      <div className="adm-header">
        <div className="adm-header-center">
          <div className="adm-logo-white">
            <Image src="/images/logo.svg" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="adm-title">Safe City &nbsp; AI</h1>
        </div>
        <button className="adm-logout-btn" onClick={() => { localStorage.clear(); router.push("/login"); }}>
          Logout ↩
        </button>
      </div>

      {/* WEB NAV */}
      <div className="adm-web-nav">
        <div className="nav-item active" onClick={() => router.push("/adminDashboard")}>
          <span>🏠</span><p>Dashboard</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/UserApprovalList")}>
          <span>👥</span><p>Users</p>
        </div>
        {/* Police Station Register - NAYA BUTTON */}
        <div className="nav-item" onClick={() => router.push("/RegisterPoliceStation")}>
          <span>🚓</span><p>Police Station</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/checkpoints")}>
          <span>🚩</span><p>Checkpoints</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/location")}>
          <span>📍</span><p>Locations</p>
        </div>
        <div className="nav-item" onClick={() => router.push("/cameras")}>
          <span>📷</span><p>CCTVCamera</p>
        </div>
      </div>

      <div className="adm-main-wrapper">
        <div className="adm-greet-section">
          <div className="adm-greet-content">
            <h3>System Overview,</h3>
            <h2>Welcome, {userName}!</h2>
            <p>Resource management and system oversight dashboard.</p>
          </div>
          <div className="adm-status-badge">
             🛡️ Admin ID: {userId}
          </div>
        </div>

        <div className="adm-content-card">
          <h3 className="section-label">Management Actions</h3>
          <div className="adm-action-list">
            <ActionRow 
              icon="👥" title="New User Requests" count="3" sub="Pending Approvals" 
              onClick={() => router.push("/UserApprovalList")} 
            />
            {/* ✅ Police Station Register - Action Row */}
            <ActionRow 
              icon="🚓" title="Police Stations" count="0" sub="Register New Station" 
              onClick={() => router.push("/RegisterPoliceStation")} 
            />
            <ActionRow 
              icon="🚩" title="Check Points" count="2" sub="Active CheckPoints" 
              onClick={() => router.push("/Checkpoints")} 
            />
            <ActionRow 
              icon="📷" title="CCTV Cameras" count="5" sub="Live Cameras" 
              onClick={() => router.push("/CCTVCamera")} 
            />
             <ActionRow 
              icon="📊" title="Camera Graph" count="1" sub="System Analytics" 
              onClick={() => router.push("/cameraGraph")} 
            />
            <ActionRow 
              icon="📍" title="Locations" count="6" sub="Total Registered" 
              onClick={() => router.push("/place")} 

            />
            <ActionRow 
  icon="🚩" title="Register Checkpoint" count="0" sub="Create new checkpoint" 
  onClick={() => router.push("/RegisterCheckpoint")} 
  
/>    
<ActionRow 
  icon="📊" title=" Checkpoint Graph" count="0" 
  onClick={() => router.push("/checkpointGraph")} 
  
/>              
    
      
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({ icon, title, count, sub, onClick }) {
  return (
    <div className="adm-row-item" onClick={onClick}>
      <div className="row-left">
        <div className="row-icon-box">{icon}</div>
        <div className="row-info">
          <h4>{title}</h4>
          <div className="row-status-container">
            <span className="count-badge-blue">{count} Items</span>
            <p className="row-subtext">{sub}</p>
          </div>
        </div>
      </div>
      <span className="row-arrow">〉</span>
    </div>
  );
}