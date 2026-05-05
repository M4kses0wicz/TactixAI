import React, { useState } from "react";
import "../styles/PlayerModal/css/PlayerModal.css";
import { useGame, FULL_POSITIONS } from "../context/GameContext";
import personIcon from "../assets/user-icon.png";

export default function PlayerModal({ player, team, onClose }) {
  const { getPlayerPhoto, getFlagUrl, currentTeam: userTeam, aiHighlights, updatePlayerNote } = useGame();
  const [activeTab, setActiveTab] = useState('profil');
  const activeTeam = team || userTeam;

  // Znajdujemy "żywego" gracza z kontekstu, aby dane były zawsze aktualne
  const livePlayer = activeTeam?.zawodnicy?.find(p => p.id === player?.id) || player;

  if (!livePlayer) return null;

  const handleDeleteNote = (noteId) => {
    const updatedNotes = (livePlayer.notes || []).filter(n => n.id !== noteId);
    updatePlayerNote(livePlayer.id, updatedNotes);
  };

  // Obliczanie wieku z uwzględnieniem polskiego formatu (np. "15 wrz 1995")
  const calculateAge = (birthDate) => {
    if (!birthDate) return "??";
    try {
      const monthsMap = {
        "sty": 0, "lut": 1, "mar": 2, "kwi": 3, "maj": 4, "cze": 5,
        "lip": 6, "sie": 7, "wrz": 8, "paź": 9, "pa\uFFFD": 9, "lis": 10, "gru": 11
      };
      
      const parts = birthDate.toLowerCase().split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = monthsMap[parts[1]] ?? -1;
        const year = parseInt(parts[2]);
        
        if (month !== -1 && !isNaN(day) && !isNaN(year)) {
          const birth = new Date(year, month, day);
          const today = new Date();
          let age = today.getFullYear() - birth.getFullYear();
          const m = today.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
          }
          return age;
        }
      }
      
      // Fallback
      const birth = new Date(birthDate);
      if (isNaN(birth.getTime())) return "??";
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
      return age;
    } catch (e) { return "??"; }
  };

  const age = livePlayer.data_urodzenia ? calculateAge(livePlayer.data_urodzenia) : (livePlayer.wiek || "??");

  // Funkcja mapująca atrybuty z bazy danych w dokładnej kolejności
  const getAttributes = (playerAttrs, pos) => {
    const t = playerAttrs || {};
    
    // Funkcja pomocnicza zabezpieczająca przed brakiem danych
    const getVal = (val) => (val !== undefined && val !== null) ? val : 10;

    const attrs = {
      technical: {
        "Dośrodkowania": getVal(t.dosrodkowania),
        "Drybling": getVal(t.drybling),
        "Gra głową": getVal(t.gra_glowa),
        "Krycie": getVal(t.krycie),
        "Odbiór piłki": getVal(t.odbior_pilki),
        "Podania": getVal(t.podania),
        "Przyjęcie piłki": getVal(t.przyjecie_pilki),
        "Strzały z dystansu": getVal(t.strzaly_z_dystansu),
        "Technika": getVal(t.technika),
        "Wykańczanie akcji": getVal(t.wykanczanie_akcji),
        "Długie wrzuty": getVal(t.dlugie_wrzuty),
        "Rzuty karne": getVal(t.rzuty_karne),
        "Rzuty rożne": getVal(t.rzuty_rozne),
        "Rzuty wolne": getVal(t.rzuty_wolne)
      },
      mental: {
        "Agresja": getVal(t.agresja),
        "Błyskotliwość": getVal(t.blyskotliwosc),
        "Decyzje": getVal(t.decyzje),
        "Determinacja": getVal(t.determinacja),
        "Gra bez piłki": getVal(t.gra_bez_pilki),
        "Koncentracja": getVal(t.koncentracja),
        "Opanowanie": getVal(t.opanowanie),
        "Pracowitość": getVal(t.pracowitosc),
        "Przegląd sytuacji": getVal(t.przeglad_sytuacji),
        "Przewidywanie": getVal(t.przewidywanie),
        "Przywództwo": getVal(t.przywodztwo),
        "Ustawianie się": getVal(t.ustawianie_sie),
        "Waleczność": getVal(t.walecznosc),
        "Współpraca": getVal(t.wspolpraca)
      },
      physical: {
        "Przyspieszenie": getVal(t.przyspieszenie),
        "Równowaga": getVal(t.rownowaga),
        "Siła": getVal(t.sila),
        "Skoczność": getVal(t.skocznosc),
        "Sprawność": getVal(t.sprawnosc),
        "Szybkość": getVal(t.szybkosc),
        "Wytrzymałość": getVal(t.wytrzymalosc),
        "Zwinność": getVal(t.zwinnosc)
      }
    };

    if (pos === "BR") {
        attrs.technical = {
            "Um. bramkarskie": getVal(t.umiejetnosci_bramkarskie),
            ...attrs.technical
        };
    }
    
    return attrs;
  };

  const attributes = getAttributes(livePlayer.atrybuty, livePlayer.pozycja_glowna);

  const renderAttrColumn = (title, data) => (
    <div className="pm-attr-col">
      <h4 className="pm-attr-title">{title}</h4>
      <div className="pm-attr-list">
        {Object.entries(data).map(([name, val]) => (
          <div key={name} className="pm-attr-item">
            <span className="pm-attr-name">{name}</span>
            <span className={`pm-attr-val ${val >= 15 ? 'pm-attr-val--high' : val >= 10 ? 'pm-attr-val--mid' : ''}`}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pm-overlay" onClick={onClose}>
      <div className="pm-window" onClick={(e) => e.stopPropagation()}>
        <button className="pm-close" onClick={onClose}>×</button>
        
        {/* HEADER SECTION */}
        <div className="pm-header">
          <div className="pm-header__left">
            <div className="pm-avatar-wrap">
              <img src={getPlayerPhoto(livePlayer.imie_nazwisko)} alt="" className="pm-avatar" />
            </div>
            <div className="pm-main-info">
              <div className="pm-name-row">
                <h2 className="pm-name">{livePlayer.imie_nazwisko}</h2>
                <span className="pm-number">{livePlayer.numer_na_koszulce || livePlayer.numer || '??'}</span>
              </div>
              <p className="pm-sub-info">
                {FULL_POSITIONS[livePlayer.pozycja_glowna] || livePlayer.pozycja_glowna} {livePlayer.funkcja ? `- ${livePlayer.funkcja}` : ''}
              </p>
              <div className="pm-meta-row">
                <img src={getFlagUrl(livePlayer.narodowosc)} alt="" className="pm-flag" />
                <span>{age} lat {livePlayer.data_urodzenia ? `(${livePlayer.data_urodzenia})` : ''}</span>
              </div>
            </div>
          </div>

          <div className="pm-header__right">
              <div className="pm-club-info">
                  <span className="pm-club-label">Klub</span>
                  <span className="pm-club-name">{activeTeam?.nazwa}</span>
                  <span className="pm-club-label" style={{marginTop: '4px'}}>{activeTeam?.liga}</span>
              </div>
          </div>
        </div>

        {/* TABS / NAV */}
        <div className="pm-nav">
          <button 
            className={`pm-nav-btn ${activeTab === 'profil' ? 'active' : ''}`} 
            onClick={() => setActiveTab('profil')}
          >
            ATRYBUTY
          </button>
          <button 
            className={`pm-nav-btn ${activeTab === 'notatki' ? 'active' : ''}`} 
            onClick={() => setActiveTab('notatki')}
          >
            NOTATKI
          </button>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="pm-content">
          {activeTab === 'profil' ? (
            <div className="pm-section pm-section--attrs">
              {renderAttrColumn("Techniczne", attributes.technical)}
              {renderAttrColumn("Psychiczne", attributes.mental)}
              {renderAttrColumn("Fizyczne", attributes.physical)}
              
              <div className="pm-attr-col">
                <h4 className="pm-attr-title">Informacje</h4>
                <div className="pm-attr-list">
                  <div className="pm-attr-item"><span className="pm-attr-name">Wzrost</span><span className="pm-attr-val">{livePlayer.wzrost || 180} cm</span></div>
                  <div className="pm-attr-item"><span className="pm-attr-name">Waga</span><span className="pm-attr-val">{livePlayer.waga || 75} kg</span></div>
                  <div className="pm-attr-item"><span className="pm-attr-name">Lepsza noga</span><span className="pm-attr-val" style={{color: '#fff'}}>{livePlayer.lepsza_noga || "Prawa"}</span></div>
                  <div className="pm-attr-item"><span className="pm-attr-name">Słabsza noga</span><span className="pm-attr-val" style={{color: '#fff'}}>{livePlayer.slabsza_noga || "Słaba"}</span></div>
                  <div className="pm-attr-item"><span className="pm-attr-name">Osobowość</span><span className="pm-attr-val" style={{color: '#fff'}}>Profesjonalny</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pm-notes-container">
              {(!livePlayer.notes || livePlayer.notes.length === 0) ? (
                <div className="pm-no-notes">
                  <span className="material-symbols-outlined">description</span>
                  <p>Brak notatek dla tego zawodnika.</p>
                  <span>Dodaj je w sekcji Notatnik Taktyczny.</span>
                </div>
              ) : (
                <div className="pm-notes-grid">
                  {livePlayer.notes.map((note, idx) => (
                    <div key={note.id || idx} className="pm-note-card">
                      <div className="pm-note-header">
                        <span className="material-symbols-outlined">description</span>
                        <span>{note.title || "Notatka taktyczna"}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ opacity: 0.4, fontSize: '9px' }}>
                            {note.timestamp ? new Date(note.timestamp).toLocaleDateString('pl-PL') : ''}
                          </span>
                          <button 
                            className="pm-delete-note" 
                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                            title="Usuń notatkę"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                          </button>
                        </div>
                      </div>
                      <div className="pm-note-body">
                        {note.content?.map((block, bIdx) => (
                          <div key={block.id || bIdx} className="pm-note-block-item" style={{ marginBottom: '12px' }}>
                            {block.type === 'desc' ? (
                              <p className="pm-note-text" style={{ borderLeft: '2px solid rgba(255,255,255,0.2)', paddingLeft: '10px' }}>
                                {block.text}
                              </p>
                            ) : (
                              <ul className="pm-note-list">
                                {block.items?.map((item, i) => (
                                  <li key={item.id || i}>{item.text}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER STATS */}
        <div className="pm-footer">
            <div className="pm-stat-card">
                <span className="pm-stat-label">Morale</span>
                <span className="pm-stat-val pm-stat-val--good">{livePlayer.stan_aktualny?.morale || 'Brak danych'}</span>
            </div>
            <div className="pm-stat-card">
                <span className="pm-stat-label">Kondycja</span>
                <span className="pm-stat-val">{livePlayer.stan_aktualny?.kondycja ? `${livePlayer.stan_aktualny.kondycja}%` : 'Brak danych'}</span>
            </div>
            <div className="pm-stat-card">
                <span className="pm-stat-label">Forma (5 meczów)</span>
                <div className="pm-form-bars">
                    {[7,8,7,9,Math.floor(livePlayer.stan_aktualny?.forma_ostatnie_5_meczow || 7)].map((s,i) => <div key={i} className="pm-form-bar" style={{height: `${s*10}%`}}></div>)}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
