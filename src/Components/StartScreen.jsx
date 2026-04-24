import React, { useState, useEffect } from "react";
import logo from "../assets/tactix_logo_main.png";
import bg1 from "../assets/lewandowski_bg.jpg";
import bg2 from "../assets/yildiz_bg.jpg";
import bg3 from "../assets/bruno_bg.jpg";
import bg4 from "../assets/Ronaldo.jpg";
import bg5 from "../assets/Antony.jpg";
import "../styles/StartScreen.css";

const backgrounds = [bg4, bg5, bg1, bg2, bg3];

export default function StartScreen({ onNext, onCreate }) {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="start-screen">
      <div className="left-panel">
        <div className="logo-wrapper">
          <img src={logo} alt="Tactix AI" className="logo-img" />
        </div>
        
        <div className="menu-options">
          <button className="menu-btn" onClick={onCreate}>
            Stwórz własny klub
          </button>
          
          <button className="menu-btn" onClick={onNext}>
            Wybierz Istniejące kluby
          </button>

        </div>

        <div className="screen-footer">
          <div className="footer-line"></div>
          <div className="footer-text">
            Tactix AI &copy; 2026 | Early Access v0.4.2
          </div>
        </div>
      </div>
      
      <div className="right-panel-container">
        {backgrounds.map((bg, index) => (
          <div 
            key={index}
            className={`bg-slide ${index === currentBg ? "active" : ""}`}
            style={{ backgroundImage: `url(${bg})` }}
          />
        ))}
        <div className="right-panel-overlay"></div>
      </div>
    </div>
  );
}
