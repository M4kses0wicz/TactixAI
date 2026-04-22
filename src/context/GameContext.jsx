import React, { createContext, useContext, useState, useEffect } from "react";
import initialData from "../data/initialData.json";
import personIcon from "../assets/user-icon.png";

// Dynamically load all player photos from assets/players directory
const playerPhotosRaw = import.meta.glob('../assets/players/*.{png,jpg,jpeg}', { eager: true });
const playerPhotos = {};
for (const path in playerPhotosRaw) {
  const filename = path.split('/').pop().replace(/\.(png|jpg|jpeg)$/, '');
  // Normalize filename for easier matching (e.g., spaces to underscores or just keep spaces)
  // We'll store both exact match and a version with underscores replacing spaces
  playerPhotos[filename] = playerPhotosRaw[path].default;
  playerPhotos[filename.replace(/_/g, ' ')] = playerPhotosRaw[path].default;
}

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [db, setDb] = useState(() => {
    const saved = localStorage.getItem("tactixai_db");
    const parsedDb = saved ? JSON.parse(saved) : initialData.druzyny;
    
    // Ensure all teams have structural data so the app doesn't crash
    if (parsedDb.length > 0) {
      const template = initialData.druzyny[0];
      return parsedDb.map(team => ({
        ...team,
        taktyka_druzyny: team.taktyka_druzyny || template.taktyka_druzyny,
        formacje: team.formacje?.length > 0 ? team.formacje : template.formacje,
        opcje_taktyczne: team.opcje_taktyczne && Object.keys(team.opcje_taktyczne).length > 0 ? team.opcje_taktyczne : template.opcje_taktyczne,
        role_zawodnikow: team.role_zawodnikow && Object.keys(team.role_zawodnikow).length > 0 ? team.role_zawodnikow : template.role_zawodnikow,
        zawodnicy: team.zawodnicy?.length > 0 ? team.zawodnicy : JSON.parse(JSON.stringify(template.zawodnicy))
      }));
    }
    return parsedDb;
  });

  const [currentTeam, setCurrentTeam] = useState(() => {
    const saved = localStorage.getItem("tactixai_currentTeam");
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed) {
      const template = initialData.druzyny[0];
      parsed.taktyka_druzyny = parsed.taktyka_druzyny || template.taktyka_druzyny;
      parsed.formacje = parsed.formacje?.length > 0 ? parsed.formacje : template.formacje;
      parsed.opcje_taktyczne = parsed.opcje_taktyczne && Object.keys(parsed.opcje_taktyczne).length > 0 ? parsed.opcje_taktyczne : template.opcje_taktyczne;
      parsed.role_zawodnikow = parsed.role_zawodnikow && Object.keys(parsed.role_zawodnikow).length > 0 ? parsed.role_zawodnikow : template.role_zawodnikow;
      parsed.zawodnicy = parsed.zawodnicy?.length > 0 ? parsed.zawodnicy : JSON.parse(JSON.stringify(template.zawodnicy));
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem("tactixai_db", JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (currentTeam) {
      localStorage.setItem("tactixai_currentTeam", JSON.stringify(currentTeam));
      
      setDb(prev => prev.map(t => t.id === currentTeam.id ? currentTeam : t));
    } else {
      localStorage.removeItem("tactixai_currentTeam");
    }
  }, [currentTeam]);

  const selectTeam = (teamId) => {
    const team = db.find(t => t.id === teamId);
    if (team) setCurrentTeam(team);
  };

  const updateTactics = (type, key, value) => {
    setCurrentTeam(prev => ({
      ...prev,
      taktyka_druzyny: {
        ...prev.taktyka_druzyny,
        [type]: {
          ...prev.taktyka_druzyny[type],
          [key]: value
        }
      }
    }));
  };

  const updateFormation = (formationName) => {
    setCurrentTeam(prev => ({
      ...prev,
      domyslna_formacja: formationName
    }));
  };
  
  const updatePlayerRole = (playerId, type, role) => {
      setCurrentTeam(prev => {
          const newPlayers = prev.zawodnicy.map(p => {
              if (p.id === playerId) {
                  return {
                      ...p,
                      wybrane_role: {
                          ...p.wybrane_role,
                          [type]: role
                      }
                  }
              }
              return p;
          });
          return {...prev, zawodnicy: newPlayers};
      });
  };

  const getPlayerPhoto = (playerName) => {
    if (!playerName) return personIcon;
    // Try to find exact match or match with spaces replaced by underscores
    const photoUrl = playerPhotos[playerName] || playerPhotos[playerName.replace(/ /g, '_')];
    return photoUrl || personIcon;
  };

  const value = {
    db,
    currentTeam,
    selectTeam,
    updateTactics,
    updateFormation,
    updatePlayerRole,
    setCurrentTeam,
    getPlayerPhoto,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
