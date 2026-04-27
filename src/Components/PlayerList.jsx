import { useState, useRef, useEffect } from "react";
import personIcon from "../assets/user-icon.png";
import "../styles/PlayerList/css/PlayerList.css";
import { useGame } from "../context/GameContext";
import PlayerModal from "./PlayerModal";

const STATUS_COLOR = {
  healthy: "#00FF00",
  minor: "#FFFF00",
  injured: "#FF0000",
  suspended: "#FF0000",
};

const STATUS_LABEL = {
  healthy: "W dobrej formie",
  minor: "Lekki uraz",
  injured: "Kontuzjowany",
  suspended: "Zawieszony",
};

function scoreColor(score) {
  if (score >= 8.5) return "#00FF00";
  if (score >= 7.5) return "#008000";
  if (score >= 6.5) return "#FFFF00";
  return "#FF0000";
}

const normalizePos = (pos) => {
  if (!pos) return "";
  return pos.replace(/[0-9]/g, '');
};

const POS_LABEL_MAP = {
  "BR": "Bramkarz",
  "ŚO": "Obrońca",
  "ŚO4": "Obrońca",
  "ŚO3": "Obrońca",
  "PO": "Obrońca",
  "LO": "Obrońca",
  "CLL": "Wahadłowy",
  "CLP": "Wahadłowy",
  "DP": "Pomocnik",
  "ŚP": "Pomocnik",
  "OP": "Pomocnik",
  "PP": "Skrzydłowy",
  "LP": "Skrzydłowy",
  "PS": "Skrzydłowy",
  "LS": "Skrzydłowy",
  "N": "Napastnik"
};

const STATUS_MAP = {
  "zdrowy": "healthy",
  "lekki_uraz": "minor",
  "kontuzja": "injured",
  "zawieszony": "suspended"
};

function PlayerRow({ player, getPlayerPhoto, onClick, showSubIcon, onSubClick, isHighlighted }) {
  const accentColor = STATUS_COLOR[player.status];
  const sc = scoreColor(player.score);
  const isHealthy = player.status === "healthy";

  return (
    <div className={`pl-row ${isHighlighted ? 'pl-row--highlighted' : ''}`} onClick={() => onClick(player.id)}>
      {/* left accent bar */}
      <span className="pl-row__accent" style={{ background: accentColor }} />

      {/* position */}
      <div className="pl-row__pos">
        <span className="pl-row__pos-code">{player.pos}</span>
        <span className="pl-row__pos-label">{player.posLabel}</span>
      </div>

      {/* nationality */}
      <span className="pl-row__nat" title={player.natCode}>
        {player.nat ? (
          <img 
            src={player.nat} 
            alt="flag" 
            style={{ 
              width: "24px", 
              height: "auto", 
              borderRadius: "2px",
              boxShadow: "0 0 2px rgba(0,0,0,0.5)"
            }} 
          />
        ) : (
          "🌍"
        )}
      </span>

      {/* heart */}
      <span
        className="pl-row__heart"
        style={{ color: isHealthy ? "#00FF00" : STATUS_COLOR[player.status] }}
        title={STATUS_LABEL[player.status]}
      >
        ♥
      </span>

      {/* avatar */}
      <div className="pl-row__avatar">
        <img 
          src={getPlayerPhoto(player.name)} 
          alt="gracz" 
          style={{
            filter: "none",
            objectFit: getPlayerPhoto(player.name).includes('user-icon') ? 'contain' : 'cover',
            width: getPlayerPhoto(player.name).includes('user-icon') ? '22px' : '100%',
            height: getPlayerPhoto(player.name).includes('user-icon') ? '22px' : '100%'
          }}
        />
      </div>

      {/* name */}
      <span className="pl-row__name">
        {player.name}
        {showSubIcon && (
          <span 
            className="pl-row__sub-icon" 
            onClick={(e) => {
              e.stopPropagation();
              onSubClick(player.id);
            }}
          >
            ▲
          </span>
        )}
      </span>

      {/* status label */}
      <span className="pl-row__status" style={{ color: accentColor }}>
        {STATUS_LABEL[player.status]}
      </span>

      {/* score */}
      <div className="pl-row__score-wrap">
        <span className="pl-row__score-label">Ocena</span>
        <span className="pl-row__score" style={{ color: sc }}>
          {player.score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlayerList({ team }) {
  const { currentTeam, getPlayerPhoto, substitutionFocusId, substitutionFocusPos, substitutePlayer } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const reserveRef = useRef(null);

  useEffect(() => {
    if (substitutionFocusId && reserveRef.current) {
      reserveRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [substitutionFocusId]);
  
  if (!team && !currentTeam) return null;

  const activeTeam = team || currentTeam;

  const selectedPlayer = activeTeam.zawodnicy?.find(p => p.id === selectedPlayerId);

  const mapPlayer = (p) => ({
    id: p.id,
    name: p.imie_nazwisko,
    nat: p.narodowosc,
    pos: normalizePos(p.pozycja_glowna),
    posLabel: POS_LABEL_MAP[normalizePos(p.pozycja_glowna)] || "Zawodnik",
    status: STATUS_MAP[p.stan_aktualny?.kontuzja] || "healthy",
    score: p.stan_aktualny?.forma_ostatnie_5_meczow || 6.0
  });

  // Fallback: if no players are marked as starting, take first 11
  let startersRaw = activeTeam.zawodnicy?.filter(p => p.isStarting) || [];
  if (startersRaw.length === 0 && activeTeam.zawodnicy?.length > 0) {
    startersRaw = activeTeam.zawodnicy.slice(0, 11);
  }

  const startingXi = startersRaw.map(mapPlayer);
  const reserveIds = new Set(startersRaw.map(p => p.id));
  const reserves = (activeTeam.zawodnicy || []).filter(p => !reserveIds.has(p.id)).map(mapPlayer);

  const handleSubAction = (reserveId) => {
    if (substitutionFocusId) {
      substitutePlayer(substitutionFocusId, reserveId);
    }
  };

  return (
    <div className="pl-wrap">
      <h2 className="pl-heading">Wyjściowy skład:</h2>
      <div className="pl-list">
        {startingXi.map((p) => (
          <PlayerRow 
            key={p.id} 
            player={p} 
            getPlayerPhoto={getPlayerPhoto} 
            onClick={setSelectedPlayerId} 
          />
        ))}
      </div>

      <h2 className="pl-heading pl-heading--reserve" ref={reserveRef}>Rezerwa:</h2>
      <div className="pl-list">
        {reserves.map((p) => {
          // Check compatibility based on the POSITION ON PITCH (substitutionFocusPos)
          const isCompatible = substitutionFocusPos && normalizePos(p.pos) === normalizePos(substitutionFocusPos);
          return (
            <PlayerRow 
              key={p.id} 
              player={p} 
              getPlayerPhoto={getPlayerPhoto} 
              onClick={setSelectedPlayerId} 
              showSubIcon={!!substitutionFocusId}
              onSubClick={handleSubAction}
              isHighlighted={isCompatible}
            />
          );
        })}
      </div>

      {selectedPlayer && (
        <PlayerModal 
          player={selectedPlayer} 
          team={activeTeam}
          onClose={() => setSelectedPlayerId(null)} 
        />
      )}
    </div>
  );
}
