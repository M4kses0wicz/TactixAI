import React, { useState, useEffect } from "react";
import logo from "../assets/tactix_logo_main.png";
import ballLogo from "../assets/TactixAI_logo_bez_napisu.png";
import bg1 from "../assets/lewandowski_bg.jpg";
import bg2 from "../assets/yildiz_bg.jpg";
import bg3 from "../assets/bruno_bg.jpg";
import bg4 from "../assets/Ronaldo.jpg";
import bg5 from "../assets/Antony.jpg";
import "../styles/StartScreen.css";
import "../styles/StartScreenSaves.css";
import { useGame } from "../context/GameContext";

const backgrounds = [bg4, bg5, bg1, bg2, bg3];

export default function StartScreen({ onNext, onCreate, isLoading }) {
  const [currentBg, setCurrentBg] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'next' or 'create'

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && isWaiting && pendingAction) {
      if (pendingAction === 'next') onNext();
      if (pendingAction === 'create') onCreate();
      setIsWaiting(false);
      setPendingAction(null);
    }
  }, [isLoading, isWaiting, pendingAction, onNext, onCreate]);

  const handleAction = (action) => {
    if (isLoading) {
      setIsWaiting(true);
      setPendingAction(action);
    } else {
      if (action === 'next') onNext();
      if (action === 'create') onCreate();
    }
  };

  return (
    <div className="start-screen">
      <div className="left-panel">
        <div className="logo-wrapper">
          <img src={logo} alt="Tactix AI" className="logo-img" />
        </div>
        
        <div className="menu-options">
          <button className="menu-btn" onClick={() => handleAction('create')}>
            Stwórz własny klub
          </button>
          
          <button className="menu-btn" onClick={() => handleAction('next')}>
            Wybierz Istniejące kluby
          </button>
        </div>



        <div className="screen-footer" style={{ opacity: isWaiting ? 0 : 0.15 }}>
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

      {isWaiting && (
        <div className="ss-loading-container">
          <img src={ballLogo} alt="loading" className="ss-loading-ball" />
        </div>
      )}
    </div>
  );
}
