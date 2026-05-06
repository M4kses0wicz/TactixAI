import { useState, useEffect, useRef, useCallback } from "react";
import { useGame } from "../context/GameContext";
import "../styles/SimulationWindow/css/simulation-window.css";

const API = "http://127.0.0.1:8000";

/* ─── Position coordinate maps ─────────────────────── */
const MINI_COORDS = {
  "BR": [{ top: "90%", left: "50%" }],
  "LO": [{ top: "72%", left: "15%" }],
  "PO": [{ top: "72%", left: "85%" }],
  "ŚO4": [{ top: "75%", left: "37%" }, { top: "75%", left: "63%" }],
  "ŚO3": [{ top: "75%", left: "27%" }, { top: "75%", left: "73%" }, { top: "75%", left: "50%" }],
  "CLL": [{ top: "62%", left: "12%" }],
  "CLP": [{ top: "62%", left: "88%" }],
  "DP": [{ top: "60%", left: "37%" }, { top: "60%", left: "63%" }, { top: "60%", left: "50%" }],
  "ŚP": [{ top: "50%", left: "37%" }, { top: "50%", left: "63%" }, { top: "50%", left: "50%" }],
  "OP": [{ top: "40%", left: "37%" }, { top: "40%", left: "63%" }, { top: "40%", left: "50%" }],
  "LP": [{ top: "48%", left: "14%" }],
  "PP": [{ top: "48%", left: "86%" }],
  "LS": [{ top: "32%", left: "22%" }],
  "PS": [{ top: "32%", left: "78%" }],
  "N": [{ top: "22%", left: "37%" }, { top: "22%", left: "63%" }, { top: "22%", left: "50%" }],
};

function ratingColor(r) {
  if (r >= 7.5) return "mc-row-rating";
  if (r >= 6.5) return "mc-row-rating mc-row-rating--mid";
  return "mc-row-rating mc-row-rating--low";
}

/* ─── Stat bar ─────────────────────────────────────── */
function StatBar({ label, homeVal, awayVal, homeDisplay, awayDisplay }) {
  const total = (homeVal || 0) + (awayVal || 0) || 1;
  const homePct = Math.round(((homeVal || 0) / total) * 100);
  return (
    <div className="mc-stat-row">
      <div className="mc-stat-labels">
        <span className="mc-stat-val">{homeDisplay ?? homeVal}</span>
        <span className="mc-stat-name">{label}</span>
        <span className="mc-stat-val">{awayDisplay ?? awayVal}</span>
      </div>
      <div className="mc-stat-bar-track">
        <div className="mc-stat-bar-home" style={{ width: `${homePct}%` }} />
        <div className="mc-stat-bar-away" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  );
}

/* ─── Mini Pitch ────────────────────────────────────── */
function MiniPitch({ team, liveRatings, isOpp, getPlayerPhoto, onDotClick, subSelectId }) {
  const formName = team?.domyslna_formacja || team?.formacje?.[0]?.nazwa;
  const positions = team?.formacje?.find(f => f.nazwa === formName)?.pozycje
    || team?.formacje?.[0]?.pozycje || [];

  // żywy skład z panelu taktycznego (assignedStarters = po zmianach formacji/zawodników)
  const assigned = team?.assignedStarters || [];

  // Mapa ocen z silnika dla szybkiego lookup po nazwisku
  const ratingMap = {};
  (liveRatings || []).forEach(p => { ratingMap[p.name] = p.rating; });

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
          if (total === 1) coords = coordsArray.find(co => co.left === "50%") || coordsArray[0];
          else if (total === 2) { const nc = coordsArray.filter(co => co.left !== "50%"); coords = nc[c] || coordsArray[c]; }
          else coords = coordsArray[c] || coordsArray[0];
        }
        // Pobierz zawodnika z assignedStarters (aktualna formacja)
        const pl = assigned[idx];
        const name = pl?.imie_nazwisko || pl?.name || "?";
        const shortName = name.split(" ").pop();
        const liveRating = ratingMap[name] ?? 6.0;
        const photo = getPlayerPhoto ? getPlayerPhoto(name) : null;
        const hasRealPhoto = photo && !photo.includes("user-icon");
        const isSelected = subSelectId === (pl?.id ?? idx);

        return (
          <div
            key={idx}
            className={`mc-dot${isSelected ? " mc-dot--selected" : ""}${!isOpp ? " mc-dot--clickable" : ""}`}
            style={{ top: coords.top, left: coords.left }}
            onClick={() => !isOpp && onDotClick && onDotClick({ id: pl?.id, name }, idx)}
          >
            <div className={`mc-dot__circle${isOpp ? " mc-dot__circle--opp" : ""}`}>
              {hasRealPhoto
                ? <img src={photo} alt="" className="mc-dot__photo" />
                : name.slice(0, 2).toUpperCase()}
            </div>
            <span className={`mc-dot__rating ${ratingColor(liveRating)}`}>{liveRating.toFixed(1)}</span>
            <span className="mc-dot__name">{shortName}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Full Squad List (starters + bench) ─────────────── */
function SquadList({ assignedTeam, liveRatings, isHome, subSelectId, onSelectStarter, onConfirmSub }) {
  // assignedStarters = żywy skład po zmianach taktycznych
  const assigned = assignedTeam?.assignedStarters || [];
  const allPlayers = assignedTeam?.zawodnicy || [];

  // Mapa ocen z silnika
  const ratingMap = {};
  (liveRatings || []).forEach(p => { ratingMap[p.name] = { rating: p.rating, stamina: p.stamina, goals: p.goals }; });

  // Starters: z assignedStarters (aktualna formacja)
  const starters = assigned.slice(0, 11).map(p => {
    const nm = p?.imie_nazwisko || p?.name || "?";
    const live = ratingMap[nm] || {};
    return {
      id: p?.id,
      name: nm,
      shortName: nm.split(" ").pop(),
      pos: p?.pozycja_glowna || p?.pos || "?",
      rating: live.rating ?? 6.0,
      stamina: live.stamina ?? p?.stan_aktualny?.kondycja ?? 85,
      goals: live.goals ?? 0,
    };
  });

  // Ławka: zawodnicy nie będący w assignedStarters
  const starterIds = new Set(assigned.map(p => p?.id).filter(Boolean));
  const bench = allPlayers
    .filter(p => !starterIds.has(p.id))
    .map(p => ({
      id: p.id,
      name: p.imie_nazwisko,
      shortName: p.imie_nazwisko?.split(" ").pop(),
      pos: p.pozycja_glowna || "?",
      rating: 6.0,
      stamina: p.stan_aktualny?.kondycja ?? 85,
      goals: 0,
    }));

  const getConditionClass = (cond) => {
    const c = cond ?? 85;
    if (c > 75) return "mc-condition-fill";
    if (c > 40) return "mc-condition-fill mid";
    return "mc-condition-fill low";
  };

  const renderRow = (p, isBench = false) => {
    const cond = p.stamina ?? p.condition ?? 85;
    const isSelected = subSelectId === p.id || subSelectId === p.name;
    return (
      <div
        key={p.id ?? p.name}
        className={`mc-compact-row${isSelected ? " mc-compact-row--selected" : ""}${isBench ? " mc-compact-row--bench" : ""}`}
        onClick={() => isHome && (isBench ? onConfirmSub(p) : onSelectStarter(p))}
        style={{ cursor: isHome ? "pointer" : "default" }}
      >
        {isBench && <span className="mc-bench-badge">RZ</span>}
        <span className="mc-compact-pos">{p.pos || "?"}</span>
        <span className="mc-compact-name">{p.shortName || p.name?.split(" ").pop() || "?"}</span>
        {p.yellowCard && !p.redCard && <span className="mc-card mc-card--yellow" />}
        {p.redCard && <span className="mc-card mc-card--red" />}
        <div className="mc-player-condition" title={`Kondycja: ${Math.round(cond)}%`}>
          <div className={getConditionClass(cond)} style={{ width: `${cond}%` }} />
        </div>
        <span className={ratingColor(p.rating)}>{p.rating?.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="mc-squad-list">
      <div className="mc-squad-section-label">Skład ({assigned.length})</div>
      {starters.map(p => renderRow(p, false))}
      {bench.length > 0 && (
        <>
          <div className="mc-bench-divider">Ławka Rezerwowych ({bench.length})</div>
          {bench.map(p => renderRow(p, true))}
        </>
      )}
    </div>
  );
}

/* ─── Attack Directions Panel ─────────────────────── */
function AttackDirectionsPanel({ homeDir, awayDir }) {
  const hL = homeDir?.left ?? 33;
  const hC = homeDir?.center ?? 34;
  const hR = homeDir?.right ?? 33;
  const aL = awayDir?.left ?? 33;
  const aC = awayDir?.center ?? 34;
  const aR = awayDir?.right ?? 33;

  const ArrowBar = ({ left, center, right, color }) => (
    <div className="mc-attack-bars">
      {[{ label: "Lewa", pct: left }, { label: "Środek", pct: center }, { label: "Prawa", pct: right }].map(d => (
        <div key={d.label} className="mc-attack-bar-row">
          <span className="mc-attack-bar-label">{d.label}</span>
          <div className="mc-attack-bar-track">
            <div className="mc-attack-bar-fill" style={{ width: `${d.pct}%`, background: color }} />
          </div>
          <span className="mc-attack-bar-pct" style={{ color }}>{Math.round(d.pct)}%</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mc-analytics-card mc-analytics-card--atk">
      <div className="mc-analytics-label">Kierunki Ataku</div>
      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>Gospodarz</div>
      <ArrowBar left={hL} center={hC} right={hR} color="#4ade80" />
      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "10px", marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase" }}>Gość</div>
      <ArrowBar left={aL} center={aC} right={aR} color="#f87171" />
    </div>
  );
}

/* ─── Match Summary Card (kartki, różne, faule, top strzelcy) ─── */
function MatchSummaryCard({ stats, homePlayers, awayPlayers, homeName, awayName }) {
  const scorers = [...(homePlayers || []), ...(awayPlayers || [])]
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  const topRated = [...(homePlayers || []), ...(awayPlayers || [])]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="mc-analytics-card mc-analytics-card--rival">
      <div className="mc-analytics-label">Podsumowanie Meczu</div>

      {/* Kartki i faule */}
      <div className="mc-summary-row">
        <div className="mc-summary-block">
          <span className="mc-summary-val" style={{ color: "#facc15" }}>{stats?.homeYellow ?? 0}</span>
          <span className="mc-summary-lbl">Żółte</span>
        </div>
        <div className="mc-summary-block">
          <span className="mc-summary-val" style={{ color: "#f87171" }}>{stats?.homeRed ?? 0}</span>
          <span className="mc-summary-lbl">Czerwone</span>
        </div>
        <div className="mc-summary-block">
          <span className="mc-summary-val">{stats?.homeCorners ?? 0}</span>
          <span className="mc-summary-lbl">Rożne</span>
        </div>
        <div className="mc-summary-block">
          <span className="mc-summary-val">{stats?.homeFouls ?? 0}</span>
          <span className="mc-summary-lbl">Faule</span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />

      {/* Top strzelcy */}
      {scorers.length > 0 && (
        <>
          <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>Bramki</div>
          {scorers.map((p, i) => (
            <div key={i} className="mc-summary-scorer">
              <span className="mc-summary-scorer-name">{p.name?.split(" ").pop()}</span>
              <span className="mc-summary-scorer-goals">{"⚽".repeat(Math.min(p.goals, 4))}</span>
            </div>
          ))}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
        </>
      )}

      {/* Top oceny */}
      <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "4px" }}>Najlepsi na boisku</div>
      {topRated.map((p, i) => (
        <div key={i} className="mc-summary-scorer">
          <span className="mc-summary-scorer-name">{p.name?.split(" ").pop()}</span>
          <span className={ratingColor(p.rating)}>{p.rating?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

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
  const W = 400, H = 40, mid = H / 2;
  const hp = snapshots.map((s, i) => `${(i / (snapshots.length - 1)) * W},${mid - (s.home / 10) * (mid - 4)}`).join(" ");
  const ap = snapshots.map((s, i) => `${(i / (snapshots.length - 1)) * W},${mid + (s.away / 10) * (mid - 4)}`).join(" ");
  return (
    <div className="mc-momentum-canvas">
      <svg className="mc-momentum-svg" preserveAspectRatio="none" viewBox={`0 0 ${W} ${H}`}>
        <line x1="0" y1={mid} x2={W} y2={mid} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
        <polyline points={hp} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
        <polyline points={ap} fill="none" stroke="rgba(248,113,113,0.5)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN SimulationWindow
   ═══════════════════════════════════════════════════ */
const SimulationWindow = ({
  onFinish,
  sessionId,
  time,
  score,
  events,
  isFinished,
  homePlayers,
  awayPlayers,
  momentum,
  stats,
}) => {
  const { currentTeam, opponentTeam, setMatchData, getClubLogo, getPlayerPhoto, substitutePlayer } = useGame();

  // Sub state — wybieramy startującego, potem rezerwowego
  const [subSelectId, setSubSelectId] = useState(null);
  const [subSelectName, setSubSelectName] = useState(null);
  const [subFeedback, setSubFeedback] = useState(null);

  const [aiInput, setAiInput] = useState("");
  const [aiChat, setAiChat] = useState([
    { role: "assistant", text: "Gotów do analizy. Zadaj mi pytanie o taktykę lub zaproponuj zmianę." }
  ]);

  const feedRef = useRef(null);

  useEffect(() => {
    setMatchData?.({ time, scoreHome: score.home, scoreAway: score.away });
  }, [time, score, setMatchData]);

  // Auto-scroll komentarza
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [events]);

  const homeName = currentTeam?.nazwa || "GOSPODARZ";
  const awayName = opponentTeam?.nazwa || "GOŚĆ";
  const homeLogo = getClubLogo ? getClubLogo(currentTeam?.logo, homeName) : null;
  const awayLogo = getClubLogo ? getClubLogo(opponentTeam?.logo, awayName) : null;

  /* ── Logika zmian zawodników ─────────────────────── */
  const handleDotClick = (player) => {
    if (!player || !player.name) return;
    if (subSelectId === player.id || subSelectId === player.name) {
      // Odznacz
      setSubSelectId(null);
      setSubSelectName(null);
    } else {
      setSubSelectId(player.id ?? player.name);
      setSubSelectName(player.name);
    }
  };

  const handleSelectStarter = (player) => handleDotClick(player);

  const handleConfirmSub = useCallback(async (bench) => {
    if (!subSelectId || !bench) return;

    // substitutePlayer(starterId, reserveId) — obie w ID z currentTeam.zawodnicy
    const starterObj = currentTeam?.zawodnicy?.find(p =>
      p.id === subSelectId || p.imie_nazwisko === subSelectName
    );
    const benchObj = currentTeam?.zawodnicy?.find(p =>
      p.id === bench.id ||
      p.imie_nazwisko === bench.name ||
      p.imie_nazwisko === bench.imie_nazwisko
    );

    if (starterObj && benchObj) {
      substitutePlayer(starterObj.id, benchObj.id);
    }

    // Wyślij aktualny skład do backendu (z nowym zawodnikiem)
    if (sessionId) {
      try {
        await fetch(`${API}/api/simulate/tactics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            homeTeam: currentTeam,
            awayTeam: opponentTeam,
          }),
        });
      } catch (e) {
        console.warn("Sub sync failed", e);
      }
    }

    const subName = bench.shortName || bench.name || "?";
    setSubFeedback(`Zmiana: ${subSelectName} ↔ ${subName}`);
    setSubSelectId(null);
    setSubSelectName(null);
    setTimeout(() => setSubFeedback(null), 3000);
  }, [subSelectId, subSelectName, currentTeam, opponentTeam, sessionId, substitutePlayer]);

  /* ── AI Send ──────────────────────────────────────── */
  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    setAiChat(prev => [...prev,
      { role: "user", text: aiInput },
      { role: "assistant", text: "Analizuję sytuację na boisku..." }
    ]);
    setAiInput("");
  };

  /* ── SquadList data ── */
  // allHomePlayers nie jest już potrzebne — SquadList buduje z assignedStarters

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

        {/* Feedback zmian */}
        {subFeedback && (
          <div className="mc-sub-feedback">
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>swap_horiz</span>
            {subFeedback}
          </div>
        )}

        {/* Hint zmian */}
        {subSelectName && !subFeedback && (
          <div className="mc-sub-hint">
            Wybrany: <strong>{subSelectName}</strong> — kliknij rezerwowego na liście poniżej
          </div>
        )}

        {!isFinished ? (
          <button className="mc-tactics-btn" onClick={onFinish}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>swap_horiz</span>
            Zmiana taktyki
          </button>
        ) : (
          <button className="mc-finish-btn" onClick={onFinish}>
            Zakończ symulację
          </button>
        )}
      </div>

      {/* ── BODY GRID 4-COL ── */}
      <div className="mc-body mc-body-4col">

        {/* ── COL 1: HOME TEAM ── */}
        <div className="mc-col mc-col-team mc-col-home">
          <div className="mc-team-header-label">
            {homeLogo && <img src={homeLogo} alt="" className="mc-col-header-logo" />}
            <span className="mc-col-header-name">{homeName}</span>
            {subSelectId && (
              <span className="mc-sub-mode-badge">ZMIANA</span>
            )}
          </div>
          <div className="mc-pitch-box mc-pitch-box--compact">
            <MiniPitch
              team={currentTeam}
              liveRatings={homePlayers}
              isOpp={false}
              getPlayerPhoto={getPlayerPhoto}
              onDotClick={handleDotClick}
              subSelectId={subSelectId}
            />
          </div>
          <div className="mc-squad-wrapper">
            <SquadList
              assignedTeam={currentTeam}
              liveRatings={homePlayers}
              isHome={true}
              subSelectId={subSelectId}
              onSelectStarter={handleSelectStarter}
              onConfirmSub={handleConfirmSub}
            />
          </div>
        </div>

        {/* ── ATTACK DIRECTIONS ── */}
        <AttackDirectionsPanel
          homeDir={stats?.homeAttackDir}
          awayDir={stats?.awayAttackDir}
        />

        {/* ── MATCH SUMMARY CARD (kartki, rożne, strzelcy) ── */}
        <MatchSummaryCard
          stats={stats}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          homeName={homeName}
          awayName={awayName}
        />

        <div className="mc-col mc-col-mid">

          {/* Key Stats */}
          <div className="mc-stats-zone">
            <div className="mc-zone-label">Kluczowe Statystyki</div>
            <div className="mc-stats-grid">
              <StatBar label="Posiadanie" homeVal={stats?.homePoss} awayVal={stats?.awayPoss}
                homeDisplay={`${stats?.homePoss ?? 50}%`} awayDisplay={`${stats?.awayPoss ?? 50}%`} />
              <StatBar label="Celność Podań" homeVal={stats?.homePass} awayVal={stats?.awayPass}
                homeDisplay={`${stats?.homePass ?? 0}%`} awayDisplay={`${stats?.awayPass ?? 0}%`} />
              <StatBar label="Strzały (Celne)" homeVal={stats?.homeShots} awayVal={stats?.awayShots}
                homeDisplay={`${stats?.homeShots ?? 0} (${stats?.homeShotsOn ?? 0})`}
                awayDisplay={`${stats?.awayShots ?? 0} (${stats?.awayShotsOn ?? 0})`} />
              <StatBar label="xG" homeVal={stats?.homeXG} awayVal={stats?.awayXG}
                homeDisplay={stats?.homeXG?.toFixed(2) ?? "0.00"}
                awayDisplay={stats?.awayXG?.toFixed(2) ?? "0.00"} />
            </div>

            {/* Action Zones */}
            <div className="mc-action-zones-wrapper" style={{ marginTop: "16px" }}>
              <div className="mc-zone-label">Strefy Akcji</div>
              <div className="mc-action-zones">
                <div className="mc-zone-part" style={{
                  flex: stats?.homeActionZones?.defense ?? 33,
                  background: "rgba(248,113,113,0.15)", color: "rgba(248,113,113,0.9)"
                }}>
                  {Math.round(stats?.homeActionZones?.defense ?? 33)}%
                </div>
                <div className="mc-zone-part" style={{
                  flex: stats?.homeActionZones?.midfield ?? 34,
                  background: "rgba(255,255,255,0.05)"
                }}>
                  {Math.round(stats?.homeActionZones?.midfield ?? 34)}%
                </div>
                <div className="mc-zone-part" style={{
                  flex: stats?.homeActionZones?.attack ?? 33,
                  background: "rgba(74,222,128,0.15)", color: "rgba(74,222,128,0.9)"
                }}>
                  {Math.round(stats?.homeActionZones?.attack ?? 33)}%
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "rgba(255,255,255,0.3)", marginTop: "5px", textTransform: "uppercase", fontWeight: 700 }}>
                <span>Obrona</span><span>Środek</span><span>Atak</span>
              </div>
            </div>
          </div>

          {/* Momentum */}
          <div className="mc-momentum-zone mc-momentum-zone--hero">
            <div className="mc-zone-label">Momentum Meczu</div>
            <MomentumChart snapshots={momentum} />
          </div>

          {/* Feed */}
          <div className="mc-feed-zone mc-feed-zone--hero" style={{ paddingTop: "12px" }}>
            <div className="mc-feed-label">Komentarz na żywo</div>
            <div className="mc-feed-list mc-feed-list--large" ref={feedRef}>
              {events.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.15)", fontSize: "14px", padding: "20px" }}>
                  Oczekiwanie na pierwsze wydarzenie...
                </div>
              )}
              {events.map((ev, i) => (
                <div key={i} className="mc-feed-item mc-feed-item--large">
                  <span className={`mc-feed-min mc-feed-min--large mc-feed-min--${ev.type || "normal"}`}>
                    {ev.min}'
                  </span>
                  <span className={`mc-feed-text mc-feed-text--large mc-feed-text--${ev.type || "normal"}`}>
                    {ev.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── COL 3: AWAY TEAM ── */}
        <div className="mc-col mc-col-team mc-col-away">
          <div className="mc-team-header-label">
            {awayLogo && <img src={awayLogo} alt="" className="mc-col-header-logo" />}
            <span className="mc-col-header-name">{awayName}</span>
          </div>
          <div className="mc-pitch-box mc-pitch-box--compact">
            <MiniPitch
              team={opponentTeam}
              liveRatings={awayPlayers}
              isOpp={true}
              getPlayerPhoto={getPlayerPhoto}
            />
          </div>
          <div className="mc-squad-wrapper">
            <SquadList
              assignedTeam={opponentTeam}
              liveRatings={awayPlayers}
              isHome={false}
              subSelectId={null}
              onSelectStarter={() => {}}
              onConfirmSub={() => {}}
            />
          </div>
        </div>

        {/* ── AI ── */}
        <div className="mc-col mc-col-ai">
          <section className="mc-AI-win">
            <div className="mc-messages-container">
              {aiChat.map((msg, idx) => (
                <div key={idx} className={`mc-message-bubble ${msg.role}`}>{msg.text}</div>
              ))}
            </div>
            <div className="mc-inp">
              <input
                type="text"
                className="mc-inp__field"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Zapytaj o sytuację na boisku..."
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
              />
              <span className={`material-symbols-outlined mc-inp__send${!aiInput.trim() ? " disabled" : ""}`} onClick={handleAiSend}>
                arrow_upward
              </span>
            </div>
          </section>
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
