import "../styles/PitchWindow/css/pitch-window.css";
import personIcon from "../assets/user-icon.png";
import { useGame } from "../context/GameContext";

// Coordinates for your team (attacking upward → GK at bottom)
const POS_COORDS = {
  "BR": [{ top: "92%", left: "50%" }],
  "LO": [{ top: "75%", left: "15%" }],
  "PO": [{ top: "75%", left: "85%" }],
  "ŚO4": [{ top: "78%", left: "37%" }, { top: "78%", left: "63%" }],
  "ŚO3": [{ top: "78%", left: "27%" }, { top: "78%", left: "50%" }, { top: "78%", left: "73%" }],
  "CLL": [{ top: "62%", left: "12%" }],
  "CLP": [{ top: "62%", left: "88%" }],
  "DP":  [{ top: "62%", left: "50%" }, { top: "62%", left: "37%" }, { top: "62%", left: "63%" }],
  "ŚP":  [{ top: "52%", left: "37%" }, { top: "52%", left: "63%" }, { top: "52%", left: "50%" }],
  "OP":  [{ top: "42%", left: "50%" }, { top: "42%", left: "37%" }, { top: "42%", left: "63%" }],
  "LP":  [{ top: "48%", left: "14%" }],
  "PP":  [{ top: "48%", left: "86%" }],
  "LS":  [{ top: "32%", left: "22%" }],
  "PS":  [{ top: "32%", left: "78%" }],
  "N":   [{ top: "22%", left: "50%" }, { top: "22%", left: "37%" }, { top: "22%", left: "63%" }],
};

// Mirror coords for opponent (attacking downward → GK at top)
const OPP_COORDS = {
  "BR": [{ top: "8%", left: "50%" }],
  "LO": [{ top: "25%", left: "85%" }],
  "PO": [{ top: "25%", left: "15%" }],
  "ŚO4": [{ top: "22%", left: "63%" }, { top: "22%", left: "37%" }],
  "ŚO3": [{ top: "22%", left: "73%" }, { top: "22%", left: "50%" }, { top: "22%", left: "27%" }],
  "CLL": [{ top: "38%", left: "88%" }],
  "CLP": [{ top: "38%", left: "12%" }],
  "DP":  [{ top: "38%", left: "50%" }, { top: "38%", left: "63%" }, { top: "38%", left: "37%" }],
  "ŚP":  [{ top: "48%", left: "63%" }, { top: "48%", left: "37%" }, { top: "48%", left: "50%" }],
  "OP":  [{ top: "58%", left: "50%" }, { top: "58%", left: "63%" }, { top: "58%", left: "37%" }],
  "LP":  [{ top: "52%", left: "86%" }],
  "PP":  [{ top: "52%", left: "14%" }],
  "LS":  [{ top: "68%", left: "78%" }],
  "PS":  [{ top: "68%", left: "22%" }],
  "N":   [{ top: "78%", left: "50%" }, { top: "78%", left: "63%" }, { top: "78%", left: "37%" }],
};

function CssPitch() {
  return (
    <div className="css-pitch">
      <div className="css-pitch__outline" />
      <div className="css-pitch__center-line" />
      <div className="css-pitch__center-circle" />
      <div className="css-pitch__center-dot" />
      <div className="css-pitch__penalty-area css-pitch__penalty-area--top" />
      <div className="css-pitch__goal-area css-pitch__goal-area--top" />
      <div className="css-pitch__penalty-dot css-pitch__penalty-dot--top" />
      <div className="css-pitch__penalty-arc css-pitch__penalty-arc--top" />
      <div className="css-pitch__penalty-area css-pitch__penalty-area--bottom" />
      <div className="css-pitch__goal-area css-pitch__goal-area--bottom" />
      <div className="css-pitch__penalty-dot css-pitch__penalty-dot--bottom" />
      <div className="css-pitch__penalty-arc css-pitch__penalty-arc--bottom" />
    </div>
  );
}

function PlayerDot({ coords, label, isOpponent, photo }) {
  return (
    <div className="pitch-player" style={{ top: coords.top, left: coords.left }}>
      <div className={`pitch-player__circle ${isOpponent ? "pitch-player__circle--opp" : ""}`}>
        <img 
          src={photo} 
          alt="" 
          className="pitch-player__icon" 
          style={{
            filter: "none",
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

function PitchWindow({ view }) {
  const { currentTeam, opponentTeam, getPlayerPhoto } = useGame();

  if (!currentTeam) return null;

  const isOpponent = view === "opponent";
  const activeTeam = isOpponent ? (opponentTeam || currentTeam) : currentTeam;

  const formation = activeTeam.formacje?.find(f => f.nazwa === activeTeam.domyslna_formacja);
  const positions = formation ? formation.pozycje : [];
  const starters = activeTeam.zawodnicy?.filter(p => p.isStarting) || [];

  const coordsMap = isOpponent ? OPP_COORDS : POS_COORDS;

  const posCounts = {};

  return (
    <div className="pitch-area">
      <CssPitch />

      {positions.map((pos, index) => {
        const count = posCounts[pos] || 0;
        posCounts[pos] = count + 1;

        const coordsArray = coordsMap[pos];
        const coords = coordsArray && coordsArray[count] ? coordsArray[count] : { top: "50%", left: "50%" };

        const playersForPos = starters.filter(p => p.pozycja_glowna === pos);
        const player = playersForPos[count];
        
        let label = pos;
        let photoName = null;
        
        if (player) {
          label = player.imie_nazwisko.split(" ").pop();
          photoName = player.imie_nazwisko;
        }

        return (
          <PlayerDot
            key={index}
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

export default PitchWindow;
