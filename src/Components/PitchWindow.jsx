import "../styles/PitchWindow/css/pitch-window.css";
import personIcon from "../assets/user-icon.png";
import { useGame } from "../context/GameContext";

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



function PlayerDot({ coords, label, isOpponent, photo }) {
  return (
    <div className="pitch-player" style={{ top: coords.top, left: coords.left }}>
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

import CustomDropdown from "./CustomDropdown";

const MENTALITY_OFFSETS = {
  "Bardzo defensywna": 8,
  "Defensywna": 5,
  "Ostrożna": 2,
  "Wyważona": 0,
  "Pozytywna": -2,
  "Ofensywna": -5,
  "Bardzo ofensywna": -8
};

export default function PitchWindow({ team, isOpponent }) {
  const { 
    getPlayerPhoto, 
    getClubLogo, 
    updateFormation, 
    updateOpponentFormation, 
    updateMentality, 
    updateOpponentMentality, 
    currentTeam 
  } = useGame();

  if (!team && !currentTeam) return null;
  const activeTeam = team || currentTeam;

  const currentFormationName = activeTeam.domyslna_formacja || (activeTeam.formacje && activeTeam.formacje[0]?.nazwa);
  const formationOptions = activeTeam.formacje?.map(f => f.nazwa) || [];
  const positions = activeTeam.formacje?.find(f => f.nazwa === currentFormationName)?.pozycje || activeTeam.formacje?.[0]?.pozycje || [];
  
  // Fallback: if no players are marked as starting, take first 11
  let starters = activeTeam.zawodnicy?.filter(p => p.isStarting) || [];
  if (starters.length === 0 && activeTeam.zawodnicy?.length > 0) {
    starters = activeTeam.zawodnicy.slice(0, 11);
  }

  const coordsMap = isOpponent ? OPP_COORDS : POS_COORDS;
  const posCounts = {};
  const logoSrc = getClubLogo(activeTeam.logo, activeTeam.nazwa);

  const handleFormationChange = (val) => {
    if (isOpponent) {
      updateOpponentFormation(val);
    } else {
      updateFormation(val);
    }
  };

  const handleMentalityChange = (val) => {
    if (isOpponent) {
      updateOpponentMentality(val);
    } else {
      updateMentality(val);
    }
  };

  const currentMentality = activeTeam.mentalnosc || "Wyważona";
  const mentalityOptions = [
    "Bardzo defensywna",
    "Defensywna",
    "Ostrożna",
    "Wyważona",
    "Pozytywna",
    "Ofensywna",
    "Bardzo ofensywna"
  ];

  const mentalityShift = MENTALITY_OFFSETS[currentMentality] || 0;

  return (
      <div className="pitch-area" key={`${activeTeam.id}-${isOpponent ? 'opp' : 'team'}`}>
      <div className="css-pitch">
        <div className="css-pitch__outline" />
        <div className="css-pitch__center-line" />
        <div className="css-pitch__center-circle" />
        <div className="css-pitch__center-dot" />
        
        {/* Arcs first - so they stay BEHIND areas */}
        <div className="css-pitch__arc-new css-pitch__arc-new--top" />
        <div className="css-pitch__arc-new css-pitch__arc-new--bottom" />

        <div className="css-pitch__penalty-area css-pitch__penalty-area--top" />
        <div className="css-pitch__goal-area css-pitch__goal-area--top" />
        <div className="css-pitch__penalty-dot css-pitch__penalty-dot--top" />
        
        <div className="css-pitch__penalty-area css-pitch__penalty-area--bottom" />
        <div className="css-pitch__goal-area css-pitch__goal-area--bottom" />
        <div className="css-pitch__penalty-dot css-pitch__penalty-dot--bottom" />
      </div>

      {/* Selectors Wrapper */}
      <div className="pitch-selectors-wrapper">
        <CustomDropdown 
          label="MENTALNOŚĆ"
          options={mentalityOptions}
          value={currentMentality}
          onChange={handleMentalityChange}
        />

        <CustomDropdown 
          label="FORMACJA"
          options={formationOptions}
          value={currentFormationName}
          onChange={handleFormationChange}
        />
      </div>
      
      {/* Separate background layer for the logo */}
      {logoSrc && (
        <div className="pitch-watermark-layer">
          <img 
            src={logoSrc}
            alt=""
            className="pitch-watermark-img" 
          />
        </div>
      )}

      {positions.map((pos, index) => {
        const count = posCounts[pos] || 0;
        posCounts[pos] = count + 1;

        const coordsArray = coordsMap[pos];
        const baseCoords = coordsArray && coordsArray[count] ? coordsArray[count] : { top: "50%", left: "50%" };

        // Apply mentality shift
        let adjustedTop = parseFloat(baseCoords.top);
        if (pos !== "BR") {
          // Team: positive shift moves down (defensive), negative moves up (offensive)
          // Opponent: positive shift moves up (defensive), negative moves down (offensive)
          const actualShift = isOpponent ? -mentalityShift : mentalityShift;
          adjustedTop += actualShift;
          
          // Clamp to stay within pitch boundaries (8% to 92%)
          adjustedTop = Math.max(10, Math.min(90, adjustedTop));
        }

        const coords = { ...baseCoords, top: `${adjustedTop}%` };

        // 1. Try to find player with matching position
        const playersForPos = starters.filter(p => p.pozycja_glowna === pos);
        let player = playersForPos[count];
        
        // 2. Fallback: if not found by position, take from the starters pool by index
        if (!player) {
          player = starters[index];
        }
        
        let label = pos;
        let photoName = null;
        
        if (player) {
          label = player.imie_nazwisko.split(" ").pop();
          photoName = player.imie_nazwisko;
        }

        return (
          <PlayerDot
            key={`${index}-${player?.id || 'empty'}`}
            coords={coords}
            label={label}
            isOpponent={isOpponent}
            photo={getPlayerPhoto(photoName)}
          />
        );
      })}
    </div>
  );
}
