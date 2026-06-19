"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../styles/Loading.css';

export default function LoadingPage() {
  const router = useRouter();
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  
  const text = "Safe City AI";

  // Typing effect
  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[index]);
        setIndex(index + 1);
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  // Navigation after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/splash');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="loading-container">
      {/* TOP: Car Logo Image */}
      <img 
        src="/images/logo.svg"  // ✅ Tumhara image path
        alt="Safe City AI Logo"
        className="car-logo-img"
        style={{
          width: '400px',
          height: '400px',
          objectFit: 'contain',
          marginBottom: '40px',
          animation: 'float 3s infinite ease-in-out',
          filter: 'drop-shadow(0 0 20px rgba(0, 123, 255, 0.7))'
        }}
      />

      {/* BOTTOM: Text */}
      <div className="loading-text-container">
        <h1 className="loading-title">
          {displayText}
          <span className="cursor">|</span>
        </h1>
        {/* <p className="loading-subtitle">Securing Cities with AI Technology</p> */}
      </div>
    </div>
  );
}