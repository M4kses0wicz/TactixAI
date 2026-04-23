import { useState } from "react";
import PitchWindow from "./PitchWindow";
import "../styles/MainWindow/css/main-window.css";
import AIWindow from "./AIWindow";
import NoteEditor from "./Noteeditor";
import PlayerList from "./PlayerList";
import TacticsPanel from "./TacticsPanel";
import PlayerTacticsPanel from "./PlayerTacticsPanel";
import { useGame } from "../context/GameContext";

// Pre-load all images from assets folder for dynamic resolution
const assetImages = import.meta.glob('../assets/**/*.svg', { eager: true });
const pngImages = import.meta.glob('../assets/**/*.png', { eager: true });
const allImages = { ...assetImages, ...pngImages };

function getLogoSrc(logoName) {
  if (!logoName) return null;
  const lowerLogo = logoName.toLowerCase();
  
  // First check in /clubs/
  let match = Object.entries(allImages).find(([path]) => path.toLowerCase().includes(`/clubs/${lowerLogo}`));
  if (match) return match[1].default;
  
  // Then check in root assets
  match = Object.entries(allImages).find(([path]) => path.toLowerCase().endsWith(`/${lowerLogo}`));
  return match ? match[1].default : null;
}

function MainWindow() {
  const { currentTeam, opponentTeam, setCurrentTeam, setOpponentTeam } = useGame();
  const [activeTab, setActiveTab] = useState("Zawodnicy");
  const [pitchView, setPitchView] = useState("team");

  if (!currentTeam) return null;

  const displayTeam = pitchView === "opponent" ? (opponentTeam || currentTeam) : currentTeam;
  const logoSrc = getLogoSrc(displayTeam.logo);

  const handleBackToMenu = () => {
    setCurrentTeam(null);
    setOpponentTeam(null);
  };

  return (
    <div className="main-container">
      {/* Background Watermark Logo */}
      <div className="bg-watermark">
        {logoSrc && <img src={logoSrc} alt="" />}
      </div>

      <header className="main-header">
        <div className="header-left">
          <div className="team-info">
            {logoSrc && <img src={logoSrc} alt="logo" className="header-logo" />}
            <div className="team-text">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1>{displayTeam.nazwa}</h1>
                {pitchView === "opponent" && <span className="opponent-badge">PRZECIWNIK</span>}
              </div>
              <span className="league-info">#2 Eredivisie</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="back-btn"
            onClick={handleBackToMenu}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '5px' }}>arrow_back</span>
            Wróć do menu
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
            <PitchWindow view={pitchView} />
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
              {activeTab === "Zawodnicy" && <PlayerList isOpponent={pitchView === "opponent"} />}
              {activeTab === "Taktyka" && <TacticsPanel isOpponent={pitchView === "opponent"} />}
              {activeTab === "Wytyczne" && <PlayerTacticsPanel isOpponent={pitchView === "opponent"} />}
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
