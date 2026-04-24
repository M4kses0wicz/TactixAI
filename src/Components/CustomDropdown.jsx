import { useState, useRef, useEffect } from "react";
import "../styles/CustomDropdown.css";

const CustomDropdown = ({ options, value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
  };

  return (
    <div className="pitch-selector-item">
      {label && <span className="selector-label">{label}</span>}
      <div className={`custom-dropdown-container ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
        <div className="custom-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
          <span className="custom-dropdown-value">{value}</span>
          <span className="material-symbols-outlined custom-dropdown-icon">
            expand_more
          </span>
        </div>

        {isOpen && (
          <div className="custom-dropdown-menu">
            {options.map((option) => (
              <div
                key={option}
                className={`custom-dropdown-option ${value === option ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomDropdown;
