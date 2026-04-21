import "../styles/AIWindow/css/ai-window.css";
import TactixAILogo from "../assets/TactixAI_logo_bez_napisu.png";

function AIWindow() {
  return (
    <section className="AI-win">
      <img src={TactixAILogo} alt="Tactix AI Logo" className="tactix-logo" />
      <h2>Witaj!</h2>
      <p>Jak mogę Ci pomóc?</p>
      <div className="inp">
        <input type="text" id="AIInput" placeholder="Zadaj pytanie..." />
        <span className="material-symbols-outlined">arrow_upward</span>
      </div>
    </section>
  );
}

export default AIWindow;
