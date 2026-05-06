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

const SAMPLE_EVENTS = [
  { min: 3,  text: "Genialna interwencja Bramkarza zatrzymuje uderzenie Larghalline!", type: "normal" },
  { min: 19, text: "Cucurella zapisany w notesie arbitra. Musi teraz uważać.", type: "card" },
  { min: 23, text: "Akcja przerwana. Sędzia boczny podnosi chorągiewkę — James nie spełniony.", type: "normal" },
  { min: 26, text: "Brzydki faul Chalobah. Sędzia udziela mu ustnego upomnienia.", type: "card" },
  { min: 30, text: "Niecelne uderzenie Colwill. To była dobra okazja do objęcia prowadzenia.", type: "normal" },
  { min: 32, text: "Zła decyzja Wellenreuther. Strzelał w trybuny.", type: "normal" },
];

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
  
  /* ─── Match State (Lifted) ─── */
  const [matchTime, setMatchTime] = useState(0);
  const [matchScore, setMatchScore] = useState({ home: 0, away: 0 });
  const [matchEvents, setMatchEvents] = useState([]);
  const [isMatchFinished, setIsMatchFinished] = useState(false);
  const [matchMomentum, setMatchMomentum] = useState([]);
  const [matchStats, setMatchStats] = useState({
    homePoss: 50, awayPoss: 50,
    homeShots: 0, awayShots: 0,
    homeShotsOn: 0, awayShotsOn: 0,
    homePass: 84, awayPass: 79,
    homeFouls: 0, awayFouls: 0,
    homeCorners: 0, awayCorners: 0,
    homeYellow: 0, awayYellow: 0,
    homeRed: 0, awayRed: 0,
    homeOffsides: 0, awayOffsides: 0,
    homeSaves: 0, awaySaves: 0,
    homeBlocks: 0, awayBlocks: 0,
    homeCrosses: 0, awayCrosses: 0,
    homeTackles: 0, awayTackles: 0,
    homeAerial: 0, awayAerial: 0,
  });
  
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);
  
  const ratingsRef = useRef({});
  const timerRef = useRef(null);

  /* Init/Update players when match starts or teams change */
  useEffect(() => {
    const getPlayers = (team) => {
      if (!team) return [];
      let starters = team.zawodnicy?.filter(p => p.isStarting) || [];
      if (starters.length === 0) starters = team.zawodnicy?.slice(0, 11) || [];
      
      return starters.map((p, i) => {
        const id = p.id ?? i;
        if (!ratingsRef.current[id]) {
          ratingsRef.current[id] = 6.6 + Math.random() * 0.8;
        }
        return {
          id,
          name: p.imie_nazwisko || "?",
          shortName: p.imie_nazwisko?.split(" ").pop() || "?",
          pos: p.pozycja_glowna || "?",
          num: p.numer ?? p.numer_koszulki ?? (i + 1),
          rating: ratingsRef.current[id],
        };
      });
    };
    setHomePlayers(getPlayers(currentTeam));
    setAwayPlayers(getPlayers(opponentTeam));
  }, [currentTeam, opponentTeam]);

  const handleMinuteTick = (t) => {
    const r = Math.random();
    const sample = SAMPLE_EVENTS.find(e => e.min === t);
    if (sample) {
      setMatchEvents(prev => [sample, ...prev]);
      if (sample.type === "card") setMatchStats(s => ({ ...s, homeYellow: s.homeYellow + 1 }));
    }

    if (r < 0.04) {
      const isHome = Math.random() > 0.5;
      if (isHome) {
        setMatchScore(s => ({ ...s, home: s.home + 1 }));
        setMatchEvents(prev => [{ min: t, text: `GOL! ${currentTeam?.nazwa || "Gospodarz"} obejmuje prowadzenie!`, type: "goal" }, ...prev]);
      } else {
        setMatchScore(s => ({ ...s, away: s.away + 1 }));
        setMatchEvents(prev => [{ min: t, text: `GOL! ${opponentTeam?.nazwa || "Gość"} wyrównuje!`, type: "goal" }, ...prev]);
      }
      setMatchStats(s => isHome
        ? { ...s, homeShots: s.homeShots + 1, homeShotsOn: s.homeShotsOn + 1 }
        : { ...s, awayShots: s.awayShots + 1, awayShotsOn: s.awayShotsOn + 1 });
    } else if (r < 0.10) {
      const isHome = Math.random() > 0.5;
      setMatchStats(s => isHome ? { ...s, homeShots: s.homeShots + 1 } : { ...s, awayShots: s.awayShots + 1 });
    }
    
    if (t % 3 === 0) {
      setMatchMomentum(prev => [...prev, { home: Math.random() * 6 + 2, away: Math.random() * 6 + 2 }]);
    }
  };

  /* ─── Live Coaching Clock ─── */
  useEffect(() => {
    if (isMatchFinished) return;
    
    const interval = isSimulating ? 1000 : 10000; // Normal match (1s) vs Slow coaching (10s)
    
    if (matchTime > 0 || isSimulating) {
      timerRef.current = setInterval(() => {
        setMatchTime(prev => {
          if (prev >= 90) {
            clearInterval(timerRef.current);
            setIsMatchFinished(true);
            return 90;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => clearInterval(timerRef.current);
  }, [isSimulating, isMatchFinished, matchTime]);

  /* ─── Side effects of time passing ─── */
  useEffect(() => {
    if (matchTime > 0 && !isMatchFinished) {
      handleMinuteTick(matchTime);
    }
  }, [matchTime]);



  if (!currentTeam) return null;

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
