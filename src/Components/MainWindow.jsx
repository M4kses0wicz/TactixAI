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
const assetImages = import.meta.glob('../assets/*.png', { eager: true });

function getLogoSrc(logoName) {
  if (!logoName) return null;
  const lowerLogo = logoName.toLowerCase();
  const match = Object.entries(assetImages).find(([path]) => path.toLowerCase().endsWith(`/${lowerLogo}`));
  return match ? match[1].default : null;
}

function MainWindow() {
  const { currentTeam, setCurrentTeam } = useGame();
  const [activeTab, setActiveTab] = useState("Zawodnicy");
  const [pitchView, setPitchView] = useState("team");

  if (!currentTeam) return null;

  const logoSrc = getLogoSrc(currentTeam.logo);

  return (
    <>
      <main>
        <section className="left-sec">
          <div className="header-container">
            {logoSrc && <img src={logoSrc} alt="logo" />}
            <p>{currentTeam.nazwa}</p>
          </div>
          <PitchWindow view={pitchView} onViewChange={setPitchView} />
        </section>
        <section className="right-sec">
          <nav>
            <p onClick={() => setActiveTab("Zawodnicy")} style={{ cursor: "pointer", color: activeTab === "Zawodnicy" ? "white" : "#777" }}>Zawodnicy</p>
            <p onClick={() => setActiveTab("Taktyka")} style={{ cursor: "pointer", color: activeTab === "Taktyka" ? "white" : "#777" }}>Taktyka</p>
            <p onClick={() => setActiveTab("Wytyczne")} style={{ cursor: "pointer", color: activeTab === "Wytyczne" ? "white" : "#777" }}>Wytyczne</p>
            <p onClick={() => setActiveTab("Notatki")} style={{ cursor: "pointer", color: activeTab === "Notatki" ? "white" : "#777" }}>Notatki</p>
          </nav>
          <div className="wrapper">
            <div className="components-holder l">
              {activeTab === "Zawodnicy" && <PlayerList isOpponent={pitchView === "opponent"} />}
              {activeTab === "Taktyka" && <TacticsPanel isOpponent={pitchView === "opponent"} />}
              {activeTab === "Wytyczne" && <PlayerTacticsPanel isOpponent={pitchView === "opponent"} />}
              {activeTab === "Notatki" && <NoteEditor />}
            </div>
            <div className="ai-win-container r">
              <AIWindow />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default MainWindow;
