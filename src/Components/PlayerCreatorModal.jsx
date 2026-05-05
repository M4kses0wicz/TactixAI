import { useState, useCallback, useRef, useEffect } from "react";
import "../styles/PlayerCreatorModal.css";
import { useGame, COUNTRY_CODES } from "../context/GameContext";


// ─── DEFINICJE ATRYBUTÓW ────────────────────────────────────────────────────

const ATTR_GROUPS = {
  Techniczne: [
    { key: "um_bramkarskie", label: "Um. bramkarskie" },
    { key: "dosrodkowania", label: "Dośrodkowania" },
    { key: "drybling", label: "Drybling" },
    { key: "gra_glowa", label: "Gra głową" },
    { key: "krycie", label: "Krycie" },
    { key: "odbior_pilki", label: "Odbiór piłki" },
    { key: "podania", label: "Podania" },
    { key: "przyjecie_pilki", label: "Przyjęcie piłki" },
    { key: "strzaly_z_dystansu", label: "Strzały z dystansu" },
    { key: "technika", label: "Technika" },
    { key: "wykanczanie_akcji", label: "Wykańczanie akcji" },
    { key: "dlugie_wrzuty", label: "Długie wrzuty" },
    { key: "rzuty_karne", label: "Rzuty karne" },
    { key: "rzuty_rozne", label: "Rzuty rożne" },
    { key: "rzuty_wolne", label: "Rzuty wolne" },
  ],
  Psychiczne: [
    { key: "agresja", label: "Agresja" },
    { key: "blyskotliwosc", label: "Błyskotliwość" },
    { key: "decyzje", label: "Decyzje" },
    { key: "determinacja", label: "Determinacja" },
    { key: "gra_bez_pilki", label: "Gra bez piłki" },
    { key: "koncentracja", label: "Koncentracja" },
    { key: "opanowanie", label: "Opanowanie" },
    { key: "pracowitosc", label: "Pracowitość" },
    { key: "przeglad_sytuacji", label: "Przegląd sytuacji" },
    { key: "przewidywanie", label: "Przewidywanie" },
    { key: "przywodztwo", label: "Przywództwo" },
    { key: "ustawianie_sie", label: "Ustawianie się" },
    { key: "walecznosc", label: "Waleczność" },
    { key: "wspolpraca", label: "Współpraca" },
  ],
  Fizyczne: [
    { key: "przyspieszenie", label: "Przyspieszenie" },
    { key: "rownowaga", label: "Równowaga" },
    { key: "sila", label: "Siła" },
    { key: "skocznosc", label: "Skoczność" },
    { key: "sprawnosc", label: "Sprawność" },
    { key: "szybkosc", label: "Szybkość" },
    { key: "wytrzymalosc", label: "Wytrzymałość" },
    { key: "zwinnosc", label: "Zwinność" },
  ],
};

const ALL_ATTRS = Object.values(ATTR_GROUPS).flat();
const ALL_POSITIONS = ["BR", "ŚO", "LO", "PO", "DP", "ŚP", "OP", "LP", "PP", "LS", "PS", "N"];

const DEFAULT_ATTRS = () =>
  Object.fromEntries(ALL_ATTRS.map((a) => [a.key, 10]));

// ─── MAPOWANIE SUWAKÓW → ATRYBUTY ──────────────────────────────────────────

function mapSlidersToAttributes({ tempo, fizycznosc, obrona, technika, strzaly }) {
  const t = tempo / 100;
  const f = fizycznosc / 100;
  const o = obrona / 100;
  const te = technika / 100;
  const s = strzaly / 100;

  const lerp = (min, max, v) => Math.round(min + (max - min) * v);
  const blend = (...pairs) => {
    const total = pairs.reduce((acc, [w]) => acc + w, 0);
    const val = pairs.reduce((acc, [w, v]) => acc + w * v, 0) / total;
    return Math.max(1, Math.min(20, Math.round(val * 20)));
  };

  return {
    // Fizyczne
    przyspieszenie: blend([3, t], [1, f]),
    rownowaga: blend([2, f], [1, te]),
    sila: blend([3, f], [0.5, o]),
    skocznosc: blend([2, f], [1, o]),
    sprawnosc: blend([2, te], [1, t], [1, f]),
    szybkosc: blend([3, t], [0.5, f]),
    wytrzymalosc: blend([2, f], [1, t]),
    zwinnosc: blend([2, t], [2, te]),

    // Techniczne
    um_bramkarskie: blend([4, o]), // placeholder
    dosrodkowania: blend([2, te], [1, s]),
    drybling: blend([3, te], [1, t]),
    gra_glowa: blend([2, f], [1, o], [1, s]),
    krycie: blend([4, o]),
    odbior_pilki: blend([3, o], [1, f]),
    podania: blend([3, te], [1, o * 0.5 + s * 0.5]),
    przyjecie_pilki: blend([3, te]),
    strzaly_z_dystansu: blend([3, s], [1, te]),
    technika: blend([4, te]),
    wykanczanie_akcji: blend([3, s], [1, te]),
    dlugie_wrzuty: blend([1, f], [1, te]),
    rzuty_karne: blend([2, s], [2, te]),
    rzuty_rozne: blend([2, te], [1, s]),
    rzuty_wolne: blend([2, s], [2, te]),

    // Psychiczne
    agresja: blend([2, f], [1, o]),
    blyskotliwosc: blend([2, te], [1, s]),
    decyzje: blend([2, te], [2, o]),
    determinacja: blend([2, f], [1, te]),
    gra_bez_pilki: blend([2, te], [1, s]),
    koncentracja: blend([2, o], [1, te]),
    opanowanie: blend([2, te], [1, o]),
    pracowitosc: blend([2, f], [1, t]),
    przeglad_sytuacji: blend([2, te], [1, o]),
    przewidywanie: blend([2, o], [1, te]),
    przywodztwo: blend([1, f], [1, te], [1, o]),
    ustawianie_sie: blend([2, o]),
    walecznosc: blend([2, f], [2, o]),
    wspolpraca: blend([2, te], [1, o]),
  };
}

// ─── MOCK AI GENERATION ─────────────────────────────────────────────────────

const AI_KEYWORDS = {
  szybki: { przyspieszenie: 18, szybkosc: 18, zwinnosc: 16 },
  wolny: { przyspieszenie: 7, szybkosc: 7 },
  silny: { sila: 17, wytrzymalosc: 16, rownowaga: 15 },
  drobny: { sila: 8, rownowaga: 8 },
  techniczny: { technika: 17, drybling: 16, podania: 15 },
  bramkarz: { odbior_pilki: 5, krycie: 5, gra_glowa: 14 },
  napastnik: { wykanczanie_akcji: 17, strzaly_z_dystansu: 15, gra_glowa: 14 },
  obrońca: { krycie: 17, odbior_pilki: 16, gra_glowa: 15, walecznosc: 16 },
  pomocnik: { podania: 16, decyzje: 15, pracowitosc: 16 },
  skrzydłowy: { przyspieszenie: 17, drybling: 16, dosrodkowania: 15 },
  waleczny: { walecznosc: 17, agresja: 15, determinacja: 16 },
  agresywny: { agresja: 17, walecznosc: 16 },
  lider: { przywodztwo: 18, determinacja: 16, koncentracja: 15 },
  leniwy: { pracowitosc: 6, wytrzymalosc: 8 },
  kondycja: { wytrzymalosc: 17, sprawnosc: 16 },
  "bez kondycji": { wytrzymalosc: 7, sprawnosc: 7 },
  strzały: { strzaly_z_dystansu: 17, wykanczanie_akcji: 16 },
  przecinak: { odbior_pilki: 16, krycie: 15, agresja: 15 },
};

const ALL_COUNTRIES = Object.keys(COUNTRY_CODES).sort();

function mockGenerateFromDescription(description, position) {
  const base = DEFAULT_ATTRS();
  // Start with random mid-range values
  ALL_ATTRS.forEach((a) => { base[a.key] = Math.round(8 + Math.random() * 6); });

  const desc = description.toLowerCase();
  Object.entries(AI_KEYWORDS).forEach(([keyword, overrides]) => {
    if (desc.includes(keyword)) {
      Object.entries(overrides).forEach(([k, v]) => {
        base[k] = Math.max(1, Math.min(20, v + Math.round((Math.random() - 0.5) * 2)));
      });
    }
  });

  // Position bias
  const posBias = {
    BR: { odbior_pilki: 5, krycie: 5 },
    ŚO: { krycie: 15, odbior_pilki: 14, gra_glowa: 14 },
    N: { wykanczanie_akcji: 14, strzaly_z_dystansu: 13 },
  };
  if (posBias[position]) {
    Object.entries(posBias[position]).forEach(([k, v]) => { base[k] = Math.max(base[k], v); });
  }

  return base;
}

// ─── HELPER ────────────────────────────────────────────────────────────────

function attrColor(v) {
  if (v >= 17) return "#4ade80";
  if (v >= 14) return "#86efac";
  if (v >= 11) return "#fbbf24";
  if (v >= 8) return "#f97316";
  return "#f87171";
}

// ─── COMPONENT ─────────────────────────────────────────────────────────────

export default function PlayerCreatorModal({ onSave, onClose, teamId }) {
  // -- static data --
  const [name, setName] = useState("");
  const [position, setPosition] = useState("N");
  const [foot, setFoot] = useState("Prawa");
  const [age, setAge] = useState(20);
  const [nationality, setNationality] = useState("");
  const [showCountries, setShowCountries] = useState(false);
  const [shirtNumber, setShirtNumber] = useState(99);
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(180);

  // -- generation method --
  const [tab, setTab] = useState("sliders"); // "sliders" | "ai"

  // -- slider values --
  const [sliders, setSliders] = useState({ tempo: 50, fizycznosc: 50, obrona: 50, technika: 50, strzaly: 50 });

  // -- AI description --
  const [aiDesc, setAiDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // -- attributes (live result) --
  const [attrs, setAttrs] = useState(DEFAULT_ATTRS);

  // -- section collapse --
  const [showSummary, setShowSummary] = useState(true);

  // -- saving --
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // ── Slider change ──
  const handleSlider = useCallback((key, val) => {
    setSliders((prev) => {
      const next = { ...prev, [key]: Number(val) };
      setAttrs(mapSlidersToAttributes(next));
      return next;
    });
  }, []);

  // ── AI generation ──
  const handleGenerate = () => {
    if (!aiDesc.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setAttrs(mockGenerateFromDescription(aiDesc, position));
      setShowSummary(true);
      setIsGenerating(false);
    }, 900);
  };

  // ── Manual attr change ──
  const handleAttr = (key, val) => {
    if (val === "") {
      setAttrs((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    const n = parseInt(val);
    if (isNaN(n)) return;
    const clamped = Math.max(0, Math.min(20, n));
    setAttrs((prev) => ({ ...prev, [key]: clamped }));
  };

  // ── Save ──
  const handleSave = async () => {
    if (!name.trim()) { setSaveMsg({ type: "error", text: "Podaj imię i nazwisko!" }); return; }
    if (!nationality.trim()) { setSaveMsg({ type: "error", text: "Wybierz narodowość zawodnika!" }); return; }
    
    // Rygorystyczna walidacja kraju
    if (!COUNTRY_CODES[nationality.trim()]) {
      setSaveMsg({ type: "error", text: "Wybierz kraj z listy podpowiedzi!" });
      return;
    }
    
    setIsSaving(true);
    setSaveMsg(null);

    const normalizedAttrs = {};
    ALL_ATTRS.forEach(a => {
      let v = Number(attrs[a.key]);
      if (isNaN(v) || v < 1) v = 1;
      if (v > 20) v = 20;
      normalizedAttrs[a.key] = v;
    });

    const playerData = {
      imie_nazwisko: name.trim(),
      pozycja_glowna: position,
      lepsza_noga: foot,
      wiek: Number(age),
      wzrost: Number(height),
      waga: Number(weight),
      narodowosc: nationality.trim() || "Polska",
      numer_na_koszulce: Number(shirtNumber) || 99,
      druzyna_id: teamId,
      atrybuty: normalizedAttrs,
    };

    try {
      if (onSave) await onSave(playerData);
      setSaveMsg({ type: "success", text: `✓ ${name} zapisany!` });
      timeoutRef.current = setTimeout(onClose, 1400);
    } catch (e) {
      setSaveMsg({ type: "error", text: `Błąd zapisu: ${e.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Overall rating ──
  const ovr = Math.round(ALL_ATTRS.reduce((s, a) => s + (Number(attrs[a.key]) || 1), 0) / ALL_ATTRS.length);

  return (
    <div className="pcm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="pcm-modal" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
        {/* ── HEADER ── */}
        <div className="pcm-header">
          <div className="pcm-header-left">
            <div className="pcm-ovr-badge" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}>{shirtNumber}</div>
            <div>
              <h2 className="pcm-title">{name.trim() || "Nowy Zawodnik"}</h2>
              <p className="pcm-subtitle">
                OVR: <span style={{ color: attrColor(ovr), fontWeight: "bold" }}>{ovr}</span> &nbsp;|&nbsp;
                Wypełnij profil i atrybuty gracza
              </p>
            </div>
          </div>
          <button className="pcm-close" onClick={onClose}>✕</button>
        </div>

        <div className="pcm-body">
          {/* ── SEKCJA 1: DANE STAŁE ── */}
          <section className="pcm-section">
            <h3 className="pcm-section-title">Dane podstawowe</h3>
            <div className="pcm-static-grid">
              <label className="pcm-field pcm-field--wide">
                <span>Imię i Nazwisko</span>
                <input
                  className="pcm-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Marek Kowalski"
                  maxLength={60}
                />
              </label>

              <label className="pcm-field" style={{ position: "relative" }}>
                <span>Narodowość</span>
                <input
                  className="pcm-input"
                  value={nationality}
                  onChange={(e) => {
                    setNationality(e.target.value);
                    setShowCountries(true);
                  }}
                  onFocus={() => setShowCountries(true)}
                  onBlur={() => setTimeout(() => setShowCountries(false), 200)}
                  placeholder="np. Polska"
                  maxLength={30}
                  autoComplete="off"
                />
                {showCountries && nationality.trim().length > 0 && (
                  <div className="pcm-autocomplete">
                    {ALL_COUNTRIES
                      .filter(c => c.toLowerCase().startsWith(nationality.trim().toLowerCase()))
                      .map(c => (
                        <div
                          key={c}
                          className="pcm-autocomplete-item"
                          onMouseDown={() => {
                            setNationality(c);
                            setShowCountries(false);
                          }}
                        >
                          {c}
                        </div>
                      ))}
                  </div>
                )}
              </label>

              <label className="pcm-field">
                <span>Pozycja</span>
                <select className="pcm-input pcm-select" value={position} onChange={(e) => setPosition(e.target.value)}>
                  {ALL_POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </label>

              <label className="pcm-field" style={{ gridColumn: 'span 2' }}>
                <span>Lepsza noga</span>
                <div className="pcm-foot-toggle">
                  {["Lewa", "Prawa", "Obie"].map((f) => (
                    <button
                      key={f}
                      className={`pcm-foot-btn ${foot === f ? "active" : ""}`}
                      onClick={() => setFoot(f)}
                      type="button"
                    >{f}</button>
                  ))}
                </div>
              </label>

              <label className="pcm-field">
                <span>Wiek</span>
                <input
                  className="pcm-input pcm-input--small"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={14} max={45}
                />
              </label>

              <label className="pcm-field">
                <span>Wzrost (cm)</span>
                <input
                  className="pcm-input pcm-input--small"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min={150} max={220}
                />
              </label>

              <label className="pcm-field">
                <span>Waga (kg)</span>
                <input
                  className="pcm-input pcm-input--small"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  min={50} max={120}
                />
              </label>

              <label className="pcm-field">
                <span>Numer</span>
                <input
                  className="pcm-input pcm-input--small"
                  type="number"
                  value={shirtNumber}
                  onChange={(e) => setShirtNumber(e.target.value)}
                  min={1} max={99}
                />
              </label>
            </div>
          </section>

          {/* ── SEKCJA 2: GENEROWANIE ── */}
          <section className="pcm-section">
            <h3 className="pcm-section-title">Atrybuty</h3>

            <div className="pcm-tabs">
              <button
                className={`pcm-tab ${tab === "sliders" ? "active" : ""}`}
                onClick={() => setTab("sliders")}
              ><span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "6px", verticalAlign: "middle" }}>tune</span> MANUALNIE</button>
              <button
                className={`pcm-tab ${tab === "ai" ? "active" : ""}`}
                onClick={() => setTab("ai")}
              ><span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "6px", verticalAlign: "middle" }}>smart_toy</span> ASYSTENT AI</button>
            </div>

            {tab === "sliders" && (
              <div className="pcm-sliders">
                {[
                  { key: "tempo", label: "Tempo", icon: "speed" },
                  { key: "fizycznosc", label: "Fizyczność", icon: "fitness_center" },
                  { key: "obrona", label: "Obrona", icon: "shield" },
                  { key: "technika", label: "Technika", icon: "sports_soccer" },
                  { key: "strzaly", label: "Strzały", icon: "sports_score" },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="pcm-slider-row">
                    <span className="material-symbols-outlined pcm-slider-icon" style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)" }}>{icon}</span>
                    <span className="pcm-slider-label">{label}</span>
                    <input
                      type="range" min={1} max={100}
                      value={sliders[key]}
                      onChange={(e) => handleSlider(key, e.target.value)}
                      className="pcm-range"
                      style={{ "--fill": `${sliders[key]}%` }}
                    />
                    <span className="pcm-slider-val">{sliders[key]}</span>
                  </div>
                ))}
                <p className="pcm-hint">Suwaki automatycznie przeliczają 37 ukrytych atrybutów.</p>
              </div>
            )}

            {tab === "ai" && (
              <div className="pcm-ai-panel">
                <textarea
                  className="pcm-textarea"
                  rows={4}
                  value={aiDesc}
                  onChange={(e) => setAiDesc(e.target.value)}
                  placeholder="Opisz zawodnika, np.: Szybki, agresywny przecinak, słaba technika."
                />
                <div className="pcm-ai-actions">
                  <button
                    className={`pcm-btn pcm-btn--generate ${isGenerating ? "loading" : ""}`}
                    onClick={handleGenerate}
                    disabled={isGenerating || !aiDesc.trim()}
                  >
                    {isGenerating ? (
                      <><span className="pcm-spinner" /> ANALIZUJĘ...</>
                    ) : (
                      <>GENERUJ Z OPISU</>
                    )}
                  </button>
                  <p className="pcm-hint">AI przetworzy tekst i dopasuje statystyki.</p>
                </div>
              </div>
            )}
          </section>

          {/* ── SEKCJA 3: TABELA ATRYBUTÓW ── */}
          <section className="pcm-section">
            <button
              className="pcm-section-toggle"
              onClick={() => setShowSummary((v) => !v)}
            >
              <h3 className="pcm-section-title" style={{ margin: 0 }}>
                Podgląd &amp; Korekta atrybutów
              </h3>
              <span className="pcm-toggle-arrow">{showSummary ? "▲" : "▼"}</span>
            </button>

            {showSummary && (
              <div className="pcm-attrs-grid">
                {Object.entries(ATTR_GROUPS).map(([groupName, groupAttrs]) => (
                  <div key={groupName} className="pcm-attr-group">
                    <div className="pcm-attr-group-title">{groupName}</div>
                    {groupAttrs.map(({ key, label }) => {
                      const val = attrs[key];
                      return (
                        <div key={key} className="pcm-attr-row">
                          <span className="pcm-attr-label">{label}</span>
                          <div className="pcm-attr-bar-wrap">
                            <div
                              className="pcm-attr-bar"
                              style={{ width: `${(val / 20) * 100}%`, background: attrColor(val) }}
                            />
                          </div>
                          <input
                            className="pcm-attr-input"
                            type="number" min={1} max={20}
                            value={val}
                            onChange={(e) => handleAttr(key, e.target.value)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── FOOTER ── */}
        <div className="pcm-footer">
          {saveMsg && (
            <span className={`pcm-save-msg pcm-save-msg--${saveMsg.type}`}>
              {saveMsg.text}
            </span>
          )}
          <button className="simulate-btn pcm-btn--cancel" onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}>ANULUJ</button>
          <button
            className={`simulate-btn ${isSaving ? "loading" : ""}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? <><span className="pcm-spinner" /> ZAPISYWANIE...</> : <><span className="material-symbols-outlined">check_circle</span> ZAPISZ ZAWODNIKA</>}
          </button>
        </div>
      </div>
    </div>
  );
}
