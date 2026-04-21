import { useState } from "react";
import personIcon from "../assets/user-icon.png";
import "../styles/PlayerTacticsPanel/css/PlayerTacticsPanel.css";

// ─── Icons (SVG inline) ───────────────────────────────────────────────────────
const ICONS = {
  "Bezposredniosc podan": () => (
    <svg
      viewBox="0 0 64 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="4"
        y1="8"
        x2="52"
        y2="8"
        stroke="#FF0000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="46,3 52,8 46,13"
        stroke="#FF0000"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="4"
        y1="18"
        x2="44"
        y2="18"
        stroke="#FFFF00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="38,13 44,18 38,23"
        stroke="#FFFF00"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="4"
        y1="28"
        x2="36"
        y2="28"
        stroke="#00BB00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="30,23 36,28 30,33"
        stroke="#00BB00"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  Tempo: () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle cx="32" cy="32" r="26" fill="#CC2200" />
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="12"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="32"
        x2="46"
        y2="38"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="3" fill="white" />
    </svg>
  ),
  "Gra na czas": () => (
    <svg
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <rect x="16" y="2" width="32" height="4" rx="2" fill="#C8A060" />
      <rect x="16" y="66" width="32" height="4" rx="2" fill="#C8A060" />
      <path
        d="M20 6 Q10 20 20 36 Q10 52 20 66 L44 66 Q54 52 44 36 Q54 20 44 6 Z"
        fill="#C8A060"
        opacity="0.85"
      />
      <path
        d="M22 8 Q14 20 22 34"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.3"
        fill="none"
      />
    </svg>
  ),
  "Faza przejscia w ofensywie": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="#888"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="32"
        cy="32"
        r="13"
        stroke="#888"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="32" cy="32" r="4" fill="#888" />
      <circle cx="32" cy="32" r="1" fill="#222" />
    </svg>
  ),
  "Rozpietosc ataku": () => (
    <svg
      viewBox="0 0 72 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="36"
        y1="18"
        x2="8"
        y2="18"
        stroke="#4499FF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="14,11 8,18 14,25"
        stroke="#4499FF"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="36"
        y1="18"
        x2="64"
        y2="18"
        stroke="#4499FF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="58,11 64,18 58,25"
        stroke="#4499FF"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  "Szukaj stalych fragmentow": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle
        cx="26"
        cy="26"
        r="16"
        stroke="#FFAA00"
        strokeWidth="4"
        fill="none"
      />
      <line
        x1="37"
        y1="37"
        x2="56"
        y2="56"
        stroke="#FFAA00"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="26"
        y1="18"
        x2="26"
        y2="34"
        stroke="#FFAA00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="26"
        x2="34"
        y2="26"
        stroke="#FFAA00"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  "Swoboda taktyczna": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <rect
        x="10"
        y="10"
        width="44"
        height="44"
        rx="6"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="22"
        y1="10"
        x2="22"
        y2="54"
        stroke="#aaa"
        strokeWidth="2"
        opacity="0.5"
      />
      <line
        x1="42"
        y1="10"
        x2="42"
        y2="54"
        stroke="#aaa"
        strokeWidth="2"
        opacity="0.5"
      />
      <circle cx="32" cy="32" r="5" fill="#aaa" />
    </svg>
  ),
  "Strategia rozgrywania": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle cx="12" cy="32" r="6" fill="#aaa" />
      <circle cx="32" cy="16" r="6" fill="#aaa" />
      <circle cx="52" cy="32" r="6" fill="#aaa" />
      <path
        d="M18 32 Q32 10 46 32"
        stroke="#aaa"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <polyline
        points="42,26 46,32 40,34"
        stroke="#aaa"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  "Rzuty od bramki": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <rect
        x="8"
        y="44"
        width="20"
        height="12"
        rx="2"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="48"
        cy="20"
        r="10"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="18"
        y1="44"
        x2="42"
        y2="26"
        stroke="#aaa"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <polyline
        points="40,20 42,26 36,26"
        stroke="#aaa"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  "Wyprowadzanie pilki przez bramkarza": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <rect
        x="8"
        y="8"
        width="48"
        height="14"
        rx="3"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <circle
        cx="32"
        cy="44"
        r="12"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="32"
        y1="22"
        x2="32"
        y2="32"
        stroke="#aaa"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polyline
        points="27,28 32,32 37,28"
        stroke="#aaa"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  "Wejscia za pilka": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle cx="32" cy="22" r="8" stroke="#aaa" strokeWidth="3" fill="none" />
      <path
        d="M14 56 Q14 38 32 38 Q50 38 50 56"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="38"
        x2="32"
        y2="52"
        stroke="#FFFF00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="27,48 32,52 37,48"
        stroke="#FFFF00"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  Drybling: () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M10 48 C10 48 16 20 32 28 C48 36 54 8 54 8"
        stroke="#aaa"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="10" cy="50" r="5" fill="#aaa" />
    </svg>
  ),
  Wejscia: () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="32"
        y1="8"
        x2="32"
        y2="56"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="32"
        x2="56"
        y2="32"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="32"
        cy="32"
        r="10"
        stroke="#00BB00"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  ),
  "Odbior podan": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="8"
        y1="32"
        x2="56"
        y2="32"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="5 4"
      />
      <circle cx="48" cy="32" r="8" fill="#4499FF" opacity="0.8" />
    </svg>
  ),
  Cierpliwosc: () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M8 54 L20 32 L32 44 L44 20 L56 32"
        stroke="#FFAA00"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  "Strzaly z dystansu": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="8"
        y1="54"
        x2="50"
        y2="18"
        stroke="#FF4400"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <polyline
        points="40,12 50,18 44,28"
        stroke="#FF4400"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="50"
        y="8"
        width="8"
        height="20"
        rx="1"
        stroke="#aaa"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  ),
  "Styl dosrodkowan": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M8 54 Q20 10 40 28"
        stroke="#aaa"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <polyline
        points="36,22 40,28 34,30"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="50"
        cy="40"
        r="8"
        stroke="#aaa"
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  ),
  "Wyprowadzanie pilki przez bramkarza_tempo": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="#aaa"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="14"
        stroke="#FFFF00"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="32"
        x2="44"
        y2="40"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="3" fill="white" />
    </svg>
  ),
  "Linia nacisku": () => (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="8"
        y1="8"
        x2="56"
        y2="8"
        stroke="#FF0000"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="20"
        x2="56"
        y2="20"
        stroke="#FFAA00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="32"
        x2="56"
        y2="32"
        stroke="#00BB00"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  "Linia defensywna": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="8"
        y1="44"
        x2="56"
        y2="44"
        stroke="#4499FF"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="44" r="5" fill="#4499FF" />
      <circle cx="32" cy="44" r="5" fill="#4499FF" />
      <circle cx="48" cy="44" r="5" fill="#4499FF" />
      <line
        x1="32"
        y1="8"
        x2="32"
        y2="44"
        stroke="#4499FF"
        strokeWidth="2"
        strokeDasharray="4 3"
        opacity="0.5"
      />
    </svg>
  ),
  "Aktywacja pressingu": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M32 8 L38 24 L56 24 L42 34 L48 52 L32 42 L16 52 L22 34 L8 24 L26 24 Z"
        fill="#FFAA00"
        opacity="0.85"
      />
    </svg>
  ),
  "Przejscie defensywne": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="56"
        y1="32"
        x2="12"
        y2="32"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="18,25 12,32 18,39"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="50" cy="22" r="6" fill="#aaa" opacity="0.7" />
      <circle cx="50" cy="42" r="6" fill="#aaa" opacity="0.7" />
    </svg>
  ),
  "Atak na pilke": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle
        cx="32"
        cy="32"
        r="12"
        stroke="#FF4400"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="14"
        y1="14"
        x2="24"
        y2="24"
        stroke="#FF4400"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="14"
        x2="40"
        y2="24"
        stroke="#FF4400"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="50"
        x2="24"
        y2="40"
        stroke="#FF4400"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="50"
        y1="50"
        x2="40"
        y2="40"
        stroke="#FF4400"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  "Reakcja na dosrodkowania": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M8 56 Q20 20 40 36"
        stroke="#aaa"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      <polyline
        points="36,30 40,36 34,38"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="44"
        y1="16"
        x2="44"
        y2="50"
        stroke="#aaa"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
  "Kierunek pressingu": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <path
        d="M8 16 L56 16 L48 48 L16 48 Z"
        stroke="#FFAA00"
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      <line
        x1="32"
        y1="16"
        x2="32"
        y2="48"
        stroke="#FFAA00"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
    </svg>
  ),
  "Krotkie wyprowadzanie rywala": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <circle cx="20" cy="32" r="8" fill="#aaa" opacity="0.6" />
      <line
        x1="28"
        y1="32"
        x2="48"
        y2="32"
        stroke="#FFFF00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polyline
        points="42,26 48,32 42,38"
        stroke="#FFFF00"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  "Zachowanie linii defensywnej": () => (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="ptac-icon"
    >
      <line
        x1="8"
        y1="32"
        x2="56"
        y2="32"
        stroke="#4499FF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="10"
        x2="32"
        y2="54"
        stroke="#4499FF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 3"
        opacity="0.5"
      />
      <polyline
        points="24,20 32,10 40,20"
        stroke="#4499FF"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      <polyline
        points="24,44 32,54 40,44"
        stroke="#4499FF"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
};

function getIcon(key) {
  const Icon = ICONS[key];
  return Icon ? (
    <Icon />
  ) : (
    <svg viewBox="0 0 64 64" fill="none" className="ptac-icon">
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="#888"
        strokeWidth="3"
        fill="none"
      />
      <text x="32" y="38" textAnchor="middle" fontSize="20" fill="#888">
        ?
      </text>
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
      <div className="ptac-tile__icon-wrap">{getIcon(settingKey)}</div>
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
function PlayerTacticsPanel({ player = {} }) {
  const {
    name = "Nieznany",
    surname = "Gracz",
    position = "Brak pozycji",
    positionShort = "—",
  } = player;
  const tabs = Object.keys(OPTIONS);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const currentSettings = OPTIONS[activeTab];

  return (
    <div className="ptac-wrap">
      {/* ── Header ── */}
      <div className="ptac-header">
        <img
          src={personIcon}
          alt="ikona gracza"
          className="ptac-header__avatar"
        />
        <div className="ptac-header__info">
          <div className="ptac-header__name-row">
            <span className="ptac-header__position-badge">{positionShort}</span>
            <span className="ptac-header__position-label">{position}</span>
          </div>
          <p className="ptac-header__fullname">
            {name} {surname}
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

      {/* ── Horizontal scroll strip ── */}
      <div className="ptac-scroll-wrap">
        <div className="ptac-scroll-track">
          {Object.entries(currentSettings).map(([key, opts]) => (
            <TacTile key={key} settingKey={key} options={opts} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Players data ─────────────────────────────────────────────────────────────
const PLAYERS = [
  {
    name: "Ayase",
    surname: "Ueda",
    positionShort: "ST",
    position: "Napastnik",
  },
  {
    name: "Justin",
    surname: "Bijlow",
    positionShort: "GK",
    position: "Bramkarz",
  },
  {
    name: "David",
    surname: "Hancko",
    positionShort: "CB",
    position: "Środkowy obrońca",
  },
  {
    name: "Lutsharel",
    surname: "Geertruida",
    positionShort: "RB/CB",
    position: "Prawy obrońca / Środkowy obrońca",
  },
  {
    name: "Gernot",
    surname: "Trauner",
    positionShort: "CB",
    position: "Środkowy obrońca",
  },
];

// ─── Main exported list ───────────────────────────────────────────────────────
export default function PlayerTacticsList() {
  return (
    <div className="ptac-list">
      {PLAYERS.map((player) => (
        <div
          key={`${player.name}-${player.surname}`}
          className="ptac-list__item"
        >
          <PlayerTacticsPanel player={player} />
          <div className="ptac-list__divider" />
        </div>
      ))}
    </div>
  );
}
