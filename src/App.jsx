import { useState, useEffect } from "react";
import "./App.css";
import StartScreen from "./Components/StartScreen";
import ClubSelection from "./Components/ClubSelection";
import CustomClubForm from "./Components/CustomClubForm";
import MainWindow from "./Components/MainWindow";
import { useGame } from "./context/GameContext";

function App() {
  const { currentTeam, isLoadingDb } = useGame();
  const [screen, setScreen] = useState(0); // 0: Start, 1: ClubSelection, 2: CustomOwn, 3: CustomOpp, 4: Main
  
  useEffect(() => {
    if (!currentTeam && screen !== 2 && screen !== 3) {
      setScreen(0);
    }
  }, [currentTeam, screen]);

  if (isLoadingDb) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: 'white', backgroundColor: '#1a1a2e' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
        <h2>Pobieranie danych z bazy...</h2>
        <p style={{ opacity: 0.7 }}>Trwa ładowanie drużyn i zawodników</p>
      </div>
    );
  }

  // If we have a team and we are NOT in the middle of custom creation, show MainWindow
  if (currentTeam && screen !== 3 && screen !== 2) {
    return <MainWindow />;
  }

  if (screen === 0) {
    return <StartScreen onNext={() => setScreen(1)} onCreate={() => setScreen(2)} />;
  }

  if (screen === 2) {
    return <CustomClubForm key="own-club" isOpponentMode={false} onBack={() => setScreen(0)} onComplete={() => setScreen(3)} />;
  }

  if (screen === 3) {
    return <CustomClubForm key="opp-club" isOpponentMode={true} onBack={() => setScreen(2)} onComplete={() => setScreen(4)} />;
  }

  return <ClubSelection onBack={() => setScreen(0)} />;
}

export default App;
