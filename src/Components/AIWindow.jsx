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
function SuggestionBox({ suggestions, stageLabel, onApply }) {
  if (!suggestions || suggestions.length === 0) return null;

  const isSubstitution = (s) => s.type === "Zmiana" || s.type === "Zmiana w składzie";

  return (
    <div className="suggestion-container">
      <div className="suggestion-header">
        <span className="suggestion-fire">🔥</span>
        <span className="suggestion-title">Sugerowane Akcje</span>
        {stageLabel && <span className="suggestion-stage">{stageLabel}</span>}
      </div>
      {suggestions.map((s, i) => (
        isSubstitution(s) ? (
          <div key={i} className="suggestion-box suggestion-box--sub">
            <div className="suggestion-sub-badge">⇄ Zmiana w składzie</div>
            <div className="suggestion-sub-players">
              <div className="suggestion-sub-in">
                <span className="sub-label sub-label--in">▲ Wchodzi</span>
                <span className="sub-name">{s.player}</span>
              </div>
              <div className="suggestion-sub-arrow">⇄</div>
              <div className="suggestion-sub-out">
                <span className="sub-label sub-label--out">▼ Schodzi</span>
                <span className="sub-name">{s.value?.replace('Za: ', '') || s.value}</span>
              </div>
            </div>
            {s.reason && <div className="suggestion-reason">{s.reason}</div>}
            <div className="suggestion-right" style={{justifyContent: 'flex-end', marginTop: '6px'}}>
              {onApply && (
                <button
                  className="suggestion-apply-btn"
                  onClick={() => onApply(s)}
                  title="Zatwierdź zmianę i przejdź dalej"
                >
                  ✓ Zatwierdź zmianę
                </button>
              )}
            </div>
          </div>
        ) : (
          <div key={i} className="suggestion-box">
            <div className="suggestion-main">
              <span className="suggestion-type">{s.type}</span>
              {s.value && (
                <>
                  <span className="suggestion-arrow">→</span>
                  <span className="suggestion-value">{s.value}</span>
                </>
              )}
            </div>
            <div className="suggestion-right">
              {s.player && (
                <span className="suggestion-player">{s.player}</span>
              )}
              {onApply && (
                <button
                  className="suggestion-apply-btn"
                  onClick={() => onApply(s)}
                  title="Zastosuj i przejdź do kolejnego etapu"
                >
                  ✓ Zastosuj
                </button>
              )}
            </div>
            {s.reason && (
              <div className="suggestion-reason">{s.reason}</div>
            )}
          </div>
        )
      ))}
      <div className="suggestion-disclaimer">
        Kliknij „Zastosuj”, aby wdrożyć zmianę i przejść do kolejnego etapu.
      </div>
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
          content: `Szefie, raport o zespole **${opp.nazwa}** jest gotowy. Mają wyraźne problemy z ${weaknessText}.\n\nZaczynamy odprawę? Na początek proponuję ustalić **Formację i Mentalność** — masz już swoj pomysł, czy mam zaproponować?`
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

  // Rzeczywiste zastosowanie sugestii AI w stanie gry
  const applyAISuggestion = (suggestion) => {
    const { type, value, player } = suggestion;

    try {
      switch (type) {
        case "Mentalność": {
          if (value) {
            updateMentality(value);
            showToast(`Mentalność → ${value}`);
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
        case "Zmiana": {
          // value = "Za: Imię Startowego"
          const outName = value?.replace("Za: ", "").trim();
          const starters = currentTeam?.zawodnicy?.filter(p => p.isStarting) || [];
          const reserves = currentTeam?.zawodnicy?.filter(p => !p.isStarting) || [];
          const outPlayer = starters.find(p => p.imie_nazwisko === outName || p.imie_nazwisko?.includes(outName?.split(" ").pop() || ""));
          const inPlayer = reserves.find(p => p.imie_nazwisko === player || p.imie_nazwisko?.includes((player || "").split(" ").pop() || ""));
          if (outPlayer && inPlayer) {
            substitutePlayer(outPlayer.id, inPlayer.id);
            showToast(`${inPlayer.imie_nazwisko} ↔ ${outPlayer.imie_nazwisko}`, "sub");
          } else {
            showToast("Nie znaleziono zawodnika — zmień ręcznie", "warning");
          }
          break;
        }
        case "Rola": {
          // player = imię, value = "Rola przy piłce / bez piłki" lub samo role
          const allPlayers = currentTeam?.zawodnicy || [];
          const target = allPlayers.find(p => p.imie_nazwisko === player || p.imie_nazwisko?.includes((player || "").split(" ").pop() || ""));
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
          // type=Taktyka, player="Cały zespół", value="Opcja taktyczna"
          // Próbujemy dopasować do taktyki przy_pilce lub bez_pilki
          if (currentTeam?.taktyka_druzyny && value) {
            const tacticsPrzy = currentTeam.taktyka_druzyny.przy_pilce || {};
            const tacticsBez = currentTeam.taktyka_druzyny.bez_pilki || {};
            let applied = false;
            // Szukamy klucza, którego wartość ma być zmieniona
            for (const key of Object.keys(tacticsPrzy)) {
              if (key.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(key.toLowerCase())) {
                updateTactics("przy_pilce", key, value);
                applied = true;
                break;
              }
            }
            if (!applied) {
              for (const key of Object.keys(tacticsBez)) {
                if (key.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(key.toLowerCase())) {
                  updateTactics("bez_pilki", key, value);
                  applied = true;
                  break;
                }
              }
            }
            if (applied) {
              showToast(`Taktyka → ${value}`);
            } else {
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

  const handleApplySuggestion = (suggestion) => {
    // Budujemy czytelny opis zastosowanej zmiany
    const parts = [];
    if (suggestion.player && suggestion.player !== 'Cały zespół') parts.push(suggestion.player);
    if (suggestion.type) parts.push(suggestion.type);
    if (suggestion.value) parts.push(`\u2192 ${suggestion.value}`);
    const changeDesc = parts.join(" \u00b7 ") || suggestion.value || "sugestia";

    // Rzeczywiście zastosuj zmianę w stanie gry PRZED wysłaniem wiadomości do AI
    applyAISuggestion(suggestion);

    const autoMessage = `Gotowe, zastosowa\u0142em: ${changeDesc}. Przejd\u017amy do kolejnego etapu.`;

    // Dodajemy wiadomo\u015b\u0107 od u\u017cytkownika (widoczna w czacie)
    const userMsg = { role: "user", content: autoMessage };

    // Pobieramy aktualn\u0105 histori\u0119 synchronicznie przez setMessages callback
    let historySnapshot = [];
    setMessages(prev => {
      historySnapshot = prev;
      return [...prev, userMsg];
    });

    setIsLoading(true);
    setAiHighlights([]);

    // Dajemy Reactowi tik\u0119 na update stanu, potem wysy\u0142amy fetch
    setTimeout(() => {
      fetch("http://127.0.0.1:8000/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: autoMessage,
          history: historySnapshot, // historia PRZED dodaniem userMsg
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
          <SuggestionBox suggestions={allSuggestions} stageLabel={msg.currentStage} onApply={handleApplySuggestion} />
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
