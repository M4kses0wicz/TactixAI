import { useState, useEffect, useRef } from "react";
import "../styles/PitchWindow/css/pitch-window.css";
import personIcon from "../assets/user-icon.png";
import { useGame, normalizePos } from "../context/GameContext";
import RoleModal from "./RoleModal";
import CustomDropdown from "./CustomDropdown";
import PlayerModal from "./PlayerModal";
import OpponentInstructionsModal from "./OpponentInstructionsModal";

// Coordinates for your team (attacking upward → GK at bottom)
const POS_COORDS = {
  "BR": [{ top: "90%", left: "50%" }],
  "LO": [{ top: "72%", left: "15%" }],
  "PO": [{ top: "72%", left: "85%" }],
  "ŚO4": [{ top: "75%", left: "37%" }, { top: "75%", left: "63%" }],
  "ŚO3": [{ top: "75%", left: "27%" }, { top: "75%", left: "73%" }, { top: "75%", left: "50%" }],
  "CLL": [{ top: "62%", left: "12%" }],
  "CLP": [{ top: "62%", left: "88%" }],
  "DP":  [{ top: "60%", left: "37%" }, { top: "60%", left: "63%" }, { top: "60%", left: "50%" }],
  "ŚP":  [{ top: "50%", left: "37%" }, { top: "50%", left: "63%" }, { top: "50%", left: "50%" }],
  "OP":  [{ top: "40%", left: "37%" }, { top: "40%", left: "63%" }, { top: "40%", left: "50%" }],
  "LP":  [{ top: "48%", left: "14%" }],
  "PP":  [{ top: "48%", left: "86%" }],
  "LS":  [{ top: "32%", left: "22%" }],
  "PS":  [{ top: "32%", left: "78%" }],
  "N":   [{ top: "22%", left: "37%" }, { top: "22%", left: "63%" }, { top: "22%", left: "50%" }],
};

function PlayerDot({ 
  player, coords, label, isOpponent, photo, onSubClick, onRoleClick, onPlayerClick, isSelected, pos,
  index, onDragStart, onDragOver, onDragLeave, onDrop, isDragOver 
}) {
  const { aiHighlights } = useGame();
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

  // Hover handled via CSS for stability

  const handleDragStart = (e) => {
    if (isOpponent || !player) return;
    setIsDragging(true);
    onDragStart(index, player.id);
    e.dataTransfer.setData("playerId", player.id);
    e.dataTransfer.setData("isStarter", "true");
    e.dataTransfer.setData("isReserve", "false");
    
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnd = () => setIsDragging(false);

    const isAiHighlighted = aiHighlights.some(h => {
      const hl = h?.toLowerCase?.()?.trim?.() || "";
      const pName = player?.imie_nazwisko?.toLowerCase?.()?.trim?.() || "";
      const r1 = player?.wybrane_role?.przy_pilce?.toLowerCase?.()?.trim?.() || "";
      const r2 = player?.wybrane_role?.bez_pilki?.toLowerCase?.()?.trim?.() || "";
      
      if (!hl) return false;

      // Sprawdzamy czy to ten zawodnik
      const isThisPlayer = pName && (hl.includes(pName) || pName.includes(hl));
      if (!isThisPlayer) return false;

      // Sprawdzamy czy AI sugeruje konkretną rolę w całej liście highlightów
      const suggestedRoles = aiHighlights.filter(hr => {
          const lowerH = hr.toLowerCase();
          return lowerH !== pName && !lowerH.includes("-") && lowerH.length > 3;
      });

      if (suggestedRoles.length > 0) {
          // Jeśli są sugerowane role, sprawdź czy gracz ma każdą z nich w przynajmniej jednym slocie
          const unmetSuggestions = suggestedRoles.filter(sr => {
              const srl = sr.toLowerCase();
              const hasInR1 = r1 && (r1.includes(srl) || srl.includes(r1));
              const hasInR2 = r2 && (r2.includes(srl) || srl.includes(r2));
              return !hasInR1 && !hasInR2;
          });
          return unmetSuggestions.length > 0;
      }
      
      return true;
    });

    return (
      <div 
        className={`pitch-player ${isSelected ? 'pitch-player--selected' : ''} ${isJustSwapped ? 'pitch-player--just-swapped' : ''} ${isDragging ? 'pitch-player--dragging' : ''} ${isDragOver ? 'pitch-player--drag-over' : ''} ${isAiHighlighted ? 'ai-highlight' : ''}`} 
      style={{ top: coords.top, left: coords.left }}
      draggable={!isOpponent && !!player}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => !isOpponent && onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => !isOpponent && onDrop(e, index)}
    >
      {!isOpponent && (
        <div 
          className="pitch-player__sub-arrow" 
          onClick={(e) => { e.stopPropagation(); onSubClick(player.id); }}
        >
          <span className="material-symbols-outlined">swap_vertical_circle</span>
        </div>
      )}
      <div 
        className={`pitch-player__circle ${isOpponent ? "pitch-player__circle--opp" : ""}`}
        onClick={(e) => { e.stopPropagation(); !isOpponent && player && onRoleClick(player, pos); }}
      >
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
      <span 
        className="pitch-player__label"
        onClick={(e) => { e.stopPropagation(); player && onPlayerClick(player); }}
      >
        {label}
      </span>
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
    substitutePlayer, swapPlayersPositions, aiHighlights, removeAiHighlight
  } = useGame();

  const [selectedRoleContext, setSelectedRoleContext] = useState(null);
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleRoleClick = (player, position) => setSelectedRoleContext({ playerId: player.id, position });

  const handleDragStart = (index, playerId) => setDraggedIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
    if (index === draggedIndex) return;
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);
    const draggedPlayerIdStr = e.dataTransfer.getData("playerId");
    const isReserve = e.dataTransfer.getData("isReserve") === "true";

    if (isReserve && draggedPlayerIdStr) {
        const targetPlayer = assignedPlayers[index];
        if (targetPlayer) {
            substitutePlayer(targetPlayer.id, parseInt(draggedPlayerIdStr));
        }
    } else if (draggedIndex !== null && draggedIndex !== index) {
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

  const coordsMap = POS_COORDS;
  const posCounts = {};
  const logoSrc = getClubLogo(activeTeam.logo, activeTeam.nazwa);

  const handleSubClick = (id, pos) => {
    if (substitutionFocusId === id) {
      setSubstitutionFocusId(null);
      setSubstitutionFocusPos(null);
    } else {
      setSubstitutionFocusId(id);
      setSubstitutionFocusPos(pos);
      setActiveTab("Zawodnicy");
    }
  };

  const currentMentality = activeTeam.mentalnosc || "Wyważona";
  const mentalityOptions = ["Bardzo defensywna", "Defensywna", "Ostrożna", "Wyważona", "Pozytywna", "Ofensywna", "Bardzo ofensywna"];
  const mentalityShift = MENTALITY_OFFSETS[currentMentality] || 0;

  return (
    <div 
      className="pitch-area" 
      key={`${activeTeam.id}-${isOpponent ? 'opp' : 'team'}`}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="css-pitch" onClick={() => {
        setSelectedRoleContext(null);
        setSubstitutionFocusId(null);
        setSubstitutionFocusPos(null);
      }}>
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
        // Smart coordinate selection based on total count of this position
        const totalInGroup = positions.filter(p => p === pos).length;
        const count = posCounts[pos] || 0;
        posCounts[pos] = count + 1;
        
        const coordsArray = coordsMap[pos];
        let baseCoords = { top: "50%", left: "50%" };

        if (coordsArray) {
          if (totalInGroup === 1) {
            // If only 1, try to find a central coord (usually index 0 or 1 in my new arrays)
            baseCoords = coordsArray.find(c => c.left === "50%") || coordsArray[0];
          } else if (totalInGroup === 2) {
            // If 2, pick the ones that are NOT central (if possible)
            const nonCentral = coordsArray.filter(c => c.left !== "50%");
            baseCoords = nonCentral[count] || coordsArray[count];
          } else {
            // Fallback for 3+ or other
            baseCoords = coordsArray[count] || coordsArray[0];
          }
        }
        let adjustedTop = parseFloat(baseCoords.top);
        if (pos !== "BR") {
          adjustedTop += mentalityShift;
          // Clamp defenders to not overlap with GK (at 90%)
          const maxTop = (pos.includes("ŚO") || pos.includes("O")) ? 82 : 90;
          adjustedTop = Math.max(10, Math.min(maxTop, adjustedTop));
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
            onPlayerClick={setSelectedPlayerForModal}
            isSelected={player?.id === substitutionFocusId}
            pos={pos}
            index={index}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDragOver={dragOverIndex === index && !isOpponent}
          />
        );
      })}

      {selectedRoleContext && (
        <RoleModal 
          player={activeTeam.zawodnicy?.find(p => p.id === selectedRoleContext.playerId)} 
          position={selectedRoleContext.position}
          isOpponent={isOpponent}
          onClose={() => setSelectedRoleContext(null)} 
        />
      )}

      {selectedPlayerForModal && !isOpponent && (
        <PlayerModal 
          player={selectedPlayerForModal} 
          team={activeTeam}
          onClose={() => setSelectedPlayerForModal(null)} 
        />
      )}

      {selectedPlayerForModal && isOpponent && (
        <OpponentInstructionsModal
          player={selectedPlayerForModal}
          onClose={() => setSelectedPlayerForModal(null)}
        />
      )}
    </div>
  );
}
