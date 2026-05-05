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

export const FULL_POSITIONS = {
  "BR": "Bramkarz",
  "ŚO": "Środkowy obrońca",
  "ŚO4": "Środkowy obrońca",
  "ŚO3": "Środkowy obrońca",
  "PO": "Prawy obrońca",
  "LO": "Lewy obrońca",
  "CLL": "Lewy wahadłowy",
  "CLP": "Prawy wahadłowy",
  "DP": "Defensywny pomocnik",
  "ŚP": "Środkowy pomocnik",
  "OP": "Ofensywny pomocnik",
  "PP": "Prawy pomocnik",
  "LP": "Lewy pomocnik",
  "PS": "Prawy skrzydłowy",
  "LS": "Lewy skrzydłowy",
  "N": "Napastnik"
};

const GameContext = createContext();

export const assignStartingEleven = (players, formationPositions) => {
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
            
            // Mapowanie roli na podstawie rzeczywistego stylu gry (przydatnosc z bazy)
            const basePrzy = (player.przydatnosc_przy_pilce && player.przydatnosc_przy_pilce.length > 0) 
                             ? player.przydatnosc_przy_pilce[0] 
                             : player.wybrane_role?.przy_pilce;
            const baseBez = (player.przydatnosc_bez_pilki && player.przydatnosc_bez_pilki.length > 0) 
                            ? player.przydatnosc_bez_pilki[0] 
                            : player.wybrane_role?.bez_pilki;
            
            player.wybrane_role = {
                przy_pilce: adaptRoleToPosition(basePrzy, reqPos, 'przy_pilce'),
                bez_pilki: adaptRoleToPosition(baseBez, reqPos, 'bez_pilki')
            };

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

export const COUNTRY_CODES = {
  "Afganistan": "af", "Albania": "al", "Algieria": "dz", "Andora": "ad", "Angola": "ao", "Antigua i Barbuda": "ag", "Arabia Saudyjska": "sa", "Argentyna": "ar", "Armenia": "am", "Australia": "au", "Austria": "at", "Azerbejdżan": "az",
  "Bahamy": "bs", "Bahrajn": "bh", "Bangladesz": "bd", "Barbados": "bb", "Belgia": "be", "Belize": "bz", "Benin": "bj", "Bhutan": "bt", "Białoruś": "by", "Boliwia": "bo", "Bośnia i Hercegowina": "ba", "Botswana": "bw", "Brazylia": "br", "Brunei": "bn", "Bułgaria": "bg", "Burkina Faso": "bf", "Burundi": "bi",
  "Chile": "cl", "Chiny": "cn", "Chorwacja": "hr", "Cypr": "cy", "Czad": "td", "Czarnogóra": "me", "Czechy": "cz",
  "Dania": "dk", "Demokratyczna Republika Konga": "cd", "Dominika": "dm", "Dominikana": "do", "Dżibuti": "dj",
  "Egipt": "eg", "Ekwador": "ec", "Erytrea": "er", "Estonia": "ee", "Eswatini": "sz", "Etiopia": "et",
  "Fidżi": "fj", "Filipiny": "ph", "Finlandia": "fi", "Francja": "fr",
  "Gabon": "ga", "Gambia": "gm", "Ghana": "gh", "Grecja": "gr", "Grenada": "gd", "Gruzja": "ge", "Gujana": "gy", "Gwatemala": "gt", "Gwinea": "gn", "Gwinea Bissau": "gw", "Gwinea Równikowa": "gq",
  "Haiti": "ht", "Hiszpania": "es", "Holandia": "nl", "Honduras": "hn",
  "Indie": "in", "Indonezja": "id", "Irak": "iq", "Iran": "ir", "Irlandia": "ie", "Islandia": "is", "Izrael": "il",
  "Jamajka": "jm", "Japonia": "jp", "Jemen": "ye", "Jordania": "jo",
  "Kambodża": "kh", "Kamerun": "cm", "Kanada": "ca", "Katar": "qa", "Kazachstan": "kz", "Kenia": "ke", "Kirgistan": "kg", "Kiribati": "ki", "Kolumbia": "co", "Komory": "km", "Kongo": "cg", "Korea Południowa": "kr", "Korea Północna": "kp", "Kosowo": "xk", "Kostaryka": "cr", "Kuba": "cu", "Kuwejt": "kw",
  "Laos": "la", "Lesotho": "ls", "Liban": "lb", "Liberia": "lr", "Libia": "ly", "Liechtenstein": "li", "Litwa": "lt", "Luksemburg": "lu",
  "Łotwa": "lv",
  "Macedonia Północna": "mk", "Madagaskar": "mg", "Malawi": "mw", "Malediwy": "mv", "Malezja": "my", "Mali": "ml", "Malta": "mt", "Maroko": "ma", "Mauretania": "mr", "Mauritius": "mu", "Meksyk": "mx", "Mikronezja": "fm", "Mjanma": "mm", "Mołdawia": "md", "Monako": "mc", "Mongolia": "mn", "Mozambik": "mz",
  "Namibia": "na", "Nauru": "nr", "Nepal": "np", "Niemcy": "de", "Niger": "ne", "Nigeria": "ng", "Nikaragua": "ni", "Norwegia": "no", "Nowa Zelandia": "nz",
  "Oman": "om",
  "Pakistan": "pk", "Palau": "pw", "Panama": "pa", "Papua-Nowa Gwinea": "pg", "Paragwaj": "py", "Peru": "pe", "Polska": "pl", "Portugalia": "pt",
  "Republika Środkowoafrykańska": "cf", "Republika Zielonego Przylądka": "cv", "Rosja": "ru", "Rumunia": "ro", "Rwanda": "rw",
  "Saint Kitts i Nevis": "kn", "Saint Lucia": "lc", "Saint Vincent i Grenadyny": "vc", "Salwador": "sv", "Samoa": "ws", "San Marino": "sm", "Senegal": "sn", "Serbia": "rs", "Seszele": "sc", "Sierra Leone": "sl", "Singapur": "sg", "Słowacja": "sk", "Słowenia": "si", "Somalia": "so", "Sri Lanka": "lk", "Stany Zjednoczone": "us", "Sudan": "sd", "Sudan Południowy": "ss", "Surinam": "sr", "Syria": "sy", "Szwajcaria": "ch", "Szwecja": "se",
  "Tadżykistan": "tj", "Tajlandia": "th", "Tanzania": "tz", "Togo": "tg", "Tonga": "to", "Trynidad i Tobago": "tt", "Tunezja": "tn", "Turcja": "tr", "Turkmenistan": "tm", "Tuvalu": "tv",
  "Uganda": "ug", "Ukraina": "ua", "Urugwaj": "uy", "Uzbekistan": "uz",
  "Vanuatu": "vu", "Wenezuela": "ve", "Węgry": "hu", "Wietnam": "vn", "Włochy": "it", "Wybrzeże Kości Słoniowej": "ci", "Wyspy Marshalla": "mh", "Wyspy Salomona": "sb", "Wyspy Świętego Tomasza i Książęca": "st",
  "Zambia": "zm", "Zimbabwe": "zw", "Zjednoczone Emiraty Arabskie": "ae",
  "Anglia": "gb-eng", "Szkocja": "gb-sct", "Walia": "gb-wls", "Irlandia Północna": "gb-nir", "Wielka Brytania": "gb"
};

const getFlagUrl = (country) => {
  if (!country) return null;
  if (typeof country === "string" && country.startsWith("http")) return country;
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
    bez: ["Środkowy pomocnik", "Śledzący środkowy pomocnik", "Podwieszony przyjmujący środkowy pomocnik"]
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

// Inteligentne mapowanie ról przy zmianie pozycji na podstawie archetypów (playstyle)
const adaptRoleToPosition = (baseRole, targetPos, type) => {
  if (!baseRole) return "";
  const roles = DEFAULT_ROLES[targetPos] || DEFAULT_ROLES[normalizePos(targetPos)];
  if (!roles) return baseRole;

  const list = type === 'przy_pilce' ? roles.przy : roles.bez;
  if (list.includes(baseRole)) return baseRole;

  const ARCHETYPES = {
    PLAYMAKER: ["Bramkarz grający piłką", "Grający Piłką Środkowy Obrońca", "Rozgrywający wysunięty boczny obrońca", "Cofnięty rozgrywający", "Rozgrywający pomocnik", "Wysunięty rozgrywający", "Rozgrywający skrzydłowy", "Wolna rola", "Fałszywy napastnik", "Cofnięty napastnik", "Swobodny rozgrywający"],
    RUNNER: ["Obiegający Środkowy Obrońca", "Wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca", "Pomocnik długodystansowiec", "Wychodzący pomocnik", "Odwrócony skrzydłowy", "Schodzący napastnik", "Wychodzący napastnik", "Odwrócony wysunięty boczny obrońca"],
    DEFENSIVE: ["Tradycyjny bramkarz", "Bramkarz", "Tradycyjny Środkowy Obrońca", "Środkowy Obrońca", "Blokujący Środkowy Obrońca", "Asekurujący Środkowy Obrońca", "Boczny obrońca", "Cofnięty boczny obrońca", "Defensywny pomocnik", "Łącznik defensywy", "Cofający się defensywny pomocnik", "Kryjący defensywny pomocnik", "Szeroko kryjący defensywny pomocnik", "Pressujący boczny obrońca", "Pressujący defensywny pomocnik", "Bramkarz grający na linii"],
    WINGER: ["Boczny Środkowy Obrońca", "Boczny pomocnik", "Skrzydłowy", "Boczny napastnik", "Śledzący boczny pomocnik", "Boczny przyjmujący pomocnik", "Boczny przyjmujący skrzydłowy", "Odwrócony przyjmujący skrzydłowy"],
    STRIKER: ["Odgrywający", "Środkowy napastnik", "Lis pola karnego", "Ofensywny pomocnik", "Podwieszony przyjmujący środkowy napastnik", "Centralny przyjmujący środkowy napastnik"],
    BALANCED: ["Środkowy pomocnik", "Śledzący środkowy pomocnik", "Centralny przyjmujący ofensywny pomocnik", "Zaawansowany Środkowy Obrońca", "Bramkarz-libero"]
  };

  let baseArchetype = null;
  for (const [arch, rolesList] of Object.entries(ARCHETYPES)) {
      if (rolesList.includes(baseRole)) {
          baseArchetype = arch;
          break;
      }
  }

  if (baseArchetype) {
      const matchingRole = list.find(r => ARCHETYPES[baseArchetype].includes(r));
      if (matchingRole) return matchingRole;
  }

  return list[0] || baseRole;
};

export { normalizePos, DEFAULT_ROLES, adaptRoleToPosition };

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
  const [aiHighlights, setAiHighlights] = useState([]);
  const [matchData, setMatchData] = useState(null);
  const [savedGames, setSavedGames] = useState([]);
  const [activeSaveId, setActiveSaveId] = useState(null);

  // Load saved games from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tactixai_savedGames");
    if (saved) {
      try {
        setSavedGames(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved games", e);
      }
    }
  }, []);

  // Persist saved games whenever they change
  useEffect(() => {
    localStorage.setItem("tactixai_savedGames", JSON.stringify(savedGames));
  }, [savedGames]);

  const saveCurrentGame = (type = "existing") => {
    if (!currentTeam) return;

    setSavedGames(prev => {
      const existingSaveIdx = prev.findIndex(s => s.id === activeSaveId);
      
      const saveData = {
        id: activeSaveId || Date.now(),
        type,
        currentTeam: JSON.parse(JSON.stringify(currentTeam)),
        opponentTeam: opponentTeam ? JSON.parse(JSON.stringify(opponentTeam)) : null,
        timestamp: new Date().toISOString()
      };

      if (existingSaveIdx > -1) {
        // Update existing
        const newSaves = [...prev];
        newSaves[existingSaveIdx] = saveData;
        return newSaves;
      } else {
        // Create new
        setActiveSaveId(saveData.id);
        return [saveData, ...prev];
      }
    });
  };

  const loadSavedGame = (save) => {
    setActiveSaveId(save.id);
    setCurrentTeam(JSON.parse(JSON.stringify(save.currentTeam)));
    if (save.opponentTeam) {
      setOpponentTeam(JSON.parse(JSON.stringify(save.opponentTeam)));
    } else {
      setOpponentTeam(null);
    }
  };

  const deleteSave = (id) => {
    setSavedGames(prev => prev.filter(s => s.id !== id));
  };

  const removeAiHighlight = (name) => {
    setAiHighlights(prev => prev.filter(h => h.toLowerCase() !== name.toLowerCase()));
  };

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

  const updateOpponentPlayerRole = (playerId, type, roleName) => {
    setOpponentTeam(prev => {
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

        const newZawodnicy = [...prev.zawodnicy];
        
        // Zaktualizuj status w ogólnej tablicy
        const sIndex = newZawodnicy.findIndex(p => p.id === starterId);
        if (sIndex !== -1) newZawodnicy[sIndex] = { ...newZawodnicy[sIndex], isStarting: false };
        
        const newAssignedStarters = [...(prev.assignedStarters || [])];
        const slotIndex = newAssignedStarters.findIndex(p => p?.id === starterId);
        
        let adaptedSubIn = { ...subIn, isStarting: true };
        
        // Jeśli podmieniamy na konkretnej pozycji (mamy indeks w wyjściowej 11), adaptuj rolę!
        if (slotIndex !== -1 && prev.domyslna_formacja) {
            const formation = prev.formacje?.find(f => f.nazwa === prev.domyslna_formacja);
            if (formation && formation.pozycje) {
                const targetPos = formation.pozycje[slotIndex];
                
                const basePrzy = (subIn.przydatnosc_przy_pilce && subIn.przydatnosc_przy_pilce.length > 0) ? subIn.przydatnosc_przy_pilce[0] : subIn.wybrane_role?.przy_pilce;
                const baseBez = (subIn.przydatnosc_bez_pilki && subIn.przydatnosc_bez_pilki.length > 0) ? subIn.przydatnosc_bez_pilki[0] : subIn.wybrane_role?.bez_pilki;
                
                adaptedSubIn.wybrane_role = {
                    przy_pilce: adaptRoleToPosition(basePrzy, targetPos, 'przy_pilce'),
                    bez_pilki: adaptRoleToPosition(baseBez, targetPos, 'bez_pilki')
                };
            }
            newAssignedStarters[slotIndex] = adaptedSubIn;
        }

        // Zaktualizuj rezerwowego w ogólnej tablicy
        const rIndex = newZawodnicy.findIndex(p => p.id === reserveId);
        if (rIndex !== -1) newZawodnicy[rIndex] = adaptedSubIn;

        return { ...prev, zawodnicy: newZawodnicy, assignedStarters: newAssignedStarters };
    });
    setSubstitutionFocusId(null);
    setSubstitutionFocusPos(null);
  };

  const swapPlayersPositions = (idx1, idx2) => {
    setCurrentTeam(prev => {
      if (!prev || !prev.assignedStarters) return prev;
      const newStarters = [...prev.assignedStarters];
      const newZawodnicy = [...prev.zawodnicy];
      
      const formation = prev.formacje?.find(f => f.nazwa === prev.domyslna_formacja);
      
      const p1 = newStarters[idx1];
      const p2 = newStarters[idx2];
      
      let p1Adapted = { ...p1 };
      let p2Adapted = { ...p2 };
      
      if (formation && formation.pozycje) {
          const targetPosForP1 = formation.pozycje[idx2]; // p1 idzie na pozycje p2
          const targetPosForP2 = formation.pozycje[idx1]; // p2 idzie na pozycje p1
          
          const b1Przy = (p1.przydatnosc_przy_pilce && p1.przydatnosc_przy_pilce.length > 0) ? p1.przydatnosc_przy_pilce[0] : p1.wybrane_role?.przy_pilce;
          const b1Bez = (p1.przydatnosc_bez_pilki && p1.przydatnosc_bez_pilki.length > 0) ? p1.przydatnosc_bez_pilki[0] : p1.wybrane_role?.bez_pilki;
          
          const b2Przy = (p2.przydatnosc_przy_pilce && p2.przydatnosc_przy_pilce.length > 0) ? p2.przydatnosc_przy_pilce[0] : p2.wybrane_role?.przy_pilce;
          const b2Bez = (p2.przydatnosc_bez_pilki && p2.przydatnosc_bez_pilki.length > 0) ? p2.przydatnosc_bez_pilki[0] : p2.wybrane_role?.bez_pilki;

          p1Adapted.wybrane_role = {
              przy_pilce: adaptRoleToPosition(b1Przy, targetPosForP1, 'przy_pilce'),
              bez_pilki: adaptRoleToPosition(b1Bez, targetPosForP1, 'bez_pilki')
          };
          
          p2Adapted.wybrane_role = {
              przy_pilce: adaptRoleToPosition(b2Przy, targetPosForP2, 'przy_pilce'),
              bez_pilki: adaptRoleToPosition(b2Bez, targetPosForP2, 'bez_pilki')
          };
      }
      
      newStarters[idx1] = p2Adapted;
      newStarters[idx2] = p1Adapted;
      
      // Update the main array so the UI synchronizes
      const zIndex1 = newZawodnicy.findIndex(p => p.id === p1.id);
      if (zIndex1 !== -1) newZawodnicy[zIndex1] = p1Adapted;
      
      const zIndex2 = newZawodnicy.findIndex(p => p.id === p2.id);
      if (zIndex2 !== -1) newZawodnicy[zIndex2] = p2Adapted;
      
      return { ...prev, zawodnicy: newZawodnicy, assignedStarters: newStarters };
    });
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchDbData = async () => {
      try {
        setIsLoadingDb(true);
        const [teamsRes, playersRes, attributesRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/druzyny'),
          fetch('http://127.0.0.1:8000/api/zawodnicy'),
          fetch('http://127.0.0.1:8000/api/zawodnicy_atrybuty')
        ]);
        
        if (!teamsRes.ok || !playersRes.ok || !attributesRes.ok) {
          throw new Error("Failed to fetch data from backend");
        }

        const teamsData = await teamsRes.json();
        const playersData = await playersRes.json();
        const attributesData = await attributesRes.json();
        
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

            // Default instrukcje_krycia
            let defaultInstructions = {
                scisle_krycie: "Standardowo",
                nacisk: "Standardowo",
                odbior: "Standardowo",
                wymuszanie_nogi: "Brak"
            };
            if (p.instrukcje_krycia) {
                try {
                    const parsedInst = typeof p.instrukcje_krycia === 'string' ? JSON.parse(p.instrukcje_krycia) : p.instrukcje_krycia;
                    defaultInstructions = { ...defaultInstructions, ...parsedInst };
                } catch(e) {
                    console.error("Error parsing default instructions for", p.imie_nazwisko);
                }
            }

            const attrs = attributesData.find(a => a.zawodnik_id === p.id) || {};

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
                wybrane_role: defaultRoles,
                instrukcje_krycia: defaultInstructions,
                atrybuty: attrs
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
    if (team) {
      setActiveSaveId(null);
      setCurrentTeam(JSON.parse(JSON.stringify(team)));
    }
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

  // (adaptRoleToPosition przeniesione wyżej, poza GameProvider, by było wspólne)

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
          
          // Adaptacja ról jest teraz robiona bezpośrednio w assignStartingEleven, 
          // więc nie musimy robić tego ponownie ręcznie.
          // Ale musimy upewnić się, że cała tablica jest odpowiednio zaktualizowana.
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
  
  const updatePlayerNote = (playerId, notes) => {
    setCurrentTeam(prev => {
      if (!prev) return prev;
      const update = p => p.id === playerId ? { ...p, notes } : p;
      return {
        ...prev,
        zawodnicy: prev.zawodnicy?.map(update),
        assignedStarters: prev.assignedStarters?.map(update)
      };
    });
  };

  const updateOpponentInstructions = (playerId, instrukcje) => {
    setOpponentTeam(prev => {
        if (!prev) return prev;
        
        const updatePlayer = p => p.id === playerId ? { ...p, instrukcje_krycia: instrukcje } : p;
        
        return {
            ...prev,
            zawodnicy: prev.zawodnicy?.map(updatePlayer),
            assignedStarters: prev.assignedStarters?.map(updatePlayer)
        };
    });
  };

  const getPlayerPhoto = (playerName) => {
    if (!playerName) return personIcon;

    // Fix for Pedro Neto / Pero Neto
    const lowerName = playerName.toLowerCase();
    if (lowerName.includes("neto")) {
      const local = playerPhotos["Pedro Neto"] || playerPhotos["Pedro_Neto"] || playerPhotos["Neto"];
      if (local) return local;
      
      // Official Premier League CDN for Pedro Neto (Highly Reliable)
      return "https://resources.premierleague.com/premierleague/photos/players/250x250/p441221.png";
    }

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
    getFlagUrl,
    getClubLogo,
    substitutionFocusId,
    setSubstitutionFocusId,
    substitutionFocusPos,
    setSubstitutionFocusPos,
    substitutePlayer,
    updatePlayerRole,
    updateOpponentPlayerRole,
    updateOpponentInstructions,
    swapPlayersPositions,
    aiHighlights,
    setAiHighlights,
    removeAiHighlight,
    matchData,
    setMatchData,
    savedGames,
    saveCurrentGame,
    loadSavedGame,
    deleteSave,
    setActiveSaveId,
    updatePlayerNote
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
