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
function SuggestionBox({ suggestions, stageLabel }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="suggestion-container">
      <div className="suggestion-header">
        <span className="suggestion-fire">🔥</span>
        <span className="suggestion-title">Sugerowane Akcje</span>
        {stageLabel && <span className="suggestion-stage">{stageLabel}</span>}
      </div>
      {suggestions.map((s, i) => (
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
          </div>
          {s.reason && (
            <div className="suggestion-reason">{s.reason}</div>
          )}
        </div>
      ))}
      <div className="suggestion-disclaimer">
        Sugestia — otwórz panel taktyki/przeciwnika i wdróż ręcznie.
      </div>
    </div>
  );
}

function AIWindow() {
  const { currentTeam, opponentTeam, setAiHighlights, setActiveTab, matchData } = useGame();
  const [apiKey, setApiKey] = useState(localStorage.getItem("mistral_api_key") || "");
  const [isEditingKey, setIsEditingKey] = useState(!localStorage.getItem("mistral_api_key"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const greetedRef = useRef(false);

  // Powitanie na starcie - używamy ref, aby na pewno stało się tylko raz
  useEffect(() => {
    if (!greetedRef.current) {
      if (currentTeam && opponentTeam) {
        setMessages([{
          role: "assistant",
          content: `Analityk TactixAI gotowy. 🎯\n\nDzisiaj prowadzisz **${currentTeam.nazwa}** przeciwko **${opponentTeam.nazwa}**. Mam dostęp do pełnych profili atrybutowych ich zawodników.\n\nZapytaj mnie o konkretnego gracza rywala, a podam Ci jego słabe punkty i zasugeruję instrukcje indywidualne. Mogę też zaproponować ustawienia taktyczne.`
        }]);
        greetedRef.current = true;
      } else if (currentTeam) {
        setMessages([{
          role: "assistant",
          content: `TactixAI na stanowisku. ⚡\n\nProwadzisz **${currentTeam.nazwa}**. Wybierz przeciwnika, abym mógł przeanalizować jego zawodników i przygotować plan taktyczny.`
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
          <SuggestionBox suggestions={allSuggestions} stageLabel={msg.currentStage} />
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
