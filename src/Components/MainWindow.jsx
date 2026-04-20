import PitchWindow from "./PitchWindow";
import "../styles/MainWindow/css/main-window.css";
import feyenoordLogo from "../assets/Feyenoord.png";

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
        <section className="right-sec"></section>
      </main>
    </>
  );
}

export default MainWindow;
