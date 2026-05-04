import React, { useState } from "react";
import "../styles/MainWindow/css/main-window.css";
import "../styles/TacticsPanel/css/TacticsPanel.css";
import "../styles/AIWindow/css/ai-window.css";
import "../styles/ClubSelection.css";

import PlayerCreatorModal from "./PlayerCreatorModal";
import initialData from "../data/initialData.json";
import { useGame, assignStartingEleven } from "../context/GameContext";

// ─── DANE TAKTYCZNE (1:1 z TacticsPanel.jsx) ─────────────────────────────────

const ICONS = {
  "Bezposredniosc podan": ({ idx, total }) => {
    const lengths = [10, 20, 30, 40, 50];
    const len = lengths[idx] || 30;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {[0, 1, 2, 3].map((i) => {
          const isActive = (idx === 4 - i);
          const opacity = isActive ? 1 : 0.2;
          const y = 16 + i * 10;
          const currentLen = isActive ? len : 25;
          return (
            <g key={i} opacity={opacity}>
              <line x1="8" y1={y} x2={8 + currentLen} y2={y} stroke="#FFEA00" strokeWidth="3" strokeLinecap="round" />
              {isActive && <circle cx={8 + currentLen + 4} cy={y} r="3" fill="#FFEA00" />}
            </g>
          );
        })}
      </svg>
    );
  },
  Tempo: ({ idx, total }) => {
    const maxAngle = 54;
    const angle = -maxAngle + (idx / (total - 1)) * (maxAngle * 2);
    const progress = (idx / (total - 1));
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#4B4B4B" strokeWidth="6" strokeLinecap="round" fill="none" pathLength="100" />
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#FF9100" strokeWidth="6" strokeLinecap="round" fill="none" 
              pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress * 100} />
        <g transform={`rotate(${angle}, 32, 48)`}>
          <line x1="32" y1="48" x2="32" y2="28" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="48" r="5" fill="white" />
        </g>
      </svg>
    );
  },
  "Gra na czas": ({ idx }) => {
    const fillLevel = 6 + (idx * 20);
    return (
      <svg viewBox="0 0 64 72" fill="none" className="tac-icon">
        <rect x="16" y="2" width="32" height="4" rx="2" fill="#C8A060" /><rect x="16" y="66" width="32" height="4" rx="2" fill="#C8A060" />
        <path d="M20 6 Q10 20 20 36 Q10 52 20 66 L44 66 Q54 52 44 36 Q54 20 44 6 Z" fill="#C8A060" opacity="0.3" />
        <path d={`M20 66 L44 66 Q54 52 44 ${66 - fillLevel} L20 ${66 - fillLevel} Q10 52 20 66 Z`} fill="#C8A060" />
      </svg>
    );
  },
  "Faza przejscia w ofensywie": ({ idx }) => {
    const colors = ["#888", "#aaa", "#44FF44"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="32" r="22" stroke={colors[idx]} strokeWidth="3" fill="none" />
        <circle cx="32" cy="32" r="13" stroke={colors[idx]} strokeWidth="3" fill="none" />
        <circle cx="32" cy="32" r={4 + idx * 2} fill={colors[idx]} />
      </svg>
    );
  },
  "Rozpietosc ataku": ({ idx, total }) => {
    const width = 10 + (idx / (total - 1)) * 40;
    return (
      <svg viewBox="0 0 64 48" fill="none" className="tac-icon">
        <rect x="4" y="8" width="56" height="32" stroke="#4B4B4B" strokeWidth="2.5" rx="3" />
        <rect x={32 - width/2} y="8" width={width} height="32" fill="#00E5FF" opacity="0.3" rx="2" />
        <g transform={`translate(${32 + width/2}, 24)`}>
          <line x1="0" y1="0" x2="6" y2="0" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
          <polyline points="2,-4 6,0 2,4" stroke="#00E5FF" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        </g>
        <g transform={`translate(${32 - width/2}, 24) rotate(180)`}>
          <line x1="0" y1="0" x2="6" y2="0" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
          <polyline points="2,-4 6,0 2,4" stroke="#00E5FF" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
    );
  },
  "Szukaj stalych fragmentow": ({ idx }) => (
    <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
      <circle cx="26" cy="26" r="16" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" fill="none" />
      <line x1="37" y1="37" x2="56" y2="56" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" strokeLinecap="round" />
      <g opacity={idx === 1 ? 1 : 0.3}><line x1="26" y1="18" x2="26" y2="34" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" /><line x1="18" y1="26" x2="34" y2="26" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" /></g>
    </svg>
  ),
  "Swoboda taktyczna": ({ idx }) => {
    const opacity = 0.2 + (idx * 0.4);
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="10" y="10" width="44" height="44" rx="6" stroke="#aaa" strokeWidth="3" fill="none" />
        <line x1="22" y1="10" x2="22" y2="54" stroke="#aaa" strokeWidth="2" opacity={1 - opacity} />
        <line x1="42" y1="10" x2="42" y2="54" stroke="#aaa" strokeWidth="2" opacity={1 - opacity} />
        <circle cx="32" cy="32" r="5" fill="#aaa" opacity={opacity} />
      </svg>
    );
  },
  "Strategia rozgrywania": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {idx === 1 ? (
          <g>
            <circle cx="20" cy="45" r="3" fill="#00E676" />
            <circle cx="35" cy="40" r="3" fill="#00E676" />
            <circle cx="28" cy="25" r="3" fill="#00E676" />
            <path d="M22 43 L33 41 M33 38 L30 28" stroke="#00E676" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
            <path d="M45 45 L40 35 M50 30 L40 25" stroke="#FF4400" strokeWidth="2" opacity="0.4" />
          </g>
        ) : idx === 2 ? (
          <g>
            <circle cx="15" cy="50" r="4" fill="#00E676" />
            <path d="M18 48 Q35 45 55 15" stroke="#00E676" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 4" />
            <polyline points="48,15 55,15 55,22" stroke="#00E676" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
          </g>
        ) : (
          <g opacity="0.5">
            <circle cx="32" cy="32" r="10" stroke="#888" strokeWidth="2" />
            <path d="M22 42 L42 22" stroke="#888" strokeWidth="2" />
          </g>
        )}
      </svg>
    );
  },
  "Rzuty od bramki": ({ idx }) => {
    const heights = [15, 30, 45];
    const targetY = 56 - heights[idx];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="20" y="52" width="24" height="8" stroke="white" strokeWidth="2.5" rx="1" />
        <path d={`M32 52 Q32 32 32 ${targetY}`} stroke="#FFEA00" strokeWidth="3" strokeDasharray="5 3" strokeLinecap="round" />
        <path d={`M32 52 Q20 35 12 ${targetY + 5}`} stroke="#FFEA00" strokeWidth="2.5" opacity="0.4" strokeDasharray="5 3" />
        <path d={`M32 52 Q44 35 52 ${targetY + 5}`} stroke="#FFEA00" strokeWidth="2.5" opacity="0.4" strokeDasharray="5 3" />
        <circle cx="32" cy={targetY} r="3" fill="#FFEA00" />
      </svg>
    );
  },
  "Wyprowadzanie pilki przez bramkarza": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2.5" rx="4" />
        <line x1="8" y1="32" x2="56" y2="32" stroke="#4B4B4B" strokeWidth="1.5" strokeDasharray="5 3" />
        {idx === 1 && <rect x="24" y="40" width="16" height="8" fill="#4499FF" rx="2" />}
        {idx === 2 && <><rect x="12" y="40" width="8" height="8" fill="#4499FF" rx="2" /><rect x="44" y="40" width="8" height="8" fill="#4499FF" rx="2" /></>}
        {idx === 3 && <><rect x="10" y="15" width="6" height="34" fill="#4499FF" rx="2" /><rect x="48" y="15" width="6" height="34" fill="#4499FF" rx="2" /></>}
        {idx === 4 && <circle cx="32" cy="32" r="6" fill="#4499FF" />}
        {idx === 5 && <circle cx="32" cy="18" r="6" fill="#4499FF" />}
        <circle cx="32" cy="52" r="4" fill="white" />
      </svg>
    );
  },
  "Wejscia za pilka": ({ idx }) => {
    const left = idx === 1 || idx === 3; const right = idx === 2 || idx === 3;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="22" r="8" stroke="#aaa" strokeWidth="3" fill="none" /><path d="M14 56 Q14 38 32 38 Q50 38 50 56" stroke="#aaa" strokeWidth="3" fill="none" strokeLinecap="round" />
        {left && <path d="M20 38 Q10 30 10 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {right && <path d="M44 38 Q54 30 54 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
      </svg>
    );
  },
  Drybling: ({ idx }) => {
    const paths = ["M12 52 L52 12", "M12 52 C20 40 44 60 52 12", "M12 52 Q15 20 32 32 Q49 44 52 12"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d={paths[idx]} stroke="#D131F5" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <polyline points="46,18 52,12 44,12" stroke="#D131F5" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="52" r="5" fill="white" />
      </svg>
    );
  },
  Wejscia: ({ idx }) => {
    const color = idx === 0 ? "#888" : "#00E676";
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2.5" rx="4" />
        <rect x="20" y="8" width="24" height="12" stroke="#4B4B4B" strokeWidth="2.5" />
        {idx !== 0 && (
          <>
            {(idx === 1 || idx === 4) && <path d="M32 48 L32 20" stroke={color} strokeWidth="3.5" strokeLinecap="round" />}
            {(idx === 2 || idx === 4) && <path d="M16 40 Q16 20 28 15" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />}
            {(idx === 3 || idx === 4) && <path d="M48 40 Q48 20 36 15" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />}
          </>
        )}
        <circle cx="32" cy="52" r="4" fill="white" />
      </svg>
    );
  },
  "Odbior podan": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="16" cy="48" r="4" fill="white" />
        {idx === 0 ? (
          <g>
            <circle cx="48" cy="48" r="6" stroke="#00E5FF" strokeWidth="2.5" />
            <path d="M22 48 L40 48" stroke="#00E5FF" strokeWidth="3.5" strokeLinecap="round" />
            <polyline points="36,44 40,48 36,52" stroke="#00E5FF" strokeWidth="3" strokeLinejoin="round" fill="none" />
          </g>
        ) : (
          <g>
            <circle cx="40" cy="20" r="6" stroke="#00E5FF" strokeWidth="2.5" opacity="0.4" />
            <path d="M20 44 Q35 40 50 15" stroke="#00E5FF" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="5 3" />
            <polyline points="44,15 50,15 50,21" stroke="#00E5FF" strokeWidth="3" strokeLinejoin="round" fill="none" />
          </g>
        )}
      </svg>
    );
  },
  Cierpliwosc: ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {idx === 0 ? (
          <g>
            <path d="M10 50 Q32 10 54 40" stroke="#FF9100" strokeWidth="4" strokeLinecap="round" />
            <polyline points="48,36 54,40 50,46" stroke="#FF9100" strokeWidth="3" strokeLinejoin="round" fill="none" />
          </g>
        ) : idx === 2 ? (
          <g>
            <path d="M15 45 C20 30 45 60 50 20" stroke="#FF9100" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 2" />
            <circle cx="50" cy="20" r="4" fill="#FF9100" />
            <circle cx="32" cy="32" r="15" stroke="#FF9100" strokeWidth="1.5" strokeDasharray="2 4" />
          </g>
        ) : (
          <circle cx="32" cy="32" r="10" stroke="#888" strokeWidth="2" opacity="0.5" />
        )}
      </svg>
    );
  },
  "Strzaly z dystansu": ({ idx }) => {
    const opacity = idx === 0 ? 0.2 : idx === 1 ? 0.5 : 1;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="16" y="8" width="32" height="12" stroke="white" strokeWidth="2.5" rx="1" />
        <path d="M32 52 L32 25" stroke="#FF3D00" strokeWidth="4.5" strokeLinecap="round" opacity={opacity} />
        <polyline points="26,32 32,25 38,32" stroke="#FF3D00" strokeWidth="3.5" strokeLinejoin="round" fill="none" opacity={opacity} />
        <circle cx="32" cy="52" r="5" fill="white" />
      </svg>
    );
  },
  "Styl dosrodkowan": ({ idx }) => {
    const paths = ["M8 54 Q20 10 40 28", "M8 54 Q20 -10 40 10", "M8 54 L40 54", "M8 54 Q30 40 40 45"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d={paths[idx] || paths[0]} stroke="#aaa" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="40" r="8" stroke="#aaa" strokeWidth="2.5" fill="none" />
      </svg>
    );
  },
  "Wyprowadzanie pilki przez bramkarza_tempo": ({ idx, total }) => {
    const maxAngle = 54;
    const angle = -maxAngle + (idx / (total - 1)) * (maxAngle * 2);
    const progress = (idx / (total - 1));
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#4B4B4B" strokeWidth="6" strokeLinecap="round" fill="none" pathLength="100" />
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#FF9100" strokeWidth="6" strokeLinecap="round" fill="none" 
              pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress * 100} />
        <g transform={`rotate(${angle}, 32, 48)`}>
          <line x1="32" y1="48" x2="32" y2="28" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="32" cy="48" r="5" fill="white" />
        </g>
      </svg>
    );
  },
  "Linia nacisku": ({ idx, total }) => {
    const y = 50 - (idx / (total - 1)) * 36;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        <line x1="8" y1="32" x2="56" y2="32" stroke="#4B4B4B" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="12" y1={y} x2="52" y2={y} stroke="#FF4400" strokeWidth="4" strokeLinecap="round" />
        <polyline points={`${32-6},${y-4} 32,${y} ${32+6},${y-4}`} stroke="#FF4400" strokeWidth="2" fill="none" />
      </svg>
    );
  },
  "Linia defensywna": ({ idx, total }) => {
    const y = 54 - (idx / (total - 1)) * 32;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        <path d="M20 56 L44 56" stroke="#4B4B4B" strokeWidth="4" />
        <line x1="12" y1={y} x2="52" y2={y} stroke="#4499FF" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  },
  "Aktywacja pressingu": ({ idx, total }) => {
    const intensity = idx + 1;
    const colors = ["#666", "#aaa", "#FFAA00", "#FF6600", "#FF0000"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {[...Array(intensity)].map((_, i) => (
          <path key={i} d={`M${15 + i*8} 45 L${25 + i*8} 15`} stroke={colors[idx]} strokeWidth="5" strokeLinecap="round" opacity={0.3 + (i/intensity)*0.7} />
        ))}
      </svg>
    );
  },
  "Przejscie defensywne": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {idx === 0 ? (
          <g>
            <path d="M50 20 L20 45" stroke="#4499FF" strokeWidth="4" strokeLinecap="round" />
            <polyline points="28,45 20,45 20,37" stroke="#4499FF" strokeWidth="3" strokeLinejoin="round" fill="none" />
            <circle cx="50" cy="20" r="4" fill="#4499FF" />
          </g>
        ) : idx === 2 ? (
          <g>
            <path d="M20 40 L45 20" stroke="#FF4400" strokeWidth="4" strokeLinecap="round" />
            <polyline points="37,20 45,20 45,28" stroke="#FF4400" strokeWidth="3" strokeLinejoin="round" fill="none" />
            <circle cx="50" cy="20" r="5" fill="white" />
          </g>
        ) : (
          <circle cx="32" cy="32" r="10" stroke="#888" strokeWidth="2" opacity="0.5" />
        )}
      </svg>
    );
  },
  "Atak na pilke": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {idx === 2 ? (
          <g transform="rotate(-30, 32, 32)">
            <path d="M20 45 L45 45 C50 45 52 40 52 35 L52 30 L45 30 L40 40 L20 40 Z" fill="#FF0000" />
            <path d="M30 30 L32 20 M38 30 L40 20" stroke="#FF0000" strokeWidth="2" />
          </g>
        ) : idx === 0 ? (
          <g>
            <path d="M15 50 L45 50 C50 50 52 48 52 45 L52 42 L45 42 L40 48 L15 48 Z" fill="#00E676" />
          </g>
        ) : (
          <path d="M20 48 L45 48 C50 48 52 45 52 40 L52 38 L45 38 L40 45 L20 45 Z" fill="#aaa" opacity="0.5" />
        )}
      </svg>
    );
  },
  "Reakcja na dosrodkowania": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="10" y="10" width="44" height="44" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        {idx === 0 ? (
          <g>
            <rect x="42" y="15" width="4" height="15" fill="#FF4400" rx="2" />
            <line x1="15" y1="25" x2="40" y2="25" stroke="#FF4400" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : idx === 2 ? (
          <g>
            <rect x="30" y="40" width="15" height="4" fill="#44FF44" rx="2" />
            <path d="M15 20 Q32 30 45 40" stroke="#44FF44" strokeWidth="2" strokeDasharray="4 4" />
          </g>
        ) : (
          <circle cx="32" cy="8" r="8" stroke="#888" strokeWidth="1.5" opacity="0.5" />
        )}
      </svg>
    );
  },
  "Kierunek pressingu": ({ idx }) => {
    const widths = [40, 20, 10]; const x = 32 - widths[idx] / 2;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x={x} y="16" width={widths[idx]} height="32" rx="4" stroke="#FFAA00" strokeWidth="3" fill="none" />
        <line x1="32" y1="16" x2="32" y2="48" stroke="#FFAA00" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    );
  },
  "Krotkie wyprowadzanie rywala": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="22" y="45" width="20" height="8" stroke="#4B4B4B" strokeWidth="2" rx="1" />
        {idx === 1 ? (
          <g>
            <circle cx="32" cy="40" r="5" fill="#FFCC00" />
            <path d="M32 40 L32 25" stroke="#FFCC00" strokeWidth="3" strokeLinecap="round" />
            <path d="M25 25 L39 25" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : (
          <g opacity="0.3">
            <circle cx="32" cy="40" r="4" stroke="#888" strokeWidth="2" />
          </g>
        )}
      </svg>
    );
  },
  "Zachowanie linii defensywnej": ({ idx }) => {
    const colors = ["#44FF44", "#aaa", "#FF4400"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <line x1="8" y1="32" x2="56" y2="32" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" />
        {idx === 0 && <polyline points="24,20 32,10 40,20" stroke={colors[idx]} strokeWidth="2.5" fill="none" />}
        {idx === 2 && <polyline points="24,44 32,54 40,44" stroke={colors[idx]} strokeWidth="2.5" fill="none" />}
      </svg>
    );
  },
};

const OPTIONS = {
  "przy_pilce": {
    "Bezposredniosc podan": ["Znacznie krócej", "Krócej", "Standardowo", "Bardziej bezpośrednio", "Znacznie bardziej bezpośrednio"],
    Tempo: ["Znacznie wolniej", "Wolniej", "Standardowo", "Szybciej", "Znacznie szybciej"],
    "Gra na czas": ["Rzadziej", "Standardowo", "Częściej"],
    "Faza przejscia w ofensywie": ["Utrzymanie pozycji", "Standardowo", "Kontratak"],
    "Rozpietosc ataku": ["Znacznie węziej", "Węziej", "Standardowo", "Szerzej", "Znacznie szerzej"],
    "Szukaj stalych fragmentow": ["Utrzymuj piłkę", "Szukaj stałych fragmentów gry"],
    "Swoboda taktyczna": ["Więcej dyscypliny", "Zrównoważone", "Mniej dyscypliny"],
    "Strategia rozgrywania": ["Gra pod pressingiem", "Zrównoważone", "Omijaj pressing"],
    "Rzuty od bramki": ["Krótko", "Mieszane", "Długo"],
    "Wyprowadzanie pilki przez bramkarza": ["Zrównoważone", "Środkowi obrońcy", "Boczni obrońcy", "Flanki", "rozgrywający", "odgrywający"],
    "Wejscia za pilka": ["Zrównoważone", "Lewy", "Prawy", "Oba skrzydła"],
    Drybling: ["Odradź", "Zrównoważone", "Zachęcaj"],
    Wejscia: ["Zrównoważone", "Środek", "Lewy", "Prawy", "Oba skrzydła"],
    "Odbior podan": ["Podania do nogi", "Podania na wolne pole"],
    Cierpliwosc: ["Szybkie centry", "Standardowo", "Podania w pole karne"],
    "Strzaly z dystansu": ["Odradź", "Zrównoważone", "Zachęć"],
    "Styl dosrodkowan": ["Zrównoważone", "Miękkie dośrodkowania", "Kąśliwe dośrodkowania", "Niskie dośrodkowania"],
    "Wyprowadzanie pilki przez bramkarza_tempo": ["Zwolnij tempo", "Zrównoważone", "Szybkie wyprowadzanie"],
  },
  "bez_pilki": {
    "Linia nacisku": ["Niski pressing", "Średni pressing", "Wysoki pressing"],
    "Linia defensywna": ["Znacznie niżej", "Niżej", "Standardowo", "Wyżej", "Znacznie wyżej"],
    "Aktywacja pressingu": ["Znacznie rzadziej", "Rzadziej", "Standardowo", "Częściej", "Znacznie częściej"],
    "Przejscie defensywne": ["Przegrupowanie", "Standardowo", "Kontrpressing"],
    "Atak na pilke": ["Gra bez wślizgów", "Standardowo", "Agresywny odbiór"],
    "Reakcja na dosrodkowania": ["Powstrzymuj dośrodkowania", "Zrównoważone", "Zachęcaj do dośrodkowań"],
    "Kierunek pressingu": ["Szeroki pressing", "Zrównoważony pressing", "Wąski pressing"],
    "Krotkie wyprowadzanie rywala": ["Nie", "Tak"],
    "Zachowanie linii defensywnej": ["Graj wyżej", "Zrównoważone", "Graj głębiej"],
  }
};

const DISPLAY_NAMES = {
  "Bezposredniosc podan": "Bezpośredniość podań",
  "Tempo": "Tempo",
  "Gra na czas": "Gra na czas",
  "Faza przejscia w ofensywie": "Faza przejścia w ofensywie",
  "Rozpietosc ataku": "Rozpiętość ataku",
  "Szukaj stalych fragmentow": "Szukaj stałych fragmentów",
  "Swoboda taktyczna": "Swoboda taktyczna",
  "Strategia rozgrywania": "Strategia rozgrywania",
  "Rzuty od bramki": "Rzuty od bramki",
  "Wyprowadzanie pilki przez bramkarza": "Wyprowadzanie piłki przez bramkarza",
  "Wejscia za pilka": "Wejścia za piłką",
  "Drybling": "Drybling",
  "Wejscia": "Wejścia",
  "Odbior podan": "Odbiór podań",
  "Cierpliwosc": "Cierpliwość",
  "Strzaly z dystansu": "Strzały z dystansu",
  "Styl dosrodkowan": "Styl dośrodkowań",
  "Wyprowadzanie pilki przez bramkarza_tempo": "Tempo wyprowadzania przez bramkarza",
  "Linia nacisku": "Linia nacisku",
  "Linia defensywna": "Linia defensywna",
  "Aktywacja pressingu": "Aktywacja pressingu",
  "Przejscie defensywne": "Przejście defensywne",
  "Atak na pilke": "Atak na piłkę",
  "Reakcja na dosrodkowania": "Reakcja na dośrodkowania",
  "Kierunek pressingu": "Kierunek pressingu",
  "Krotkie wyprowadzanie rywala": "Krótkie wyprowadzanie rywala",
  "Zachowanie linii defensywnej": "Zachowanie linii defensywnej",
};

const INITIAL_CLUB_NAME = "NOWY KLUB";
const INITIAL_LOGO = "https://cdn-icons-png.flaticon.com/512/33/33736.png";

const getFullPosition = (pos) => {
  const map = {
    BR: "Bramkarz",
    ŚO: "Obrońca", LO: "Obrońca", PO: "Obrońca",
    DP: "Pomocnik", ŚP: "Pomocnik", OP: "Pomocnik", LP: "Pomocnik", PP: "Pomocnik",
    LS: "Skrzydłowy", PS: "Skrzydłowy",
    N: "Napastnik"
  };
  return map[pos] || "Zawodnik";
};

const getFlag = (nat) => {
  const m = { "Polska": "🇵🇱", "Niemcy": "🇩🇪", "Anglia": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Hiszpania": "🇪🇸", "Francja": "🇫🇷", "Włochy": "🇮🇹", "Holandia": "🇳🇱", "Portugalia": "🇵🇹", "Brazylia": "🇧🇷", "Argentyna": "🇦🇷" };
  return m[nat] || "🏳️";
};

// Komponent TacticTile 1:1 z TacticsPanel
function TacticTile({ label, options, value, onChange }) {
  const findIdx = (val) => options.findIndex(o => o.toLowerCase().trim() === val.toLowerCase().trim());
  const idx = findIdx(value) !== -1 ? findIdx(value) : Math.floor(options.length / 2);
  const prev = () => onChange(options[(idx - 1 + options.length) % options.length]);
  const next = () => onChange(options[(idx + 1) % options.length]);
  const Icon = ICONS[label];

  return (
    <div className="tac-tile">
      <div className="tac-tile__header">
        <span className="tac-tile__title">{DISPLAY_NAMES[label] || label}</span>
      </div>
      <div className="tac-tile__icon-wrap">
        {Icon ? <Icon idx={idx} total={options.length} /> : (
          <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
            <circle cx="32" cy="32" r="20" stroke="#888" strokeWidth="3" fill="none" />
            <text x="32" y="38" textAnchor="middle" fontSize="20" fill="#888">?</text>
          </svg>
        )}
      </div>
      <div className="tac-tile__control">
        <button className="tac-tile__arrow" onClick={prev}>‹</button>
        <span className="tac-tile__value">{options[idx]}</span>
        <button className="tac-tile__arrow" onClick={next}>›</button>
      </div>
    </div>
  );
}

// Prosty komponent CustomDropdown dla Formacji i Mentalności, by wyglądały jak w PitchWindow
function CustomDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ position: "relative", minWidth: "140px" }}>
      <div 
        style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}
      >
        {label}
      </div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
      >
        <span>{value}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </div>
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", marginTop: "4px", zIndex: 100, maxHeight: "200px", overflowY: "auto" }}>
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => { onChange(opt); setIsOpen(false); }}
              style={{ padding: "8px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomClubForm({ onBack, onComplete, isOpponentMode = false }) {
  const { setCurrentTeam, setOpponentTeam } = useGame();

  const [step, setStep] = useState("setup"); // 'setup' lub 'tactics'
  const [activeTacTab, setActiveTacTab] = useState("przy_pilce"); // przy_pilce or bez_pilki

  const [nazwa, setNazwa] = useState("");
  const [liga, setLiga] = useState("Niższa liga");
  const [logoUrl, setLogoUrl] = useState("");
  const [formation, setFormation] = useState("4-3-3");

  const [taktyka, setTaktyka] = useState({
    przy_pilce: Object.keys(OPTIONS.przy_pilce).reduce((acc, key) => {
      acc[key] = OPTIONS.przy_pilce[key][Math.floor(OPTIONS.przy_pilce[key].length / 2)];
      return acc;
    }, {}),
    bez_pilki: Object.keys(OPTIONS.bez_pilki).reduce((acc, key) => {
      acc[key] = OPTIONS.bez_pilki[key][Math.floor(OPTIONS.bez_pilki[key].length / 2)];
      return acc;
    }, {})
  });

  const [players, setPlayers] = useState([]);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Szefie, kreator gotowy. Wprowadź nazwę i zacznij od utworzenia KADRY (min. 11 zawodników), a następnie dopasujemy Twoją TAKTYKĘ."
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const setTac = (tab, key, val) => {
    setTaktyka(prev => ({
      ...prev,
      [tab]: { ...prev[tab], [key]: val }
    }));
  };

  const handleSave = () => {
    if (players.length < 11) {
      alert("Musisz dodać przynajmniej 11 zawodników do kadry!");
      return;
    }

    const template = initialData.druzyny[0];
    
    const taktykaFin = {
      przy_pilce: {
        ...Object.fromEntries(Object.entries(taktyka.przy_pilce).map(([k, v]) => [k.toLowerCase().replace(/ /g, "_"), v])),
      },
      bez_pilki: {
        ...Object.fromEntries(Object.entries(taktyka.bez_pilki).map(([k, v]) => [k.toLowerCase().replace(/ /g, "_"), v])),
      },
    };

    const allFormations = JSON.parse(JSON.stringify(template.formacje));
    const selectedFormation = allFormations.find(f => f.nazwa === formation) || allFormations[0];
    
    // Używamy assignStartingEleven by gracze byli posortowani pod pozycje
    const assignedPlayers = assignStartingEleven(players, selectedFormation.pozycje);
    const startersOnly = assignedPlayers.filter(p => p.isStarting);

    if (isOpponentMode) {
      setOpponentTeam({
        id: Date.now(),
        nazwa: nazwa.trim() || INITIAL_CLUB_NAME,
        logo: logoUrl || INITIAL_LOGO,
        liga: liga.trim() || "Niższa liga",
        domyslna_formacja: formation,
        mentalnosc: "Wyważona",
        taktyka_druzyny: taktykaFin,
        zawodnicy: assignedPlayers,
        formacje: allFormations,
        opcje_taktyczne: JSON.parse(JSON.stringify(template.opcje_taktyczne)),
        role_zawodnikow: JSON.parse(JSON.stringify(template.role_zawodnikow)),
        assignedStarters: startersOnly,
      });
    } else {
      setCurrentTeam({
        id: Date.now(),
        nazwa: nazwa.trim() || INITIAL_CLUB_NAME,
        logo: logoUrl || INITIAL_LOGO,
        liga: liga.trim() || "Niższa liga",
        domyslna_formacja: formation,
        mentalnosc: "Wyważona",
        taktyka_druzyny: taktykaFin,
        zawodnicy: assignedPlayers,
        formacje: allFormations,
        opcje_taktyczne: JSON.parse(JSON.stringify(template.opcje_taktyczne)),
        role_zawodnikow: JSON.parse(JSON.stringify(template.role_zawodnikow)),
        assignedStarters: startersOnly,
      });
    }
    onComplete();
  };

  const handleAiSend = () => {
    if (!chatInput.trim()) return;
    const msg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, msg]);
    setChatInput("");
    setIsAiLoading(true);

    setTimeout(() => {
      setIsAiLoading(false);
      setChatMessages(prev => [...prev, {
        role: "assistant",
        content: `Gotowe! Styl dopasowany do Twoich zaleceń. Zmieniłem ustawienia taktyczne, rzuć okiem na "Taktykę Zespołową".`
      }]);
      setTac("przy_pilce", "Tempo", "Szybciej");
      setTac("przy_pilce", "Bezposredniosc podan", "Krócej");
    }, 1500);
  };

  const handleAddPlayer = (playerData) => {
    const vals = playerData.atrybuty ? Object.values(playerData.atrybuty) : [];
    const ovr = vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 50;
    
    setPlayers(prev => [...prev, {
      id: Date.now(),
      imie_nazwisko: playerData.imie_nazwisko,
      pozycja_glowna: playerData.pozycja_glowna,
      lepsza_noga: playerData.lepsza_noga,
      isStarting: prev.length < 11,
      stan_aktualny: { kontuzja: "brak", forma_ostatnie_5_meczow: 6.5, kondycja: 100, morale: "Dobry" },
      atrybuty: playerData.atrybuty || {},
      wybrane_role: { przy_pilce: "", bez_pilki: "" },
      instrukcje_krycia: { scisle_krycie: "Standardowo", nacisk: "Standardowo", odbior: "Standardowo", wymuszanie_nogi: "Brak" },
      _ovr: ovr,
    }]);
    setIsPlayerModalOpen(false);
  };

  const handleNextStep = () => {
    if (!nazwa.trim()) {
      alert("Proszę podać nazwę klubu.");
      return;
    }
    setStep("tactics");
  };

  if (step === "setup") {
    return (
      <div className="main-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #111 0%, #050505 100%)' }}>
        <button className="selection-back-btn" onClick={onBack}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          WRÓĆ
        </button>
        
        <div style={{ width: '100%', maxWidth: '500px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
          {isOpponentMode && <div style={{ background: '#FF4400', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px' }}>PRZECIWNIK</div>}
          <img src={logoUrl || INITIAL_LOGO} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '30px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
          
          <h2 style={{ margin: '0 0 30px', fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>{nazwa.trim() || "Nowy Klub"}</h2>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>NAZWA KLUBU</label>
              <input type="text" value={nazwa} onChange={e => setNazwa(e.target.value)} placeholder="np. FC Warsaw" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>LIGA</label>
              <input type="text" value={liga} onChange={e => setLiga(e.target.value)} placeholder="np. Niższa liga" style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>URL LOGO (Opcjonalnie)</label>
              <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 16px', color: '#fff', fontSize: '15px', fontWeight: 700, outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <CustomDropdown
                label="DOMYŚLNA FORMACJA"
                options={['4-4-2', '4-3-3', '4-2-3-1', '4-1-4-1', '3-5-2', '3-4-3', '5-3-2', '5-4-1']}
                value={formation}
                onChange={(val) => setFormation(val)}
              />
            </div>
          </div>

          <button className="select-btn" onClick={handleNextStep} style={{ marginTop: '40px', width: '100%', padding: '16px', borderRadius: '16px' }}>
            DALEJ →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* ── HEADER 1:1 z MainWindow ── */}
      <header className="main-header">
        <div className="header-left">
          <div className="team-info">
            <img 
              src={logoUrl || INITIAL_LOGO} 
              alt="Club Logo" 
              className="header-logo" 
              style={{ cursor: 'pointer' }} 
              onClick={() => {
                const url = prompt("Podaj URL nowego logo:", logoUrl);
                if (url) setLogoUrl(url);
              }} 
            />
            <div className="team-text">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ display: 'flex', alignItems: 'center' }}>
                  {nazwa || (isOpponentMode ? "NOWY PRZECIWNIK" : INITIAL_CLUB_NAME)}
                  {isOpponentMode && <span className="opponent-badge" style={{ marginLeft: '10px', fontSize: '10px' }}>PRZECIWNIK</span>}
                </h1>
              </div>
              <span className="league-info">{liga || "Kreator Klubu"}</span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button className="simulate-btn" onClick={() => setStep("setup")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}>
            ← EDYTUJ DANE
          </button>
          <button className="simulate-btn" onClick={handleSave}>
            <span className="material-symbols-outlined">check_circle</span>
            {isOpponentMode ? "ZAPISZ PRZECIWNIKA" : "ZAPISZ KLUB"}
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT 3-COLUMN ── */}
      <main className="main-content">
        
        {/* LEFT COLUMN: DANE KLUBU & KADRA */}
        <section className="left-sec" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="pitch-content-wrapper" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: "uppercase" }}>Wyjściowy skład i rezerwa</h3>
              <button 
                className="simulate-btn"
                onClick={() => setIsPlayerModalOpen(true)}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                + DODAJ ZAWODNIKA
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {players.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                  <p style={{ margin: 0 }}>Brak zawodników w kadrze. Dodaj min. 11 graczy.</p>
                </div>
              ) : (
                players.map((p, idx) => (
                  <div key={p.id} style={{ 
                    display: 'flex', alignItems: 'center', 
                    padding: '8px 16px', background: '#111', 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    borderLeft: '4px solid #00E676',
                    borderRadius: '8px', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '45px', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#fff' }}>{p.pozycja_glowna}</span>
                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>{getFullPosition(p.pozycja_glowna)}</span>
                      </div>

                      <span style={{ fontSize: '18px', marginLeft: '5px' }} title={p.narodowosc || "Polska"}>{getFlag(p.narodowosc || "Polska")}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#00E676' }}>favorite</span>
                      
                      <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '5px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.6)' }}>person</span>
                      </div>

                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginLeft: '5px' }}>{p.imie_nazwisko}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>OCENA</span>
                        <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFEA00', marginTop: '-2px' }}>-</span>
                      </div>
                      
                      <button onClick={() => setPlayers(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '24px', padding: '0 0 4px 0', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color='#ff4b4b'} onMouseLeave={(e) => e.target.style.color='rgba(255,255,255,0.15)'}>&times;</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* MIDDLE COLUMN: TAKTYKA */}
        <section className="mid-sec" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="content-wrapper" style={{ flex: 1, padding: '0', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <div className="main-panel" style={{ padding: '24px 24px 48px', height: '100%' }}>
              
              <div className="tac-tabs" style={{ marginBottom: '28px', display: 'flex', gap: '20px' }}>
                <button 
                  className={`tac-tab ${activeTacTab === "przy_pilce" ? "tac-tab--active" : ""}`}
                  onClick={() => setActiveTacTab("przy_pilce")}
                  style={{ margin: 0 }}
                >
                  Przy piłce
                </button>
                <button 
                  className={`tac-tab ${activeTacTab === "bez_pilki" ? "tac-tab--active" : ""}`}
                  onClick={() => setActiveTacTab("bez_pilki")}
                  style={{ margin: 0 }}
                >
                  Bez piłki
                </button>
              </div>

              <div className="tac-grid">
                {Object.entries(OPTIONS[activeTacTab]).map(([key, opts]) => (
                  <TacticTile
                    key={key}
                    label={key}
                    options={opts}
                    value={taktyka[activeTacTab][key]}
                    onChange={val => setTac(activeTacTab, key, val)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: AI CHAT */}
        <section className="right-sec ai-panel-container">
          <section className="AI-win">
            <div className="messages-container">
              <div style={{ alignSelf: "center", marginBottom: "10px", marginTop: "20px" }}>
                <span style={{ fontSize: '11px', textDecoration: 'underline', opacity: 0.3, cursor: 'pointer' }}>Zmień klucz API</span>
              </div>
              {chatMessages.map((msg, i) => (
                <div key={i} className="message-wrapper">
                  <div className={`message-bubble ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="message-bubble assistant loading-bubble">
                  <div className="loading-dots"><span></span><span></span><span></span></div>
                  Analizuję dane taktyczne...
                </div>
              )}
            </div>
            <div className="inp">
              <input
                type="text"
                id="AIInput"
                placeholder="Zapytaj o taktykę lub zawodnika..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSend()}
              />
              <span
                className={`material-symbols-outlined ${(isAiLoading || !chatInput.trim()) ? 'disabled' : ''}`}
                onClick={handleAiSend}
              >
                arrow_upward
              </span>
            </div>
          </section>
        </section>

      </main>

      {isPlayerModalOpen && (
        <PlayerCreatorModal 
          onClose={() => setIsPlayerModalOpen(false)}
          onSave={handleAddPlayer}
        />
      )}
    </div>
  );
}
