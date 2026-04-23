import { useState, useRef, useEffect } from "react";
import "../styles/AIWindow/css/ai-window.css";
import TactixAILogo from "../assets/TactixAI_logo_bez_napisu.png";
import { useGame } from "../context/GameContext";

function AIWindow() {
  const { currentTeam } = useGame();
  const [apiKey, setApiKey] = useState(localStorage.getItem("mistral_api_key") || "");
  const [isEditingKey, setIsEditingKey] = useState(!localStorage.getItem("mistral_api_key"));
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    try {
      let teamContext = "Jesteś asystentem trenera piłkarskiego w grze typu Football Manager. Odpowiadaj krótko, zwięźle i fachowo po polsku.";
      if (currentTeam) {
        const starters = currentTeam.zawodnicy?.filter(p => p.isStarting).map(p => `${p.imie_nazwisko} (${p.pozycja_glowna})`).join(", ") || "Brak";
        const tacticalOptions = JSON.stringify(currentTeam.opcje_taktyczne, null, 2);
        const playerRoles = JSON.stringify(currentTeam.role_zawodnikow, null, 2);

        teamContext += `
Obecnie trener zarządza drużyną: ${currentTeam.nazwa}.
Wybrana formacja to: ${currentTeam.domyslna_formacja}.
Skład wyjściowy: ${starters}.

Dostępne OPCJE TAKTYCZNE (używaj dokładnie tych nazw w rekomendacjach):
${tacticalOptions}

Dostępne ROLE DLA POZYCJI (używaj dokładnie tych nazw w rekomendacjach):
${playerRoles}

INSTRUKCJA FORMATOWANIA:
Zawsze odpowiadaj w sposób ustrukturyzowany, używając:
1. Głównego nagłówka (np. TRENERZE, OTO ANALIZA:)
2. Wyraźnych sekcji w kwadratowych nawiasach [SEKCJA]
3. List wypunktowanych dla konkretnych zaleceń.
4. Pogrubienia kluczowych ustawień.
Zachowaj profesjonalny, analityczny ton.`;
      }

      const apiMessages = [
        { role: "system", content: teamContext },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        userMessage
      ];

      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: "mistral-tiny",
          messages: apiMessages
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message;
      setMessages((prev) => [...prev, { role: "assistant", content: aiMessage.content }]);
    } catch (error) {
      console.error("Mistral API Error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Wystąpił błąd połączenia. Sprawdź, czy Twój klucz API jest poprawny lub spróbuj ponownie." }]);
    } finally {
      setIsLoading(false);
    }
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
                <h2>Witaj!</h2>
                <p>Jak mogę Ci pomóc?</p>
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
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="message-bubble assistant" style={{ opacity: 0.6 }}>
                    Analizowanie...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          <div className="inp">
            <input 
              type="text" 
              id="AIInput" 
              placeholder="Zadaj pytanie..." 
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
