import PitchWindow from "./PitchWindow";
import "../styles/MainWindow/css/main-window.css";
import feyenoordLogo from "../assets/Feyenoord.png";
import AIWindow from "./AIWindow";

function MainWindow() {
  return (
    <>
      <main>
        <section className="left-sec">
          <div className="header-container">
            <img src={feyenoordLogo} alt="logo" />
            <p>Feyenoord Rotterdam</p>
          </div>
          <PitchWindow />
        </section>
        <section className="right-sec">
          <nav>
            <p>Zawodnicy</p>
            <p>Taktyka</p>
            <p>Wytyczne</p>
            <p>Notatki</p>
          </nav>
          <div className="wrapper">
            <div className="components-holder l"></div>
            <div className="ai-win-container r">
              <AIWindow />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default MainWindow;
