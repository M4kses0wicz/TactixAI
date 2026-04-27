import { useState } from "react";
import personIcon from "../assets/user-icon.png";
import "../styles/PlayerTacticsPanel/css/PlayerTacticsPanel.css";
import { useGame } from "../context/GameContext";

// ─── Icons (SVG inline) ───────────────────────────────────────────────────────
const ICONS = {
  "Bezposredniosc podan": ({ idx, total }) => {
    const lengths = [10, 20, 30, 40, 50];
    const len = lengths[idx] || 30;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 72" fill="none" className="ptac-icon">
        <rect x="16" y="2" width="32" height="4" rx="2" fill="#C8A060" /><rect x="16" y="66" width="32" height="4" rx="2" fill="#C8A060" />
        <path d="M20 6 Q10 20 20 36 Q10 52 20 66 L44 66 Q54 52 44 36 Q54 20 44 6 Z" fill="#C8A060" opacity="0.3" />
        <path d={`M20 66 L44 66 Q54 52 44 ${66 - fillLevel} L20 ${66 - fillLevel} Q10 52 20 66 Z`} fill="#C8A060" />
      </svg>
    );
  },
  "Faza przejscia w ofensywie": ({ idx }) => {
    const colors = ["#888", "#aaa", "#44FF44"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <circle cx="32" cy="32" r="22" stroke={colors[idx]} strokeWidth="3" fill="none" />
        <circle cx="32" cy="32" r="13" stroke={colors[idx]} strokeWidth="3" fill="none" />
        <circle cx="32" cy="32" r={4 + idx * 2} fill={colors[idx]} />
      </svg>
    );
  },
  "Rozpietosc ataku": ({ idx, total }) => {
    const width = 10 + (idx / (total - 1)) * 40;
    return (
      <svg viewBox="0 0 64 48" fill="none" className="ptac-icon">
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
    <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
      <circle cx="26" cy="26" r="16" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" fill="none" />
      <line x1="37" y1="37" x2="56" y2="56" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" strokeLinecap="round" />
      <g opacity={idx === 1 ? 1 : 0.3}><line x1="26" y1="18" x2="26" y2="34" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" /><line x1="18" y1="26" x2="34" y2="26" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" /></g>
    </svg>
  ),
  "Swoboda taktyczna": ({ idx }) => {
    const opacity = 0.2 + (idx * 0.4);
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <rect x="10" y="10" width="44" height="44" rx="6" stroke="#aaa" strokeWidth="3" fill="none" />
        <line x1="22" y1="10" x2="22" y2="54" stroke="#aaa" strokeWidth="2" opacity={1 - opacity} />
        <line x1="42" y1="10" x2="42" y2="54" stroke="#aaa" strokeWidth="2" opacity={1 - opacity} />
        <circle cx="32" cy="32" r="5" fill="#aaa" opacity={opacity} />
      </svg>
    );
  },
  "Strategia rozgrywania": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <circle cx="32" cy="22" r="8" stroke="#aaa" strokeWidth="3" fill="none" /><path d="M14 56 Q14 38 32 38 Q50 38 50 56" stroke="#aaa" strokeWidth="3" fill="none" strokeLinecap="round" />
        {left && <path d="M20 38 Q10 30 10 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {right && <path d="M44 38 Q54 30 54 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
      </svg>
    );
  },
  Drybling: ({ idx }) => {
    const paths = [
      "M12 52 L52 12",
      "M12 52 C20 40 44 60 52 12",
      "M12 52 Q15 20 32 32 Q49 44 52 12"
    ];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <path d={paths[idx]} stroke="#D131F5" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <polyline points="46,18 52,12 44,12" stroke="#D131F5" strokeWidth="3.5" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="52" r="5" fill="white" />
      </svg>
    );
  },
  Wejscia: ({ idx }) => {
    const color = idx === 0 ? "#888" : "#00E676";
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <rect x="16" y="8" width="32" height="12" stroke="white" strokeWidth="2.5" rx="1" />
        <path d="M32 52 L32 25" stroke="#FF3D00" strokeWidth="4.5" strokeLinecap="round" opacity={opacity} />
        <polyline points="26,32 32,25 38,32" stroke="#FF3D00" strokeWidth="3.5" strokeLinejoin="round" fill="none" opacity={opacity} />
        <circle cx="32" cy="52" r="5" fill="white" />
        {idx === 2 && <path d="M20 40 L44 40" stroke="#FF3D00" strokeWidth="1.5" opacity="0.3" />}
      </svg>
    );
  },
  "Styl dosrodkowan": ({ idx }) => {
    const paths = ["M8 54 Q20 10 40 28", "M8 54 Q20 -10 40 10", "M8 54 L40 54", "M8 54 Q30 40 40 45"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        <path d="M20 56 L44 56" stroke="#4B4B4B" strokeWidth="4" />
        <line x1="12" y1={y} x2="52" y2={y} stroke="#4499FF" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  },
  "Aktywacja pressingu": ({ idx }) => {
    const intensity = idx + 1;
    const colors = ["#666", "#aaa", "#FFAA00", "#FF6600", "#FF0000"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
          <circle cx="32" cy="32" r="8" stroke="#888" strokeWidth="1.5" opacity="0.5" />
        )}
      </svg>
    );
  },
  "Kierunek pressingu": ({ idx }) => {
    const widths = [40, 20, 10]; const x = 32 - widths[idx] / 2;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
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
      <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
        <line x1="8" y1="32" x2="56" y2="32" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" />
        {idx === 0 && <polyline points="24,20 32,10 40,20" stroke={colors[idx]} strokeWidth="2.5" fill="none" />}
        {idx === 2 && <polyline points="24,44 32,54 40,44" stroke={colors[idx]} strokeWidth="2.5" fill="none" />}
      </svg>
    );
  },
};

function getIcon(key, idx, total) {
  const Icon = ICONS[key];
  return Icon ? (
    <Icon idx={idx} total={total} />
  ) : (
    <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
      <circle cx="32" cy="32" r="20" stroke="#888" strokeWidth="3" fill="none" />
      <text x="32" y="38" textAnchor="middle" fontSize="20" fill="#888">?</text>
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const OPTIONS = {
  "Przy pilce": {
    "Bezposredniosc podan": [
      "Znacznie krócej",
      "Krócej",
      "Standardowo",
      "Bardziej bezpośrednio",
      "Znacznie bardziej bezpośrednio",
    ],
    Tempo: [
      "Znacznie wolniej",
      "Wolniej",
      "Standardowo",
      "Wyżej",
      "Znacznie wyżej",
    ],
    "Gra na czas": ["Rzadziej", "Standardowo", "Częściej"],
    "Faza przejscia w ofensywie": [
      "Utrzymanie pozycji",
      "Standardowo",
      "Kontratak",
    ],
    "Rozpietosc ataku": [
      "Znacznie węziej",
      "Węziej",
      "Standardowo",
      "Szerzej",
      "Znacznie szerzej",
    ],
    "Szukaj stalych fragmentow": [
      "Utrzymuj piłkę",
      "Szukaj stałych fragmentów gry",
    ],
    "Swoboda taktyczna": [
      "Więcej dyscypliny",
      "Zrównoważone",
      "Mniej dyscypliny",
    ],
    "Strategia rozgrywania": [
      "Gra pod pressingiem",
      "Zrównoważone",
      "Omijaj pressing",
    ],
    "Rzuty od bramki": ["Krótko", "Mieszane", "Długo"],
    "Wyprowadzanie pilki przez bramkarza": [
      "Zrównoważone",
      "Środkowi obrońcy",
      "Boczni obrońcy",
      "Flanki",
      "rozgrywający",
      "odgrywający",
    ],
    "Wejscia za pilka": ["Zrównoważone", "Lewy", "Prawy", "Oba skrzydła"],
    Drybling: ["Odradź", "Zrównoważone", "Zachęcaj"],
    Wejscia: ["Zrównoważone", "Środek", "Lewy", "Prawy", "Oba skrzydła"],
    "Odbior podan": ["Podania do nogi", "Podania na wolne pole"],
    Cierpliwosc: ["Szybkie centry", "Standardowo", "Podania w pole karne"],
    "Strzaly z dystansu": ["Odradź", "Zrównoważone", "Zachęć"],
    "Styl dosrodkowan": [
      "Zrównoważone",
      "Miękkie dośrodkowania",
      "Kąśliwe dośrodkowania",
      "Niskie dośrodkowania",
    ],
    "Wyprowadzanie pilki przez bramkarza_tempo": [
      "Zwolnij tempo",
      "Zrównoważone",
      "Szybkie wyprowadzanie",
    ],
  },
  "Bez pilki": {
    "Linia nacisku": ["Niski pressing", "Średni pressing", "Wysoki pressing"],
    "Linia defensywna": [
      "Znacznie niżej",
      "Niżej",
      "Standardowo",
      "Wyżej",
      "Znacznie wyżej",
    ],
    "Aktywacja pressingu": [
      "Znacznie rzadziej",
      "Rzadziej",
      "Standardowo",
      "Częściej",
      "Znacznie częściej",
    ],
    "Przejscie defensywne": ["Przegrupowanie", "Standardowo", "Kontrpressing"],
    "Atak na pilke": ["Gra bez wślizgów", "Standardowo", "Agresywny odbiór"],
    "Reakcja na dosrodkowania": [
      "Powstrzymuj dośrodkowania",
      "Zrównoważone",
      "Zachęcaj do dośrodkowań",
    ],
    "Kierunek pressingu": [
      "Szeroki pressing",
      "Zrównoważony pressing",
      "Wąski pressing",
    ],
    "Krotkie wyprowadzanie rywala": ["Nie", "Tak"],
    "Zachowanie linii defensywnej": [
      "Graj wyżej",
      "Zrównoważone",
      "Graj głębiej",
    ],
  },
};

const DISPLAY_NAMES = {
  "Bezposredniosc podan": "Bezpośredniość podań",
  Tempo: "Tempo",
  "Gra na czas": "Gra na czas",
  "Faza przejscia w ofensywie": "Faza przejścia w ofensywie",
  "Rozpietosc ataku": "Rozpiętość ataku",
  "Szukaj stalych fragmentow": "Szukaj stałych fragmentów",
  "Swoboda taktyczna": "Swoboda taktyczna",
  "Strategia rozgrywania": "Strategia rozgrywania",
  "Rzuty od bramki": "Rzuty od bramki",
  "Wyprowadzanie pilki przez bramkarza": "Wyprowadzanie piłki przez bramkarza",
  "Wejscia za pilka": "Wejścia za piłką",
  Drybling: "Drybling",
  Wejscia: "Wejścia",
  "Odbior podan": "Odbiór podań",
  Cierpliwosc: "Cierpliwość",
  "Strzaly z dystansu": "Strzały z dystansu",
  "Styl dosrodkowan": "Styl dośrodkowań",
  "Wyprowadzanie pilki przez bramkarza_tempo":
    "Tempo wyprowadzania przez bramkarza",
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

// ─── Single tile ──────────────────────────────────────────────────────────────
function RoleTile({ tabKey, player, options, isOpponent }) {
  const { updatePlayerRole, updateOpponentPlayerRole } = useGame();
  
  const type = tabKey === "Przy pilce" ? "przy_pilce" : "bez_pilki";
  const currentRole = player.wybrane_role?.[type] || options[0];
  const idx = Math.max(0, options.indexOf(currentRole));

  const prev = () => {
    if (options.length === 0) return;
    const newIdx = (idx - 1 + options.length) % options.length;
    updatePlayerRole(player.id, type, options[newIdx]);
  };
  const next = () => {
    if (options.length === 0) return;
    const newIdx = (idx + 1) % options.length;
    if (isOpponent) {
      updateOpponentPlayerRole(player.id, type, options[newIdx]);
    } else {
      updatePlayerRole(player.id, type, options[newIdx]);
    }
  };

  return (
    <div className="ptac-tile">
      <h3 className="ptac-tile__title">Rola: {tabKey === "Przy pilce" ? "Przy piłce" : "Bez piłki"}</h3>
      <div className="ptac-tile__icon-wrap">
        <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
          <circle cx="32" cy="32" r="20" stroke="#888" strokeWidth="3" fill="none" />
          <text x="32" y="38" textAnchor="middle" fontSize="20" fill="#888">R</text>
        </svg>
      </div>
      <div className="ptac-tile__control">
        <button className="ptac-tile__arrow" onClick={prev}>‹</button>
        <span className="ptac-tile__value" style={{fontSize: "12px"}}>{currentRole || "Brak ról"}</span>
        <button className="ptac-tile__arrow" onClick={next}>›</button>
      </div>
    </div>
  );
}

function TacTile({ settingKey, options }) {
  const midIndex = Math.floor(options.length / 2);
  const [idx, setIdx] = useState(midIndex);

  const prev = () => setIdx((i) => (i - 1 + options.length) % options.length);
  const next = () => setIdx((i) => (i + 1) % options.length);

  return (
    <div className="ptac-tile">
      <h3 className="ptac-tile__title">
        {DISPLAY_NAMES[settingKey] ?? settingKey}
      </h3>
      <div className="ptac-tile__icon-wrap">{getIcon(settingKey, idx, options.length)}</div>
      <div className="ptac-tile__control">
        <button className="ptac-tile__arrow" onClick={prev}>
          ‹
        </button>
        <span className="ptac-tile__value">{options[idx]}</span>
        <button className="ptac-tile__arrow" onClick={next}>
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Single player panel ──────────────────────────────────────────────────────
function PlayerTacticsPanel({ player, isOpponent }) {
  const { currentTeam, opponentTeam, getPlayerPhoto } = useGame();
  
  const activeTeam = isOpponent ? (opponentTeam || currentTeam) : currentTeam;
  const tabs = ["Przy pilce", "Bez pilki"];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Determine roles based on position
  const type = activeTab === "Przy pilce" ? "przy_pilce" : "bez_pilki";
  const pos = player.pozycja_glowna;
  
  // Use ŚO3 if formation is 3/5 at back, otherwise ŚO4
  let queryPos = pos;
  if (pos === "ŚO4" || pos === "ŚO3") {
     const form = currentTeam.domyslna_formacja;
     queryPos = form.startsWith("3") || form.startsWith("5") ? "ŚO3" : "ŚO4";
  }

  const roleOptions = activeTeam.role_zawodnikow[type]?.[queryPos] || [];

  return (
    <div className="ptac-wrap">
      {/* ── Header ── */}
      <div className="ptac-header">
        <img
          src={getPlayerPhoto(player.imie_nazwisko)}
          alt="ikona gracza"
          className="ptac-header__avatar"
          style={{ 
            filter: "none",
            borderRadius: getPlayerPhoto(player.imie_nazwisko) !== personIcon ? "50%" : "0",
            border: getPlayerPhoto(player.imie_nazwisko) !== personIcon ? "1px solid rgba(255,255,255,0.15)" : "none"
          }}
        />
        <div className="ptac-header__info">
          <div className="ptac-header__name-row">
            <span className="ptac-header__position-badge">{pos}</span>
            <span className="ptac-header__position-label">{pos}</span>
          </div>
          <p className="ptac-header__fullname">
            {player.imie_nazwisko}{" "}
            {player.narodowosc && (
              <img 
                src={player.narodowosc} 
                alt="flag" 
                style={{ 
                  width: "20px", 
                  height: "auto", 
                  verticalAlign: "middle", 
                  marginLeft: "8px",
                  borderRadius: "2px"
                }} 
              />
            )}
          </p>
          {/* Tab switcher inline */}
          <div className="ptac-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`ptac-tab ${activeTab === tab ? "ptac-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "Przy pilce" ? "Przy piłce" : "Bez piłki"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid Layout ── */}
      <div className="ptac-scroll-wrap">
        <div className="ptac-scroll-track">
          <RoleTile tabKey={activeTab} player={player} options={roleOptions} isOpponent={isOpponent} />
          {Object.entries(OPTIONS[activeTab]).map(([key, opts]) => (
            <TacTile key={key} settingKey={key} options={opts} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main exported list ───────────────────────────────────────────────────────
export default function PlayerTacticsList({ isOpponent }) {
  const { currentTeam, opponentTeam } = useGame();
  
  if (!currentTeam) return null;

  const activeTeam = isOpponent ? (opponentTeam || currentTeam) : currentTeam;

    const starters = activeTeam.zawodnicy.filter(p => p.isStarting);

  return (
    <div className="ptac-list">
      {starters.map((player) => (
        <div
          key={player.id}
          className="ptac-list__item"
        >
          <PlayerTacticsPanel player={player} isOpponent={isOpponent} />
          <div className="ptac-list__divider" />
        </div>
      ))}
    </div>
  );
}
