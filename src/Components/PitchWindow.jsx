import { useState, useEffect, useRef } from "react";
import "../styles/PitchWindow/css/pitch-window.css";
import personIcon from "../assets/user-icon.png";
import { useGame, normalizePos } from "../context/GameContext";
import RoleModal from "./RoleModal";
import CustomDropdown from "./CustomDropdown";

// Coordinates for your team (attacking upward → GK at bottom)
const POS_COORDS = {
  "BR": [{ top: "86%", left: "50%" }],
  "LO": [{ top: "72%", left: "15%" }],
  "PO": [{ top: "72%", left: "85%" }],
  "ŚO4": [{ top: "75%", left: "37%" }, { top: "75%", left: "63%" }],
  "ŚO3": [{ top: "75%", left: "27%" }, { top: "75%", left: "50%" }, { top: "75%", left: "73%" }],
  "CLL": [{ top: "62%", left: "12%" }],
  "CLP": [{ top: "62%", left: "88%" }],
  "DP":  [{ top: "60%", left: "50%" }, { top: "60%", left: "37%" }, { top: "60%", left: "63%" }],
  "ŚP":  [{ top: "50%", left: "37%" }, { top: "50%", left: "63%" }, { top: "50%", left: "50%" }],
  "OP":  [{ top: "40%", left: "50%" }, { top: "40%", left: "37%" }, { top: "40%", left: "63%" }],
  "LP":  [{ top: "48%", left: "14%" }],
  "PP":  [{ top: "48%", left: "86%" }],
  "LS":  [{ top: "32%", left: "22%" }],
  "PS":  [{ top: "32%", left: "78%" }],
  "N":   [{ top: "22%", left: "50%" }, { top: "22%", left: "37%" }, { top: "22%", left: "63%" }],
};

// Mirror coords for opponent (attacking downward → GK at top)
const OPP_COORDS = {
  "BR": [{ top: "14%", left: "50%" }],
  "LO": [{ top: "28%", left: "85%" }],
  "PO": [{ top: "28%", left: "15%" }],
  "ŚO4": [{ top: "25%", left: "63%" }, { top: "25%", left: "37%" }],
  "ŚO3": [{ top: "25%", left: "73%" }, { top: "25%", left: "50%" }, { top: "25%", left: "27%" }],
  "CLL": [{ top: "38%", left: "88%" }],
  "CLP": [{ top: "38%", left: "12%" }],
  "DP":  [{ top: "40%", left: "50%" }, { top: "40%", left: "63%" }, { top: "40%", left: "37%" }],
  "ŚP":  [{ top: "50%", left: "63%" }, { top: "50%", left: "37%" }, { top: "50%", left: "50%" }],
  "OP":  [{ top: "60%", left: "50%" }, { top: "60%", left: "63%" }, { top: "60%", left: "37%" }],
  "LP":  [{ top: "52%", left: "86%" }],
  "PP":  [{ top: "52%", left: "14%" }],
  "LS":  [{ top: "68%", left: "78%" }],
  "PS":  [{ top: "68%", left: "22%" }],
  "N":   [{ top: "78%", left: "50%" }, { top: "78%", left: "63%" }, { top: "78%", left: "37%" }],
};

function PlayerDot({ 
  player, coords, label, isOpponent, photo, onSubClick, onRoleClick, isSelected, pos,
  index, onDragStart, onDragOver, onDrop 
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [isJustSwapped, setIsJustSwapped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const prevPlayerIdRef = useRef(player?.id);

  useEffect(() => {
    if (player?.id && prevPlayerIdRef.current && player.id !== prevPlayerIdRef.current) {
        setIsJustSwapped(true);
        setTimeout(() => setIsJustSwapped(false), 1500);
    }
    prevPlayerIdRef.current = player?.id;
  }, [player?.id]);

  const handleMouseEnter = () => { if (!isOpponent) { setIsHovered(true); setShowArrow(true); } };
  const handleMouseLeave = () => { setIsHovered(false); setTimeout(() => setShowArrow(false), 300); };

  const handleDragStart = (e) => {
    if (isOpponent || !player) return;
    setIsDragging(true);
    onDragStart(index);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnd = () => setIsDragging(false);

  return (
    <div 
      className={`pitch-player ${isSelected ? 'pitch-player--selected' : ''} ${isJustSwapped ? 'pitch-player--just-swapped' : ''} ${isDragging ? 'pitch-player--dragging' : ''}`} 
      style={{ top: coords.top, left: coords.left }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => !isOpponent && player && onRoleClick(player, pos)}
      draggable={!isOpponent && !!player}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      {!isOpponent && (isHovered || showArrow) && (
        <div className="pitch-player__sub-arrow" onClick={(e) => { e.stopPropagation(); onSubClick(player.id); }}>▼</div>
      )}
      <div className={`pitch-player__circle ${isOpponent ? "pitch-player__circle--opp" : ""}`}>
        <img 
          src={photo} 
          alt="" 
          className="pitch-player__icon" 
          style={{
            filter: photo.includes('user-icon') ? "invert(1)" : "none",
            borderRadius: photo.includes('user-icon') ? '0' : '50%',
            objectFit: photo.includes('user-icon') ? 'contain' : 'cover',
            width: photo.includes('user-icon') ? '20px' : '100%',
            height: photo.includes('user-icon') ? '20px' : '100%'
          }}
        />
      </div>
      <span className="pitch-player__label">{label}</span>
    </div>
  );
}

const MENTALITY_OFFSETS = {
  "Bardzo defensywna": 8, "Defensywna": 5, "Ostrożna": 2, "Wyważona": 0, "Pozytywna": -2, "Ofensywna": -5, "Bardzo ofensywna": -8
};

export default function PitchWindow({ team, isOpponent }) {
  const { 
    getPlayerPhoto, getClubLogo, updateFormation, updateOpponentFormation, 
    updateMentality, updateOpponentMentality, currentTeam, opponentTeam,
    substitutionFocusId, setSubstitutionFocusId, setSubstitutionFocusPos, setActiveTab,
    swapPlayersPositions
  } = useGame();

  const [selectedRoleContext, setSelectedRoleContext] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleRoleClick = (player, position) => setSelectedRoleContext({ playerId: player.id, position });

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index === draggedIndex) return;
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
        swapPlayersPositions(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  if (!team && !currentTeam) return null;
  const activeTeam = isOpponent ? (opponentTeam || team) : (team || currentTeam);

  const currentFormationName = activeTeam.domyslna_formacja || (activeTeam.formacje && activeTeam.formacje[0]?.nazwa);
  const positions = activeTeam.formacje?.find(f => f.nazwa === currentFormationName)?.pozycje || activeTeam.formacje?.[0]?.pozycje || [];
  
  // STABILNA LOGIKA PRZYPISANIA
  let assignedPlayers = activeTeam.assignedStarters || [];
  
  if (assignedPlayers.length === 0) {
      const starters = activeTeam.zawodnicy?.filter(p => p.isStarting) || [];
      const availableStarters = [...starters];
      assignedPlayers = new Array(positions.length).fill(null);
      
      positions.forEach((pos, idx) => {
          if (availableStarters.length > 0) {
              const pIdx = availableStarters.findIndex(p => normalizePos(p.pozycja_glowna) === normalizePos(pos));
              const finalIdx = pIdx !== -1 ? pIdx : 0;
              assignedPlayers[idx] = availableStarters[finalIdx];
              availableStarters.splice(finalIdx, 1);
          }
      });
  }

  const coordsMap = isOpponent ? OPP_COORDS : POS_COORDS;
  const posCounts = {};
  const logoSrc = getClubLogo(activeTeam.logo, activeTeam.nazwa);

  const handleSubClick = (id, pos) => {
    setSubstitutionFocusId(id);
    setSubstitutionFocusPos(pos);
    setActiveTab("Zawodnicy");
  };

  const currentMentality = activeTeam.mentalnosc || "Wyważona";
  const mentalityOptions = ["Bardzo defensywna", "Defensywna", "Ostrożna", "Wyważona", "Pozytywna", "Ofensywna", "Bardzo ofensywna"];
  const mentalityShift = MENTALITY_OFFSETS[currentMentality] || 0;

  return (
    <div className="pitch-area" key={`${activeTeam.id}-${isOpponent ? 'opp' : 'team'}`}>
      <div className="css-pitch" onClick={() => setSelectedRoleContext(null)}>
        <div className="css-pitch__outline" />
        <div className="css-pitch__center-line" />
        <div className="css-pitch__center-circle" />
        <div className="css-pitch__center-dot" />
        <div className="css-pitch__arc-new css-pitch__arc-new--top" />
        <div className="css-pitch__arc-new css-pitch__arc-new--bottom" />
        <div className="css-pitch__penalty-area css-pitch__penalty-area--top" />
        <div className="css-pitch__goal-area css-pitch__goal-area--top" />
        <div className="css-pitch__penalty-dot css-pitch__penalty-dot--top" />
        <div className="css-pitch__penalty-area css-pitch__penalty-area--bottom" />
        <div className="css-pitch__goal-area css-pitch__goal-area--bottom" />
        <div className="css-pitch__penalty-dot css-pitch__penalty-dot--bottom" />
      </div>

      <div className="pitch-selectors-wrapper">
        <CustomDropdown label="MENTALNOŚĆ" options={mentalityOptions} value={currentMentality} onChange={(v) => isOpponent ? updateOpponentMentality(v) : updateMentality(v)} />
        <CustomDropdown label="FORMACJA" options={activeTeam.formacje?.map(f => f.nazwa) || []} value={currentFormationName} onChange={(v) => isOpponent ? updateOpponentFormation(v) : updateFormation(v)} />
      </div>
      
      {logoSrc && <div className="pitch-watermark-layer"><img src={logoSrc} alt="" className="pitch-watermark-img" /></div>}

      {positions.map((pos, index) => {
        const count = posCounts[pos] || 0;
        posCounts[pos] = count + 1;
        const coordsArray = coordsMap[pos];
        const baseCoords = coordsArray && coordsArray[count] ? coordsArray[count] : { top: "50%", left: "50%" };
        let adjustedTop = parseFloat(baseCoords.top);
        if (pos !== "BR") {
          const actualShift = isOpponent ? -mentalityShift : mentalityShift;
          adjustedTop += actualShift;
          adjustedTop = Math.max(10, Math.min(90, adjustedTop));
        }
        const coords = { ...baseCoords, top: `${adjustedTop}%` };
        const player = assignedPlayers[index];
        let label = player ? player.imie_nazwisko.split(" ").pop() : normalizePos(pos);

        return (
          <PlayerDot
            key={`${index}-${player?.id || 'empty'}`}
            player={player}
            coords={coords}
            label={label}
            isOpponent={isOpponent}
            photo={getPlayerPhoto(player?.imie_nazwisko)}
            onSubClick={(id) => handleSubClick(id, pos)}
            onRoleClick={handleRoleClick}
            isSelected={player?.id === substitutionFocusId}
            pos={pos}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        );
      })}

      {selectedRoleContext && (
        <RoleModal 
          player={activeTeam.zawodnicy?.find(p => p.id === selectedRoleContext.playerId)} 
          position={selectedRoleContext.position}
          onClose={() => setSelectedRoleContext(null)} 
        />
      )}
    </div>
  );
}
