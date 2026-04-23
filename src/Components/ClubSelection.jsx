import React, { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import "../styles/ClubSelection.css";

// Pre-load all images from assets folder for dynamic resolution
const assetImages = import.meta.glob('../assets/**/*.svg', { eager: true });
const pngImages = import.meta.glob('../assets/**/*.png', { eager: true });
const allImages = { ...assetImages, ...pngImages };

function getLogoSrc(logoName) {
  if (!logoName) return null;
  const lowerLogo = logoName.toLowerCase();
  
  // First check in /clubs/
  let match = Object.entries(allImages).find(([path]) => path.toLowerCase().includes(`/clubs/${lowerLogo}`));
  if (match) return match[1].default;
  
  // Then check in root assets
  match = Object.entries(allImages).find(([path]) => path.toLowerCase().endsWith(`/${lowerLogo}`));
  return match ? match[1].default : null;
}

export default function ClubSelection({ onBack }) {
  const { db, selectTeam, selectOpponentTeam } = useGame();
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
  const dragStartTime = useRef(0);
  const itemWidth = 170 + 32; // width (170) + gap (32)

  useEffect(() => {
    const middle = Math.floor(virtualClubs.length / 2);
    setSelectedIndex(middle);
  }, [phase]);

  // Infinite Jump logic
  useEffect(() => {
    if (isDragging) return;

    const baseLen = baseClubs.length;
    const total = virtualClubs.length;
    
    // Jump if we are outside the "safe middle zone" (copies 2 and 3)
    if (selectedIndex < baseLen || selectedIndex >= total - baseLen) {
      setTimeout(() => {
        setIsJumping(true);
        const offset = selectedIndex % baseLen;
        setSelectedIndex(baseLen * 2 + offset);
        // Turn off jump mode after a tiny delay to allow the state to update without transition
        setTimeout(() => setIsJumping(false), 50);
      }, 500); // Wait for the last transition to finish
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
    dragStartTime.current = Date.now();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = itemWidth / 3;
    if (Math.abs(dragOffset) > threshold) {
      const shift = Math.round(-dragOffset / itemWidth);
      setSelectedIndex(prev => {
        const next = prev + shift;
        return Math.max(0, Math.min(virtualClubs.length - 1, next));
      });
    }
    setDragOffset(0);
  };

  const getTransform = () => {
    const centerOffset = (selectedIndex * itemWidth) - dragOffset;
    return `translateX(calc(50% - ${centerOffset}px - 75px))`;
  };

  return (
    <div 
      className="club-selection-screen"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <button className="back-btn" onClick={handleBack}>
        Wróć
      </button>

      <h1 className="selection-title">
        {phase === "user" ? "Wybierz swój klub" : "Wybierz przeciwnika"}
      </h1>

      <div 
        className="carousel-container"
        onMouseDown={handleMouseDown}
      >
        <div 
          className="clubs-track" 
          style={{ 
            transform: getTransform(),
            transition: (isDragging || isJumping) ? "none" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
          }}
        >
          {virtualClubs.map((club, index) => {
            const isActive = index === selectedIndex;
            const src = getLogoSrc(club.logo);
            
            return (
              <div 
                key={club.vId} 
                className={`club-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  const duration = Date.now() - dragStartTime.current;
                  if (duration < 200) {
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
