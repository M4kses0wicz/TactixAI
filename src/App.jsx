import { useState, useEffect } from "react";
import "./App.css";
import StartScreen from "./Components/StartScreen";
import ClubSelection from "./Components/ClubSelection";
import CustomClubForm from "./Components/CustomClubForm";
import MainWindow from "./Components/MainWindow";
import SaveSelectionScreen from "./Components/SaveSelectionScreen";
import { useGame } from "./context/GameContext";

function App() {
  const { currentTeam, isLoadingDb, loadSavedGame, setActiveSaveId } = useGame();
  const [screen, setScreen] = useState(0); 
  // 0: Start
  // 1: SaveSelection (Existing)
  // 2: ClubSelection
  // 3: SaveSelection (Custom)
  // 4: CustomOwn
  // 5: CustomOpp
  // 6: Main (handled by currentTeam)
  
  useEffect(() => {
    if (!currentTeam) {
      const selectionScreens = [1, 2, 3, 4, 5];
      if (!selectionScreens.includes(screen)) {
        setScreen(0);
      }
    }
  }, [currentTeam]); // Only depend on currentTeam to prevent loops

  // If we have a team and we are NOT in the middle of custom creation or selection, show MainWindow
  useEffect(() => {
    if (currentTeam) {
      console.log("App: CurrentTeam changed", currentTeam.nazwa, "Zawodnicy:", currentTeam.zawodnicy?.length);
    }
  }, [currentTeam]);

  if (currentTeam && currentTeam.zawodnicy && currentTeam.zawodnicy.length > 0 && screen !== 4 && screen !== 5 && screen !== 2) {
    return <MainWindow />;
  }

  if (screen === 0) {
    return (
      <StartScreen 
        onNext={() => setScreen(1)} 
        onCreate={() => setScreen(3)} 
        isLoading={isLoadingDb} 
      />
    );
  }

  if (screen === 1) {
    return (
      <SaveSelectionScreen 
        key="save-sel-v3-existing"
        type="existing"
        onBack={() => setScreen(0)}
        onNew={() => { setActiveSaveId(null); setScreen(2); }}
        onContinue={(save) => loadSavedGame(save)}
      />
    );
  }

  if (screen === 3) {
    return (
      <SaveSelectionScreen 
        key="save-sel-v3-custom"
        type="custom"
        onBack={() => setScreen(0)}
        onNew={() => { setActiveSaveId(null); setScreen(4); }}
        onContinue={(save) => loadSavedGame(save)}
      />
    );
  }

  if (screen === 4) {
    return <CustomClubForm key="own-club" isOpponentMode={false} onBack={() => setScreen(3)} onComplete={() => setScreen(5)} />;
  }

  if (screen === 5) {
    return <CustomClubForm key="opp-club" isOpponentMode={true} onBack={() => setScreen(4)} onComplete={() => setScreen(0)} />;
  }

  return <ClubSelection onBack={() => setScreen(1)} onComplete={() => setScreen(0)} />;
}

export default App;
