import React from "react";
import "../styles/PlayerModal/css/PlayerModal.css";
import { useGame } from "../context/GameContext";
import personIcon from "../assets/user-icon.png";

export default function PlayerModal({ player, team, onClose }) {
  const { getPlayerPhoto, getFlagUrl, currentTeam: userTeam, aiHighlights } = useGame();
  const activeTeam = team || userTeam;

  if (!player) return null;

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

  const age = calculateAge(player.data_urodzenia);

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

  const attributes = getAttributes(player.atrybuty, player.pozycja_glowna);

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
              <img src={getPlayerPhoto(player.imie_nazwisko)} alt="" className="pm-avatar" />
            </div>
            <div className="pm-main-info">
              <div className="pm-name-row">
                <h2 className="pm-name">{player.imie_nazwisko}</h2>
                <span className="pm-number">{player.numer || '??'}</span>
              </div>
              <p className="pm-sub-info">
                {player.pozycja_glowna} {player.funkcja ? `- ${player.funkcja}` : ''}
              </p>
              <div className="pm-meta-row">
                <img src={player.narodowosc} alt="" className="pm-flag" />
                <span>{age} lat ({player.data_urodzenia || '??'})</span>
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
          <button className="pm-nav-btn pm-nav-btn--active">Przegląd</button>
          <button className="pm-nav-btn">Kontrakt</button>
          <button className="pm-nav-btn">Transfer</button>
          <button className="pm-nav-btn">Historia</button>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="pm-content">
          
          {/* LEFT: Attributes */}
          <div className="pm-section pm-section--attrs">
            {renderAttrColumn("Techniczne", attributes.technical)}
            {renderAttrColumn("Psychiczne", attributes.mental)}
            {renderAttrColumn("Fizyczne", attributes.physical)}
          </div>

          {/* RIGHT: Extra Info */}
          <div className="pm-sidebar">
            <div className="pm-section pm-info-box">
              <h4 className="pm-section-title">Informacje</h4>
              <div className="pm-info-grid">
                <div className="pm-info-item"><span className="pm-info-label">Wzrost</span><span className="pm-info-val">{player.wzrost || 180} cm</span></div>
                <div className="pm-info-item"><span className="pm-info-label">Waga</span><span className="pm-info-val">{player.waga || 75} kg</span></div>
                <div className="pm-info-item"><span className="pm-info-label">Lepsza noga</span><span className="pm-info-val">{player.lepsza_noga || "Prawa"}</span></div>
                <div className="pm-info-item"><span className="pm-info-label">Słabsza noga</span><span className="pm-info-val">{player.slabsza_noga || "Słaba"}</span></div>
                <div className="pm-info-item"><span className="pm-info-label">Osobowość</span><span className="pm-info-val">Profesjonalny</span></div>
              </div>
            </div>

            <div className="pm-section pm-position-box">
                <h4 className="pm-section-title">Rola i Pozycja</h4>
                <div className="pm-roles-list">
                    <div className={`pm-role-item pm-role-item--active ${aiHighlights.some(h => h.toLowerCase() === player.wybrane_role?.przy_pilce?.toLowerCase()) ? 'ai-highlight' : ''}`}>
                        <span className="pm-role-name">Przy piłce: {player.wybrane_role?.przy_pilce || 'Brak'}</span>
                        <div className="pm-role-stars">★★★★★</div>
                    </div>
                    <div className={`pm-role-item ${aiHighlights.some(h => h.toLowerCase() === player.wybrane_role?.bez_pilki?.toLowerCase()) ? 'ai-highlight' : ''}`}>
                        <span className="pm-role-name">Bez piłki: {player.wybrane_role?.bez_pilki || 'Brak'}</span>
                        <div className="pm-role-stars">★★★★☆</div>
                    </div>
                </div>
                <div className="pm-pitch-mini" style={{marginTop: '15px'}}>
                    <div className="pm-pitch-field">
                        {/* Simple CSS representation of the pitch */}
                        <div className="pm-pitch-dot pm-pitch-dot--active" style={{top: '20%', left: '50%'}}></div>
                    </div>
                </div>
            </div>
          </div>

        </div>

        {/* FOOTER STATS */}
        <div className="pm-footer">
            <div className="pm-stat-card">
                <span className="pm-stat-label">Morale</span>
                <span className="pm-stat-val pm-stat-val--good">{player.stan_aktualny?.morale || 'Brak danych'}</span>
            </div>
            <div className="pm-stat-card">
                <span className="pm-stat-label">Kondycja</span>
                <span className="pm-stat-val">{player.stan_aktualny?.kondycja ? `${player.stan_aktualny.kondycja}%` : 'Brak danych'}</span>
            </div>
            <div className="pm-stat-card">
                <span className="pm-stat-label">Forma (5 meczów)</span>
                <div className="pm-form-bars">
                    {[7,8,7,9,Math.floor(player.stan_aktualny?.forma_ostatnie_5_meczow || 7)].map((s,i) => <div key={i} className="pm-form-bar" style={{height: `${s*10}%`}}></div>)}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
