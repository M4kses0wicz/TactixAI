import React, { useState, useEffect } from "react";
import { useGame } from "../context/GameContext";
import "../styles/SaveSelectionScreen.css";

export default function SaveSelectionScreen({ type, onBack, onNew, onContinue }) {
  const { savedGames, deleteSave, getClubLogo } = useGame();
  
  const filteredSaves = savedGames.filter(s => s.type === type);
  
  // Base items: New Game + Saved Games
  const baseItems = [
    { id: 'new', isNew: true, nazwa: type === 'custom' ? 'NOWY KLUB' : 'NOWA ANALIZA' },
    ...filteredSaves
  ];

  const virtualItems = baseItems.map(item => ({ ...item, vId: item.id }));

  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    setSelectedIndex(0);
  }, [type, baseItems.length]);

  const [isJumping, setIsJumping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [totalMove, setTotalMove] = useState(0);
  const itemWidth = 240 + 40; 

  const handleNext = () => {
    const selected = virtualItems[selectedIndex];
    if (selected.isNew) {
      onNew();
    } else {
      onContinue(selected);
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
    const threshold = 50;
    if (Math.abs(dragOffset) > threshold) {
      const shift = Math.round(-dragOffset / itemWidth);
      if (shift !== 0) {
        setSelectedIndex(prev => Math.max(0, Math.min(virtualItems.length - 1, prev + shift)));
      }
    }
    setDragOffset(0);
  };

  const getTransform = () => {
    const centerOffset = (selectedIndex * itemWidth) - dragOffset;
    return `translateX(${-centerOffset - 120}px)`;
  };

  const title = type === 'custom' ? "Twoje Projekty" : "Zapisane Analizy";
  const subtitle = type === 'custom' ? "Wybierz własny klub lub stwórz nowy" : "Kontynuuj rozpoczętą analizę taktyczną";

  return (
    <div 
      className="save-selection-screen"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <button className="ss-back-button" onClick={onBack}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
        WRÓĆ
      </button>

      <div className="save-selection-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="carousel-container" onMouseDown={handleMouseDown}>
        <div 
          className="saves-track" 
          style={{ 
            transform: getTransform(),
            transition: (isDragging || isJumping) ? "none" : "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {virtualItems.map((item, index) => {
            const isActive = index === selectedIndex;
            
            if (item.isNew) {
              return (
                <div 
                  key={item.vId}
                  className={`ss-carousel-item ss-new-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (totalMove < 10) {
                      if (isActive) onNew();
                      else setSelectedIndex(index);
                    }
                  }}
                >
                  <div className="item-logo-wrapper">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <div className="item-info">
                    <h3>{item.nazwa}</h3>
                    <span>Zacznij od zera</span>
                  </div>
                  {isActive && (
                    <div className="ss-continue-overlay">
                      <span className="material-symbols-outlined">play_arrow</span>
                      ZACZNIJ
                    </div>
                  )}
                </div>
              );
            }

            return (
              <SaveCardItem 
                key={item.vId}
                item={item}
                isActive={isActive}
                onDelete={() => deleteSave(item.id)}
                onContinue={() => onContinue(item)}
                onSelect={() => setSelectedIndex(index)}
                getClubLogo={getClubLogo}
                type={type}
                totalMove={totalMove}
              />
            );
          })}
        </div>
      </div>

      <div className="selection-footer">
        TACTIX AI • SYSTEM ARCHIWIZACJI PROJEKTÓW
      </div>
    </div>
  );
}

function SaveCardItem({ item, isActive, onDelete, onContinue, onSelect, getClubLogo, type, totalMove }) {
  const [isHovered, setIsHovered] = useState(false);
  const club = item.currentTeam;
  const opponent = item.opponentTeam;

  const logoSrc = isHovered && opponent
    ? (type === 'custom' ? opponent.logo : getClubLogo(opponent.logo, opponent.nazwa))
    : (type === 'custom' ? club.logo : getClubLogo(club.logo, club.nazwa));

  return (
    <div 
      className={`ss-carousel-item ${isActive ? 'active' : ''}`}
      onClick={() => {
        if (totalMove > 10) return; // Prevent click during drag
        if (isActive) onContinue();
        else onSelect();
      }}
    >
      {isActive && (
        <button className="ss-delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <span className="material-symbols-outlined">delete</span>
        </button>
      )}
      <div 
        className={`item-logo-wrapper ${isHovered && opponent ? 'showing-opponent' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img key={logoSrc} src={logoSrc} alt="" className="item-logo-img" draggable="false" />
      </div>
      <div className="item-info">
        <h3>{club.nazwa}</h3>
        <div className={`opponent-peek ${isHovered && opponent ? 'visible' : ''}`}>
          {opponent ? `vs ${opponent.nazwa}` : ''}
        </div>
        <div className="item-meta">
          <span>{new Date(item.timestamp).toLocaleDateString()}</span>
          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      {isActive && (
        <div className="ss-continue-overlay">
          <span className="material-symbols-outlined">play_arrow</span>
          KONTYNUUJ
        </div>
      )}
    </div>
  );
}
