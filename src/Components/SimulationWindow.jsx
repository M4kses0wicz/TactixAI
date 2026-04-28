import { useState, useEffect, useRef } from "react";
import { useGame } from "../context/GameContext";
import AIWindow from "./AIWindow";
import "../styles/SimulationWindow/css/simulation-window.css";

// Unified Coords - Both teams: GK at bottom (90%), N at top (20%)
const MINI_PITCH_COORDS = {
  "BR": [{ top: "90%", left: "50%" }],
  "LO": [{ top: "78%", left: "15%" }],
  "PO": [{ top: "78%", left: "85%" }],
  "ŚO4": [{ top: "80%", left: "38%" }, { top: "80%", left: "62%" }],
  "ŚO3": [{ top: "80%", left: "28%" }, { top: "80%", left: "50%" }, { top: "80%", left: "72%" }],
  "CLL": [{ top: "68%", left: "12%" }],
  "CLP": [{ top: "68%", left: "88%" }],
  "DP":  [{ top: "64%", left: "50%" }, { top: "64%", left: "38%" }, { top: "64%", left: "62%" }],
  "ŚP":  [{ top: "52%", left: "38%" }, { top: "52%", left: "62%" }, { top: "52%", left: "50%" }],
  "OP":  [{ top: "40%", left: "50%" }, { top: "40%", left: "38%" }, { top: "40%", left: "62%" }],
  "LP":  [{ top: "50%", left: "14%" }],
  "PP":  [{ top: "50%", left: "86%" }],
  "LS":  [{ top: "32%", left: "22%" }],
  "PS":  [{ top: "32%", left: "78%" }],
  "N":   [{ top: "22%", left: "50%" }, { top: "22%", left: "38%" }, { top: "22%", left: "62%" }],
};

const MiniPitch = ({ team, players, isOpponent }) => {
  const currentFormationName = team?.domyslna_formacja || (team?.formacje && team?.formacje[0]?.nazwa);
  const positions = team?.formacje?.find(f => f.nazwa === currentFormationName)?.pozycje || team?.formacje?.[0]?.pozycje || [];
  const posCounts = {};

  return (
    <div className="mini-pitch-container">
      {positions.map((pos, index) => {
        const count = posCounts[pos] || 0;
        posCounts[pos] = count + 1;
        const coords = MINI_PITCH_COORDS[pos]?.[count] || { top: "50%", left: "50%" };
        const player = players[index] || { rating: 7.0, name: "N/A" };
        return (
          <div 
            key={index} 
            className={`mini-player-dot ${isOpponent ? 'opp' : ''}`} 
            style={{ top: coords.top, left: coords.left }}
            data-label={`${player.name} ${player.rating.toFixed(1)}`}
          />
        );
      })}
    </div>
  );
};

const SimulationWindow = ({ onFinish }) => {
  const { currentTeam, opponentTeam, getClubLogo, setMatchData } = useGame();
  const [time, setTime] = useState(0);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [events, setEvents] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  
  const [homePlayers, setHomePlayers] = useState([]);
  const [awayPlayers, setAwayPlayers] = useState([]);

  const timerRef = useRef(null);

  useEffect(() => {
    const initLineup = (team) => {
      if (!team) return [];
      let starters = team.zawodnicy?.filter(p => p.isStarting) || [];
      if (starters.length === 0) starters = team.zawodnicy?.slice(0, 11) || [];
      return starters.map(p => ({
        id: p.id,
        name: p.imie_nazwisko.split(' ').pop(),
        pos: p.pozycja_glowna,
        rating: 6.8 + (Math.random() * 0.4)
      }));
    };
    setHomePlayers(initLineup(currentTeam));
    setAwayPlayers(initLineup(opponentTeam));
  }, [currentTeam, opponentTeam]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev >= 90) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          return 90;
        }
        const nextTime = prev + 1;
        handleRandomEvent(nextTime);

        // Push live data to context for AI
        const lowRated = [...homePlayers, ...awayPlayers].filter(p => p.rating < 6.5).map(p => `${p.name} (${p.rating.toFixed(1)})`);
        setMatchData({
          time: nextTime,
          scoreHome: score.home,
          scoreAway: score.away,
          lowRatedPlayers: lowRated,
          recentEvents: events.slice(0, 5).map(e => `${e.time}' ${e.text}`)
        });

        return nextTime;
      });
    }, 200);
    return () => {
      clearInterval(timerRef.current);
      setMatchData(null);
    };
  }, [homePlayers, awayPlayers]);

  const addEvent = (text, type = "normal") => {
    setEvents(prev => [{ time: time, text, type }, ...prev]);
  };

  const handleRandomEvent = (currentTime) => {
    const chance = Math.random();
    if (chance < 0.08) {
        if (Math.random() > 0.5) {
            setScore(s => ({ ...s, home: s.home + 1 }));
            addEvent(`GOL dla ${currentTeam.nazwa}!`, "goal");
        } else {
            setScore(s => ({ ...s, away: s.away + 1 }));
            addEvent(`GOL dla przeciwnika!`, "goal");
        }
    }
  };

  return (
    <div className="simulation-overlay">
      {/* Refined Scoreboard */}
      <div className="sim-scoreboard">
        <div className="sim-sb-team home">
           <span className="sim-sb-name">{currentTeam.nazwa}</span>
           <img src={getClubLogo(currentTeam.logo, currentTeam.nazwa)} alt="" className="sim-sb-logo" />
        </div>

        <div className="sim-sb-center">
           <div className="sim-sb-score">{score.home} : {score.away}</div>
           <div className="sim-sb-time">{time}'</div>
        </div>

        <div className="sim-sb-team away">
           <img src={getClubLogo(opponentTeam?.logo || "", opponentTeam?.nazwa || "Przeciwnik")} alt="" className="sim-sb-logo" />
           <span className="sim-sb-name">{opponentTeam?.nazwa || "Przeciwnik"}</span>
        </div>
      </div>

      <div className="sim-layout-grid">
        {/* Left: Home */}
        <div className="sim-side-panel">
          <div className="sim-panel-box mini-pitch-box">
             <div className="sim-panel-header">Taktyka: {currentTeam.nazwa}</div>
             <MiniPitch team={currentTeam} players={homePlayers} isOpponent={false} />
          </div>
          <div className="sim-panel-box lineup-list-box">
             <div className="sim-panel-header">Wyjściowy skład</div>
             <div className="lineup-list">
                {homePlayers.map(p => (
                  <div key={p.id} className="lineup-item">
                    <span className="lineup-name">{p.name} <span className="lineup-pos">{p.pos}</span></span>
                    <span className="lineup-rating">{p.rating.toFixed(1)}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Center: AI + Analysis */}
        <div className="sim-center-col">
           <div className="sim-panel-box sim-ai-center-box">
              <div className="sim-panel-header">Asystent AI Tactix</div>
              <AIWindow />
           </div>
           
           <div className="sim-panel-box sim-commentary-box">
              <div className="sim-panel-header">Analiza Live</div>
              <div className="sim-events-list">
                 {events.map((ev, i) => (
                   <div key={i} className={`sim-event ${ev.type}`}>
                     <span className="time">{ev.time}'</span> {ev.text}
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Away */}
        <div className="sim-side-panel">
          <div className="sim-panel-box mini-pitch-box">
             <div className="sim-panel-header">Taktyka: Przeciwnik</div>
             <MiniPitch team={opponentTeam} players={awayPlayers} isOpponent={true} />
          </div>
          <div className="sim-panel-box lineup-list-box">
             <div className="sim-panel-header">Wyjściowy skład</div>
             <div className="lineup-list">
                {awayPlayers.map(p => (
                  <div key={p.id} className="lineup-item">
                    <span className="lineup-name">{p.name} <span className="lineup-pos">{p.pos}</span></span>
                    <span className="lineup-rating">{p.rating.toFixed(1)}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="sim-footer">
        <button className="finish-btn" onClick={onFinish} disabled={!isFinished}>
          {isFinished ? "ZAKOŃCZ SYMULACJĘ" : "SYMULACJA..."}
        </button>
      </div>
    </div>
  );
};

export default SimulationWindow;
