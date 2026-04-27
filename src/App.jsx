import { useState, useEffect } from "react";
import "./App.css";
import StartScreen from "./Components/StartScreen";
import ClubSelection from "./Components/ClubSelection";
import CustomClubForm from "./Components/CustomClubForm";
import MainWindow from "./Components/MainWindow";
import { useGame } from "./context/GameContext";

function App() {
  const { currentTeam, isLoadingDb } = useGame();
  const [screen, setScreen] = useState(0); // 0: Start, 1: ClubSelection, 2: CustomClubForm
  
  useEffect(() => {
    if (!currentTeam) {
      setScreen(0);
    }
  }, [currentTeam]);

  if (isLoadingDb) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: 'white', backgroundColor: '#1a1a2e' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚽</div>
        <h2>Pobieranie danych z bazy...</h2>
        <p style={{ opacity: 0.7 }}>Trwa ładowanie drużyn i zawodników</p>
      </div>
    );
  }

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
