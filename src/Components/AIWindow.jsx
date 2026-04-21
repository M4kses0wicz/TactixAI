import "../styles/AIWindow/css/ai-window.css";
import TactixAILogo from "../assets/TactixAI_logo_bez_napisu.png";

function AIWindow() {
  return (
    <section className="AI-win">
      <img src={TactixAILogo} alt="Tactix AI Logo" />
      <div className="d"></div>
    </section>
  );
}

export default AIWindow;
