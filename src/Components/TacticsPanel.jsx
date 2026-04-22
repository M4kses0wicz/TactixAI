import { useState } from "react";
import "../styles/TacticsPanel/css/TacticsPanel.css";
import { useGame } from "../context/GameContext";

// ─── Icons (SVG inline) ───────────────────────────────────────────────────────
const ICONS = {
  "Bezposredniosc podan": ({ idx, total }) => {
    // idx: 0-4
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        {[0, 1, 2, 3].map((i) => {
          const isActive = (idx === 4 - i);
          const opacity = isActive ? 1 : 0.2;
          const y = 16 + i * 10;
          return (
            <g key={i} opacity={opacity}>
              <line x1="10" y1={y} x2="44" y2={y} stroke="#D131F5" strokeWidth="2" strokeLinecap="round" />
              <circle cx={44 + (isActive ? 6 : 0)} cy={y} r="3" fill="#D131F5" />
              {isActive && <path d={`M44 ${y} L52 ${y}`} stroke="#D131F5" strokeWidth="2" strokeDasharray="2 2" />}
            </g>
          );
        })}
      </svg>
    );
  },
  Tempo: ({ idx, total }) => {
    const angle = -60 + (idx / (total - 1)) * 120;
    const progress = (idx / (total - 1));
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#4B4B4B" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M12 48 A24 24 0 0 1 52 48" stroke="#D131F5" strokeWidth="6" strokeLinecap="round" fill="none" 
              strokeDasharray="100" strokeDashoffset={100 - progress * 100} />
        <g transform={`rotate(${angle}, 32, 48)`}>
          <line x1="32" y1="48" x2="32" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" />
          <circle cx="32" cy="48" r="4" fill="white" />
        </g>
      </svg>
    );
  },
  "Gra na czas": ({ idx }) => {
    const fillLevel = 6 + (idx * 20); // More sand at the bottom for higher idx
    return (
      <svg viewBox="0 0 64 72" fill="none" className="tac-icon">
        <rect x="16" y="2" width="32" height="4" rx="2" fill="#C8A060" />
        <rect x="16" y="66" width="32" height="4" rx="2" fill="#C8A060" />
        <path d="M20 6 Q10 20 20 36 Q10 52 20 66 L44 66 Q54 52 44 36 Q54 20 44 6 Z" fill="#C8A060" opacity="0.3" />
        {/* Bottom sand */}
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
        <rect x="4" y="8" width="56" height="32" stroke="#4B4B4B" strokeWidth="2" rx="2" />
        <rect x={32 - width/2} y="8" width={width} height="32" fill="#D131F5" opacity="0.3" rx="1" />
        <g transform={`translate(${32 + width/2}, 24)`}>
          <line x1="0" y1="0" x2="6" y2="0" stroke="#D131F5" strokeWidth="3" strokeLinecap="round" />
          <polyline points="2,-4 6,0 2,4" stroke="#D131F5" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        </g>
        <g transform={`translate(${32 - width/2}, 24) rotate(180)`}>
          <line x1="0" y1="0" x2="6" y2="0" stroke="#D131F5" strokeWidth="3" strokeLinecap="round" />
          <polyline points="2,-4 6,0 2,4" stroke="#D131F5" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
        </g>
      </svg>
    );
  },
  "Szukaj stalych fragmentow": ({ idx }) => (
    <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
      <circle cx="26" cy="26" r="16" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" fill="none" />
      <line x1="37" y1="37" x2="56" y2="56" stroke={idx === 1 ? "#FFAA00" : "#666"} strokeWidth="4" strokeLinecap="round" />
      <g opacity={idx === 1 ? 1 : 0.3}>
        <line x1="26" y1="18" x2="26" y2="34" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="26" x2="34" y2="26" stroke="#FFAA00" strokeWidth="3" strokeLinecap="round" />
      </g>
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
    const highlight = idx; // 0, 1, 2
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="12" r="4" fill={highlight === 1 ? "#D131F5" : "#4B4B4B"} />
        <circle cx="12" cy="52" r="4" fill={highlight === 0 ? "#D131F5" : "#4B4B4B"} />
        <circle cx="52" cy="52" r="4" fill={highlight === 2 ? "#D131F5" : "#4B4B4B"} />
        <path d="M16 48 L28 16" stroke={highlight === 0 ? "#D131F5" : "#4B4B4B"} strokeWidth="2" strokeDasharray="4 2" />
        <path d="M48 48 L36 16" stroke={highlight === 2 ? "#D131F5" : "#4B4B4B"} strokeWidth="2" strokeDasharray="4 2" />
        <path d="M18 52 L46 52" stroke="#4B4B4B" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M32 12 L32 32" stroke={highlight === 1 ? "#D131F5" : "#4B4B4B"} strokeWidth="3" strokeLinecap="round" />
        <polyline points="28,26 32,32 36,26" stroke={highlight === 1 ? "#D131F5" : "#4B4B4B"} strokeWidth="2.5" fill="none" />
      </svg>
    );
  },
  "Rzuty od bramki": ({ idx }) => {
    const heights = [15, 30, 45];
    const targetY = 56 - heights[idx];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="20" y="52" width="24" height="8" stroke="white" strokeWidth="2" />
        <path d={`M32 52 Q32 32 32 ${targetY}`} stroke="#D131F5" strokeWidth="3" strokeDasharray="4 2" strokeLinecap="round" />
        <path d={`M32 52 Q20 35 12 ${targetY + 5}`} stroke="#D131F5" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />
        <path d={`M32 52 Q44 35 52 ${targetY + 5}`} stroke="#D131F5" strokeWidth="2" opacity="0.4" strokeDasharray="4 2" />
        <circle cx="32" cy={targetY} r="3" fill="#D131F5" />
      </svg>
    );
  },
  "Wyprowadzanie pilki przez bramkarza": ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        <line x1="8" y1="32" x2="56" y2="32" stroke="#4B4B4B" strokeWidth="1" strokeDasharray="4 2" />
        {idx === 1 && <rect x="24" y="40" width="16" height="8" fill="#D131F5" rx="1" />}
        {idx === 2 && <><rect x="12" y="40" width="8" height="8" fill="#D131F5" rx="1" /><rect x="44" y="40" width="8" height="8" fill="#D131F5" rx="1" /></>}
        {idx === 3 && <><rect x="10" y="15" width="6" height="34" fill="#D131F5" rx="1" /><rect x="48" y="15" width="6" height="34" fill="#D131F5" rx="1" /></>}
        {idx === 4 && <circle cx="32" cy="32" r="6" fill="#D131F5" />}
        {idx === 5 && <circle cx="32" cy="18" r="6" fill="#D131F5" />}
        <circle cx="32" cy="52" r="3" fill="white" />
      </svg>
    );
  },
  "Wejscia za pilka": ({ idx }) => {
    const left = idx === 1 || idx === 3;
    const right = idx === 2 || idx === 3;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="22" r="8" stroke="#aaa" strokeWidth="3" fill="none" />
        <path d="M14 56 Q14 38 32 38 Q50 38 50 56" stroke="#aaa" strokeWidth="3" fill="none" strokeLinecap="round" />
        {left && <path d="M20 38 Q10 30 10 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {right && <path d="M44 38 Q54 30 54 20" stroke="#FFFF00" strokeWidth="3" fill="none" strokeLinecap="round" />}
      </svg>
    );
  },
  Drybling: ({ idx }) => {
    const paths = [
      "M12 52 L52 12", // Less
      "M12 52 C20 40 44 60 52 12", // Std
      "M12 52 Q15 20 32 32 Q49 44 52 12" // More
    ];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d={paths[idx]} stroke="#D131F5" strokeWidth="4" strokeLinecap="round" fill="none" />
        <polyline points="46,18 52,12 44,12" stroke="#D131F5" strokeWidth="3" strokeLinejoin="round" fill="none" />
        <circle cx="12" cy="52" r="4" fill="white" />
      </svg>
    );
  },
  Wejscia: ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="8" y="8" width="48" height="48" stroke="#4B4B4B" strokeWidth="2" rx="4" />
        <rect x="20" y="8" width="24" height="12" stroke="#4B4B4B" strokeWidth="2" />
        {(idx === 0 || idx === 1 || idx === 4) && <path d="M32 48 L32 20" stroke="#D131F5" strokeWidth="3" strokeLinecap="round" />}
        {(idx === 2 || idx === 4) && <path d="M16 40 Q16 20 28 15" stroke="#D131F5" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
        {(idx === 3 || idx === 4) && <path d="M48 40 Q48 20 36 15" stroke="#D131F5" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
        <circle cx="32" cy="52" r="3" fill="white" />
      </svg>
    );
  },
  "Odbior podan": ({ idx }) => (
    <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
      <circle cx="16" cy="48" r="4" fill="white" />
      <circle cx="48" cy="24" r="5" stroke="#D131F5" strokeWidth="2" />
      {idx === 0 ? (
        <path d="M22 44 L42 28" stroke="#D131F5" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <path d="M20 48 Q35 48 44 32" stroke="#D131F5" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      <polyline points="38,28 42,28 42,34" stroke="#D131F5" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Cierpliwosc: ({ idx }) => {
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="12" y="40" width="40" height="4" fill="#4B4B4B" rx="2" />
        {idx === 2 && <rect x="12" y="40" width="40" height="4" fill="#D131F5" rx="2" />}
        <path d="M20 30 L32 30 L44 30" stroke="#D131F5" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="32" cy="18" r="6" stroke="#D131F5" strokeWidth="3" />
        <line x1="32" y1="24" x2="32" y2="40" stroke="#D131F5" strokeWidth="2" />
      </svg>
    );
  },
  "Strzaly z dystansu": ({ idx }) => {
    const opacity = idx === 0 ? 0.2 : idx === 1 ? 0.5 : 1;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x="16" y="8" width="32" height="12" stroke="white" strokeWidth="2" />
        <path d="M32 52 L32 25" stroke="#D131F5" strokeWidth="4" strokeLinecap="round" opacity={opacity} />
        <polyline points="26,32 32,25 38,32" stroke="#D131F5" strokeWidth="3" strokeLinejoin="round" fill="none" opacity={opacity} />
        <circle cx="32" cy="52" r="4" fill="white" />
        {idx === 2 && <path d="M20 40 L44 40" stroke="#D131F5" strokeWidth="1" opacity="0.3" />}
      </svg>
    );
  },
  "Styl dosrodkowan": ({ idx }) => {
    const paths = [
      "M8 54 Q20 10 40 28", // Std
      "M8 54 Q20 -10 40 10", // High
      "M8 54 L40 54",      // Low
      "M8 54 Q30 40 40 45"  // Whipped
    ];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d={paths[idx] || paths[0]} stroke="#aaa" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="40" r="8" stroke="#aaa" strokeWidth="2.5" fill="none" />
      </svg>
    );
  },
  "Wyprowadzanie pilki przez bramkarza_tempo": ({ idx }) => {
    const rotation = -60 + (idx * 60);
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="32" r="22" stroke="#aaa" strokeWidth="3" fill="none" />
        <g transform={`rotate(${rotation}, 32, 32)`}>
          <line x1="32" y1="32" x2="32" y2="14" stroke="#FFFF00" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="32" r="3" fill="white" />
        </g>
      </svg>
    );
  },
  // ── Bez piłki ──
  "Linia nacisku": ({ idx, total }) => {
    const y = 8 + (idx / (total - 1)) * 24;
    return (
      <svg viewBox="0 0 64 40" fill="none" className="tac-icon">
        <line x1="8" y1={y} x2="56" y2={y} stroke="#FF4400" strokeWidth="4" strokeLinecap="round" />
        <line x1="8" y1="20" x2="56" y2="20" stroke="#aaa" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
      </svg>
    );
  },
  "Linia defensywna": ({ idx, total }) => {
    const y = 50 - (idx / (total - 1)) * 30;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <line x1="8" y1={y} x2="56" y2={y} stroke="#4499FF" strokeWidth="4" strokeLinecap="round" />
        <circle cx="16" cy={y} r="4" fill="#4499FF" />
        <circle cx="48" cy={y} r="4" fill="#4499FF" />
      </svg>
    );
  },
  "Aktywacja pressingu": ({ idx }) => {
    const scale = 0.6 + (idx * 0.2);
    const color = ["#666", "#aaa", "#FFAA00", "#FF6600", "#FF0000"][idx];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path
          d="M32 8 L38 24 L56 24 L42 34 L48 52 L32 42 L16 52 L22 34 L8 24 L26 24 Z"
          fill={color}
          transform={`scale(${scale})`}
          transform-origin="center"
        />
      </svg>
    );
  },
  "Przejscie defensywne": ({ idx }) => {
    const colors = ["#4499FF", "#aaa", "#FF4400"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <line x1="56" y1="32" x2="12" y2="32" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" />
        <polyline points="18,25 12,32 18,39" stroke={colors[idx]} strokeWidth="3" strokeLinejoin="round" fill="none" />
        <circle cx="50" cy="22" r="6" fill={colors[idx]} opacity="0.7" />
        <circle cx="50" cy="42" r="6" fill={colors[idx]} opacity="0.7" />
      </svg>
    );
  },
  "Atak na pilke": ({ idx }) => {
    const colors = ["#aaa", "#FF8800", "#FF0000"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <circle cx="32" cy="32" r="12" stroke={colors[idx]} strokeWidth={2 + idx} fill="none" />
        <line x1="14" y1="14" x2="24" y2="24" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="14" x2="40" y2="24" stroke={colors[idx]} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  },
  "Reakcja na dosrodkowania": ({ idx }) => {
    const colors = ["#FF4400", "#aaa", "#44FF44"];
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <path d="M8 56 Q20 20 40 36" stroke={colors[idx]} strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <line x1="44" y1="16" x2="44" y2="50" stroke="#aaa" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  },
  "Kierunek pressingu": ({ idx }) => {
    const widths = [40, 20, 10];
    const x = 32 - widths[idx] / 2;
    return (
      <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
        <rect x={x} y="16" width={widths[idx]} height="32" rx="4" stroke="#FFAA00" strokeWidth="3" fill="none" />
        <line x1="32" y1="16" x2="32" y2="48" stroke="#FFAA00" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    );
  },
  "Krotkie wyprowadzanie rywala": ({ idx }) => (
    <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
      <circle cx="20" cy="32" r="8" fill="#aaa" opacity={idx === 1 ? 1 : 0.3} />
      <line x1="28" y1="32" x2="48" y2="32" stroke={idx === 1 ? "#FFFF00" : "#666"} strokeWidth="3" strokeLinecap="round" />
      <polyline points="42,26 48,32 42,38" stroke={idx === 1 ? "#FFFF00" : "#666"} strokeWidth="3" strokeLinejoin="round" fill="none" />
    </svg>
  ),
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

function getIcon(key, idx, total) {
  const Icon = ICONS[key];
  return Icon ? (
    <Icon idx={idx} total={total} />
  ) : (
    <svg viewBox="0 0 64 64" fill="none" className="tac-icon">
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

// ─── Display labels ───────────────────────────────────────────────────────────
const DISPLAY_NAMES = {
  "Bezposredniosc podan": "Bezpośredniość Podań",
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
function TacTile({ tabKey, settingKey, options, isOpponent }) {
  const { currentTeam, updateTactics } = useGame();
  
  const jsonKey = settingKey.toLowerCase().replace(/ /g, "_");
  const jsonTab = tabKey === "Przy pilce" ? "przy_pilce" : "bez_pilki";

  // Opponent mode: use local state with midpoint default
  const midIndex = Math.floor(options.length / 2);
  const [oppIdx, setOppIdx] = useState(midIndex);

  if (isOpponent) {
    const oppPrev = () => setOppIdx((i) => (i - 1 + options.length) % options.length);
    const oppNext = () => setOppIdx((i) => (i + 1) % options.length);

    return (
      <div className="tac-tile">
        <h3 className="tac-tile__title">
          {DISPLAY_NAMES[settingKey] ?? settingKey}
        </h3>
        <div className="tac-tile__icon-wrap">{getIcon(settingKey, oppIdx, options.length)}</div>
        <div className="tac-tile__control">
          <button className="tac-tile__arrow" onClick={oppPrev}>‹</button>
          <span className="tac-tile__value">{options[oppIdx]}</span>
          <button className="tac-tile__arrow" onClick={oppNext}>›</button>
        </div>
      </div>
    );
  }

  // Team mode: read/write from context
  const currentValue = currentTeam.taktyka_druzyny[jsonTab]?.[jsonKey] || options[0];
  const idx = Math.max(0, options.indexOf(currentValue));

  const prev = () => {
    const newIdx = (idx - 1 + options.length) % options.length;
    updateTactics(jsonTab, jsonKey, options[newIdx]);
  };
  const next = () => {
    const newIdx = (idx + 1) % options.length;
    updateTactics(jsonTab, jsonKey, options[newIdx]);
  };

  return (
    <div className="tac-tile">
      <h3 className="tac-tile__title">
        {DISPLAY_NAMES[settingKey] ?? settingKey}
      </h3>
      <div className="tac-tile__icon-wrap">{getIcon(settingKey, idx, options.length)}</div>
      <div className="tac-tile__control">
        <button className="tac-tile__arrow" onClick={prev}>
          ‹
        </button>
        <span className="tac-tile__value">{currentValue}</span>
        <button className="tac-tile__arrow" onClick={next}>
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TacticsPanel({ isOpponent }) {
  const { currentTeam, updateFormation } = useGame();
  const tabs = Object.keys(OPTIONS);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const currentSettings = OPTIONS[activeTab];

  if (!currentTeam) return null;

  return (
    <div className="tac-wrap">
      {isOpponent && (
        <div style={{ padding: "0 0 12px", color: "rgba(255,255,255,0.5)", fontSize: "13px", fontFamily: "'Lato', sans-serif", fontWeight: 700, letterSpacing: "0.03em" }}>
          Taktyka przeciwnika
        </div>
      )}

      {/* tab switcher */}
      <div className="tac-tabs">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`tac-tab ${activeTab === tab ? "tac-tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Przy pilce" ? "Przy piłce" : "Bez piłki"}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="tac-grid">
        {Object.entries(currentSettings).map(([key, opts]) => (
          <TacTile key={key} tabKey={activeTab} settingKey={key} options={opts} isOpponent={isOpponent} />
        ))}
      </div>
    </div>
  );
}
