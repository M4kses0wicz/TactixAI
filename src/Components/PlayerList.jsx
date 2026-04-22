import personIcon from "../assets/user-icon.png";
import "../styles/PlayerList/css/PlayerList.css";
import { useGame } from "../context/GameContext";

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

const POS_LABEL_MAP = {
  "BR": "Bramkarz",
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

function PlayerRow({ player, getPlayerPhoto }) {
  const accentColor = STATUS_COLOR[player.status];
  const sc = scoreColor(player.score);
  const isHealthy = player.status === "healthy";

  return (
    <div className="pl-row">
      {/* left accent bar */}
      <span className="pl-row__accent" style={{ background: accentColor }} />

      {/* position */}
      <div className="pl-row__pos">
        <span className="pl-row__pos-code">{player.pos}</span>
        <span className="pl-row__pos-label">{player.posLabel}</span>
      </div>

      {/* nationality */}
      <span className="pl-row__nat" title={player.natCode}>
        {player.nat}
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
      <span className="pl-row__name">{player.name}</span>

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
export default function PlayerList({ isOpponent }) {
  const { currentTeam, getPlayerPhoto } = useGame();
  
  if (!currentTeam) return null;

  if (isOpponent) {
    // Opponent mode: show 11 empty placeholder slots
    const formation = currentTeam.formacje?.find(f => f.nazwa === currentTeam.domyslna_formacja);
    const positions = formation ? formation.pozycje : [];
    const emptyPlayers = positions.map((pos, i) => ({
      id: `opp-${i}`,
      name: "Nieznany zawodnik",
      nat: "🏳️",
      pos: pos,
      posLabel: POS_LABEL_MAP[pos] || "Zawodnik",
      status: "healthy",
      score: 6.00
    }));

    return (
      <div className="pl-wrap">
        <h2 className="pl-heading">Skład przeciwnika:</h2>
        <div className="pl-list">
          {emptyPlayers.map((p) => (
            <PlayerRow key={p.id} player={p} getPlayerPhoto={getPlayerPhoto} />
          ))}
        </div>
      </div>
    );
  }

  const mapPlayer = (p) => ({
    id: p.id,
    name: p.imie_nazwisko,
    nat: p.narodowosc,
    pos: p.pozycja_glowna,
    posLabel: POS_LABEL_MAP[p.pozycja_glowna] || "Zawodnik",
    status: STATUS_MAP[p.stan_aktualny?.kontuzja] || "healthy",
    score: p.stan_aktualny?.forma_ostatnie_5_meczow || 6.0
  });

  const startingXi = currentTeam.zawodnicy.filter(p => p.isStarting).map(mapPlayer);
  const reserves = currentTeam.zawodnicy.filter(p => !p.isStarting).map(mapPlayer);

  return (
    <div className="pl-wrap">
      <h2 className="pl-heading">Wyjściowy skład:</h2>
      <div className="pl-list">
        {startingXi.map((p) => (
          <PlayerRow key={p.id} player={p} getPlayerPhoto={getPlayerPhoto} />
        ))}
      </div>

      <h2 className="pl-heading pl-heading--reserve">Rezerwa:</h2>
      <div className="pl-list">
        {reserves.map((p) => (
          <PlayerRow key={p.id} player={p} getPlayerPhoto={getPlayerPhoto} />
        ))}
      </div>
    </div>
  );
}
