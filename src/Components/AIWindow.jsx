import { useState, useRef, useEffect } from "react";
import "../styles/AIWindow/css/ai-window.css";
import TactixAILogo from "../assets/TactixAI_logo_bez_napisu.png";
import { useGame } from "../context/GameContext";

// --- PARSER SUGESTII ---
function parseSuggestions(text) {
  try {
    if (!text) return { cleanText: text, suggestions: [] };

    const suggestions = [];
    const regex = /<suggestion>(.*?)<\/suggestion>/gi;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const raw = match[1].trim();
      // Format: "Typ: Wartość (Zawodnik)"
      const typeMatch = raw.match(/^(.+?):\s*(.+?)\s*\((.+?)\)\s*$/);
      if (typeMatch) {
        suggestions.push({
          type: typeMatch[1].trim(),
          value: typeMatch[2].trim(),
          player: typeMatch[3].trim()
        });
      } else {
        // Fallback — raw text
        suggestions.push({ type: raw, value: "", player: "" });
      }
    }

    // Czyścimy tekst z tagów
    const cleanText = text.replace(/<suggestion>.*?<\/suggestion>/gi, '').replace(/\n{3,}/g, '\n\n').trim();

    return { cleanText, suggestions };
  } catch (err) {
    console.error("parseSuggestions error:", err);
    return { cleanText: text, suggestions: [], parseError: true };
  }
}

// --- KOMPONENT SUGGESTION BOX ---
function SuggestionBox({ suggestions, stageLabel, onApply, appliedSet }) {
  if (!suggestions || suggestions.length === 0) return null;

  const isSubstitution = (s) => s.type === "Zmiana" || s.type === "Zmiana w składzie";
  const totalCount = suggestions.length;
  const appliedCount = suggestions.filter((_, i) => appliedSet?.has(i)).length;
  const allApplied = appliedCount === totalCount;

  return (
    <div className={`suggestion-container ${allApplied ? 'suggestion-container--done' : ''}`}>
      <div className="suggestion-header">
        <span className="suggestion-title">{allApplied ? 'Wdrożono' : 'Propozycje'}</span>
        {stageLabel && <span className="suggestion-stage">{stageLabel}</span>}
        {totalCount > 1 && (
          <span className={`suggestion-counter ${allApplied ? 'suggestion-counter--done' : ''}`}>{appliedCount}/{totalCount}</span>
        )}
      </div>
      {suggestions.map((s, i) => {
        const isApplied = appliedSet?.has(i);
        return isSubstitution(s) ? (
          <div key={i} className={`suggestion-box suggestion-box--sub ${isApplied ? 'suggestion-box--applied' : ''}`}>
            <div className="suggestion-sub-players">
              <div className="suggestion-sub-in">
                <span className="sub-label sub-label--in">Wchodzi</span>
                <span className="sub-name">{s.player}</span>
              </div>
              <div className="suggestion-sub-arrow">
                <span className="material-symbols-outlined">swap_horiz</span>
              </div>
              <div className="suggestion-sub-out">
                <span className="sub-label sub-label--out">Schodzi</span>
                <span className="sub-name">{s.value?.replace(/^(Za|Schodzi|Za:|Schodzi:)\s*/i, '') || s.value}</span>
              </div>
            </div>
            {s.reason && <div className="suggestion-reason">{s.reason}</div>}
            <div className="suggestion-actions">
              {onApply && (
                isApplied ? (
                  <span className="suggestion-applied-badge">
                    <span className="material-symbols-outlined">check_circle</span>
                    Wdrożono
                  </span>
                ) : (
                  <button className="suggestion-apply-btn" onClick={() => onApply(s, i)}>
                    Zatwierdź
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          <div key={i} className={`suggestion-box ${isApplied ? 'suggestion-box--applied' : ''}`}>
            <div className="suggestion-main">
              {s.setting && <span className="suggestion-setting">{s.setting}</span>}
              <span className="suggestion-type">{s.type}</span>
              {s.value && (
                <>
                  <span className="suggestion-arrow">→</span>
                  <span className="suggestion-value">{s.value}</span>
                </>
              )}
            </div>
            <div className="suggestion-right">
              {s.player && s.player !== 'Cały zespół' && (
                <span className="suggestion-player">{s.player}</span>
              )}
              {onApply && (
                isApplied ? (
                  <span className="suggestion-applied-badge">
                    <span className="material-symbols-outlined">check_circle</span>
                    Wdrożono
                  </span>
                ) : (
                  <button className="suggestion-apply-btn" onClick={() => onApply(s, i)}>
                    Zastosuj
                  </button>
                )
              )}
            </div>
            {s.reason && (
              <div className="suggestion-reason">{s.reason}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function AIWindow() {
  const { currentTeam, opponentTeam, setAiHighlights, setActiveTab, matchData, updateMentality, updateFormation, substitutePlayer, updatePlayerRole, updateTactics } = useGame();
  const [apiKey, setApiKey] = useState(localStorage.getItem("mistral_api_key") || "");
  const [isEditingKey, setIsEditingKey] = useState(!localStorage.getItem("mistral_api_key"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [appliedToast, setAppliedToast] = useState(null); // { text, type }
  // Track applied suggestion indices per message: { [msgIdx]: Set<suggestionIdx> }
  const [appliedMap, setAppliedMap] = useState({});
  const greetedRef = useRef(false);

  // Powitanie na starcie - używamy ref, aby na pewno stało się tylko raz
  useEffect(() => {
    if (!greetedRef.current) {
      if (currentTeam && opponentTeam) {
        // Wyciągamy konkretne słabości rywala z danych
        const opp = opponentTeam;
        const oppTaktyka = opp.taktyka_druzyny || {};
        const oppPrzyPilce = oppTaktyka.przy_pilce || {};
        const oppBezPilki = oppTaktyka.bez_pilki || {};
        const oppStarters = (opp.zawodnicy || []).filter(p => p.isStarting);

        // Szukamy słabości w danych taktycznych / atrybutach zawodników
        let weaknessText = null;

        // 1. Sprawdźmy linię defensywną (wysoka = podatna na kontry)
        if (oppBezPilki.linia_defensywna && String(oppBezPilki.linia_defensywna).toLowerCase().includes('wysok')) {
          weaknessText = "bardzo wysoko ustawioną linią defensywną — świetny teren do kontr";
        }
        // 2. Sprawdźmy mentalność (bardzo ofensywna = otwarte plecy)
        else if (["Bardzo ofensywna", "Ofensywna"].includes(opp.mentalnosc)) {
          weaknessText = `mentalnością ${opp.mentalnosc} — grają odważnie, ale zostawią przestrzeń za linią obrony`;
        }
        // 3. Szukamy wolnych stopperów w składzie rywala
        else {
          const slowDefenders = oppStarters.filter(p => {
            const pos = (p.pozycja_glowna || "").toUpperCase();
            const attrs = p.atrybuty || {};
            const speed = attrs.szybkosc ?? attrs.przyspieszenie ?? 99;
            return (pos === "CB" || pos === "ST" || pos === "SW") && Number(speed) < 65;
          });
          if (slowDefenders.length > 0) {
            weaknessText = `wolnymi stoperami (${slowDefenders[0].imie_nazwisko || 'w obronie'}) — idealny cel dla szybkich ataków za plecy`;
          }
        }

        // 4. Fallback — ogólna słabość na podstawie formacji
        if (!weaknessText) {
          const formacja = opp.domyslna_formacja || "";
          if (formacja.startsWith("3")) {
            weaknessText = "grą trójką defensywną — skrzydła są nagłe i dość otwarte";
          } else if (formacja.startsWith("4-3-3") || formacja.startsWith("4-2-3")) {
            weaknessText = "agresywnym pressingiem, co zostawia luki w środku po stracie piłki";
          } else {
            weaknessText = "przejściem defensywnym — długo wracają na pozycje po stracie piłki";
          }
        }

        setMessages([{
          role: "assistant",
          content: `Szefie, raport o zespole **${opp.nazwa}** jest gotowy. Mają wyraźne problemy z ${weaknessText}.\n\nZaczynamy odprawę? Na początek proponuję ustalić naszą **Taktykę Zespołową** — mam coś zaproponować?`
        }]);
        greetedRef.current = true;
      } else if (currentTeam) {
        setMessages([{
          role: "assistant",
          content: `Szefie, jestem gotowy. ⚡\n\nWybierz przeciwnika, abym mógł przygotować raport zwiadowczy i poprowadzić Cię przez odprawę taktyczną.`
        }]);
        greetedRef.current = true;
      }
    }
  }, [currentTeam, opponentTeam]);

  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const saveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("mistral_api_key", apiKey.trim());
      setIsEditingKey(false);
    }
  };

  // Pokazuje animowany toast potwierdzenia
  const showToast = (text, type = "success") => {
    setAppliedToast({ text, type });
    setTimeout(() => setAppliedToast(null), 2800);
  };

  // --- REVERSE LOOKUP: wartość opcji taktycznej → klucz taktyki + sekcja ---
  // Buduje mapę np. "Szybciej" → { section: "przy_pilce", key: "Tempo" }
  const TACTIC_OPTIONS = {
    "przy_pilce": {
      "Bezposredniosc podan": ["Znacznie krócej","Krócej","Standardowo","Bardziej bezpośrednio","Znacznie bardziej bezpośrednio"],
      "Tempo": ["Znacznie wolniej","Wolniej","Standardowo","Szybciej","Znacznie szybciej"],
      "Gra na czas": ["Rzadziej","Standardowo","Częściej"],
      "Faza przejscia w ofensywie": ["Utrzymanie pozycji","Standardowo","Kontratak"],
      "Rozpietosc ataku": ["Znacznie węziej","Węziej","Standardowo","Szerzej","Znacznie szerzej"],
      "Szukaj stalych fragmentow": ["Utrzymuj piłkę","Szukaj stałych fragmentów gry"],
      "Swoboda taktyczna": ["Więcej dyscypliny","Zrównoważone","Mniej dyscypliny"],
      "Strategia rozgrywania": ["Gra pod pressingiem","Zrównoważone","Omijaj pressing"],
      "Rzuty od bramki": ["Krótko","Mieszane","Długo"],
      "Wyprowadzanie pilki przez bramkarza": ["Zrównoważone","Środkowi obrońcy","Boczni obrońcy","Flanki","rozgrywający","odgrywający"],
      "Wejscia za pilka": ["Zrównoważone","Lewy","Prawy","Oba skrzydła"],
      "Drybling": ["Odradź","Zrównoważone","Zachęcaj"],
      "Wejscia": ["Zrównoważone","Środek","Lewy","Prawy","Oba skrzydła"],
      "Odbior podan": ["Podania do nogi","Podania na wolne pole"],
      "Cierpliwosc": ["Szybkie centry","Standardowo","Podania w pole karne"],
      "Strzaly z dystansu": ["Odradź","Zrównoważone","Zachęć"],
      "Styl dosrodkowan": ["Zrównoważone","Miękkie dośrodkowania","Kąśliwe dośrodkowania","Niskie dośrodkowania"],
      "Wyprowadzanie pilki przez bramkarza_tempo": ["Zwolnij tempo","Zrównoważone","Szybkie wyprowadzanie"],
    },
    "bez_pilki": {
      "Linia nacisku": ["Niski pressing","Średni pressing","Wysoki pressing"],
      "Linia defensywna": ["Znacznie niżej","Niżej","Standardowo","Wyżej","Znacznie wyżej"],
      "Aktywacja pressingu": ["Znacznie rzadziej","Rzadziej","Standardowo","Częściej","Znacznie częściej"],
      "Przejscie defensywne": ["Przegrupowanie","Standardowo","Kontrpressing"],
      "Atak na pilke": ["Gra bez wślizgów","Standardowo","Agresywny odbiór"],
      "Reakcja na dosrodkowania": ["Powstrzymuj dośrodkowania","Zrównoważone","Zachęcaj do dośrodkowań"],
      "Kierunek pressingu": ["Szeroki pressing","Zrównoważony pressing","Wąski pressing"],
      "Krotkie wyprowadzanie rywala": ["Nie","Tak"],
      "Zachowanie linii defensywnej": ["Graj wyżej","Zrównoważone","Graj głębiej"],
    }
  };

  // Display name → internal key lookup
  const DISPLAY_TO_KEY = {
    "bezpośredniość podań": "Bezposredniosc podan",
    "tempo": "Tempo",
    "gra na czas": "Gra na czas",
    "faza przejścia w ofensywie": "Faza przejscia w ofensywie",
    "rozpiętość ataku": "Rozpietosc ataku",
    "szukaj stałych fragmentów": "Szukaj stalych fragmentow",
    "swoboda taktyczna": "Swoboda taktyczna",
    "strategia rozgrywania": "Strategia rozgrywania",
    "rzuty od bramki": "Rzuty od bramki",
    "wyprowadzanie piłki przez bramkarza": "Wyprowadzanie pilki przez bramkarza",
    "wejścia za piłką": "Wejscia za pilka",
    "drybling": "Drybling",
    "wejścia": "Wejscia",
    "odbiór podań": "Odbior podan",
    "cierpliwość": "Cierpliwosc",
    "strzały z dystansu": "Strzaly z dystansu",
    "styl dośrodkowań": "Styl dosrodkowan",
    "tempo wyprowadzania przez bramkarza": "Wyprowadzanie pilki przez bramkarza_tempo",
    "linia nacisku": "Linia nacisku",
    "linia defensywna": "Linia defensywna",
    "aktywacja pressingu": "Aktywacja pressingu",
    "przejście defensywne": "Przejscie defensywne",
    "atak na piłkę": "Atak na pilke",
    "reakcja na dośrodkowania": "Reakcja na dosrodkowania",
    "kierunek pressingu": "Kierunek pressingu",
    "krótkie wyprowadzanie rywala": "Krotkie wyprowadzanie rywala",
    "zachowanie linii defensywnej": "Zachowanie linii defensywnej",
  };

  const normalize = (str) => {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // remove punctuation
      .replace(/\s+/g, " ") // normalize spaces
      .trim();
  };

  const findTacticByValue = (val) => {
    if (!val) return null;
    const normVal = normalize(val);
    for (const [section, keys] of Object.entries(TACTIC_OPTIONS)) {
      for (const [key, options] of Object.entries(keys)) {
        // Try exact normalized match first
        let match = options.find(o => normalize(o) === normVal);
        // Then try partial match
        if (!match) {
          match = options.find(o => normalize(o).includes(normVal) || normVal.includes(normalize(o)));
        }
        
        if (match) {
          return { section, key, exactValue: match };
        }
      }
    }
    return null;
  };

  const findTacticBySetting = (settingName) => {
    if (!settingName) return null;
    const normSetting = normalize(settingName);
    
    // Try DISPLAY_TO_KEY first
    for (const [disp, key] of Object.entries(DISPLAY_TO_KEY)) {
      if (normalize(disp) === normSetting || normSetting.includes(normalize(disp))) {
        for (const [section, keys] of Object.entries(TACTIC_OPTIONS)) {
          if (keys[key]) return { section, key };
        }
      }
    }

    // Try direct key match
    for (const [section, keys] of Object.entries(TACTIC_OPTIONS)) {
      for (const key of Object.keys(keys)) {
        if (normalize(key) === normSetting) return { section, key };
      }
    }
    return null;
  };

  const findPlayerFuzzy = (name, playerList) => {
    if (!name || !playerList) return null;
    const normName = normalize(name);
    
    // Exact match
    let found = playerList.find(p => normalize(p.imie_nazwisko) === normName);
    if (found) return found;

    // Last name match
    const parts = normName.split(" ");
    const lastName = parts[parts.length - 1];
    if (lastName && lastName.length > 2) {
      found = playerList.find(p => normalize(p.imie_nazwisko).split(" ").pop() === lastName);
      if (found) return found;
      
      found = playerList.find(p => normalize(p.imie_nazwisko).includes(lastName));
    }
    return found || null;
  };

  // Rzeczywiste zastosowanie sugestii AI w stanie gry
  const applyAISuggestion = (suggestion) => {
    const { type, value, player, setting } = suggestion;

    try {
      switch (type) {
        case "Mentalność": {
          if (value) {
            // Find best mentality match
            const mentalities = ["Bardzo defensywna", "Defensywna", "Ostrożna", "Wyważona", "Pozytywna", "Ofensywna", "Bardzo ofensywna"];
            const normVal = normalize(value);
            const match = mentalities.find(m => normalize(m) === normVal || normalize(m).includes(normVal));
            
            if (match) {
              updateMentality(match);
              showToast(`Mentalność → ${match}`);
            } else {
              updateMentality(value);
              showToast(`Mentalność → ${value}`);
            }
          }
          break;
        }
        case "Formacja": {
          if (value) {
            updateFormation(value);
            showToast(`Formacja → ${value}`);
          }
          break;
        }
        case "Zmiana":
        case "Zmiana w składzie": {
          const outName = value?.replace(/^(Za|Schodzi|Za:|Schodzi:)\s*/i, "").trim();
          const starters = currentTeam?.zawodnicy?.filter(p => p.isStarting) || [];
          const reserves = currentTeam?.zawodnicy?.filter(p => !p.isStarting) || [];
          const outPlayer = findPlayerFuzzy(outName, starters);
          const inPlayer = findPlayerFuzzy(player, reserves);
          
          if (outPlayer && inPlayer) {
            substitutePlayer(outPlayer.id, inPlayer.id);
            showToast(`${inPlayer.imie_nazwisko} ↔ ${outPlayer.imie_nazwisko}`, "sub");
          } else {
            console.warn("Substitution failed — out:", outName, "| in:", player);
            showToast("Nie znaleziono zawodnika — zmień ręcznie", "warning");
          }
          break;
        }
        case "Rola": {
          const allPlayers = currentTeam?.zawodnicy || [];
          const target = findPlayerFuzzy(player, allPlayers);
          if (target && value) {
            updatePlayerRole(target.id, "przy_pilce", value);
            showToast(`${target.imie_nazwisko} → rola: ${value}`);
          } else {
            showToast("Ustaw rolę ręcznie w panelu gracza", "warning");
          }
          break;
        }
        case "Taktyka":
        case "Instrukcja": {
          if (currentTeam?.taktyka_druzyny && value) {
            let applied = false;

            // Strategy 1: Use 'setting' and 'value'
            if (setting) {
              const match = findTacticBySetting(setting);
              if (match) {
                // Find exact value from options to be safe
                const options = TACTIC_OPTIONS[match.section][match.key];
                const exactVal = options.find(o => normalize(o) === normalize(value)) || value;
                updateTactics(match.section, match.key, exactVal);
                applied = true;
              }
            }

            // Strategy 2: Global value search
            if (!applied) {
              const match = findTacticByValue(value);
              if (match) {
                updateTactics(match.section, match.key, match.exactValue);
                applied = true;
              }
            }

            if (applied) {
              showToast(`Taktyka → ${value}`);
            } else {
              console.warn("Tactic apply failed:", suggestion);
              showToast(`Zastosuj ręcznie: ${value}`, "warning");
            }
          }
          break;
        }
        default:
          showToast(`Zastosuj ręcznie: ${value || type}`, "warning");
      }
    } catch (err) {
      console.error("applyAISuggestion error:", err);
      showToast("Błąd — zastosuj ręcznie", "error");
    }
  };

  // Proceed to next AI stage after all suggestions are applied
  const proceedToNextStage = (allSuggestions) => {
    const autoMessage = "Zrobione. Co dalej?";

    const userMsg = { role: "user", content: autoMessage };

    let historySnapshot = [];
    setMessages(prev => {
      historySnapshot = prev;
      return [...prev, userMsg];
    });

    setIsLoading(true);
    setAiHighlights([]);

    setTimeout(() => {
      fetch("http://127.0.0.1:8000/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: autoMessage,
          history: historySnapshot,
          currentTeam,
          opponentTeam,
          matchData,
          apiKey: apiKey.trim()
        })
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          const explanation = data.explanation || data.text || "Brak tre\u015bci odpowiedzi";
          const jsonSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
          const currentStage = data.current_stage || null;
          setMessages(prev2 => [...prev2, { role: "assistant", content: explanation, suggestions: jsonSuggestions, currentStage }]);
          if (data.highlights && Array.isArray(data.highlights)) {
            setAiHighlights(data.highlights);
            setActiveTab("Taktyka");
          }
        })
        .catch(err => {
          console.error("AI Auto-Suggestion Error:", err);
          setMessages(prev2 => [...prev2, { role: "assistant", content: `B\u0142\u0105d: ${err.message || "Nieznany b\u0142\u0105d"}`, isError: true }]);
        })
        .finally(() => setIsLoading(false));
    }, 0);
  };

  const handleApplySuggestion = (suggestion, suggestionIdx, msgIdx, allSuggestions) => {
    // Apply the actual change in game state
    applyAISuggestion(suggestion);

    // Mark this suggestion as applied
    setAppliedMap(prev => {
      const newMap = { ...prev };
      const newSet = new Set(prev[msgIdx] || []);
      newSet.add(suggestionIdx);
      newMap[msgIdx] = newSet;

      // Check if ALL suggestions in this message are now applied
      const total = allSuggestions.length;
      if (newSet.size >= total) {
        // All applied! Proceed after a short delay to show the final green state
        setTimeout(() => {
          proceedToNextStage(allSuggestions);
        }, 800);
      }

      return newMap;
    });
  };


  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setAiHighlights([]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          history: messages,
          currentTeam,
          opponentTeam,
          matchData,
          apiKey: apiKey.trim()
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        throw new Error("Uszkodzony format danych z serwera");
      }

      if (data.error) throw new Error(data.error);

      const explanation = data.explanation || data.text || "Brak treści odpowiedzi";
      const jsonSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
      const currentStage = data.current_stage || null;

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: explanation,
        suggestions: jsonSuggestions,
        currentStage
      }]);
      if (data.highlights && Array.isArray(data.highlights)) {
        setAiHighlights(data.highlights);
        setActiveTab("Taktyka");
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      const isJsonError = error?.message?.includes("JSON") || error?.message?.includes("Uszkodzony") || error?.message?.includes("format");
      const errorContent = isJsonError
        ? "⚠️ Błąd komunikacji z Asystentem (Uszkodzony format danych). Spróbuj zapytać inaczej lub zadać krótsze pytanie."
        : `Wystąpił błąd analizy: ${error?.message || "Nieznany błąd"}`;
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: errorContent,
        isError: isJsonError
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Renderowanie bąbelka z parserem sugestii
  const renderMessage = (msg, idx) => {
    if (msg?.role === 'assistant') {
      // Błąd komunikacji — renderuj czerwony box
      if (msg.isError) {
        return (
          <div key={idx} className="message-wrapper">
            <div className="message-bubble assistant error-bubble">
              {String(msg?.content || "")}
            </div>
          </div>
        );
      }

      // Parse <suggestion> tagów z tekstu (fallback)
      const { cleanText, suggestions: tagSuggestions, parseError } = parseSuggestions(msg?.content || "");

      // Priorytet: JSON suggestions z response > tagi <suggestion> z tekstu
      const jsonSuggestions = msg.suggestions || [];
      const allSuggestions = jsonSuggestions.length > 0 ? jsonSuggestions : tagSuggestions;

      return (
        <div key={idx} className="message-wrapper">
          {msg.currentStage && (
            <div className="stage-badge">{msg.currentStage}</div>
          )}
          <div className={`message-bubble assistant`}>
            {String(cleanText || "")}
          </div>
          {parseError && (
            <div className="message-bubble assistant error-bubble">
              ⚠️ Błąd komunikacji z Asystentem (Uszkodzony format danych). Spróbuj zapytać inaczej.
            </div>
          )}
          <SuggestionBox 
            suggestions={allSuggestions} 
            stageLabel={msg.currentStage} 
            onApply={(s, sIdx) => handleApplySuggestion(s, sIdx, idx, allSuggestions)}
            appliedSet={appliedMap[idx] || new Set()}
          />
        </div>
      );
    }
    return (
      <div key={idx} className={`message-bubble ${msg?.role || 'assistant'}`}>
        {String(msg?.content || "")}
      </div>
    );
  };

  return (
    <section className="AI-win">
      {isEditingKey ? (
        <div className="api-key-setup" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "20px" }}>
          <img src={TactixAILogo} alt="Tactix AI Logo" className="tactix-logo" />
          <h3 style={{ marginBottom: "15px", letterSpacing: "1px" }}>Klucz API Mistral</h3>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: "80%", padding: "10px", borderRadius: "10px", border: "1px solid #555", background: "transparent", color: "white", textAlign: "center", marginBottom: "15px" }}
            placeholder="Wklej tutaj swój klucz..."
          />
          <button
            onClick={saveKey}
            style={{ padding: "10px 30px", borderRadius: "10px", background: "white", color: "black", fontWeight: "bold", border: "none", cursor: "pointer" }}
          >
            Zapisz
          </button>
        </div>
      ) : (
        <>
          <div className="messages-container">
            {messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.8 }}>
                <img src={TactixAILogo} alt="Tactix AI Logo" className="tactix-logo" />
                <h2>TactixAI</h2>
                <p>Elitarny analityk taktyczny</p>
                <button
                  onClick={() => setIsEditingKey(true)}
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", marginTop: "15px", fontSize: "11px", textDecoration: "underline" }}
                >
                  Zmień klucz API
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => setIsEditingKey(true)}
                  style={{ alignSelf: "center", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", marginBottom: "10px", fontSize: "11px", textDecoration: "underline" }}
                >
                  Zmień klucz API
                </button>
                {messages.map((msg, idx) => renderMessage(msg, idx))}
                {isLoading && (
                  <div className="message-bubble assistant loading-bubble">
                    <div className="loading-dots">
                      <span></span><span></span><span></span>
                    </div>
                    Analizuję dane taktyczne...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* === TOAST POWIADOMIENIE === */}
          {appliedToast && (
            <div className={`ai-toast ai-toast--${appliedToast.type}`}>
              {appliedToast.type === "sub" ? "⇄" : appliedToast.type === "warning" ? "⚠️" : "✓"} {appliedToast.text}
            </div>
          )}

          {matchData && (
            <div className="live-indicator">
              <span className="live-dot"></span>
              LIVE — {matchData.time}' | {matchData.scoreHome} : {matchData.scoreAway}
            </div>
          )}

          <div className="inp">
            <input
              type="text"
              id="AIInput"
              placeholder={matchData ? "Zapytaj o sytuację na boisku..." : "Zapytaj o taktykę lub zawodnika..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <span
              className={`material-symbols-outlined ${(isLoading || !input.trim()) ? 'disabled' : ''}`}
              onClick={handleSend}
            >
              arrow_upward
            </span>
          </div>
        </>
      )}
    </section>
  );
}

export default AIWindow;
