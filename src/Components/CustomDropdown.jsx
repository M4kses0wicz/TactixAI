import { useState, useRef, useEffect } from "react";
import "../styles/CustomDropdown.css";
import { useGame } from "../context/GameContext";

const CustomDropdown = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { aiHighlights, removeAiHighlight } = useGame();

  const isHighlighted = aiHighlights.some(h => {
    const hl = h?.toLowerCase?.()?.trim?.() || "";
    const l = label?.toLowerCase?.()?.trim?.() || "";
    const v = value?.toLowerCase?.()?.trim?.() || "";
    if (!hl) return false;
    
    // Podświetlamy jeśli AI sugeruje ten dropdown lub konkretną wartość która nie jest obecnie wybrana
    return (hl.includes(l) || l.includes(hl) || options.some(opt => {
        const o = opt?.toLowerCase?.()?.trim?.() || "";
        return (hl.includes(o) || o.includes(hl)) && o !== v;
    })) && !hl.includes(v);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    removeAiHighlight(label);
    removeAiHighlight(option);
  };

  return (
    <div className="pitch-selector-item">
      {label && <span className="selector-label">{label}</span>}
      <div className={`custom-dropdown-container ${isOpen ? 'open' : ''} ${isHighlighted ? 'ai-highlight' : ''}`} ref={dropdownRef}>
        <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
          <span className="custom-dropdown-value">{value}</span>
          <span className="material-symbols-outlined custom-dropdown-icon">
            expand_more
          </span>
        </div>

        {isOpen && (
          <div className="custom-dropdown-menu">
            {options.map((option) => {
               const isOptionHighlighted = aiHighlights.some(h => {
                   const hl = h?.toLowerCase?.()?.trim?.() || "";
                   const o = option?.toLowerCase?.()?.trim?.() || "";
                   return hl && o && (hl.includes(o) || o.includes(hl));
               });
               return (
                <div
                    key={option}
                    className={`custom-dropdown-option ${value === option ? 'selected' : ''} ${isOptionHighlighted ? 'ai-highlight' : ''}`}
                    onClick={() => handleSelect(option)}
                >
                    {option}
                </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;
