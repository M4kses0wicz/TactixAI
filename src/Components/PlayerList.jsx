import { useState, useRef, useEffect } from "react";
import personIcon from "../assets/user-icon.png";
import "../styles/PlayerList/css/PlayerList.css";
import { useGame } from "../context/GameContext";
import PlayerModal from "./PlayerModal";
import OpponentInstructionsModal from "./OpponentInstructionsModal";
import PlayerCreatorModal from "./PlayerCreatorModal";

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

function PlayerRow({
  id, player, getPlayerPhoto, onClick, showSubIcon, onSubClick, isHighlighted, isExactMatch,
  onDragStart, onDragOver, onDragLeave, onDrop, isStarter, isOpponent
}) {
  const accentColor = STATUS_COLOR[player.status];
  const sc = scoreColor(player.score);
  const isHealthy = player.status === "healthy";

  const { aiHighlights } = useGame();
  const isAiHighlighted = aiHighlights.some(h => h.toLowerCase() === player.name?.toLowerCase());

  return (
    <div
      id={id}
      className={`pl-row ${isHighlighted ? 'pl-row--highlighted' : ''} ${isAiHighlighted ? 'ai-highlight' : ''}`}
      onClick={() => {
        onClick(player.id);
        removeAiHighlight(player.name);
      }}
      draggable={!isOpponent}
      onDragStart={(e) => !isOpponent && onDragStart(e, player.id, isStarter)}
      onDragOver={(e) => !isOpponent && onDragOver(e)}
      onDragLeave={() => !isOpponent && onDragLeave()}
      onDrop={(e) => !isOpponent && onDrop(e, player.id, isStarter)}
    >
      {/* left accent bar */}
      <span className="pl-row__accent" style={{ background: accentColor }} />

      {/* position */}
      <div className={`pl-row__pos ${isExactMatch ? 'pl-row__pos--exact' : ''}`}>
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
        {isOpponent && player.hasInstructions && (
          <span className="material-symbols-outlined pl-row__instruction-icon" title="Ustawiono instrukcje krycia">
            my_location
          </span>
        )}
        {showSubIcon && !isOpponent && (
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
export default function PlayerList({ team, isOpponent }) {
  const { currentTeam, opponentTeam, setCurrentTeam, setOpponentTeam, getPlayerPhoto, getFlagUrl, substitutionFocusId, substitutionFocusPos, setSubstitutionFocusId, setSubstitutionFocusPos, substitutePlayer } = useGame();
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const reserveRef = useRef(null);

  const handleAddPlayer = (playerData) => {
    const vals = playerData.atrybuty ? Object.values(playerData.atrybuty) : [];
    const ovr = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 50;

    const newPlayer = {
      id: Date.now(),
      imie_nazwisko: playerData.imie_nazwisko,
      pozycja_glowna: playerData.pozycja_glowna,
      lepsza_noga: playerData.lepsza_noga,
      narodowosc: playerData.narodowosc || "Polska",
      wiek: playerData.wiek,
      wzrost: playerData.wzrost,
      waga: playerData.waga,
      numer_na_koszulce: playerData.numer_na_koszulce,
      isStarting: false,
      stan_aktualny: { kontuzja: "brak", forma_ostatnie_5_meczow: 6.5, kondycja: 100, morale: "Dobry" },
      atrybuty: playerData.atrybuty || {},
      wybrane_role: { przy_pilce: "", bez_pilki: "" },
      instrukcje_krycia: { scisle_krycie: "Standardowo", nacisk: "Standardowo", odbior: "Standardowo", wymuszanie_nogi: "Brak" },
      _ovr: ovr,
    };

    if (isOpponent) {
      setOpponentTeam(prev => ({
        ...prev,
        zawodnicy: [...(prev.zawodnicy || []), newPlayer]
      }));
    } else {
      setCurrentTeam(prev => ({
        ...prev,
        zawodnicy: [...(prev.zawodnicy || []), newPlayer]
      }));
    }
  };

  const handleSubAction = (reserveId) => {
    if (substitutionFocusId) {
      substitutePlayer(substitutionFocusId, reserveId);
    }
  };

  useEffect(() => {
    if (substitutionFocusId) {
      // Find the first compatible substitute
      const firstCompatible = reserves.find(p => normalizePos(p.pos) === normalizePos(substitutionFocusPos));
      if (firstCompatible) {
        const element = document.getElementById(`player-row-${firstCompatible.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (reserveRef.current) {
        reserveRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [substitutionFocusId, substitutionFocusPos]);

  if (!team && !currentTeam) return null;

  const activeTeam = team || currentTeam;

  const selectedPlayer = activeTeam.zawodnicy?.find(p => p.id === selectedPlayerId);

  const mapPlayer = (p) => {
    const inst = p.instrukcje_krycia || {};
    const hasInstructions = inst.scisle_krycie !== "Standardowo" ||
      inst.nacisk !== "Standardowo" ||
      inst.odbior !== "Standardowo" ||
      inst.wymuszanie_nogi !== "Brak";
    return {
      id: p.id,
      name: p.imie_nazwisko,
      nat: getFlagUrl(p.narodowosc),
      natCode: p.narodowosc,
      pos: normalizePos(p.pozycja_glowna),
      posLabel: POS_LABEL_MAP[normalizePos(p.pozycja_glowna)] || "Zawodnik",
      status: STATUS_MAP[p.stan_aktualny?.kontuzja] || "healthy",
      score: p.stan_aktualny?.forma_ostatnie_5_meczow || 6.0,
      hasInstructions
    };
  };

  // Fallback: if no players are marked as starting, take first 11
  let startersRaw = activeTeam.zawodnicy?.filter(p => p.isStarting) || [];
  if (startersRaw.length === 0 && activeTeam.zawodnicy?.length > 0) {
    startersRaw = activeTeam.zawodnicy.slice(0, 11);
  }

  const isPosCompatible = (pos1, pos2) => {
    if (!pos1 || !pos2) return false;
    const n1 = normalizePos(pos1);
    const n2 = normalizePos(pos2);
    if (n1 === n2) return true;

    // Grouping logic
    const groups = [
      ["PO", "LO", "CLP", "CLL"], // Fullbacks / Wingbacks
      ["DP", "ŚP"],               // Defensive / Central Midfield
      ["OP", "ŚP"],               // Offensive / Central Midfield
      ["PP", "LP", "PS", "LS"]    // Wide Midfielders / Wingers
    ];

    return groups.some(group => group.includes(n1) && group.includes(n2));
  };

  const startingXi = startersRaw.map(mapPlayer);
  const reserveIds = new Set(startersRaw.map(p => p.id));
  const reserves = (activeTeam.zawodnicy || []).filter(p => !reserveIds.has(p.id)).map(mapPlayer);

  const [dragOverId, setDragOverId] = useState(null);

  const handleDragStart = (e, playerId, isStarter) => {
    e.dataTransfer.setData("playerId", playerId);
    e.dataTransfer.setData("isStarter", isStarter);
    e.dataTransfer.setData("isReserve", !isStarter);
    // Optional: add a ghost image or style
  };

  const handleDragOver = (e, playerId) => {
    e.preventDefault();
    setDragOverId(playerId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e, targetPlayerId, isTargetStarter) => {
    e.preventDefault();
    setDragOverId(null);

    const draggedPlayerIdStr = e.dataTransfer.getData("playerId");
    if (!draggedPlayerIdStr) return;

    const draggedPlayerId = parseInt(draggedPlayerIdStr);
    const isDraggedStarter = e.dataTransfer.getData("isStarter") === "true";

    if (draggedPlayerId === targetPlayerId) return;

    // Cases:
    // 1. Reserve dragged onto Starter -> Substitute
    if (!isDraggedStarter && isTargetStarter) {
      substitutePlayer(targetPlayerId, draggedPlayerId);
    }
    // 2. Starter dragged onto Reserve -> Substitute
    else if (isDraggedStarter && !isTargetStarter) {
      substitutePlayer(draggedPlayerId, targetPlayerId);
    }
  };

  return (
    <div className="pl-wrap">
      {substitutionFocusId && !isOpponent && (
        <div className="pl-sub-banner">
          <span className="material-symbols-outlined">swap_horiz</span>
          Zmieniasz: <strong>{activeTeam.zawodnicy.find(p => p.id === substitutionFocusId)?.imie_nazwisko}</strong>
          <button className="pl-sub-cancel" onClick={() => {
            setSubstitutionFocusId(null);
            setSubstitutionFocusPos(null);
          }}>Anuluj</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="pl-heading" style={{ margin: 0 }}>Wyjściowy skład:</h2>
        {activeTeam.isCustom && (
          <button
            className="simulate-btn"
            onClick={() => setIsCreatorOpen(true)}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "6px 12px",
              fontSize: "10px",
              color: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
              borderRadius: "6px"
            }}
          >
            + DODAJ ZAWODNIKA
          </button>
        )}
      </div>

      <div className="pl-list">
        {startingXi.map((p) => (
          <PlayerRow
            key={p.id}
            player={p}
            getPlayerPhoto={getPlayerPhoto}
            onClick={setSelectedPlayerId}
            onDragStart={handleDragStart}
            onDragOver={(e) => handleDragOver(e, p.id)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isStarter={true}
            isHighlighted={dragOverId === p.id && !isOpponent}
            isOpponent={isOpponent}
          />
        ))}
      </div>

      <h2 className="pl-heading pl-heading--reserve" ref={reserveRef}>Rezerwa:</h2>
      <div className="pl-list">
        {reserves.map((p) => {
          // Check compatibility based on the POSITION ON PITCH (substitutionFocusPos)
          const isCompatible = !isOpponent && (substitutionFocusPos && isPosCompatible(p.pos, substitutionFocusPos));
          const isExact = !isOpponent && substitutionFocusPos && normalizePos(p.pos) === normalizePos(substitutionFocusPos);

          return (
            <PlayerRow
              key={p.id}
              id={`player-row-${p.id}`}
              player={p}
              getPlayerPhoto={getPlayerPhoto}
              onClick={setSelectedPlayerId}
              showSubIcon={!!substitutionFocusId && !isOpponent}
              onSubClick={handleSubAction}
              isHighlighted={isCompatible || (dragOverId === p.id && !isOpponent)}
              isExactMatch={isExact}
              onDragStart={handleDragStart}
              onDragOver={(e) => handleDragOver(e, p.id)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              isStarter={false}
              isOpponent={isOpponent}
            />
          );
        })}
      </div>

      {selectedPlayer && !isOpponent && (
        <PlayerModal
          player={selectedPlayer}
          team={activeTeam}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {selectedPlayer && isOpponent && (
        <OpponentInstructionsModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {isCreatorOpen && (
        <PlayerCreatorModal
          teamId={activeTeam.id}
          onSave={handleAddPlayer}
          onClose={() => setIsCreatorOpen(false)}
        />
      )}
    </div>
  );
}
