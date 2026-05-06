import { useState, useRef, useEffect } from "react";
import PitchWindow from "./PitchWindow";
import "../styles/MainWindow/css/main-window.css";
import AIWindow from "./AIWindow";
import NoteEditor from "./Noteeditor";
import PlayerList from "./PlayerList";
import TacticsPanel from "./TacticsPanel";
import PlayerTacticsPanel from "./PlayerTacticsPanel";
import { useGame } from "../context/GameContext";



import SimulationWindow from "./SimulationWindow";
import ExitConfirmationModal from "./ExitConfirmationModal";
import personIcon from "../assets/user-icon.png";

const API = "http://127.0.0.1:8000";
// SESSION_ID jest stały przez cały czas życia aplikacji (nie resetuje się przy re-renderach)
const SESSION_ID = (() => {
  let id = sessionStorage.getItem("tactix_session_id");
  if (!id) { id = "match_" + Date.now(); sessionStorage.setItem("tactix_session_id", id); }
  return id;
})();

function MainWindow() {
  const [pitchView, setPitchView] = useState("team");
  const [isSimulating, setIsSimulating] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  
  const { 
    currentTeam, 
    opponentTeam, 
    setCurrentTeam, 
    setOpponentTeam, 
    getClubLogo, 
    activeTab, 
    setActiveTab,
    saveCurrentGame
  } = useGame();
  
  /* ─── Match State (zasilany przez CoreMatchEngine API) ─── */
  const [matchTime, setMatchTime] = useState(0);
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });
  const [matchEvents, setMatchEvents] = useState([]);
  const [isMatchFinished, setIsMatchFinished] = useState(false);
  const [matchMomentum, setMatchMomentum] = useState([]);
  const [matchStats, setMatchStats] = useState({
    homePoss: 50, awayPoss: 50,
    homeShots: 0, awayShots: 0,
    homeShotsOn: 0, awayShotsOn: 0,
    homePass: 0, awayPass: 0,
    homeFouls: 0, awayFouls: 0,
    homeCorners: 0, awayCorners: 0,
    homeYellow: 0, awayYellow: 0,
    homeRed: 0, awayRed: 0,
    homeXG: 0, awayXG: 0,
    homeActionZones: { defense: 33, midfield: 34, attack: 33 },
    awayActionZones: { defense: 33, midfield: 34, attack: 33 },
    homeAttackDir: { left: 33, center: 34, right: 33 },
    awayAttackDir: { left: 33, center: 34, right: 33 },
  });

  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  const [engineReady, setEngineReady] = useState(false);
  const timerRef = useRef(null);

  /* ─── Pomocnicze: aktualizuj cały stan z payloadu API ─── */
  const applyStats = (stats, newEvents = []) => {
    const h = stats.home;
    const a = stats.away;
    setMatchTime(stats.minute);
    setMatchScore({ home: stats.score_home, away: stats.score_away });
    if (stats.is_finished) setIsMatchFinished(true);
    setMatchStats({
      homePoss: h.possession_pct,    awayPoss: a.possession_pct,
      homeShots: h.shots_total,       awayShots: a.shots_total,
      homeShotsOn: h.shots_on_target, awayShotsOn: a.shots_on_target,
      homePass: h.pass_accuracy_pct,  awayPass: a.pass_accuracy_pct,
      homeFouls: h.fouls,             awayFouls: a.fouls,
      homeCorners: h.corners,         awayCorners: a.corners,
      homeYellow: h.yellow_cards,     awayYellow: a.yellow_cards,
      homeRed: h.red_cards,           awayRed: a.red_cards,
      homeXG: h.cumulative_xg,        awayXG: a.cumulative_xg,
      homeActionZones: h.action_zones_pct,
      awayActionZones: a.action_zones_pct,
      homeAttackDir: h.attack_directions_pct,
      awayAttackDir: a.attack_directions_pct,
    });
    if (stats.momentum?.length) {
      setMatchMomentum(stats.momentum.map(m => ({ home: m.home, away: m.away })));
    }
    // Oceny zawodników
    const mapPlayers = (arr) => arr.map(p => ({
      id: p.id, name: p.name,
      shortName: p.name?.split(" ").pop() || "?",
      pos: p.pos, rating: p.rating, stamina: p.stamina,
      goals: p.goals,
    }));
    setHomePlayers(mapPlayers(h.player_ratings || []));
    setAwayPlayers(mapPlayers(a.player_ratings || []));
    // Zdarzenia – dodaj nowe na górę
    if (newEvents.length) {
      setMatchEvents(prev => [
        ...newEvents.map(e => ({ min: e.min, text: e.text, type: e.type })).reverse(),
        ...prev,
      ]);
    }
  };

  /* ─── Start symulacji: POST /api/simulate/start ─── */
  const startSimulation = async () => {
    try {
      const res = await fetch(`${API}/api/simulate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: SESSION_ID,
          homeTeam: currentTeam,
          awayTeam: opponentTeam,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        applyStats(data.stats);
        setEngineReady(true);
      } else {
        console.error("Simulate start error:", data.error);
        setEngineReady(false);
      }
    } catch (e) {
      console.error("Cannot reach simulation API:", e);
      setEngineReady(false);
    }
  };

  /* ─── Tick: POST /api/simulate/tick ─── */
  const doTick = async () => {
    try {
      const res = await fetch(`${API}/api/simulate/tick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: SESSION_ID, ticks: 10 }),
      });
      const data = await res.json();
      if (data.ok) {
        applyStats(data.stats, data.new_events || []);
        if (data.finished) {
          clearInterval(timerRef.current);
          setIsMatchFinished(true);
        }
      }
    } catch (e) {
      console.error("Tick error:", e);
    }
  };

  /* ─── Uruchom silnik gdy isSimulating=true ─── */
  useEffect(() => {
    if (!isSimulating) {
      clearInterval(timerRef.current);
      return;
    }
    if (isMatchFinished) return;

    // Synchronizuj taktykę przed wznowieniem/startem
    const syncTactics = async () => {
      try {
        await fetch(`${API}/api/simulate/tactics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: SESSION_ID,
            homeTeam: currentTeam,
            awayTeam: opponentTeam,
          }),
        });
      } catch (e) {
        console.warn("Tactics sync failed, but continuing...", e);
      }
    };

    // Przy pierwszym wejściu w symulację: zainicjuj silnik lub wznów
    const run = async () => {
      if (matchTime === 0) {
        await startSimulation();
      } else {
        // Jeśli mecz już trwa, upewnij się że backend ma najnowszą taktykę (zmiany w przerwie)
        await syncTactics();
      }
      
      // Startujemy interwał dopiero gdy silnik gotowy (lub już był)
      timerRef.current = setInterval(doTick, 1200); 
    };

    run();

    return () => clearInterval(timerRef.current);
  }, [isSimulating]);



  if (!currentTeam || !currentTeam.zawodnicy) {
    console.warn("MainWindow: Brak currentTeam lub zawodników!", currentTeam);
    return null;
  }

  const activeTeam = pitchView === "opponent" ? (opponentTeam || currentTeam) : currentTeam;
  const isOppView = pitchView === "opponent";
  const logoSrc = getClubLogo(activeTeam.logo, activeTeam.nazwa);

  const handleBackToMenu = () => {
    setShowExitModal(true);
  };

  const confirmExitWithoutSave = () => {
    setCurrentTeam(null);
    setOpponentTeam(null);
    setShowExitModal(false);
  };

  const confirmSaveAndExit = () => {
    const type = currentTeam?.isCustom ? "custom" : "existing";
    saveCurrentGame(type);
    setCurrentTeam(null);
    setOpponentTeam(null);
    setShowExitModal(false);
  };

  if (isSimulating) {
    return (
      <SimulationWindow 
        onFinish={() => setIsSimulating(false)} 
        sessionId={SESSION_ID}
        time={matchTime}
        score={matchScore}
        events={matchEvents}
        isFinished={isMatchFinished}
        momentum={matchMomentum}
        stats={matchStats}
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
      />
    );
  }

  return (
    <div className="main-container">
      <header className="main-header">
        <div className="header-left">
          <div className="team-info">
            {logoSrc && <img src={logoSrc} alt="logo" className="header-logo" />}
            <div className="team-text">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1>{activeTeam.nazwa}</h1>
                {isOppView && <span className="opponent-badge">PRZECIWNIK</span>}
              </div>
              <span className="league-info">{activeTeam.liga}</span>
            </div>
          </div>
        </div>

        {/* ── CENTRAL MATCH HUB ── */}
        {matchTime > 0 && (
          <div className="header-center">
            <div className="header-match-status">
              <div className="h-match-logos-row">
                {getClubLogo(currentTeam?.logo, currentTeam?.nazwa) && (
                  <img src={getClubLogo(currentTeam?.logo, currentTeam?.nazwa)} alt="" className="h-small-logo" />
                )}
                <div className="h-score">{matchScore.home} : {matchScore.away}</div>
                {getClubLogo(opponentTeam?.logo, opponentTeam?.nazwa) && (
                  <img src={getClubLogo(opponentTeam?.logo, opponentTeam?.nazwa)} alt="" className="h-small-logo" />
                )}
              </div>
              <div className={`h-time-pill ${isMatchFinished ? "finished" : ""}`}>
                {isMatchFinished ? "KONIEC" : `${matchTime}'`}
              </div>
            </div>
          </div>
        )}
        
        <div className="header-right">
          {matchTime === 0 ? (
            <button className="simulate-btn" onClick={() => setIsSimulating(true)}>
              <span className="material-symbols-outlined" style={{ color: '#4CAF50', fontSize: '20px' }}>play_arrow</span>
              Rozpocznij symulację
            </button>
          ) : (
            <button className="simulate-btn" onClick={() => setIsSimulating(true)}>
              <span className="material-symbols-outlined" style={{ color: '#4CAF50', fontSize: '20px' }}>sports_soccer</span>
              Mecz
            </button>
          )}
          <button 
            className="menu-trigger-btn"
            onClick={handleBackToMenu}
            title="Wróć do menu"
            style={{ color: '#ff4b4b', borderColor: 'rgba(255, 75, 75, 0.3)' }}
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="left-sec">
          <nav className="tab-nav">
            <p 
              className={pitchView === "team" ? "active" : ""} 
              onClick={() => setPitchView("team")}
            >
              Twój skład
            </p>
            <p 
              className={pitchView === "opponent" ? "active" : ""} 
              onClick={() => setPitchView("opponent")}
            >
              Przeciwnik
            </p>
          </nav>
          <div className="pitch-content-wrapper">
            <PitchWindow team={activeTeam} isOpponent={isOppView} key={`${activeTeam.id}-${pitchView}`} />
          </div>
        </section>
        
        <section className="mid-sec">
          <nav className="tab-nav">
            <p className={activeTab === "Zawodnicy" ? "active" : ""} onClick={() => setActiveTab("Zawodnicy")}>Zawodnicy</p>
            <p className={activeTab === "Taktyka" ? "active" : ""} onClick={() => setActiveTab("Taktyka")}>
              Taktyka {(isOppView && !currentTeam?.isCustom) && <span className="material-symbols-outlined" style={{fontSize: '14px', marginLeft: '5px'}}>lock</span>}
            </p>
            <p className={activeTab === "Wytyczne" ? "active" : ""} onClick={() => setActiveTab("Wytyczne")}>
              Wytyczne {(isOppView && !currentTeam?.isCustom) && <span className="material-symbols-outlined" style={{fontSize: '14px', marginLeft: '5px'}}>lock</span>}
            </p>
            <p className={activeTab === "Notatki" ? "active" : ""} onClick={() => setActiveTab("Notatki")}>
              Notatki {(isOppView && !currentTeam?.isCustom) && <span className="material-symbols-outlined" style={{fontSize: '14px', marginLeft: '5px'}}>lock</span>}
            </p>
          </nav>
          
          <div className="content-wrapper">
            <div className={`main-panel ${activeTab === "Notatki" ? "main-panel--no-scroll" : ""}`}>
              {activeTab === "Zawodnicy" && <PlayerList team={activeTeam} isOpponent={isOppView} />}
              {activeTab === "Taktyka" && <TacticsPanel isOpponent={isOppView && !currentTeam?.isCustom} />}
              {activeTab === "Wytyczne" && <PlayerTacticsPanel isOpponent={isOppView && !currentTeam?.isCustom} />}
              {activeTab === "Notatki" && <NoteEditor team={activeTeam} isOpponent={isOppView && !currentTeam?.isCustom} />}
            </div>
          </div>
        </section>

        <section className="right-sec ai-panel-container">
          <AIWindow />
        </section>
      </main>

      {showExitModal && (
        <ExitConfirmationModal 
          onCancel={() => setShowExitModal(false)}
          onExitWithoutSave={confirmExitWithoutSave}
          onSaveAndExit={confirmSaveAndExit}
        />
      )}
    </div>
  );
}

export default MainWindow;
