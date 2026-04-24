import { useState, useRef, useEffect } from "react";
import PitchWindow from "./PitchWindow";
import "../styles/MainWindow/css/main-window.css";
import AIWindow from "./AIWindow";
import NoteEditor from "./Noteeditor";
import PlayerList from "./PlayerList";
import TacticsPanel from "./TacticsPanel";
import PlayerTacticsPanel from "./PlayerTacticsPanel";
import { useGame } from "../context/GameContext";



function MainWindow() {
  const { currentTeam, opponentTeam, setCurrentTeam, setOpponentTeam, getClubLogo } = useGame();
  const [activeTab, setActiveTab] = useState("Zawodnicy");
  const [pitchView, setPitchView] = useState("team");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!currentTeam) return null;

  const activeTeam = pitchView === "opponent" ? (opponentTeam || currentTeam) : currentTeam;
  const isOppView = pitchView === "opponent";
  const logoSrc = getClubLogo(activeTeam.logo, activeTeam.nazwa);

  const handleBackToMenu = () => {
    setCurrentTeam(null);
    setOpponentTeam(null);
  };

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
              <span className="league-info">#2 Eredivisie</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button className="simulate-btn">
            <span className="material-symbols-outlined" style={{ color: '#4CAF50', fontSize: '20px' }}>play_arrow</span>
            Rozpocznij symulację
          </button>
          <div className="header-menu-container" ref={menuRef}>
            <button 
              className={`menu-trigger-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Menu"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>

            {isMenuOpen && (
              <div className="header-dropdown-menu">
                <button className="menu-item" onClick={() => { handleBackToMenu(); setIsMenuOpen(false); }}>
                  <span className="material-symbols-outlined">logout</span>
                  Wróć do menu
                </button>
                <button className="menu-item" onClick={() => setIsMenuOpen(false)}>
                  <span className="material-symbols-outlined">settings</span>
                  Ustawienia
                </button>
                <button className="menu-item" onClick={() => setIsMenuOpen(false)}>
                  <span className="material-symbols-outlined">help</span>
                  Pomoc
                </button>
              </div>
            )}
          </div>
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
            <p className={activeTab === "Taktyka" ? "active" : ""} onClick={() => setActiveTab("Taktyka")}>Taktyka</p>
            <p className={activeTab === "Wytyczne" ? "active" : ""} onClick={() => setActiveTab("Wytyczne")}>Wytyczne</p>
            <p className={activeTab === "Notatki" ? "active" : ""} onClick={() => setActiveTab("Notatki")}>Notatki</p>
          </nav>
          
          <div className="content-wrapper">
            <div className="main-panel">
              {activeTab === "Zawodnicy" && <PlayerList team={activeTeam} />}
              {activeTab === "Taktyka" && <TacticsPanel isOpponent={isOppView} />}
              {activeTab === "Wytyczne" && <PlayerTacticsPanel isOpponent={isOppView} />}
              {activeTab === "Notatki" && <NoteEditor />}
            </div>
          </div>
        </section>

        <section className="right-sec ai-panel-container">
          <AIWindow />
        </section>
      </main>
    </div>
  );
}

export default MainWindow;
