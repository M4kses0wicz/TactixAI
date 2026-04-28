import React from "react";
import "../styles/RoleModal/css/RoleModal.css";
import { useGame, normalizePos, DEFAULT_ROLES } from "../context/GameContext";

const POS_FULL_NAMES = {
  "BR": "Bramkarz",
  "ŚO": "Środkowy Obrońca",
  "PO": "Obrońca (Prawy)",
  "LO": "Obrońca (Lewy)",
  "DP": "Defensywny pomocnik",
  "ŚP": "Pomocnik (Środek)",
  "OP": "Ofensywny pomocnik (Środek)",
  "PS": "Skrzydłowy (Prawy)",
  "LS": "Skrzydłowy (Lewy)",
  "N": "Wysunięty napastnik (Środek)"
};

const ROLE_DESCRIPTIONS = {
  "Bramkarz": "Preferuje proste i bezpieczne rozwiązania. Oddaje piłkę najbliższym, niekrytym obrońcom lub zostaje na linii bramkowej.",
  "Bramkarz grający piłką": "Inicjuje kontrataki i szuka wolnych zawodników wyżej na boisku. Wyprowadza piłkę głęboko z pola karnego.",
  "Tradycyjny bramkarz": "Unika jakiegokolwiek ryzyka. Przy kontakcie z piłką wybija ją natychmiast i jak najdalej.",
  "Bramkarz grający na linii": "Trzyma się blisko linii bramkowej, rzadko wychodząc do dośrodkowań czy prostopadłych piłek. Polega na refleksie.",
  "Bramkarz-libero": "Ustawia się wysoko, często przed polem karnym, asekurując wyżej ustawioną linię obrony i przejmując długie podania.",
  "Środkowy Obrońca": "Rozgrywa bezpiecznie z partnerami w linii. Bez piłki trzyma strukturę i kryje w wyznaczonej strefie.",
  "Zaawansowany Środkowy Obrońca": "Wyprowadza piłkę z obrony, wchodząc głęboko w linię pomocy, by stworzyć przewagę liczebną w rozegraniu.",
  "Grający Piłką Środkowy Obrońca": "Skupia się na penetrujących i długich podaniach, potrafi jednym zagraniem przyspieszyć atak.",
  "Tradycyjny Środkowy Obrońca": "Po odzyskaniu piłki natychmiast ją wybija. Zero ryzyka przy wyprowadzaniu.",
  "Boczny Środkowy Obrońca": "W systemie z 3 obrońcami rozszerza grę, wchodząc w boczne sektory i dając wsparcie flankom.",
  "Obiegający Środkowy Obrońca": "Niezwykle ofensywny; włącza się do akcji, obiegając skrzydłem wyżej ustawionych partnerów.",
  "Blokujący Środkowy Obrońca": "Stoper. Agresywnie wybiega przed linię obrony, by zaatakować napastnika zanim ten przyjmie piłkę.",
  "Asekurujący Środkowy Obrońca": "Libero. Cofa się głębiej za resztę obrońców, zbierając prostopadłe piłki posłane za plecy obrony.",
  "Blokujący Boczny Środkowy Obrońca": "Agresywnie atakuje rywala w bocznych sektorach boiska, łamiąc linię obrony w poszukiwaniu odbioru.",
  "Boczny obrońca": "Utrzymuje pozycję, oferując podstawowe wsparcie skrzydłowemu. Trzyma szerokość w obronie.",
  "Wysunięty boczny obrońca": "Bardzo ofensywny wariant obrońcy. Dubluje skrzydłowego i agresywnie szuka dośrodkowań spod linii końcowej.",
  "Odwrócony boczny obrońca": "Zamiast grać przy linii, ścina do środka pola w fazie ataku, stając się dodatkowym środkowym pomocnikiem.",
  "Rozgrywający wysunięty boczny obrońca": "Schodzi do półprzestrzeni (half-spaces), pełniąc rolę bocznego rozgrywającego wspierającego atak pozycyjny.",
  "Zaawansowany boczny wysunięty obrońca": "Przebywa niemal wyłącznie na połowie rywala, działając w ataku jak typowy skrzydłowy.",
  "Cofnięty boczny obrońca": "Zostaje bardzo głęboko, często asymetrycznie tworząc trójkę stoperów dla lepszej asekuracji z tyłu.",
  "Pressujący boczny obrońca": "Błyskawicznie wychodzi ze swojej linii, agresywnie atakując skrzydłowego rywala już na jego połowie.",
  "Cofnięty wysunięty boczny obrońca": "Wahadłowy, który mocniej skupia się na zabezpieczeniu własnej połowy, rzadziej włączając się pod pole karne rywala.",
  "Pressujący boczny wysunięty obrońca": "Agresywny wahadłowy, atakujący rywala wysoko na bokach boiska za cenę zostawienia luki za plecami.",
  "Łącznik defensywy": "Spaja obronę z atakiem, wybiegając z piłką z głębi pola niczym drugi, ukryty napastnik (Segundo Volante).",
  "Defensywny pomocnik": "Odbiera piłkę i bezpiecznie podaje do bardziej kreatywnych partnerów. Zatyka dziury przed polem karnym.",
  "Pomocnik długodystansowiec": "Box-to-Box. Transportuje piłkę od własnego do obcego pola karnego, często decydując się na strzały z dystansu.",
  "Cofnięty rozgrywający": "Główny dyrygent zespołu; schodzi przed stoperów, by odebrać piłkę i podyktować tempo i kierunek gry.",
  "Swobodny rozgrywający": "Regista. Ma niemal nieograniczoną swobodę; agresywnie szuka wolnej przestrzeni przed obroną, by dyktować grę.",
  "Cofający się defensywny pomocnik": "Half Back. W fazie obrony i rozegrania cofa się bardzo głęboko, wchodząc pomiędzy środkowych obrońców.",
  "Kryjący defensywny pomocnik": "Kotwica. Plastruje kluczowego zawodnika rywala operującego w strefie przed polem karnym. Utrzymuje twardo pozycję.",
  "Szeroko kryjący defensywny pomocnik": "Asekuruje boczne sektory boiska, łatając luki pozostawione przez wysoko grających bocznych obrońców.",
  "Pressujący defensywny pomocnik": "Ball-Winning. Porzuca swoją pozycję, by biegać za piłką, agresywnie ją odbierać i natychmiast oddawać partnerom.",
  "Rozgrywający pomocnik": "Klasyczna ósemka. Dyktuje tempo w centrum boiska, stanowiąc główny punkt odniesienia w ataku pozycyjnym.",
  "Wysunięty rozgrywający": "Ustawia się wyżej niż reszta pomocników, szukając miejsca na oddanie decydującego, ostatniego podania.",
  "Boczny środkowy pomocnik": "Carrilero. Zabezpiecza boczne strefy pomocy i wpiera zespół w szerokiej wymianie podań.",
  "Środkowy pomocnik": "Pracownik box-to-box o wyważonym nastawieniu. Wykonuje systemowe polecenia (atak, wsparcie, obrona).",
  "Wychodzący pomocnik": "Mezzala. Szeroko atakuje półprzestrzenie (pomiędzy środkiem a skrzydłem), często wbiegając na pozycję dla dośrodkowań.",
  "Ofensywny pomocnik": "Klasyczna 10-tka. Łączy drugą linię z napastnikami, grając tuż za ich plecami w strefie przed polem karnym.",
  "Wolna rola": "Trequartista/Shadow Striker. Szuka wolnej przestrzeni. Odpuszcza obowiązki defensywne na rzecz kreacji i morderczej skuteczności z przodu.",
  "Fałszywy napastnik": "Bardziej wykończeniowiec niż kreator; atakuje z głębi w pole karne, zachowując się jak drugi, podwieszony napastnik.",
  "Śledzący ofensywny pomocnik": "W obronie cofa się głęboko za linię piłki, przeszkadzając w rozegraniu defensywnemu pomocnikowi rywala.",
  "Podwieszony przyjmujący ofensywny pomocnik": "Bez piłki odcina opcje podań do najniżej grającego pomocnika rywala, zamiast bezpośrednio atakować stoperów.",
  "Centralny przyjmujący ofensywny pomocnik": "Bez piłki skupia całą swoją uwagę na agresywnym naciskaniu stoperów rywala w fazie wyprowadzenia.",
  "Odwrócony skrzydłowy": "Operuje po stronie przeciwnej do swojej lepszej nogi; ścina do środka pola karnego, szukając uderzeń na bramkę.",
  "Rozgrywający skrzydłowy": "Drybluje w kierunku środka, starając się ściągnąć na siebie uwagę obrońców, by posłać otwierające podanie.",
  "Skrzydłowy": "Trzyma się szeroko przy linii autowej, szuka bezpośrednich pojedynków biegowych 1-na-1 i klasycznych dośrodkowań spod końcowej linii.",
  "Boczny pomocnik": "Zapewnia asekuracyjną i bezpieczną grę na skrzydle. W obronie rzetelnie blokuje boczne korytarze boiska.",
  "Śledzący boczny pomocnik": "Niezwykle pracowity gracz. Sumiennie wraca na własną połowę, biegając za ofensywnymi bocznymi obrońców rywala jak cień.",
  "Boczny przyjmujący pomocnik": "W fazie obrony aktywnie pressuje rywala w bocznej strefie, starając się wymusić błąd w rozegraniu.",
  "Schodzący napastnik": "Inside Forward. Zamiast dośrodkowywać, biegnie z piłką po przekątnej prosto na bramkę, stając się de facto dodatkowym snajperem.",
  "Boczny napastnik": "Raumdeuter. Poszukiwacz przestrzeni na boku boiska. Zaniedbuje kreowanie gry, w zamian znikając z radaru obrońcom przed strzałem.",
  "Śledzący skrzydłowy": "Defensywny skrzydłowy, który agresywnie pressuje na całej długości bocznej linii, pracując na pełnych obrotach w obu kierunkach.",
  "Boczny przyjmujący skrzydłowy": "Bez piłki pressuje rywala od zewnątrz do środka, zamykając opcję podania wzdłuż linii bocznej.",
  "Odwrócony przyjmujący skrzydłowy": "W obronie pressuje przeciwnika z piłką od środka do zewnątrz, wypychając grę rywala pod linię autową.",
  "Odgrywający": "Target Forward. Używa siły fizycznej grając tyłem do bramki. Przyjmuje wysokie piłki, przetrzymuje je i zgrywa nadbiegającym partnerom.",
  "Środkowy napastnik": "Uniwersalna dziewiątka. W zależności od sytuacji na boisku potrafi kreować, przytrzymać piłkę i wykańczać akcje.",
  "Wychodzący napastnik": "Advanced Forward. Szpica ataku. Gra na granicy spalonego, czekając na prostopadłe piłki z głębi pola i skupiając się na zdobywaniu goli.",
  "Lis pola karnego": "Poacher. Nie uczestniczy w rozegraniu piłki. Żyje wyłącznie w polu karnym, polując na dośrodkowania i najmniejsze błędy obrońców.",
  "Cofnięty napastnik": "Fałszywa dziewiątka. Cofa się głębiej do linii pomocy, by wyciągnąć za sobą stoperów i stworzyć lukę w środku dla wbiegających skrzydłowych.",
  "Śledzący środkowy napastnik": "Pressing Forward. Pierwszy obrońca. Haruje bez piłki, nakładając zaciekły, nieustanny pressing na stoperów i bramkarza przeciwnika.",
  "Podwieszony przyjmujący środkowy napastnik": "Cofa się w pressingu, odpuszczając nacisk na stoperów na rzecz odcięcia od piłki środkowego rozgrywającego rywali.",
  "Centralny przyjmujący środkowy napastnik": "W obronie nieustannie i bezpośrednio naciska na środkowych obrońców rywala, próbując zablokować im swobodne rozegranie."
};

export default function RoleModal({ player, position, onClose, isOpponent }) {
  const { getPlayerPhoto, updatePlayerRole, updateOpponentPlayerRole, aiHighlights, removeAiHighlight } = useGame();
  const [currentType, setCurrentType] = React.useState('przy_pilce');

  const onUpdateRole = isOpponent ? updateOpponentPlayerRole : updatePlayerRole;

  if (!player) return null;

  // Precyzyjne określenie pozycji (np. ŚO3, ŚO4)
  const posKey = position; 
  const fullPosName = POS_FULL_NAMES[normalizePos(posKey)] || posKey;
  
  const getRolesForPos = (type) => {
    // ŚCISŁA LISTA RÓL - TYLKO TO CO PODAŁ UŻYTKOWNIK
    const fallback = DEFAULT_ROLES[posKey] || DEFAULT_ROLES[normalizePos(posKey)];
    
    if (fallback) {
        const list = type === 'przy_pilce' ? fallback.przy : fallback.bez;
        return [...list].sort();
    }

    return [];
  };

  const possessionRoles = getRolesForPos('przy_pilce');
  const defensiveRoles = getRolesForPos('bez_pilki');
  
  // OSTATECZNY PRIORYTET: 1. Wybrane role z bazy, 2. Pierwsza z listy, 3. "Brak"
  const currentPrzyPilce = player.wybrane_role?.przy_pilce || possessionRoles[0] || "Brak";
  const currentBezPilki = player.wybrane_role?.bez_pilki || defensiveRoles[0] || "Brak";
  const activeRole = currentType === 'przy_pilce' ? currentPrzyPilce : currentBezPilki;

  // Mock instructions based on role name
  const getInstructions = (role) => {
    if (role.includes("Grajacy") || role.includes("rozgrywajacy")) return [
      { icon: "✦", text: "Swobodnie" },
      { icon: "○", text: "Utrzymuje pozycje" }
    ];
    if (role.includes("Blokujacy") || role.includes("Obrona")) return [
      { icon: "⌅", text: "Wychodzi wyzej" },
      { icon: "🛡️", text: "Ostrozny" }
    ];
    if (role.includes("napastnik") || role.includes("Atak")) return [
      { icon: "⌅", text: "Wychodzi wyzej" },
      { icon: "✦", text: "Asertywny" }
    ];
    return [
      { icon: "○", text: "Utrzymuje pozycje" },
      { icon: "✦", text: "Zrównoważony" }
    ];
  };

  const renderStars = (role) => {
    const isNative = player.przydatnosc_do_roli_przy_pilce?.includes(role) || 
                     player.przydatnosc_do_roli_bez_pilki?.includes(role);
    
    const seed = role.length + player.imie_nazwisko.length;
    const baseStars = isNative ? 4 : 3;
    const extra = (seed % 2 === 0) ? 1 : 0.5;
    const count = Math.min(5, baseStars + extra);
    
    const fullStars = Math.floor(count);
    const hasHalf = count % 1 !== 0;
    
    return (
      <div className="rm-stars-row">
        {[...Array(fullStars)].map((_, i) => <span key={`f-${i}`} style={{color: '#FFEA00'}}>★</span>)}
        {hasHalf && (
          <span style={{ position: 'relative', display: 'inline-block', color: 'rgba(255,255,255,0.1)' }}>
            ★
            <span style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden', color: '#FFEA00' }}>★</span>
          </span>
        )}
        {[...Array(5 - Math.ceil(count))].map((_, i) => <span key={`e-${i}`} style={{color: 'rgba(255,255,255,0.1)'}}>★</span>)}
      </div>
    );
  };

  const renderRoleCard = (role, type, current) => {
    const isActive = current === role;
    const isAiHighlighted = aiHighlights.some(h => {
      const hl = h?.toLowerCase?.()?.trim?.() || "";
      const r = role?.toLowerCase?.()?.trim?.() || "";
      if (!hl || !r) return false;
      
      // Dopasowanie: albo pełna nazwa, albo rola zawiera sugestię, albo pierwsze 4 litery
      const match = hl.includes(r) || r.includes(hl) || (hl.length > 3 && r.startsWith(hl.substring(0, 4)));
      
      // Podświetl tylko jeśli rola jest sugerowana ALE NIE JEST obecnie wybrana
      return match && !isActive;
    });

    return (
      <div 
        key={role} 
        className={`rm-role-card ${isActive ? 'rm-role-card--active' : ''} ${isAiHighlighted ? 'ai-highlight' : ''}`}
        onClick={() => onUpdateRole(player.id, type, role)}
      >
        <div className="rm-role-check" />
        <div className="rm-role-main">
          <div className="rm-role-name-row">
            <span className="rm-role-name">{role}</span>
          </div>
          <div className="rm-role-stars-container">
            {renderStars(role)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-window" onClick={(e) => e.stopPropagation()}>
        <button className="rm-close" onClick={onClose}>×</button>
        
        <div className="rm-header">
          <div className="rm-avatar-outer">
            <div className="rm-avatar-wrap">
                <img src={getPlayerPhoto(player.imie_nazwisko)} alt="" className="rm-avatar" />
            </div>
          </div>
          <div className="rm-header-text">
            <div className="rm-pos-title">{fullPosName}</div>
            <h2 className="rm-name">{player.imie_nazwisko}</h2>
          </div>
        </div>

        <div className="rm-tabs-container">
            <div className="rm-tabs">
                <button className={`rm-tab ${currentType === 'przy_pilce' ? 'rm-tab--active' : ''}`} onClick={() => setCurrentType('przy_pilce')}>
                    ⚽ Przy piłce
                </button>
                <button className={`rm-tab ${currentType === 'bez_pilki' ? 'rm-tab--active' : ''}`} onClick={() => setCurrentType('bez_pilki')}>
                    🛡️ Bez piłki
                </button>
            </div>
        </div>

        <div className="rm-content">
          <div className="rm-role-grid">
            {(currentType === 'przy_pilce' ? possessionRoles : defensiveRoles).map(role => renderRoleCard(role, currentType, currentType === 'przy_pilce' ? currentPrzyPilce : currentBezPilki))}
          </div>
        </div>

        <div className="rm-description-panel">
          <div className="rm-description-icon">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div className="rm-description-text">
            {ROLE_DESCRIPTIONS[activeRole] || "Wybierz rolę, aby zobaczyć jej opis."}
          </div>
        </div>

        <div className="rm-footer">
          <button className="rm-done-btn" onClick={onClose}>Zatwierdź</button>
        </div>
      </div>
    </div>
  );
};
