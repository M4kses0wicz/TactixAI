import React, { useState } from "react";
import "../styles/OpponentInstructionsModal/css/OpponentInstructionsModal.css";
import { useGame } from "../context/GameContext";

export default function OpponentInstructionsModal({ player, onClose }) {
  const { getPlayerPhoto, updateOpponentInstructions } = useGame();

  // Initialize state with player's current instructions or defaults
  const [instructions, setInstructions] = useState({
    scisle_krycie: player?.instrukcje_krycia?.scisle_krycie || "Standardowo",
    nacisk: player?.instrukcje_krycia?.nacisk || "Standardowo",
    odbior: player?.instrukcje_krycia?.odbior || "Standardowo",
    wymuszanie_nogi: player?.instrukcje_krycia?.wymuszanie_nogi || "Brak",
  });

  if (!player) return null;

  const handleOptionClick = (field, value) => {
    setInstructions((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateOpponentInstructions(player.id, instructions);
    onClose();
  };

  const renderOptions = (field, title, icon, options) => (
    <div className="oim-section">
      <h4 className="oim-section-title">
        <span className="material-symbols-outlined">{icon}</span>
        {title}
      </h4>
      <div className="oim-options-group">
        {options.map((opt) => (
          <div
            key={opt}
            className={`oim-option ${instructions[field] === opt ? "oim-option--active" : ""}`}
            data-val={opt}
            onClick={() => handleOptionClick(field, opt)}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="oim-overlay" onClick={onClose}>
      <div className="oim-window" onClick={(e) => e.stopPropagation()}>
        <div className="oim-header">
          <div className="oim-player-info">
            <div className="oim-avatar-wrap">
              <img
                src={getPlayerPhoto(player.imie_nazwisko)}
                alt=""
                className={`oim-avatar ${getPlayerPhoto(player.imie_nazwisko).includes("user-icon") ? "oim-avatar--default" : ""}`}
              />
            </div>
            <div className="oim-name-group">
              <h2 className="oim-name">{player.imie_nazwisko}</h2>
              <span className="oim-position">
                {player.pozycja_glowna} {player.funkcja ? `- ${player.funkcja}` : ""}
              </span>
            </div>
          </div>
          <button className="oim-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="oim-content">
          {renderOptions("scisle_krycie", "Ścisłe krycie", "person_search", [
            "Nigdy",
            "Standardowo",
            "Zawsze",
          ])}
          {renderOptions("nacisk", "Nacisk", "speed", [
            "Nigdy",
            "Standardowo",
            "Zawsze",
          ])}
          {renderOptions("odbior", "Odbiór piłki", "sports_martial_arts", [
            "Łagodny",
            "Standardowo",
            "Agresywny",
          ])}
          {renderOptions("wymuszanie_nogi", "Wymuszanie nogi", "foot_bones", [
            "Lewa",
            "Brak",
            "Prawa",
          ])}
        </div>

        <div className="oim-footer">
          <button className="oim-save-btn" onClick={handleSave}>
            Zapisz instrukcje
          </button>
        </div>
      </div>
    </div>
  );
}
