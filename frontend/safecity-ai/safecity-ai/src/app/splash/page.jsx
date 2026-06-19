"use client";
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Image component for better loading
import '../../styles/Splash.css';

export default function SplashPage() {
  const router = useRouter();

  return (
    <div className="full-screen-wrapper">
      <div className="splash-card-desktop">
        
        {/* Top Bar with Gradient - Matching your theme */}
        <div className="splash-header-gradient">
          <div className="logo-container">
            {/* Logo from public/images/logo.svg */}
             <div className="logo-container-white">
               
            <Image 
              src="/images/logo.svg" 
              alt="SafeCity Logo" 
              width={100} 
              height={100} 
              className="brand-logo-img"
            />
            </div>
          </div>
          <div className="auth-buttons-group">
            <span className="nav-link" onClick={() => router.push("/login")}>
              LOGIN
            </span>
            <button className="nav-signup-btn" onClick={() => router.push("/signup")}>
              SIGN UP
            </button>
          </div>
        </div>

        {/* Hero Section with City Background Style */}
        <div className="hero-section">
          <div className="hero-overlay">
             <h1 className="hero-title">SafeCity AI</h1>
             <p className="hero-subtitle">
              Transforming cities into safer communities with advanced AI
              monitoring and rapid response systems. Report incidents,
              receive alerts, and protect your city.
             </p>
          </div>
        </div>

        {/* Features Section - Desktop Grid */}
        <div className="features-grid-container">
          <h2 className="features-main-heading">Key Features</h2>
          
          <div className="features-layout">
            <div className="feature-card">
              <div className="feature-icon-box">⏱️</div>
              <div className="feature-info">
                <h3>Real-Time Incident Reporting</h3>
                <p>Empower citizens to instantly report accidents, crimes and emergencies with location data.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">⚡</div>
              <div className="feature-info">
                <h3>AI-Powered Alert System</h3>
                <p>Receive immediate notifications on potential threats and suspicious activities detected by AI.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">👮</div>
              <div className="feature-info">
                <h3>Streamlined Police Operations</h3>
                <p>Provide safe, reliable, and efficient help to every citizen.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}