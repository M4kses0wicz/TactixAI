import { useState, useEffect, useRef, useMemo } from "react";
import { useGame } from "../context/GameContext";
import "../styles/SimulationWindow/css/simulation-window.css";
import personIcon from "../assets/user-icon.png";

/* ─── Position coordinate maps ───────────────────────── */
// 1:1 copy of POS_COORDS from PitchWindow.jsx — identical formation layout
const MINI_COORDS = {
  "BR":  [{ top: "90%", left: "50%" }],
  "LO":  [{ top: "72%", left: "15%" }],
  "PO":  [{ top: "72%", left: "85%" }],
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


/* ─── Grouping positions for lineup list ─────────────── */
const POS_GROUP = (pos) => {
  if (!pos) return "INNE";
  const p = pos.replace(/[0-9]/g, "");
  if (p === "BR") return "BR";
  if (["ŚO", "LO", "PO", "CLL", "CLP"].includes(p)) return "DEF";
  if (["DP", "ŚP", "OP", "LP", "PP", "LS", "PS"].includes(p)) return "MID";
  if (p === "N") return "FWD";
  return "INNE";
};

const GROUP_ORDER = ["BR", "DEF", "MID", "FWD", "INNE"];

function ratingColor(r) {
  if (r >= 7.5) return "mc-row-rating";
  if (r >= 6.5) return "mc-row-rating mc-row-rating--mid";
  return "mc-row-rating mc-row-rating--low";
}

/* ─── Sample events (verbatim from image_5.png) ──────── */
const SAMPLE_EVENTS = [
  { min: 3,  text: "Genialna interwencja Bramkarza zatrzymuje uderzenie Larghalline!", type: "normal" },
  { min: 19, text: "Cucurella zapisany w notesie arbitra. Musi teraz uważać.", type: "card" },
  { min: 23, text: "Akcja przerwana. Sędzia boczny podnosi chorągiewkę — James nie spełniony.", type: "normal" },
  { min: 26, text: "Brzydki faul Chalobah. Sędzia udziela mu ustnego upomnienia.", type: "card" },
  { min: 30, text: "Niecelne uderzenie Colwill. To była dobra okazja do objęcia prowadzenia.", type: "normal" },
  { min: 32, text: "Zła decyzja Wellenreuther. Strzelał w trybuny.", type: "normal" },
];

/* ─── Stat bar row ───────────────────────────────────── */
function StatBar({ label, homeVal, awayVal, homeDisplay, awayDisplay, isCards }) {
  const total = (homeVal || 0) + (awayVal || 0) || 1;
  const homePct = Math.round(((homeVal || 0) / total) * 100);
  const awayPct = 100 - homePct;

  return (
    <div className="mc-stat-row">
      <div className="mc-stat-labels">
        <span className="mc-stat-val">{homeDisplay ?? homeVal}</span>
        <span className="mc-stat-name">{label}</span>
        <span className="mc-stat-val">{awayDisplay ?? awayVal}</span>
      </div>
      <div className="mc-stat-bar-track">
        <div className="mc-stat-bar-home" style={{ width: `${homePct}%` }} />
        <div className="mc-stat-bar-away" style={{ width: `${awayPct}%` }} />
      </div>
    </div>
  );
}

/* ─── Mini Pitch ─────────────────────────────────────── */
function MiniPitch({ team, players, isOpp, getPlayerPhoto }) {
  const formName = team?.domyslna_formacja || team?.formacje?.[0]?.nazwa;
  const positions = team?.formacje?.find(f => f.nazwa === formName)?.pozycje
    || team?.formacje?.[0]?.pozycje || [];

  // Pre-count total occurrences of each position (same logic as PitchWindow)
  const totalCounts = {};
  positions.forEach(pos => { totalCounts[pos] = (totalCounts[pos] || 0) + 1; });

  const renderCounts = {};

  return (
    <div className="mc-mini-pitch">
      <div className="mc-pitch-center-line" />
      <div className="mc-pitch-center-circle" />
      <div className="mc-pitch-pen-top" />
      <div className="mc-pitch-pen-bot" />

      {positions.map((pos, idx) => {
        const c = renderCounts[pos] || 0;
        renderCounts[pos] = c + 1;

        const coordsArray = MINI_COORDS[pos];
        let coords = { top: "50%", left: "50%" };

        if (coordsArray) {
          const total = totalCounts[pos];
          if (total === 1) {
            // Single player at this position → prefer center (left: "50%")
            coords = coordsArray.find(co => co.left === "50%") || coordsArray[0];
          } else if (total === 2) {
            // Two players → skip the center slot, use the two flanks
            const nonCentral = coordsArray.filter(co => co.left !== "50%");
            coords = nonCentral[c] || coordsArray[c];
          } else {
            // Three or more → sequential
            coords = coordsArray[c] || coordsArray[0];
          }
        }

        const pl = players[idx] || { name: "?", shortName: "?", rating: 6.8 };
        const photo = getPlayerPhoto ? getPlayerPhoto(pl.name) : personIcon;
        const hasRealPhoto = photo && !photo.includes('user-icon');

        return (
          <div
            key={idx}
            className="mc-dot"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className={`mc-dot__circle${isOpp ? " mc-dot__circle--opp" : ""}`}>
              {hasRealPhoto ? (
                <img src={photo} alt="" className="mc-dot__photo" />
              ) : (
                pl.name?.slice(0, 2).toUpperCase() || "??"
              )}
            </div>
            <span className={`mc-dot__rating ${ratingColor(pl.rating)}`}>{pl.rating.toFixed(1)}</span>
            <span className="mc-dot__name">{pl.shortName || pl.name}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lineup List ────────────────────────────────────── */
function LineupList({ players, isOpp, getPlayerPhoto }) {
  const grouped = useMemo(() => {
    const map = {};
    GROUP_ORDER.forEach(g => (map[g] = []));
    players.forEach(p => {
      const g = POS_GROUP(p.pos);
      if (map[g]) map[g].push(p);
    });
    return map;
  }, [players]);

  return (
    <div className="mc-lineup-scroll">
      {GROUP_ORDER.map(group => {
        const rows = grouped[group];
        if (!rows || rows.length === 0) return null;
        return (
          <div key={group} className="mc-pos-group">
            <div className="mc-pos-header">{group}</div>
            {rows.map((p, i) => {
              const photo = getPlayerPhoto ? getPlayerPhoto(p.name) : personIcon;
              const hasRealPhoto = photo && !photo.includes('user-icon');
              return (
                <div key={p.id ?? i} className="mc-lineup-row">
                  <span className="mc-row-num">{p.num ?? "—"}</span>
                  <div className={`mc-row-circle${isOpp ? " mc-row-circle--opp" : ""}`}>
                    {hasRealPhoto ? (
                      <img src={photo} alt="" className="mc-row-photo" />
                    ) : (
                      (p.name || "?").slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className="mc-row-name">{p.name}</span>
                  <span className={ratingColor(p.rating)}>{p.rating.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Momentum SVG ───────────────────────────────────── */
function MomentumChart({ snapshots }) {
  if (!snapshots || snapshots.length < 2) {
    return (
      <div className="mc-momentum-canvas">
        <svg className="mc-momentum-svg" preserveAspectRatio="none" viewBox="0 0 400 40">
          <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x="200" y="24" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.2)">MOMENTUM</text>
        </svg>
      </div>
    );
  }

  const W = 400;
  const H = 40;
  const mid = H / 2;

  const homePoints = snapshots.map((s, i) => {
    const x = (i / (snapshots.length - 1)) * W;
    const y = mid - (s.home / 10) * (mid - 4);
    return `${x},${y}`;
  }).join(" ");

  const awayPoints = snapshots.map((s, i) => {
    const x = (i / (snapshots.length - 1)) * W;
    const y = mid + (s.away / 10) * (mid - 4);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="mc-momentum-canvas">
      <svg className="mc-momentum-svg" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <polyline points={homePoints} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points={awayPoints} fill="none" stroke="rgba(248,113,113,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN SimulationWindow
   ════════════════════════════════════════════════════════ */
const SimulationWindow = ({ 
  onFinish, 
  time, 
  score, 
  events, 
  isFinished, 
  homePlayers, 
  awayPlayers, 
  momentum, 
  stats 
}) => {
  const { currentTeam, opponentTeam, setMatchData, getClubLogo, getPlayerPhoto } = useGame();

  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  useEffect(() => {
    setMatchData?.({ time, scoreHome: score.home, scoreAway: score.away });
  }, [time, score, setMatchData]);

  const homeName = currentTeam?.nazwa || "GOSPODARZ";
  const awayName = opponentTeam?.nazwa || "GOŚĆ";
  const homeLogo = getClubLogo ? getClubLogo(currentTeam?.logo, homeName) : null;
  const awayLogo = getClubLogo ? getClubLogo(opponentTeam?.logo, awayName) : null;

  return (
    <div className="simulation-overlay">

      {/* ── HEADER ── */}
      <div className="mc-header-wrapper">
        <div className="mc-header">
          <div className="mc-team mc-team--home">
            {homeLogo && <img src={homeLogo} alt="" className="mc-team-logo" />}
            <span className="mc-team-name">{homeName}</span>
          </div>

          <div className="mc-scorebox">
            <div className="mc-score">{score.home} : {score.away}</div>
            <div className={`mc-time-pill${isFinished ? " mc-time-pill--finished" : ""}`}>
              {isFinished ? "KONIEC" : `${time}'`}
            </div>
          </div>

          <div className="mc-team mc-team--away">
            <span className="mc-team-name">{awayName}</span>
            {awayLogo && <img src={awayLogo} alt="" className="mc-team-logo" />}
          </div>
        </div>

        {/* Right-side action button: Wróć during match, Zakończ after */}
        {!isFinished ? (
          <button className="mc-back-btn" onClick={onFinish}>Wróć</button>
        ) : (
          <button className="mc-finish-btn" onClick={onFinish}>
            Zakończ symulację
          </button>
        )}
      </div>

      {/* ── BODY GRID ── */}
      <div className="mc-body">

        {/* ── LEFT — Home Team ── */}
        <div className="mc-side">
          <div className="mc-pitch-box">
            <div className="mc-pitch-label">Taktyka — {homeName}</div>
            <MiniPitch team={currentTeam} players={homePlayers} isOpp={false} getPlayerPhoto={getPlayerPhoto} />
          </div>
          <LineupList players={homePlayers} isOpp={false} getPlayerPhoto={getPlayerPhoto} />
        </div>

        {/* ── CENTER — Data Hub ── */}
        <div className="mc-center">

          {/* AI Input Bar — TOP */}
          <div className="mc-ai-bar mc-ai-bar--top">
            <div className="mc-ai-container">
              <div className="mc-ai-input-row">
                <span className="mc-ai-prefix">TactixAI</span>
                <input
                  className="mc-ai-input"
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Zadaj pytanie o sytuację na boisku..."
                  onKeyDown={e => e.key === "Enter" && setAiInput("")}
                />
                <button className="mc-ai-send" onClick={() => setAiInput("")} title="Wyślij">↑</button>
              </div>
              <div className="mc-ai-response">
                {aiResponse}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mc-stats-zone">
            <div className="mc-zone-label">Statystyki meczu</div>
            <div className="mc-stats-grid">
              <StatBar
                label="Posiadanie"
                homeVal={stats.homePoss}
                awayVal={stats.awayPoss}
                homeDisplay={`${stats.homePoss}%`}
                awayDisplay={`${stats.awayPoss}%`}
              />
              <StatBar
                label="Strzały"
                homeVal={stats.homeShots}
                awayVal={stats.awayShots}
                homeDisplay={`${stats.homeShots} (${stats.homeShotsOn})`}
                awayDisplay={`${stats.awayShots} (${stats.awayShotsOn})`}
              />
              <StatBar
                label="Podania %"
                homeVal={stats.homePass}
                awayVal={stats.awayPass}
                homeDisplay={`${stats.homePass}%`}
                awayDisplay={`${stats.awayPass}%`}
              />
              <StatBar
                label="Faule"
                homeVal={stats.homeFouls}
                awayVal={stats.awayFouls}
              />
              <StatBar
                label="Rożne"
                homeVal={stats.homeCorners}
                awayVal={stats.awayCorners}
              />
              <StatBar
                label="Kartki Ż/C"
                homeVal={stats.homeYellow + stats.homeRed}
                awayVal={stats.awayYellow + stats.awayRed}
                homeDisplay={`${stats.homeYellow}Y ${stats.homeRed}R`}
                awayDisplay={`${stats.awayYellow}Y ${stats.awayRed}R`}
              />
              <StatBar label="Spalone" homeVal={stats.homeOffsides} awayVal={stats.awayOffsides} />
              <StatBar label="Obrony BR" homeVal={stats.homeSaves} awayVal={stats.awaySaves} />
              <StatBar label="Bloki" homeVal={stats.homeBlocks} awayVal={stats.awayBlocks} />
              <StatBar label="Dośrodkowania" homeVal={stats.homeCrosses} awayVal={stats.awayCrosses} />
              <StatBar label="Odbiory" homeVal={stats.homeTackles} awayVal={stats.awayTackles} />
              <StatBar label="Pojedynki pow." homeVal={stats.homeAerial} awayVal={stats.awayAerial} />
            </div>
          </div>

          {/* Momentum */}
          <div className="mc-momentum-zone">
            <div className="mc-zone-label" style={{ marginBottom: "6px" }}>Momentum meczu</div>
            <MomentumChart snapshots={momentum} />
          </div>

          {/* Commentary Feed — below momentum, taller and highlighted */}
          <div className="mc-feed-zone mc-feed-zone--compact">
            <div className="mc-feed-label">Komentarz na żywo</div>
            <div className="mc-feed-list">
              {events.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "11px" }}>
                  Oczekiwanie na pierwsze wydarzenie...
                </div>
              )}
              {events.map((ev, i) => (
                <div key={i} className="mc-feed-item">
                  <span className={`mc-feed-min mc-feed-min--${ev.type || "normal"}`}>
                    {ev.min}'
                  </span>
                  <span className={`mc-feed-text mc-feed-text--${ev.type || "normal"}`}>
                    {ev.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT — Away Team ── */}
        <div className="mc-side mc-side--right">
          <div className="mc-pitch-box">
            <div className="mc-pitch-label">Taktyka — {awayName}</div>
            <MiniPitch team={opponentTeam} players={awayPlayers} isOpp={true} getPlayerPhoto={getPlayerPhoto} />
          </div>
          <LineupList players={awayPlayers} isOpp={true} getPlayerPhoto={getPlayerPhoto} />
        </div>

      </div>

      {/* ── FOOTER ── */}
      <div className="mc-footer">
        <span className="mc-footer-info">
          {isFinished ? "Mecz zakończony" : `Trwa symulacja — ${time}'`}
        </span>
      </div>

    </div>
  );
};

export default SimulationWindow;
