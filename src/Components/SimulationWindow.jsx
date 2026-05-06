import { useState, useEffect, useRef, useMemo } from "react";
import { useGame } from "../context/GameContext";
import "../styles/SimulationWindow/css/simulation-window.css";
import personIcon from "../assets/user-icon.png";

/* ─── Position coordinate maps ───────────────────────── */
// 1:1 copy of POS_COORDS from PitchWindow.jsx — identical formation layout
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
  { min: 3, text: "Genialna interwencja Bramkarza zatrzymuje uderzenie Larghalline!", type: "normal" },
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

/* ─── Compact Lineup List ────────────────────────────── */
function CompactLineupList({ players }) {
  const starters = players.slice(0, 11);
  const bench = players.slice(11);

  const getConditionClass = (cond) => {
    if (cond > 75) return "mc-condition-fill";
    if (cond > 40) return "mc-condition-fill mid";
    return "mc-condition-fill low";
  };

  const getBodyLang = (r) => {
    if (r > 7.5) return "🔥";
    if (r < 6.0) return "😓";
    return "😐";
  };

  const renderRow = (p, i) => {
    const cond = p.condition || (70 + Math.random() * 25);
    return (
      <div key={p.id ?? i} className="mc-compact-row">
        <span className="mc-compact-name">{p.shortName || p.name.split(' ').pop()}</span>
        {p.yellowCard && !p.redCard && <span className="mc-card mc-card--yellow" title="Żółta kartka"></span>}
        {p.redCard && <span className="mc-card mc-card--red" title="Czerwona kartka"></span>}
        <span className="mc-body-lang" title="Mowa ciała">{getBodyLang(p.rating)}</span>
        <div className="mc-player-condition" title={`Kondycja: ${Math.round(cond)}%`}>
          <div className={getConditionClass(cond)} style={{ width: `${cond}%` }}></div>
        </div>
        <span className={`mc-row-rating ${ratingColor(p.rating)}`}>{p.rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="mc-compact-lineup">
      {starters.map(renderRow)}
      {bench.length > 0 && <div className="mc-bench-divider">Ławka Rezerwowych</div>}
      {bench.map(renderRow)}
    </div>
  );
}

/* ─── Attack Directions Panel ─────────────────────────── */
function AttackDirectionsPanel() {
  const directions = [
    { label: 'Lewa',   pct: 20, color: '#4ade80' },
    { label: 'Środek', pct: 65, color: 'rgba(255,255,255,0.75)' },
    { label: 'Prawa',  pct: 15, color: '#4ade80' },
  ];
  return (
    <div className="mc-analytics-card mc-analytics-card--atk">
      <div className="mc-analytics-label">Kierunki Ataku</div>
      <div className="mc-attack-pitch">
        <div className="mc-attack-pitch__half-line" />
        <div className="mc-attack-pitch__penalty" />
        <div className="mc-attack-pitch__goal" />
        <div className="mc-attack-zone" style={{ left: 0, width: '28%', background: 'rgba(74,222,128,0.2)' }} />
        <div className="mc-attack-zone" style={{ left: '28%', width: '44%', background: 'rgba(255,255,255,0.07)' }} />
        <div className="mc-attack-zone" style={{ right: 0, width: '28%', background: 'rgba(74,222,128,0.1)' }} />
        <span className="mc-attack-arrow mc-attack-arrow--left"  style={{ opacity: 0.4 }}>▲</span>
        <span className="mc-attack-arrow mc-attack-arrow--center" style={{ opacity: 0.9 }}>▲</span>
        <span className="mc-attack-arrow mc-attack-arrow--right" style={{ opacity: 0.3 }}>▲</span>
      </div>
      <div className="mc-attack-bars">
        {directions.map(d => (
          <div key={d.label} className="mc-attack-bar-row">
            <span className="mc-attack-bar-label">{d.label}</span>
            <div className="mc-attack-bar-track">
              <div className="mc-attack-bar-fill" style={{ width: `${d.pct}%`, background: d.color }} />
            </div>
            <span className="mc-attack-bar-pct" style={{ color: d.color }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Rival Analysis Panel ────────────────────────────── */
function RivalAnalysisPanel() {
  const tags = [
    { label: 'Wysoki Pressing', color: '#f87171' },
    { label: 'Gra z Kontry',   color: '#facc15' },
    { label: 'Obrona Strefowa',color: '#60a5fa' },
    { label: 'Szeroka Gra',    color: '#a78bfa' },
  ];
  const metrics = [
    { label: 'Linia Obrony', value: 'Wysoka',  icon: '↑' },
    { label: 'Dom. Noga',    value: 'Prawa',   icon: '▶' },
    { label: 'Tempo',        value: 'Szybkie', icon: '▶▶' },
    { label: 'Długie Piłki', value: '22%',     icon: '↗' },
  ];
  return (
    <div className="mc-analytics-card mc-analytics-card--rival">
      <div className="mc-analytics-label">Analiza Rywala</div>
      <div className="mc-rival-tags">
        {tags.map(t => (
          <span key={t.label} className="mc-rival-tag"
            style={{ borderColor: `${t.color}40`, color: t.color, background: `${t.color}12` }}>
            {t.label}
          </span>
        ))}
      </div>
      <div className="mc-rival-metrics">
        {metrics.map(m => (
          <div key={m.label} className="mc-rival-metric">
            <span className="mc-rival-metric__icon">{m.icon}</span>
            <div className="mc-rival-metric__text">
              <span className="mc-rival-metric__val">{m.value}</span>
              <span className="mc-rival-metric__label">{m.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mc-rival-danger-label">Strefy Zagrożenia</div>
      <div className="mc-rival-pitch-map">
        <div className="mc-rival-heat" style={{ left:'8%', top:'12%', width:'28%', height:'38%', background:'rgba(248,113,113,0.22)', borderColor:'rgba(248,113,113,0.4)' }} />
        <div className="mc-rival-heat" style={{ left:'34%', top:'5%', width:'32%', height:'28%', background:'rgba(250,204,21,0.14)', borderColor:'rgba(250,204,21,0.3)' }} />
        <div className="mc-rival-heat" style={{ right:'8%', top:'16%', width:'22%', height:'28%', background:'rgba(248,113,113,0.14)', borderColor:'rgba(248,113,113,0.28)' }} />
        <div className="mc-rival-pitch-goal-top" />
        <div className="mc-rival-pitch-penalty-top" />
      </div>
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
  const [aiChat, setAiChat] = useState([
    { role: "assistant", text: "Gotów do analizy. Zadaj mi pytanie o taktykę, zmiany lub statystyki, by uzyskać poradę." }
  ]);

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    setAiChat(prev => [...prev, { role: "user", text: aiInput }, { role: "assistant", text: "Analizuję aktualne dane meczowe... Zespół potrzebuje lepszego utrzymania piłki w drugiej linii." }]);
    setAiInput("");
  };

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
          <button className="mc-tactics-btn" onClick={onFinish}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_horiz</span>
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
          </div>
          <div className="mc-pitch-box mc-pitch-box--compact">
            <MiniPitch
              team={currentTeam}
              players={homePlayers}
              isOpp={false}
              getPlayerPhoto={getPlayerPhoto}
            />
          </div>
          <div className="mc-compact-lineup-wrapper">
            <CompactLineupList players={homePlayers} />
          </div>
        </div>

        {/* ── ATTACK DIRECTIONS – osobna karta w gridzie ── */}
        <AttackDirectionsPanel />

        {/* ── COL 2: MATCH CENTER ── */}
        <div className="mc-col mc-col-mid">

          {/* Key Stats & Action Zones */}
          <div className="mc-stats-zone">
            <div className="mc-zone-label">Kluczowe Statystyki</div>
            <div className="mc-stats-grid">
              <StatBar label="Posiadanie" homeVal={stats.homePoss} awayVal={stats.awayPoss} homeDisplay={`${stats.homePoss}%`} awayDisplay={`${stats.awayPoss}%`} />
              <StatBar label="Celność Podań" homeVal={stats.homePass} awayVal={stats.awayPass} homeDisplay={`${stats.homePass}%`} awayDisplay={`${stats.awayPass}%`} />
              <StatBar label="Strzały (Celne)" homeVal={stats.homeShots} awayVal={stats.awayShots} homeDisplay={`${stats.homeShots} (${stats.homeShotsOn})`} awayDisplay={`${stats.awayShots} (${stats.awayShotsOn})`} />
              <StatBar label="xG (Oczekiwane)" homeVal={(stats.homeShots * 0.11).toFixed(2)} awayVal={(stats.awayShots * 0.11).toFixed(2)} />
            </div>

            <div className="mc-action-zones-wrapper" style={{ marginTop: '20px' }}>
              <div className="mc-zone-label">Strefy Akcji (Ostatnie 15')</div>
              <div className="mc-action-zones">
                <div className="mc-zone-part" style={{ flex: 20, background: 'rgba(248,113,113,0.15)', color: 'rgba(248,113,113,0.9)' }}>20%</div>
                <div className="mc-zone-part" style={{ flex: 55, background: 'rgba(255,255,255,0.05)' }}>55%</div>
                <div className="mc-zone-part" style={{ flex: 25, background: 'rgba(74,222,128,0.15)', color: 'rgba(74,222,128,0.9)' }}>25%</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '6px', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Obrona</span><span>Środek</span><span>Atak</span>
              </div>
            </div>
          </div>

          {/* Momentum */}
          <div className="mc-momentum-zone mc-momentum-zone--hero">
            <div className="mc-zone-label">Momentum Meczu</div>
            <MomentumChart snapshots={momentum} />
          </div>

          {/* Expanded Feed */}
          <div className="mc-feed-zone mc-feed-zone--hero" style={{ paddingTop: '12px' }}>
            <div className="mc-feed-label">Komentarz na żywo</div>
            <div className="mc-feed-list mc-feed-list--large">
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
              players={awayPlayers}
              isOpp={true}
              getPlayerPhoto={getPlayerPhoto}
            />
          </div>
          <div className="mc-compact-lineup-wrapper">
            <CompactLineupList players={awayPlayers} />
          </div>
        </div>

        {/* ── RIVAL ANALYSIS – osobna karta w gridzie ── */}
        <RivalAnalysisPanel />

        {/* ── COL 4: AI Command Center ── */}
        <div className="mc-col mc-col-ai">
          <section className="mc-AI-win">
            {/* Messages */}
            <div className="mc-messages-container">
              {aiChat.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.6, gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.2)' }}>sports_soccer</span>
                  <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>TACTIX AI</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Zadaj pytanie o mecz</span>
                </div>
              ) : (
                aiChat.map((msg, idx) => (
                  <div key={idx} className={`mc-message-bubble ${msg.role}`}>
                    {msg.text}
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="mc-inp">
              <input
                type="text"
                className="mc-inp__field"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Zapytaj o sytuację na boisku..."
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
              />
              <span
                className={`material-symbols-outlined mc-inp__send ${!aiInput.trim() ? 'disabled' : ''}`}
                onClick={handleAiSend}
              >
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
