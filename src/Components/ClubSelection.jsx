import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import "../styles/ClubSelection.css";

export default function ClubSelection({ onBack }) {
  const { db, selectTeam, selectOpponentTeam, getClubLogo } = useGame();
  const [phase, setPhase] = useState("user"); // "user" | "opponent"
  const [userClub, setUserClub] = useState(null);
  
  // Base list of clubs
  const baseClubs = phase === "user" 
    ? db 
    : db.filter(c => c.id !== userClub?.id);

  // For infinite loop, we repeat the list 5 times
  const repeatCount = 5;
  const virtualClubs = Array(repeatCount).fill(baseClubs).flat().map((club, idx) => ({
    ...club,
    vId: `${club.id}-${idx}`
  }));

  // Start in the middle of the virtual list
  const middleStart = Math.floor(virtualClubs.length / 2);
  const [selectedIndex, setSelectedIndex] = useState(middleStart);
  const [isJumping, setIsJumping] = useState(false);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [totalMove, setTotalMove] = useState(0);
  const itemWidth = 170 + 40; // width (170) + gap (40px = 2.5rem)

  useEffect(() => {
    if (virtualClubs.length > 0) {
      const middle = Math.floor(virtualClubs.length / 2);
      setSelectedIndex(middle);
    }
  }, [phase, virtualClubs.length]);

  // Infinite Jump logic
  useEffect(() => {
    if (isDragging) return;

    const baseLen = baseClubs.length;
    const total = virtualClubs.length;
    
    // Jump if we are outside the "safe middle zone"
    if (selectedIndex < baseLen || selectedIndex >= total - baseLen) {
      const jumpTimer = setTimeout(() => {
        setIsJumping(true);
        const offset = selectedIndex % baseLen;
        setSelectedIndex(baseLen * 2 + offset);
        setTimeout(() => setIsJumping(false), 30);
      }, 800); 
      return () => clearTimeout(jumpTimer);
    }
  }, [selectedIndex, isDragging, baseClubs.length, virtualClubs.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex(prev => Math.min(virtualClubs.length - 1, prev + 1));
      } else if (e.key === "Enter") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, virtualClubs, phase]);

  const handleNext = () => {
    const selected = virtualClubs[selectedIndex];
    if (phase === "user") {
      setUserClub(selected);
      setPhase("opponent");
    } else {
      selectTeam(userClub.id);
      selectOpponentTeam(selected.id);
    }
  };

  const handleBack = () => {
    if (phase === "opponent") {
      setPhase("user");
    } else {
      onBack();
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragOffset(0);
    setTotalMove(0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
    setTotalMove(prev => prev + Math.abs(diff - dragOffset));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 50; // pixels to trigger slide
    if (Math.abs(dragOffset) > threshold) {
      const shift = Math.round(-dragOffset / itemWidth);
      if (shift !== 0) {
        setSelectedIndex(prev => {
          const next = prev + shift;
          return Math.max(0, Math.min(virtualClubs.length - 1, next));
        });
      }
    }
    setDragOffset(0);
  };

  const getTransform = () => {
    // 85 is half of item width (170/2)
    const centerOffset = (selectedIndex * itemWidth) - dragOffset;
    return `translateX(calc(50% - ${centerOffset}px - 85px))`;
  };

  return (
    <div 
      className="club-selection-screen"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <button className="selection-back-btn" onClick={handleBack}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        Wróć
      </button>

      <h1 className="selection-title">
        {phase === "user" ? "Twoja drużyna" : "Rozpracuj rywala"}
      </h1>

      <div 
        className="carousel-container"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="clubs-track" 
          style={{ 
            transform: getTransform(),
            transition: (isDragging || isJumping) ? "none" : "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {virtualClubs.map((club, index) => {
            const isActive = index === selectedIndex;
            const src = getClubLogo(club.logo, club.nazwa);
            
            return (
              <div 
                key={club.vId} 
                className={`club-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  // Only select if we didn't drag much
                  if (totalMove < 10) {
                    setSelectedIndex(index);
                  }
                }}
              >
                <div className="club-logo-container">
                  {src ? (
                    <img 
                      src={src} 
                      alt={club.nazwa} 
                      className="club-logo-img" 
                      draggable="false"
                    />
                  ) : (
                    <div className="club-placeholder-logo">
                      {club.nazwa.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="club-name">{club.nazwa}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="select-btn" onClick={handleNext}>
        Wybierz
      </button>
    </div>
  );
}
