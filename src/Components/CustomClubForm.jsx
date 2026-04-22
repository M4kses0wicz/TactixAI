import React, { useState } from "react";
import { useGame } from "../context/GameContext";

export default function CustomClubForm({ onBack, onComplete }) {
  const { db, setCurrentTeam } = useGame();
  
  const [nazwa, setNazwa] = useState("");
  const [logo, setLogo] = useState("");
  const [formacja, setFormacja] = useState("4-3-3");
  const [zawodnicy, setZawodnicy] = useState([]);

  // Default tactics
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
    
    // We get the structural elements from db[0] to copy formacje, opcje_taktyczne and role_zawodnikow
    const template = db[0];

    const newTeam = {
      id: Date.now(),
      nazwa,
      logo,
      domyslna_formacja: formacja,
      taktyka_druzyny: defaultTactics,
      zawodnicy,
      formacje: template.formacje,
      opcje_taktyczne: template.opcje_taktyczne,
      role_zawodnikow: template.role_zawodnikow
    };
    
    // Technically we should save this to `db` in context, but currently GameContext doesn't expose `addTeam`.
    // Let's assume we just set it as current team for now (or modify GameContext to support adding).
    setCurrentTeam(newTeam);
    onComplete();
  };

  return (
    <div style={{ padding: "2rem", color: "white", backgroundColor: "#111", height: "100vh", overflowY: "auto" }}>
      <button onClick={onBack} style={{ marginBottom: "2rem" }}>Wróć</button>
      <h1 style={{ marginBottom: "2rem" }}>Stwórz własny klub</h1>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "600px" }}>
        <input 
          placeholder="Nazwa klubu" 
          value={nazwa} 
          onChange={e => setNazwa(e.target.value)} 
          style={{ padding: "0.5rem" }}
        />
        <input 
          placeholder="URL Logo (opcjonalnie)" 
          value={logo} 
          onChange={e => setLogo(e.target.value)} 
          style={{ padding: "0.5rem" }}
        />
        <select value={formacja} onChange={e => setFormacja(e.target.value)} style={{ padding: "0.5rem" }}>
          {db[0]?.formacje.map(f => <option key={f.nazwa} value={f.nazwa}>{f.nazwa}</option>)}
        </select>
        
        <h3>Zawodnicy ({zawodnicy.length})</h3>
        {zawodnicy.map((p, idx) => (
          <div key={p.id} style={{ display: "flex", gap: "1rem", alignItems: "center", background: "#222", padding: "1rem", borderRadius: "8px" }}>
            <input 
              placeholder="Imię i Nazwisko" 
              value={p.imie_nazwisko}
              onChange={e => {
                const newZ = [...zawodnicy];
                newZ[idx].imie_nazwisko = e.target.value;
                setZawodnicy(newZ);
              }}
            />
            <select 
              value={p.pozycja_glowna}
              onChange={e => {
                const newZ = [...zawodnicy];
                newZ[idx].pozycja_glowna = e.target.value;
                setZawodnicy(newZ);
              }}
            >
              <option value="BR">BR</option>
              <option value="ŚO4">ŚO</option>
              <option value="LO">LO</option>
              <option value="PO">PO</option>
              <option value="DP">DP</option>
              <option value="ŚP">ŚP</option>
              <option value="LP">LP</option>
              <option value="PP">PP</option>
              <option value="OP">OP</option>
              <option value="N">N</option>
            </select>
            <label>
              Skład?
              <input type="checkbox" checked={p.isStarting} onChange={e => {
                const newZ = [...zawodnicy];
                newZ[idx].isStarting = e.target.checked;
                setZawodnicy(newZ);
              }} />
            </label>
            <button onClick={() => setZawodnicy(zawodnicy.filter(z => z.id !== p.id))}>X</button>
          </div>
        ))}
        <button onClick={addPlayer} style={{ padding: "0.5rem", background: "#444", color: "white" }}>+ Dodaj zawodnika</button>

        <button onClick={handleSave} style={{ padding: "1rem", background: "green", color: "white", marginTop: "2rem" }}>Zapisz i Graj</button>
      </div>
    </div>
  );
}
