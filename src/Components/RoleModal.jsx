import React from "react";
import "../styles/RoleModal/css/RoleModal.css";
import { useGame, normalizePos, DEFAULT_ROLES } from "../context/GameContext";

const POS_FULL_NAMES = {
  "BR": "Bramkarz",
  "ŚO": "Środkowy Obrońca",
  "PO": "Obrońca (Prawy)",
  "LO": "Obrońca (Lewy)",
  "DP": "Defensywny pomocnik",
  "ŚP": "Pomocnik (Środek)",
  "OP": "Ofensywny pomocnik (Środek)",
  "PS": "Skrzydłowy (Prawy)",
  "LS": "Skrzydłowy (Lewy)",
  "N": "Wysunięty napastnik (Środek)"
};

export default function RoleModal({ player, position, onClose }) {
  const { getPlayerPhoto, updatePlayerRole } = useGame();
  const [currentType, setCurrentType] = React.useState('przy_pilce');

  if (!player) return null;

  // Precyzyjne określenie pozycji (np. ŚO3, ŚO4)
  const posKey = position; 
  const fullPosName = POS_FULL_NAMES[normalizePos(posKey)] || posKey;
  
  const getRolesForPos = (type) => {
    // ŚCISŁA LISTA RÓL - TYLKO TO CO PODAŁ UŻYTKOWNIK
    const fallback = DEFAULT_ROLES[posKey] || DEFAULT_ROLES[normalizePos(posKey)];
    
    if (fallback) {
        const list = type === 'przy_pilce' ? fallback.przy : fallback.bez;
        return [...list].sort();
    }

    return [];
  };

  const possessionRoles = getRolesForPos('przy_pilce');
  const defensiveRoles = getRolesForPos('bez_pilki');
  
  // OSTATECZNY PRIORYTET: 1. Wybrane role z bazy, 2. Pierwsza z listy, 3. "Brak"
  const currentPrzyPilce = player.wybrane_role?.przy_pilce || possessionRoles[0] || "Brak";
  const currentBezPilki = player.wybrane_role?.bez_pilki || defensiveRoles[0] || "Brak";

  // Mock instructions based on role name
  const getInstructions = (role) => {
    if (role.includes("Grajacy") || role.includes("rozgrywajacy")) return [
      { icon: "✦", text: "Swobodnie" },
      { icon: "○", text: "Utrzymuje pozycje" }
    ];
    if (role.includes("Blokujacy") || role.includes("Obrona")) return [
      { icon: "⌅", text: "Wychodzi wyzej" },
      { icon: "🛡️", text: "Ostrozny" }
    ];
    if (role.includes("napastnik") || role.includes("Atak")) return [
      { icon: "⌅", text: "Wychodzi wyzej" },
      { icon: "✦", text: "Asertywny" }
    ];
    return [
      { icon: "○", text: "Utrzymuje pozycje" },
      { icon: "✦", text: "Zrównoważony" }
    ];
  };

  const renderStars = (role) => {
    const isNative = player.przydatnosc_do_roli_przy_pilce?.includes(role) || 
                     player.przydatnosc_do_roli_bez_pilki?.includes(role);
    
    const seed = role.length + player.imie_nazwisko.length;
    const baseStars = isNative ? 4 : 3;
    const extra = (seed % 2 === 0) ? 1 : 0.5;
    const count = Math.min(5, baseStars + extra);
    
    const fullStars = Math.floor(count);
    const hasHalf = count % 1 !== 0;
    
    return (
      <div className="rm-stars-row">
        {[...Array(fullStars)].map((_, i) => <span key={`f-${i}`} style={{color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.5)'}}>★</span>)}
        {hasHalf && <span style={{color: '#ffffff', fontSize: '0.8em', position: 'relative', top: '-1px'}}>½</span>}
        {[...Array(5 - Math.ceil(count))].map((_, i) => <span key={`e-${i}`} style={{color: 'rgba(255,255,255,0.05)'}}>★</span>)}
      </div>
    );
  };

  const renderRoleCard = (role, type, current) => {
    const isActive = current === role;
    const instructions = getInstructions(role);

    return (
      <div 
        key={role} 
        className={`rm-role-card ${isActive ? 'rm-role-card--active' : ''}`}
        onClick={() => updatePlayerRole(player.id, type, role)}
      >
        <div className="rm-role-check" />
        <div className="rm-role-main">
          <span className="rm-role-name">{role}</span>
          <div className="rm-role-footer">
            <div className="rm-role-instruction">
                {instructions[0]?.icon} {instructions[0]?.text}
            </div>
            <div className="rm-role-stars">{renderStars(role)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-window" onClick={(e) => e.stopPropagation()}>
        <button className="rm-close" onClick={onClose}>×</button>
        
        <div className="rm-header">
          <div className="rm-avatar-outer">
            <div className="rm-avatar-wrap">
                <img src={getPlayerPhoto(player.imie_nazwisko)} alt="" className="rm-avatar" />
            </div>
          </div>
          <div className="rm-header-text">
            <div className="rm-pos-title">{fullPosName}</div>
            <h2 className="rm-name">{player.imie_nazwisko}</h2>
          </div>
        </div>

        <div className="rm-tabs-container">
            <div className="rm-tabs">
                <button className={`rm-tab ${currentType === 'przy_pilce' ? 'rm-tab--active' : ''}`} onClick={() => setCurrentType('przy_pilce')}>
                    ⚽ Przy piłce
                </button>
                <button className={`rm-tab ${currentType === 'bez_pilki' ? 'rm-tab--active' : ''}`} onClick={() => setCurrentType('bez_pilki')}>
                    🛡️ Bez piłki
                </button>
            </div>
        </div>

        <div className="rm-content">
          <div className="rm-role-grid">
            {(currentType === 'przy_pilce' ? possessionRoles : defensiveRoles).map(role => renderRoleCard(role, currentType, currentType === 'przy_pilce' ? currentPrzyPilce : currentBezPilki))}
          </div>
        </div>

        <div className="rm-footer">
          <button className="rm-done-btn" onClick={onClose}>Zatwierdź</button>
        </div>
      </div>
    </div>
  );
};
