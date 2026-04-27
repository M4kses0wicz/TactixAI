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

const assignStartingEleven = (players, formationPositions) => {
    const teamPlayers = players.map(p => ({ ...p, isStarting: false }));
    
    const assignedIds = new Set();
    const assignedOrder = new Map();
    
    formationPositions.forEach((reqPos, index) => {
        let player = teamPlayers.find(p => p.pozycja_glowna === reqPos && !assignedIds.has(p.id));
        
        // Fallbacks if exact position is not found
        if (!player) {
            if (reqPos.includes("ŚO")) player = teamPlayers.find(p => p.pozycja_glowna.includes("ŚO") && !assignedIds.has(p.id));
            else if (reqPos.includes("P") && reqPos !== "DP") player = teamPlayers.find(p => p.pozycja_glowna.includes("P") && !assignedIds.has(p.id) && p.pozycja_glowna !== "BR");
            else if (reqPos === "N" || reqPos === "LS" || reqPos === "PS") player = teamPlayers.find(p => (p.pozycja_glowna === "N" || p.pozycja_glowna.includes("S")) && !assignedIds.has(p.id));
            else if (reqPos === "LO" || reqPos === "PO" || reqPos.includes("O")) player = teamPlayers.find(p => p.pozycja_glowna.includes("O") && !assignedIds.has(p.id) && p.pozycja_glowna !== "BR");
        }
        
        // Generic fallback (anyone except GK, unless we need a GK)
        if (!player && reqPos !== "BR") {
            player = teamPlayers.find(p => !assignedIds.has(p.id) && p.pozycja_glowna !== "BR");
        }
        
        // Absolute fallback (anyone left)
        if (!player) {
            player = teamPlayers.find(p => !assignedIds.has(p.id));
        }

        if (player) {
            player.isStarting = true;
            assignedIds.add(player.id);
            assignedOrder.set(player.id, index);
        }
    });

    // Sort so starters are at the top, and ordered logically by formation position
    teamPlayers.sort((a, b) => {
        if (a.isStarting && !b.isStarting) return -1;
        if (!a.isStarting && b.isStarting) return 1;
        
        if (a.isStarting && b.isStarting) {
            return (assignedOrder.get(a.id) ?? 99) - (assignedOrder.get(b.id) ?? 99);
        }
        
        return 0;
    });
    
    return teamPlayers;
};

const fixPolishChars = (str) => {
    if (!str) return str;
    return str.replace(/grajcy pik/gi, "grający piłką")
              .replace(/obronca/gi, "obrońca")
              .replace(/obroca/gi, "obrońca")
              .replace(/srodkowy/gi, "środkowy")
              .replace(/Srodkowy/gi, "Środkowy")
              .replace(/Wysuniety/gi, "Wysunięty")
              .replace(/wysuniety/gi, "wysunięty")
              .replace(/Cofniety/gi, "Cofnięty")
              .replace(/cofniety/gi, "cofnięty")
              .replace(/rozgrywajacy/gi, "rozgrywający")
              .replace(/Odwrocony/gi, "Odwrócony")
              .replace(/skrzydlowy/gi, "skrzydłowy")
              .replace(/Schodzacy/gi, "Schodzący")
              .replace(/Falszywy/gi, "Fałszywy")
              .replace(/Odgrywajacy/gi, "Odgrywający")
              .replace(/dlugodystansowiec/gi, "długodystansowiec")
              .replace(/Odbierajacy/gi, "Odbierający")
              .replace(/pilke/gi, "piłkę")
              .replace(/pilka/gi, "piłką")
              .replace(/Kr.cej/gi, "Krócej")
              .replace(/Wy.ej/gi, "Wyżej")
              .replace(/Cz.ciej/gi, "Częściej")
              .replace(/rodkowi/gi, "Środkowi")
              .replace(/rzadziej/gi, "Rzadziej")
              .replace(/weziej/gi, "Węziej")
              .replace(/bezpo.rednio/gi, "bezpośrednio")
              .replace(/k.liwe/gi, "kąśliwe")
              .replace(/sta.ych fragment.w/gi, "stałych fragmentów")
              .replace(/Śś/g, "Ś")
              .replace(/śś/g, "ś");
};

const COUNTRY_CODES = {
  "Polska": "pl", "Niemcy": "de", "Hiszpania": "es", "Francja": "fr", "Włochy": "it",
  "Anglia": "gb-eng", "Holandia": "nl", "Portugalia": "pt", "Brazylia": "br", "Argentyna": "ar",
  "Belgia": "be", "Chorwacja": "hr", "Dania": "dk", "Szwajcaria": "ch", "Urugwaj": "uy",
  "Meksyk": "mx", "Stany Zjednoczone": "us", "Japonia": "jp", "Korea Południowa": "kr",
  "Nigeria": "ng", "Senegal": "sn", "Maroko": "ma", "Egipt": "eg", "Ghana": "gh",
  "Wybrzeże Kości Słoniowej": "ci", "Kamerun": "cm", "Algieria": "dz", "Mali": "ml", "Gwinea": "gn",
  "Turcja": "tr", "Ukraina": "ua", "Rosja": "ru", "Czechy": "cz", "Słowacja": "sk",
  "Węgry": "hu", "Serbia": "rs", "Grecja": "gr", "Norwegia": "no", "Szwecja": "se",
  "Austria": "at", "Słowenia": "si", "Gruzja": "ge", "Armenia": "am", "Izrael": "il",
  "Irlandia": "ie", "Szkocja": "gb-sct", "Walia": "gb-wls", "Irlandia Północna": "gb-nir",
  "Australia": "au", "Kanada": "ca", "Ekwador": "ec", "Kolumbia": "co", "Paragwaj": "py",
  "Chile": "cl", "Peru": "pe", "Wenezuela": "ve", "Arabia Saudyjska": "sa", "Irak": "iq",
  "Uzbekistan": "uz", "Indonezja": "id", "Macedonia Północna": "mk", "Czarnogóra": "me", "Kosowo": "xk",
  "Bośnia i Hercegowina": "ba", "Demokratyczna Republika Konga": "cd", "Dominikana": "do"
};

const getFlagUrl = (country) => {
  if (!country) return null;
  let code = "";
  
  if (country.length === 2 && /^[A-Z]{2}$/i.test(country)) {
    code = country.toLowerCase();
  } else if (COUNTRY_CODES[country]) {
    code = COUNTRY_CODES[country];
  } else {
    return null;
  }
  
  return `https://flagcdn.com/w40/${code}.png`;
};

const normalizePos = (pos) => {
  if (!pos) return "";
  return pos.replace(/[0-9]/g, '');
};

const DEFAULT_ROLES = {
  "BR": {
    przy: ["Bramkarz grający piłką", "Bramkarz", "Tradycyjny bramkarz"],
    bez: ["Bramkarz", "Bramkarz grający na linii", "Bramkarz-libero"]
  },
  "ŚO4": {
    przy: ["Środkowy Obrońca", "Zaawansowany Środkowy Obrońca", "Grający Piłką Środkowy Obrońca", "Tradycyjny Środkowy Obrońca"],
    bez: ["Środkowy Obrońca", "Blokujący Środkowy Obrońca", "Asekurujący Środkowy Obrońca"]
  },
  "ŚO3": {
    przy: ["Grający Piłką Środkowy Obrońca", "Tradycyjny Środkowy Obrońca", "Boczny Środkowy Obrońca", "Obiegający Środkowy Obrońca"],
    bez: ["Środkowy Obrońca", "Blokujący Środkowy Obrońca", "Asekurujący Środkowy Obrońca", "Boczny Środkowy Obrońca", "Blokujący Boczny Środkowy Obrońca"]
  },
  "LO": {
    przy: ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Odwrócony boczny obrońca", "Boczny obrońca", "Wysunięty boczny obrońca"],
    bez: ["Boczny obrońca", "Cofnięty boczny obrońca", "Pressujący boczny obrońca"]
  },
  "PO": {
    przy: ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Odwrócony boczny obrońca", "Boczny obrońca", "Wysunięty boczny obrońca"],
    bez: ["Boczny obrońca", "Cofnięty boczny obrońca", "Pressujący boczny obrońca"]
  },
  "CLL": {
    przy: ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca", "Wysunięty boczny obrońca"],
    bez: ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca"]
  },
  "CLP": {
    przy: ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca", "Wysunięty boczny obrońca"],
    bez: ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca"]
  },
  "DP": {
    przy: ["Łącznik defensywy", "Defensywny pomocnik", "Pomocnik długodystansowiec", "Cofnięty rozgrywający", "Swobodny rozgrywający"],
    bez: ["Cofający się defensywny pomocnik", "Defensywny pomocnik", "Pressujący defensywny pomocnik", "Kryjący defensywny pomocnik", "Szeroko kryjący defensywny pomocnik"]
  },
  "ŚP": {
    przy: ["Rozgrywający pomocnik", "Wysunięty rozgrywający", "Boczny środkowy pomocnik", "Środkowy pomocnik", "Wychodzący pomocnik"],
    bez: ["Rozgrywający pomocnik", "Wysunięty rozgrywający", "Boczny środkowy pomocnik", "Środkowy pomocnik", "Wychodzący pomocnik"]
  },
  "OP": {
    przy: ["Wychodzący pomocnik", "Ofensywny pomocnik", "Wysunięty rozgrywający", "Wolna rola", "Fałszywy napastnik"],
    bez: ["Ofensywny pomocnik", "Śledzący ofensywny pomocnik", "Podwieszony przyjmujący ofensywny pomocnik", "Centralny przyjmujący ofensywny pomocnik"]
  },
  "LP": {
    przy: ["Odwrócony skrzydłowy", "Rozgrywający skrzydłowy", "Skrzydłowy", "Boczny pomocnik"],
    bez: ["Boczny pomocnik", "Śledzący boczny pomocnik", "Boczny przyjmujący pomocnik"]
  },
  "PP": {
    przy: ["Odwrócony skrzydłowy", "Rozgrywający skrzydłowy", "Skrzydłowy", "Boczny pomocnik"],
    bez: ["Boczny pomocnik", "Śledzący boczny pomocnik", "Boczny przyjmujący pomocnik"]
  },
  "LS": {
    przy: ["Rozgrywający skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Skrzydłowy", "Boczny napastnik"],
    bez: ["Skrzydłowy", "Śledzący skrzydłowy", "Boczny przyjmujący skrzydłowy", "Odwrócony przyjmujący skrzydłowy"]
  },
  "PS": {
    przy: ["Rozgrywający skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Skrzydłowy", "Boczny napastnik"],
    bez: ["Skrzydłowy", "Śledzący skrzydłowy", "Boczny przyjmujący skrzydłowy", "Odwrócony przyjmujący skrzydłowy"]
  },
  "N": {
    przy: ["Odgrywający", "Środkowy napastnik", "Wychodzący napastnik", "Lis pola karnego", "Cofnięty napastnik"],
    bez: ["Środkowy napastnik", "Śledzący środkowy napastnik", "Podwieszony przyjmujący środkowy napastnik", "Centralny przyjmujący środkowy napastnik"]
  }
};

export { normalizePos, DEFAULT_ROLES };

export function useGame() {
  return useContext(GameContext);
}

export function GameProvider({ children }) {
  const [db, setDb] = useState([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  const [currentTeam, setCurrentTeam] = useState(null);
  const [opponentTeam, setOpponentTeam] = useState(null);
  const [activeTab, setActiveTab] = useState("Zawodnicy");
  const [substitutionFocusId, setSubstitutionFocusId] = useState(null);
  const [substitutionFocusPos, setSubstitutionFocusPos] = useState(null);

  const updatePlayerRole = (playerId, type, roleName) => {
    setCurrentTeam(prev => {
        if (!prev) return prev;
        const newZawodnicy = prev.zawodnicy.map(p => {
            if (p.id === playerId) {
                const updatedRoles = { ...(p.wybrane_role || { przy_pilce: 'Brak', bez_pilki: 'Brak' }) };
                if (type === 'przy_pilce') updatedRoles.przy_pilce = roleName;
                if (type === 'bez_pilki') updatedRoles.bez_pilki = roleName;
                return { ...p, wybrane_role: updatedRoles };
            }
            return p;
        });
        return { ...prev, zawodnicy: newZawodnicy };
    });
  };

  const substitutePlayer = (starterId, reserveId) => {
    setCurrentTeam(prev => {
        if (!prev) return prev;
        const subIn = prev.zawodnicy.find(p => p.id === reserveId);
        if (!subIn) return prev;

        const newZawodnicy = prev.zawodnicy.map(p => {
            if (p.id === starterId) return { ...p, isStarting: false };
            if (p.id === reserveId) return { ...p, isStarting: true };
            return p;
        });

        const newAssignedStarters = [...(prev.assignedStarters || [])];
        const slotIndex = newAssignedStarters.findIndex(p => p?.id === starterId);
        
        if (slotIndex !== -1) {
            newAssignedStarters[slotIndex] = { ...subIn, isStarting: true };
        }

        return { ...prev, zawodnicy: newZawodnicy, assignedStarters: newAssignedStarters };
    });
    setSubstitutionFocusId(null);
    setSubstitutionFocusPos(null);
  };

  const swapPlayersPositions = (idx1, idx2) => {
    setCurrentTeam(prev => {
      if (!prev || !prev.assignedStarters) return prev;
      const newStarters = [...prev.assignedStarters];
      const temp = newStarters[idx1];
      newStarters[idx1] = newStarters[idx2];
      newStarters[idx2] = temp;
      return { ...prev, assignedStarters: newStarters };
    });
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchDbData = async () => {
      try {
        setIsLoadingDb(true);
        const [teamsRes, playersRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/druzyny'),
          fetch('http://127.0.0.1:8000/api/zawodnicy')
        ]);
        
        if (!teamsRes.ok || !playersRes.ok) {
          throw new Error("Failed to fetch data from backend");
        }

        const teamsData = await teamsRes.json();
        const playersData = await playersRes.json();
        
        const groupedPlayers = {};
        playersData.forEach(p => {
            if (!groupedPlayers[p.druzyna_id]) {
                groupedPlayers[p.druzyna_id] = [];
            }
            
            const parseRoles = (val) => {
              if (!val) return [];
              // Jeśli to już jest tablica (np. z JSON)
              if (Array.isArray(val)) return val.map(r => fixPolishChars(r));
              // Jeśli to string JSON
              if (typeof val === 'string' && val.startsWith('[')) {
                try {
                  const parsed = JSON.parse(val);
                  if (Array.isArray(parsed)) return parsed.map(r => fixPolishChars(r));
                } catch (e) {
                  console.error("Błąd parsowania JSON ról:", e);
                }
              }
              // Fallback: stary format przecinkowy
              if (typeof val === 'string') {
                return val.split(',').map(r => fixPolishChars(r.trim())).filter(r => r.length > 0);
              }
              return [];
            };

            const rolesPrzyPilce = parseRoles(p.przydatnosc_przy_pilce);
            const rolesBezPilki = parseRoles(p.przydatnosc_bez_pilki);
            const flagUrl = getFlagUrl(p.narodowosc);
            
            // Pobieranie realistycznej roli domyślnej z bazy
            let defaultRoles = { przy_pilce: rolesPrzyPilce[0] || "", bez_pilki: rolesBezPilki[0] || "" };
            if (p.wybrane_role) {
                try {
                    const dbRoles = typeof p.wybrane_role === 'string' ? JSON.parse(p.wybrane_role) : p.wybrane_role;
                    if (dbRoles.przy_pilce) defaultRoles.przy_pilce = dbRoles.przy_pilce;
                    if (dbRoles.bez_pilki) defaultRoles.bez_pilki = dbRoles.bez_pilki;
                } catch(e) {
                    console.error("Error parsing default roles for", p.imie_nazwisko);
                }
            }

            groupedPlayers[p.druzyna_id].push({
                id: p.id,
                imie_nazwisko: p.imie_nazwisko,
                narodowosc: flagUrl,
                pozycja_glowna: p.pozycja_glowna,
                numer: p.numer_zawodnika,
                data_urodzenia: p.data_urodzenia,
                wzrost: p.wzrost_cm,
                waga: p.waga_kg,
                lepsza_noga: p.lepsza_noga,
                slabsza_noga: p.slabsza_noga,
                funkcja: p.funkcja_na_boisku,
                isStarting: false,
                stan_aktualny: {
                    kontuzja: p.kontuzja || "brak",
                    forma_ostatnie_5_meczow: parseFloat(p.forma_ostatnie_5_meczow) || 7.0,
                    kondycja: p.kondycja_procent,
                    morale: p.morale
                },
                przydatnosc_przy_pilce: rolesPrzyPilce,
                przydatnosc_bez_pilki: rolesBezPilki,
                wybrane_role: defaultRoles
            });
        });

        const template = initialData.druzyny[0];
        const finalDb = teamsData.map(team => {
            const teamPlayers = groupedPlayers[team.id] || [];
            
            // Assign starting 11 based on default formation
            const defaultPositions = template.formacje[0].pozycje || ['BR', 'LO', 'ŚO4', 'ŚO4', 'PO', 'DP', 'ŚP', 'ŚP', 'LS', 'PS', 'N'];
            const assigned = assignStartingEleven(teamPlayers, defaultPositions);
            const startersOnly = assigned.filter(p => p.isStarting);

            const taktykaBaza = team.taktyka_druzyny || {};
            const taktykaFinalna = JSON.parse(JSON.stringify(template.taktyka_druzyny));

            const normalizeKey = (key) => {
              if (key === "wyprowadzanie_pilki_przez_bramkarza_tempo") return "Wyprowadzanie pilki przez bramkarza_tempo";
              return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
            };

            if (taktykaBaza.przy_pilce) {
                Object.keys(taktykaBaza.przy_pilce).forEach(key => {
                  const normalized = normalizeKey(key);
                  taktykaFinalna.przy_pilce[normalized] = fixPolishChars(taktykaBaza.przy_pilce[key]);
                });
            }
            if (taktykaBaza.bez_pilki) {
                Object.keys(taktykaBaza.bez_pilki).forEach(key => {
                  const normalized = normalizeKey(key);
                  taktykaFinalna.bez_pilki[normalized] = fixPolishChars(taktykaBaza.bez_pilki[key]);
                });
            }

            return {
                id: team.id,
                nazwa: team.nazwa,
                logo: team.logo,
                liga: team.liga,
                domyslna_formacja: template.domyslna_formacja,
                taktyka_druzyny: taktykaFinalna,
                formacje: JSON.parse(JSON.stringify(template.formacje)),
                mentalnosc: "Wyważona",
                opcje_taktyczne: JSON.parse(JSON.stringify(template.opcje_taktyczne)),
                role_zawodnikow: JSON.parse(JSON.stringify(template.role_zawodnikow)),
                zawodnicy: assigned,
                assignedStarters: startersOnly
            };
        });

        if (isMounted) {
          setDb(finalDb);
          
          const savedCurrent = localStorage.getItem("tactixai_currentTeam");
          if (savedCurrent) {
            const parsedId = JSON.parse(savedCurrent).id;
            const updatedCurrent = finalDb.find(t => t.id === parsedId);
            if (updatedCurrent) setCurrentTeam(JSON.parse(JSON.stringify(updatedCurrent)));
          }
          
          const savedOpponent = localStorage.getItem("tactixai_opponentTeam");
          if (savedOpponent) {
            const parsedId = JSON.parse(savedOpponent).id;
            const updatedOpponent = finalDb.find(t => t.id === parsedId);
            if (updatedOpponent) setOpponentTeam(JSON.parse(JSON.stringify(updatedOpponent)));
          }
          
          setIsLoadingDb(false);
        }
      } catch (err) {
        console.error("Failed to load DB, falling back to initialData.json:", err);
        if (isMounted) {
          const saved = localStorage.getItem("tactixai_db");
          const parsedDb = saved ? JSON.parse(saved) : initialData.druzyny;
          
          const template = initialData.druzyny[0];
          const syncedDb = parsedDb.map(team => ({
            ...team,
            taktyka_druzyny: team.taktyka_druzyny || template.taktyka_druzyny,
            formacje: team.formacje?.length > 0 ? team.formacje : template.formacje,
            mentalnosc: team.mentalnosc || "Wyważona",
            opcje_taktyczne: team.opcje_taktyczne && Object.keys(team.opcje_taktyczne).length > 0 ? team.opcje_taktyczne : template.opcje_taktyczne,
            role_zawodnikow: team.role_zawodnikow && Object.keys(team.role_zawodnikow).length > 0 ? team.role_zawodnikow : template.role_zawodnikow,
            zawodnicy: team.zawodnicy?.length > 0 ? team.zawodnicy : JSON.parse(JSON.stringify(template.zawodnicy))
          }));

          setDb(syncedDb);

          const savedCurrent = localStorage.getItem("tactixai_currentTeam");
          if (savedCurrent) setCurrentTeam(JSON.parse(savedCurrent));

          const savedOpponent = localStorage.getItem("tactixai_opponentTeam");
          if (savedOpponent) setOpponentTeam(JSON.parse(savedOpponent));

          setIsLoadingDb(false);
        }
      }
    };

    fetchDbData();

    return () => { isMounted = false; };
  }, []);

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

  // Inteligentne mapowanie ról przy zmianie pozycji
  const adaptRoleToPosition = (currentRole, targetPos, type) => {
    if (!currentRole) return "";
    const roles = DEFAULT_ROLES[targetPos] || DEFAULT_ROLES[normalizePos(targetPos)];
    if (!roles) return currentRole;

    const list = type === 'przy_pilce' ? roles.przy : roles.bez;
    
    // 1. Jeśli rola już istnieje na nowej pozycji - zostawiamy
    if (list.includes(currentRole)) return currentRole;

    // 2. Mapowanie odpowiedników (Słownik adaptacji)
    const adaptations = {
        "Rozgrywający skrzydłowy": "Rozgrywający pomocnik",
        "Skrzydłowy": "Boczny pomocnik",
        "Odwrócony skrzydłowy": "Boczny pomocnik",
        "Środkowy napastnik": "Ofensywny pomocnik",
        "Lis pola karnego": "Środkowy napastnik",
        "Łącznik defensywy": "Defensywny pomocnik",
        "Cofnięty rozgrywający": "Rozgrywający pomocnik",
        "Środkowy Obrońca": "Tradycyjny Środkowy Obrońca"
    };

    if (adaptations[currentRole] && list.includes(adaptations[currentRole])) {
        return adaptations[currentRole];
    }

    // 3. Fallback: Pierwsza dostępna rola dla nowej pozycji
    return list[0] || currentRole;
  };

  const updateFormation = (formationName) => {
    setCurrentTeam(prev => {
      if (!prev) return prev;
      const newTeam = { ...prev, domyslna_formacja: formationName };
      const formation = newTeam.formacje?.find(f => f.nazwa === formationName);
      
      if (formation && formation.pozycje) {
          // KLUCZOWA ZMIANA: Priorytetyzujemy aktualnych starterów
          const currentStarters = prev.assignedStarters?.length === 11 
            ? prev.assignedStarters 
            : prev.zawodnicy.filter(z => z.isStarting);

          // Jeśli mamy już wybranych 11 graczy, to używamy TYLKO ich do nowej formacji
          const pool = currentStarters.length === 11 ? currentStarters : prev.zawodnicy;
          
          const assigned = assignStartingEleven(pool, formation.pozycje);
          newTeam.assignedStarters = assigned.filter(p => p.isStarting);
          
          // Aktualizujemy flagi w pełnej liście zawodników na podstawie nowego przypisania
          const starterIds = new Set(newTeam.assignedStarters.map(s => s.id));
          newTeam.zawodnicy = prev.zawodnicy.map(z => ({
              ...z,
              isStarting: starterIds.has(z.id)
          }));
          
          // Adaptacja ról... (zachowujemy istniejącą logikę adaptacji)
          newTeam.assignedStarters = newTeam.assignedStarters.map((p, idx) => {
              const targetPos = formation.pozycje[idx];
              if (targetPos && p.wybrane_role) {
                  const newPrzy = adaptRoleToPosition(p.wybrane_role.przy_pilce, targetPos, 'przy_pilce');
                  const newBez = adaptRoleToPosition(p.wybrane_role.bez_pilki, targetPos, 'bez_pilki');
                  return { ...p, wybrane_role: { przy_pilce: newPrzy, bez_pilki: newBez } };
              }
              return p;
          });
      }
      return newTeam;
    });
  };

  const updateOpponentFormation = (formationName) => {
    setOpponentTeam(prev => {
      if (!prev) return prev;
      const newTeam = { ...prev, domyslna_formacja: formationName };
      const formation = newTeam.formacje?.find(f => f.nazwa === formationName);
      if (formation && formation.pozycje) {
          newTeam.zawodnicy = assignStartingEleven(newTeam.zawodnicy, formation.pozycje);
      }
      return newTeam;
    });
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
    
    // Explicit overrides
    if (name.includes('napoli')) return napoliLogo;
    if (name.includes('inter')) return interLogo;
    if (name === 'psg') {
      const found = Object.entries(allLogos).find(([p]) => p.includes('paris'));
      if (found) return found[1].default || found[1];
    }
    if (name === 'real madryt' || name === 'real madrid') {
      const found = Object.entries(allLogos).find(([p]) => p.includes('real-madrid'));
      if (found) return found[1].default || found[1];
    }
    
    // Remove common prefixes to match correctly
    let normalizedName = name.replace(/^(fc |ac |as )/g, '');
    
    const entries = Object.entries(allLogos);
    
    // 1. Try exact filename match
    let match = target ? entries.find(([path]) => path.toLowerCase().includes(target)) : null;
    
    // 2. Try by full clean name (e.g. "manchesterunited", "milan", "roma")
    if (!match) {
      const cleanName = normalizedName.replace(/[^a-z]/g, '');
      if (cleanName.length > 2) {
        match = entries.find(([path]) => {
          const cleanPath = path.split('/').pop().toLowerCase().replace(/[^a-z]/g, '');
          return cleanPath.includes(cleanName);
        });
      }
    }

    // 3. Try by first word (fallback for things like "Bayern Monachium" -> "bayern")
    if (!match) {
      const firstWord = normalizedName.split(' ')[0].replace(/[^a-z]/g, '');
      if (firstWord.length > 2) {
        match = entries.find(([path]) => path.split('/').pop().toLowerCase().includes(firstWord));
      }
    }
    
    return match ? (match[1].default || match[1]) : null;
  };


    const value = {
      db,
      isLoadingDb,
      currentTeam,
      opponentTeam,
      activeTab,
      setActiveTab,
    selectTeam,
    selectOpponentTeam,
    updateTactics,
    updateOpponentTactics,
    updateFormation,
    updateOpponentFormation,
    updateMentality,
    updateOpponentMentality,
    setCurrentTeam,
    setOpponentTeam,
    getPlayerPhoto,
    getClubLogo,
    substitutionFocusId,
    setSubstitutionFocusId,
    substitutionFocusPos,
    setSubstitutionFocusPos,
    substitutePlayer,
    updatePlayerRole,
    swapPlayersPositions
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
