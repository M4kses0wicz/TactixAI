import { useState, useEffect } from "react";
import "./App.css";
import StartScreen from "./Components/StartScreen";
import ClubSelection from "./Components/ClubSelection";
import CustomClubForm from "./Components/CustomClubForm";
import MainWindow from "./Components/MainWindow";
import { useGame } from "./context/GameContext";

function App() {
  const { currentTeam } = useGame();
  const [screen, setScreen] = useState(0); // 0: Start, 1: ClubSelection, 2: CustomClubForm
  
  useEffect(() => {
    if (!currentTeam) {
      setScreen(0);
    }
  }, [currentTeam]);

  if (currentTeam) {
    return <MainWindow />;
  }

  if (screen === 0) {
    return <StartScreen onNext={() => setScreen(1)} onCreate={() => setScreen(2)} />;
  }

  if (screen === 2) {
    return <CustomClubForm onBack={() => setScreen(0)} onComplete={() => setScreen(1)} />;
  }

  return <ClubSelection onBack={() => setScreen(0)} />;
}

export default App;
