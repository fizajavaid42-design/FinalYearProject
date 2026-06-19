"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/api";
import "../../styles/Login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const res = await api.post("/login", formData);
      const data = res.data;

      console.log("Login response:", data); // 👈 temporary - check station_id aata hai ya nahi

      localStorage.setItem("role", data.role);
      localStorage.setItem("name", data.name);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("token", data.access_token);

      // ✅ station_id save karo (sirf agar response mein aaye)
      if (data.station_id) {
        localStorage.setItem("station_id", data.station_id);
      }

      if (data.role === "ADMIN") {
        router.push("/adminDashboard");
      } else if (data.role === "citizen") {
        router.push("/citizenDashboard");
      } else if (data.role === "police") {
        router.push("/policeDashboard");
      }
    } catch (err) {
      alert("Login Failed: Check your credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-full-page">
      {/* Dashboard Style Header */}
      <div className="login-header-sync">
        <div className="header-center-box">
          <div className="logo-white-circle">
            <Image src="/images/logo.svg" alt="Logo" width={50} height={50} />
          </div>
          <h1 className="header-title-text">Safe City &nbsp; AI</h1>
        </div>
      </div>

      <div className="login-main-content">
        <div className="login-form-container">
          <div className="form-head-section">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-actual-form">
            <div className="login-input-group">
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

            <div className="login-input-group">
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

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? "Verifying..." : "Login to System"}
            </button>
          </form>

          <div className="login-footer-links">
            <p>
              New to Safe City?{" "}
              <span onClick={() => router.push("/signup")}>Create Account</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}