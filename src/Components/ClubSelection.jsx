import React, { useState } from "react";
import { useGame } from "../context/GameContext";

export default function ClubSelection({ onBack }) {
  const { db, selectTeam } = useGame();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = () => {
    selectTeam(db[selectedIndex].id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", backgroundColor: "#111", color: "white" }}>
      <button 
        onClick={onBack}
        style={{ position: "absolute", top: "2rem", left: "2rem", background: "none", color: "white", border: "1px solid white", padding: "0.5rem 1rem", borderRadius: "4px", cursor: "pointer" }}
      >
        Wróć
      </button>

      <h1 style={{ fontSize: "2.5rem", marginBottom: "4rem" }}>Wybierz swój klub</h1>

      <div style={{ display: "flex", alignItems: "center", gap: "2rem", marginBottom: "4rem" }}>
        {db.map((team, index) => {
          const isSelected = index === selectedIndex;
          return (
            <div 
              key={team.id} 
              onClick={() => setSelectedIndex(index)}
              style={{ 
                cursor: "pointer", 
                opacity: isSelected ? 1 : 0.4,
                transform: isSelected ? "scale(1.5)" : "scale(1)",
                transition: "all 0.3s ease"
              }}
            >
              {/* For now, just a placeholder circle if no logo, or use text */}
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#333", display: "flex", alignItems: "center", justifyContent: "center", border: isSelected ? "2px solid white" : "none"
              }}>
                {team.nazwa.charAt(0)}
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={handleSelect}
        style={{ padding: "0.8rem 3rem", fontSize: "1.2rem", backgroundColor: "transparent", color: "white", border: "1px solid white", borderRadius: "20px", cursor: "pointer" }}
      >
        Wybierz
      </button>
    </div>
  );
}
