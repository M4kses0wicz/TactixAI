import React, { createContext, useContext, useState, useEffect } from "react";
import initialData from "../data/initialData.json";
import personIcon from "../assets/user-icon.png";

// Manual imports for problematic logos to ensure they are bundled correctly
import napoliLogo from "../assets/clubs/italy_napoli.football-logos.cc.svg";
import interLogo from "../assets/clubs/italy_inter.football-logos.cc.svg";

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

// Dynamically load all club logos
const assetImages = import.meta.glob('../assets/**/*.svg', { eager: true });
const pngImages = import.meta.glob('../assets/**/*.png', { eager: true });
const allLogos = { ...assetImages, ...pngImages };

const GameContext = createContext();

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [db, setDb] = useState(() => {
    const saved = localStorage.getItem("tactixai_db");
    const parsedDb = saved ? JSON.parse(saved) : initialData.druzyny;
    
    // Always sync logos from initialData to ensure we have the latest SVG/PNG filenames
    // This fixes issues where a single club (e.g. PSG) might have an outdated logo filename in localStorage
    const syncedDb = parsedDb.map(club => {
      const initialClub = initialData.druzyny.find(c => c.id === club.id);
      if (initialClub && initialClub.logo !== club.logo) {
        return { ...club, logo: initialClub.logo };
      }
      return club;
    });

    if (syncedDb.length !== initialData.druzyny.length) {
      return initialData.druzyny;
    }

    // Ensure all teams have structural data so the app doesn't crash
    if (syncedDb.length > 0) {
      const template = initialData.druzyny[0];
      return syncedDb.map(team => ({
        ...team,
        taktyka_druzyny: team.taktyka_druzyny || template.taktyka_druzyny,
        formacje: team.formacje?.length > 0 ? team.formacje : template.formacje,
        mentalnosc: team.mentalnosc || "Wyważona",
        opcje_taktyczne: team.opcje_taktyczne && Object.keys(team.opcje_taktyczne).length > 0 ? team.opcje_taktyczne : template.opcje_taktyczne,
        role_zawodnikow: team.role_zawodnikow && Object.keys(team.role_zawodnikow).length > 0 ? team.role_zawodnikow : template.role_zawodnikow,
        zawodnicy: team.zawodnicy?.length > 0 ? team.zawodnicy : JSON.parse(JSON.stringify(template.zawodnicy))
      }));
    }
    return syncedDb;
  });

  const [currentTeam, setCurrentTeam] = useState(() => {
    const saved = localStorage.getItem("tactixai_currentTeam");
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed) {
      const template = initialData.druzyny[0];
      parsed.taktyka_druzyny = parsed.taktyka_druzyny || template.taktyka_druzyny;
      parsed.formacje = parsed.formacje?.length > 0 ? parsed.formacje : template.formacje;
      parsed.mentalnosc = parsed.mentalnosc || "Wyważona";
      parsed.opcje_taktyczne = parsed.opcje_taktyczne && Object.keys(parsed.opcje_taktyczne).length > 0 ? parsed.opcje_taktyczne : template.opcje_taktyczne;
      parsed.role_zawodnikow = parsed.role_zawodnikow && Object.keys(parsed.role_zawodnikow).length > 0 ? parsed.role_zawodnikow : template.role_zawodnikow;
      parsed.zawodnicy = parsed.zawodnicy?.length > 0 ? parsed.zawodnicy : JSON.parse(JSON.stringify(template.zawodnicy));
    }
    return parsed;
  });

  const [opponentTeam, setOpponentTeam] = useState(() => {
    const saved = localStorage.getItem("tactixai_opponentTeam");
    return saved ? JSON.parse(saved) : null;
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

  useEffect(() => {
    if (opponentTeam) {
      localStorage.setItem("tactixai_opponentTeam", JSON.stringify(opponentTeam));
      setDb(prev => prev.map(t => t.id === opponentTeam.id ? opponentTeam : t));
    } else {
      localStorage.removeItem("tactixai_opponentTeam");
    }
  }, [opponentTeam]);

  const selectTeam = (teamId) => {
    const team = db.find(t => t.id === teamId);
    if (team) setCurrentTeam(JSON.parse(JSON.stringify(team)));
  };

  const selectOpponentTeam = (teamId) => {
    const team = db.find(t => t.id === teamId);
    if (team) setOpponentTeam(JSON.parse(JSON.stringify(team)));
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

  const updateOpponentTactics = (type, key, value) => {
    setOpponentTeam(prev => ({
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

  const updateOpponentFormation = (formationName) => {
    setOpponentTeam(prev => prev ? ({
      ...prev,
      domyslna_formacja: formationName
    }) : null);
  };

  const updateMentality = (mentality) => {
    setCurrentTeam(prev => ({
      ...prev,
      mentalnosc: mentality
    }));
  };

  const updateOpponentMentality = (mentality) => {
    setOpponentTeam(prev => prev ? ({
      ...prev,
      mentalnosc: mentality
    }) : null);
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

  const getClubLogo = (logoName, teamName) => {
    if (!logoName && !teamName) return null;
    const target = (logoName || "").toLowerCase();
    const name = (teamName || "").toLowerCase();
    
    // Explicit overrides for Napoli and Inter
    if (name.includes('napoli')) return napoliLogo;
    if (name.includes('inter')) return interLogo;
    
    const entries = Object.entries(allLogos);
    
    // 1. Try exact filename match
    let match = target ? entries.find(([path]) => path.toLowerCase().includes(target)) : null;
    
    // 2. Try by cleaning the name (e.g. "Napoli", "Inter")
    if (!match) {
      const firstWord = name.split(' ')[0].replace(/[^a-z]/g, '');
      if (firstWord.length > 2) {
        match = entries.find(([path]) => path.toLowerCase().includes(firstWord));
      }
    }
    
    return match ? (match[1].default || match[1]) : null;
  };

  const value = {
    db,
    currentTeam,
    opponentTeam,
    selectTeam,
    selectOpponentTeam,
    updateTactics,
    updateOpponentTactics,
    updateFormation,
    updateOpponentFormation,
    updateMentality,
    updateOpponentMentality,
    updatePlayerRole,
    setCurrentTeam,
    setOpponentTeam,
    getPlayerPhoto,
    getClubLogo,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
