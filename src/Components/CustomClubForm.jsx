import React, { useState } from "react";
import { useGame } from "../context/GameContext";
import "../styles/CustomClubForm.css";

export default function CustomClubForm({ onBack, onComplete }) {
  const { db, setCurrentTeam } = useGame();
  
  const [nazwa, setNazwa] = useState("");
  const [logo, setLogo] = useState("");
  const [formacja, setFormacja] = useState("4-3-3");
  const [zawodnicy, setZawodnicy] = useState([]);

  const defaultTactics = {
    "przy_pilce": {
      "bezposredniosc_podan": "Standardowo",
      "tempo": "Standardowo",
      "gra_na_czas": "Rzadziej",
      "faza_przejscia_w_ofensywie": "Standardowo",
      "rozpietosc_ataku": "Standardowo",
      "szukaj_stalych_fragmentow": "Utrzymuj piłkę",
      "swoboda_taktyczna": "Zrównoważone",
      "strategia_rozgrywania": "Zrównoważone",
      "rzuty_od_bramki": "Mieszane",
      "wyprowadzanie_pilki_przez_bramkarza": "Zrównoważone",
      "wejscia_za_pilka": "Zrównoważone",
      "drybling": "Zrównoważone",
      "wejscia": "Zrównoważone",
      "odbior_podan": "Podania do nogi",
      "cierpliwosc": "Standardowo",
      "strzaly_z_dystansu": "Zrównoważone",
      "styl_dosrodkowan": "Zrównoważone",
      "wyprowadzanie_pilki_przez_bramkarza_tempo": "Zrównoważone"
    },
    "bez_pilki": {
      "linia_nacisku": "Średni pressing",
      "linia_defensywna": "Standardowo",
      "aktywacja_pressingu": "Standardowo",
      "przejscie_defensywne": "Standardowo",
      "atak_na_pilke": "Standardowo",
      "reakcja_na_dosrodkowania": "Zrównoważone",
      "kierunek_pressingu": "Zrównoważony pressing",
      "krotkie_wyprowadzanie_rywala": "Nie",
      "zachowanie_linii_defensywnej": "Zrównoważone"
    }
  };

  const addPlayer = () => {
    setZawodnicy([...zawodnicy, {
      id: Date.now(),
      imie_nazwisko: "",
      pozycja_glowna: "ŚP",
      isStarting: true,
      stan_aktualny: {
        kontuzja: "zdrowy",
        forma_ostatnie_5_meczow: 6.0
      },
      atrybuty: {
        techniczne: { technika: 10, podania: 10 },
        fizyczne: { szybkosc: 10, wytrzymalosc: 10 }
      }
    }]);
  };

  const handleSave = () => {
    if (!nazwa) return alert("Podaj nazwę klubu!");
    
    const template = db[0] || { formacje: [], opcje_taktyczne: {}, role_zawodnikow: [] };

    const newTeam = {
      id: Date.now(),
      nazwa,
      logo: logo || "https://via.placeholder.com/150",
      domyslna_formacja: formacja,
      taktyka_druzyny: defaultTactics,
      zawodnicy,
      formacje: template.formacje,
      opcje_taktyczne: template.opcje_taktyczne,
      role_zawodnikow: template.role_zawodnikow
    };
    
    setCurrentTeam(newTeam);
    onComplete();
  };

  return (
    <div className="custom-form-container">
      <div className="form-header">
        <button className="back-btn" onClick={onBack}>← Wróć</button>
        <h1 style={{ margin: 0, fontSize: "1.8rem", letterSpacing: "2px" }}>KREATOR KLUBU</h1>
        <div style={{ width: "80px" }}></div> {/* Spacer */}
      </div>

      <div className="form-card">
        <div className="form-group">
          <label>Nazwa Klubu</label>
          <input 
            className="form-input"
            placeholder="Wpisz nazwę swojego klubu..." 
            value={nazwa} 
            onChange={e => setNazwa(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>URL Logo (opcjonalnie)</label>
          <input 
            className="form-input"
            placeholder="http://..." 
            value={logo} 
            onChange={e => setLogo(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Domyslna Formacja</label>
          <select 
            className="form-input"
            value={formacja} 
            onChange={e => setFormacja(e.target.value)}
          >
            {db[0]?.formacje.map(f => <option key={f.nazwa} value={f.nazwa}>{f.nazwa}</option>)}
          </select>
        </div>
        
        <div style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "0.9rem", color: "rgba(255,255,255,0.6)" }}>
              KADRA ZAWODNICZA ({zawodnicy.length})
            </h3>
          </div>

          {zawodnicy.map((p, idx) => (
            <div key={p.id} className="player-item">
              <input 
                className="form-input"
                style={{ flex: 2 }}
                placeholder="Imię i Nazwisko" 
                value={p.imie_nazwisko}
                onChange={e => {
                  const newZ = [...zawodnicy];
                  newZ[idx].imie_nazwisko = e.target.value;
                  setZawodnicy(newZ);
                }}
              />
              <select 
                className="form-input"
                style={{ flex: 1 }}
                value={p.pozycja_glowna}
                onChange={e => {
                  const newZ = [...zawodnicy];
                  newZ[idx].pozycja_glowna = e.target.value;
                  setZawodnicy(newZ);
                }}
              >
                {["BR", "ŚO", "LO", "PO", "DP", "ŚP", "LP", "PP", "OP", "N"].map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>SKŁAD?</span>
                <input type="checkbox" checked={p.isStarting} onChange={e => {
                  const newZ = [...zawodnicy];
                  newZ[idx].isStarting = e.target.checked;
                  setZawodnicy(newZ);
                }} />
              </div>
              <button className="remove-btn" onClick={() => setZawodnicy(zawodnicy.filter(z => z.id !== p.id))}>×</button>
            </div>
          ))}

          <button className="add-player-btn" onClick={addPlayer}>
            + DODAJ ZAWODNIKA
          </button>
        </div>

        <button className="submit-btn" onClick={handleSave}>
          ZAPISZ I ROZPOCZNIJ KARIERĘ
        </button>
      </div>
    </div>
  );
}
