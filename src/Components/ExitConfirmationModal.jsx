import React from 'react';
import '../styles/ExitConfirmationModal.css';

export default function ExitConfirmationModal({ onCancel, onExitWithoutSave, onSaveAndExit }) {
  return (
    <div className="exit-modal-overlay">
      <div className="exit-modal-content">
        <div className="exit-modal-header">
          <div className="exit-icon-container">
            <span className="material-symbols-outlined exit-icon">logout</span>
          </div>
          <h2>Wyjść z gry?</h2>
        </div>
        
        <p className="exit-modal-desc">
          Twoje postępy w ustawianiu składu i taktyki zostaną utracone, jeśli wyjdziesz bez zapisywania.
        </p>

        <div className="exit-modal-actions">
          <div className="exit-main-actions">
            <button className="exit-btn secondary" onClick={onExitWithoutSave}>
              Porzuć zmiany
            </button>
            <button className="exit-btn primary" onClick={onSaveAndExit}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
              Zapisz i kontynuuj
            </button>
          </div>
          
          <button className="exit-btn cancel" onClick={onCancel}>
            WRÓĆ DO EDYCJI
          </button>
        </div>
      </div>
    </div>
  );
}
