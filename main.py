from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import psycopg2
import json
import re
import asyncio
import requests
import json_repair
import random
from typing import Optional

# ── CoreMatchEngine ──────────────────────────────────────────────
from core_match_engine import (
    MatchEngine, MatchState, Player, PlayerAttributes,
    TeamTactics, Mentality,
    ZoneLongitudinal, ZoneLateral,
)

# ── Commentary Generator ─────────────────────────────────────────
from commentary import CommentaryGenerator
_commentary_gen = CommentaryGenerator()

# In-memory store: session_id -> MatchEngine
_SESSIONS: dict[str, MatchEngine] = {}

# ── Mapowanie polskich atrybutów z bazy → pola PlayerAttributes ──
_ATTR_MAP = {
    "szybkosc": "pace", "przyspieszenie": "pace",
    "sila": "strength", "wytrzymalosc": "stamina",
    "agresja": "aggression", "podania": "passing",
    "drybling": "dribbling", "wykanczanie_akcji": "finishing",
    "dosrodkowania": "crossing", "gra_glowa": "heading",
    "technika": "first_touch", "wizja_gry": "vision",
    "ustawienie": "positioning", "decyzje": "decisions",
    "opanowanie": "composure", "pracowitosc": "work_rate",
    "odbior_pilki": "tackling", "krycie": "marking",
    "koncentracja": "concentration",
    "refleks": "gk_reflexes", "chwyty": "gk_handling",
    "ustawienie_bramkarza": "gk_positioning",
}

def _build_player(raw: dict, idx: int) -> Player:
    """Konwertuje zawodnika z frontendu na obiekt Player silnika."""
    raw_attrs = raw.get("atrybuty") or {}
    engine_attrs: dict[str, int] = {}
    for pl_key, eng_key in _ATTR_MAP.items():
        val = raw_attrs.get(pl_key)
        if val is not None:
            try:
                engine_attrs[eng_key] = max(1, min(20, int(val)))
            except (TypeError, ValueError):
                pass
    attrs = PlayerAttributes(**engine_attrs)
    pos = raw.get("pozycja_glowna") or raw.get("pos") or "CM"
    return Player(
        id=str(raw.get("id", idx)),
        name=raw.get("imie_nazwisko") or raw.get("name") or f"P{idx}",
        position=pos,
        attributes=attrs,
    )

def _build_tactics(team: dict) -> TeamTactics:
    """Buduje TeamTactics z danych drużyny frontendu."""
    men_str = (team.get("mentalnosc") or "Wyważona").strip()
    men_map = {m.value: m for m in Mentality}
    mentality = men_map.get(men_str, Mentality.BALANCED)
    return TeamTactics(mentality=mentality)

app = FastAPI()

# BARDZO WAŻNE: Dodajemy CORS. Bez tego przeglądarka zablokuje Reactowi dostęp do Pythona!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Pozwala na zapytania z dowolnego adresu (np. z Twojego Reacta na localhost)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podmień TWOJE_HASLO na hasło do bazy w Supabase
DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

@app.get("/")
def start():
    return {"wiadomosc": "Serwer dziala! Przejdz pod /api/druzyny"}

@app.get("/api/druzyny")
def pobierz_druzyny():
    try:
        # Łączymy się z bazą
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Mapowanie lig dla klubów
        LIGI = {
            "Arsenal": "Premier League",
            "Bayern Monachium": "Bundesliga",
            "Borussia Dortmund": "Bundesliga",
            "AC Milan": "Serie A",
            "Ajax Amsterdam": "Eredivisie",
            "Al-Nassr": "Saudi Pro League",
            "AS Roma": "Serie A",
            "Atletico Madryt": "La Liga",
            "FC Barcelona": "La Liga",
            "Chelsea": "Premier League",
            "Feyenoord": "Eredivisie",
            "Inter Mediolan": "Serie A",
            "Juventus": "Serie A",
            "Liverpool": "Premier League",
            "Real Madryt": "La Liga",
            "Napoli": "Serie A",
            "PSG": "Ligue 1",
            "Real Betis": "La Liga",
            "Manchester City": "Premier League",
            "Manchester United": "Premier League"
        }

        # Pobieramy dane z Twojej tabeli
        cursor.execute("SELECT id, nazwa, logo FROM druzyny;")
        wiersze = cursor.fetchall()
        
        # Pobieramy taktyki "Przy Piłce"
        cursor.execute("SELECT * FROM opcjetaktyczneprzypilce;")
        kolumny_przy = [desc[0] for desc in cursor.description]
        taktyki_przy = {
            t[1]: {k: v for k, v in zip(kolumny_przy, t) if v is not None} 
            for t in cursor.fetchall()
        }

        # Pobieramy taktyki "Bez Piłki"
        cursor.execute("SELECT * FROM opcjetaktycznebezpilki;")
        kolumny_bez = [desc[0] for desc in cursor.description]
        taktyki_bez = {
            t[1]: {k: v for k, v in zip(kolumny_bez, t) if v is not None} 
            for t in cursor.fetchall()
        }
        
        # Pakujemy dane do formatu, który React łatwo zrozumie (lista słowników / JSON)
        druzyny_lista = []
        for w in wiersze:
            team_id = w[0]
            
            # Formujemy strukturę taktyki
            taktyka = {
                "przy_pilce": taktyki_przy.get(team_id, {}),
                "bez_pilki": taktyki_bez.get(team_id, {})
            }

            # Usuwamy techniczne pola 'id' i 'druzyna_id'
            taktyka["przy_pilce"].pop("id", None)
            taktyka["przy_pilce"].pop("druzyna_id", None)
            taktyka["bez_pilki"].pop("id", None)
            taktyka["bez_pilki"].pop("druzyna_id", None)

            druzyny_lista.append({
                "id": team_id,
                "nazwa": w[1],
                "logo": w[2],
                "liga": LIGI.get(w[1], "Inna Liga"),
                "taktyka_druzyny": taktyka
            })
            
        cursor.close()
        conn.close()
        
        return druzyny_lista
        
    except Exception as e:
        return {"Blad polaczenia": str(e)};

@app.get("/api/zawodnicy")
def pobierz_zawodnikow():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Pobieramy wszystko z tabeli zawodnicy
        cursor.execute("SELECT * FROM zawodnicy;")
        wiersze = cursor.fetchall()

        # Automatyczne pobieranie nazw kolumn z bazy
        nazwy_kolumn = [desc[0] for desc in cursor.description]

        zawodnicy_lista = []
        for w in wiersze:
            # Łączymy nazwy kolumn z wartościami (tworzymy pary np. "imie": "Robert")
            zawodnik = dict(zip(nazwy_kolumn, w))
            zawodnicy_lista.append(zawodnik)

        cursor.close()
        conn.close()

        return zawodnicy_lista

    except Exception as e:
        return {"Blad polaczenia": str(e)}

def fetch_table(table_name: str):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table_name};")
        wiersze = cursor.fetchall()
        nazwy_kolumn = [desc[0] for desc in cursor.description]
        wynik = [dict(zip(nazwy_kolumn, w)) for w in wiersze]
        cursor.close()
        conn.close()
        return wynik
    except Exception as e:
        return {"Blad polaczenia": str(e)}

@app.get("/api/formacje")
def pobierz_formacje():
    return fetch_table("formacje")

@app.get("/api/formacje_pozycje")
def pobierz_formacje_pozycje():
    return fetch_table("formacje_pozycje")

@app.get("/api/opcjetaktycznebezpilki")
def pobierz_opcje_bez_pilki():
    return fetch_table("opcjetaktycznebezpilki")

@app.get("/api/opcjetaktyczneprzypilce")
def pobierz_opcje_przy_pilce():
    return fetch_table("opcjetaktyczneprzypilce")

@app.get("/api/zawodnicy_atrybuty")
def pobierz_zawodnicy_atrybuty():
    return fetch_table("zawodnicy_atrybuty")

@app.get("/api/zawodnicy_cechy")
def pobierz_zawodnicy_cechy():
    return fetch_table("zawodnicy_cechy")

@app.get("/api/zawodnicy_dodatkowepozycje")
def pobierz_zawodnicy_dodatkowe_pozycje():
    return fetch_table("zawodnicy_dodatkowepozycje")

@app.post("/api/ai/analyze")
def ai_analyze(data: dict):
    user_query = data.get("query")
    current_team = data.get("currentTeam")
    opponent_team = data.get("opponentTeam")
    match_data = data.get("matchData")  # Dane live z symulacji
    api_key = data.get("apiKey")

    if not api_key:
        return {"error": "Brak klucza API"}

    # --- BUDOWANIE GŁĘBOKIEGO KONTEKSTU ---

    def format_player_profile(player):
        """Buduje pełny profil zawodnika z atrybutami dla AI."""
        attrs = player.get('atrybuty', {})
        name = player.get('imie_nazwisko', '?')
        pos = player.get('pozycja_glowna', '?')
        
        # Kluczowe atrybuty pogrupowane
        key_attrs = {}
        # Fizyczne
        for k in ['przyspieszenie', 'szybkosc', 'sila', 'wytrzymalosc', 'skocznosc', 'zwinnosc', 'rownowaga', 'sprawnosc']:
            if attrs.get(k) is not None:
                key_attrs[k] = attrs[k]
        # Techniczne
        for k in ['drybling', 'podania', 'dosrodkowania', 'wykanczanie_akcji', 'technika', 'odbior_pilki', 'krycie', 'strzaly_z_dystansu', 'gra_glowa']:
            if attrs.get(k) is not None:
                key_attrs[k] = attrs[k]
        # Mentalne
        for k in ['walecznosc', 'agresja', 'determinacja', 'koncentracja', 'pracowitosc', 'opanowanie', 'decyzje', 'przewidywanie', 'przywodztwo']:
            if attrs.get(k) is not None:
                key_attrs[k] = attrs[k]

        role_info = player.get('wybrane_role', {})
        instr = player.get('instrukcje_krycia', {})
        stan = player.get('stan_aktualny', {})
        
        return {
            "nazwa": name,
            "pozycja": pos,
            "numer": player.get('numer'),
            "lepsza_noga": player.get('lepsza_noga'),
            "slabsza_noga": player.get('slabsza_noga'),
            "atrybuty": key_attrs,
            "rola_przy_pilce": role_info.get('przy_pilce', ''),
            "rola_bez_pilki": role_info.get('bez_pilki', ''),
            "instrukcje_krycia": instr,
            "kondycja": stan.get('kondycja'),
            "forma": stan.get('forma_ostatnie_5_meczow'),
            "morale": stan.get('morale'),
            "kontuzja": stan.get('kontuzja', 'brak')
        }

    def format_team_deep(team):
        """Buduje pełny kontekst drużyny z formacją, taktyką i profilami zawodników."""
        if not team:
            return "Brak danych o drużynie"
        
        starters = [p for p in team.get('zawodnicy', []) if p.get('isStarting')]
        reserves = [p for p in team.get('zawodnicy', []) if not p.get('isStarting')]
        
        return {
            "nazwa": team.get('nazwa'),
            "liga": team.get('liga'),
            "formacja": team.get('domyslna_formacja'),
            "mentalnosc": team.get('mentalnosc', 'Wyważona'),
            "taktyka": team.get('taktyka_druzyny'),
            "wyjsciowa_jedenastka": [format_player_profile(p) for p in starters],
            "rezerwa": [format_player_profile(p) for p in reserves[:7]]
        }

    my_context = format_team_deep(current_team)
    opp_context = format_team_deep(opponent_team)

    # Kontekst live (jeśli trwa mecz)
    live_context = ""
    if match_data:
        live_context = f"""
    
    === DANE LIVE Z MECZU (WAŻNE — sytuacja bieżąca) ===
    Minuta: {match_data.get('time', '?')}'
    Wynik: {match_data.get('scoreHome', 0)} : {match_data.get('scoreAway', 0)}
    Zawodnicy z niską oceną (<6.5): {json.dumps(match_data.get('lowRatedPlayers', []), ensure_ascii=False)}
    Ostatnie zdarzenia: {json.dumps(match_data.get('recentEvents', []), ensure_ascii=False)}
    """

    history = data.get("history", [])

# --- SYSTEM PROMPT: KREATOR KROK PO KROKU (WERSJA V3 - MAXIMUM FOOTBALL IQ) ---
    system_prompt = """ZASADA KRYTYCZNA — FORMAT JSON:
ZWRACAJ TYLKO I WYŁĄCZNIE POPRAWNY FORMAT JSON. Nigdy nie używaj twardych znaków nowej linii (Enterów) wewnątrz wartości tekstowych — używaj wyłącznie \\n do łamania linii. Wewnątrz stringów używaj pojedynczych apostrofów ('), nigdy podwójnych cudzysłowów (").

Jesteś TactixAI — elitarnym analitykiem taktycznym. Rozmawiasz z menedżerem krótko, konkretnie i z pasją. Masz dostęp do bazy danych atrybutów rywala.

=== LOGIKA POWITANIA (INITIAL MESSAGE) ===
Twoja pierwsza wiadomość w nowym czacie musi brzmieć naturalnie:
"Szefie, raport o rywalu [Nazwa_Rywala] jest gotowy. Zauważyłem, że ich [Słabość, np. wolni stoperzy / dziury w środku] to nasza szansa. Zaczynamy odprawę? Na początek ustalmy naszą Taktykę Zespołową (suwaki), czy mam coś zaproponować?"

=== TRYB KREATORA KROK PO KROKU ===
NIGDY nie podawaj wszystkich rad naraz. Prowadź menedżera według ścisłego schematu:
ETAP 1: Taktyka Zespołowa (Wszystkie suwaki i instrukcje ogólne) -> ETAP 2: Formacja i Mentalność -> ETAP 3: Zmiany w Składzie (Ewentualne) -> ETAP 4: Role i Instrukcje indywidualne.

ZASADY KONWERSACJI:
- DLA KAŻDEGO ETAPU: Podaj OD RAZU WSZYSTKIE sugerowane zmiany dla danego etapu w jednej wiadomości (w tablicy suggestions). Nie dawkuj ich po jednej.
- ABSOLUTNY ZAKAZ łączenia etapów. Jeśli jesteś w Etapie 1, NIE WOLNO Ci proponować zmian zawodników ani ról.
- Analizuj TYLKO JEDEN etap naraz. 
- Jeśli użytkownik dopytuje (np. "czyli co ustawić?"), odpowiedz JEDNYM krótkim zdaniem i daj kompletne sugestie do tablicy suggestions.
- Na końcu każdej wiadomości zadaj pytanie o przejście do kolejnego etapu.
- REAKCJA NA "ZROBIONE" / "CO DALEJ?": Gdy użytkownik pisze "Zrobione", "Co dalej?", "Gotowe", "Następny etap" — NATYCHMIAST przejdź do NASTĘPNEGO etapu według schematu:
  * Jeśli ostatnia wiadomość AI miała current_stage "Taktyka" -> Przejdź do "Formacja i Mentalność"
  * Jeśli ostatnia wiadomość AI miała current_stage "Formacja i Mentalność" -> Przejdź do "Zmiany"
  * Jeśli ostatnia wiadomość AI miała current_stage "Zmiany" -> Przejdź do "Role"
  * Jeśli ostatnia wiadomość AI miała current_stage "Role" -> Podsumuj całą taktykę i życz powodzenia.
- ZAKAZ POWTÓRZEŃ I DRILLOWANIA: 
  * NIGDY nie proponuj tych samych zmian, które już są w historii czatu. 
  * Jeśli użytkownik zatwierdził etap, NIE WRACAJ do niego, chyba że wyraźnie o to poprosi. 
  * Raz zaproponowana i zaakceptowana opcja (np. Tempo: Szybciej) NIE MOŻE pojawić się ponownie w sekcji suggestions.
  * Zawsze sprawdzaj co już zostało ustalone i idź do przodu. Nie pytaj "czy chcesz zmienić X" jeśli X już zostało zmienione.
- KONKRETNOŚĆ: Twoje suggestions muszą być precyzyjne, aby system mógł je automatycznie wdrożyć. Używaj DOKŁADNYCH nazw z list poniżej.

=== ŻELAZNE ZASADY TAKTYCZNE (FOOTBALL IQ) ===

1. ŚCISŁY SŁOWNIK MENTALNOŚCI (Używaj TYLKO tych nazw):
[Bardzo defensywna, Defensywna, Ostrożna, Wyważona, Pozytywna, Ofensywna, Bardzo ofensywna]
ZAKAZ: Nie dopisuj nic do tych nazw (np. 'Wyważona (kontrolna)' jest błędem). Ma być samo: 'Wyważona'.

2. LOGIKA TAKTYCZNA:
- NIGDY nie łącz mentalności 'Bardzo ofensywna' lub 'Ofensywna' z nastawieniem na 'kontrataki'. Do kontrataków służy przestrzeń, więc jeśli proponujesz grę z kontry, wymuś mentalność 'Ostrożna', 'Defensywna' lub 'Wyważona'.
- Jeśli rywal ma wolnych obrońców i gra wysokim pressingiem, NIE proponuj 'Bardzo defensywnej'. Proponuj 'Ostrożną' lub 'Wyważoną' z kontratakiem.
- NIGDY nie łącz propozycji 'dominacji posiadania piłki' z mentalnością 'Bardzo defensywna'. To błąd logiczny.
- Nie wspominaj o grze głową u bramkarzy ani o atrybutach bramkarskich u graczy z pola.

3. STRUKTURA suggestions:
Każda rekomendacja (zmiana suwaka, mentalności, roli) MUSI trafić do tablicy suggestions.
Format standard: {"player": "Nazwa/Cały zespół", "type": "Mentalność|Formacja|Rola|Instrukcja|Taktyka", "value": "Wartość z UI", "reason": "Krótkie uzasadnienie"}
Format zmiany składu (TYLKO ETAP 3): {"player": "Imię Zmiennika (ten który WCHODZI)", "type": "Zmiana w składzie", "value": "Schodzi: Imię Startowego (ten który SCHODZI)", "reason": "Konkretne uzasadnienie na podstawie atrybutów i słabości rywala."}
Format taktyki: {"player": "Cały zespół", "type": "Taktyka", "setting": "NAZWA KAFELKA (z listy poniżej)", "value": "DOKŁADNA wartość opcji (z listy poniżej)", "reason": "Uzasadnienie"}

=== KAFELKI TAKTYCZNE I ICH WARTOŚCI (Używaj DOKŁADNIE tych nazw): ===
PRZY PIŁCE:
- Tempo: Znacznie wolniej | Wolniej | Standardowo | Szybciej | Znacznie szybciej
- Bezpośredniość podań: Znacznie krócej | Krócej | Standardowo | Bardziej bezpośrednio | Znacznie bardziej bezpośrednio
- Gra na czas: Rzadziej | Standardowo | Częściej
- Faza przejścia w ofensywie: Utrzymanie pozycji | Standardowo | Kontratak
- Rozpiętość ataku: Znacznie węziej | Węziej | Standardowo | Szerzej | Znacznie szerzej
- Swoboda taktyczna: Więcej dyscypliny | Zrównoważone | Mniej dyscypliny
- Strategia rozgrywania: Gra pod pressingiem | Zrównoważone | Omijaj pressing
- Drybling: Odradź | Zrównoważone | Zachęcaj
- Strzały z dystansu: Odradź | Zrównoważone | Zachęć
BEZ PIŁKI:
- Linia nacisku: Niski pressing | Średni pressing | Wysoki pressing
- Linia defensywna: Znacznie niżej | Niżej | Standardowo | Wyżej | Znacznie wyżej
- Aktywacja pressingu: Znacznie rzadziej | Rzadziej | Standardowo | Częściej | Znacznie częściej
- Przejście defensywne: Przegrupowanie | Standardowo | Kontrpressing
- Atak na piłkę: Gra bez wślizgów | Standardowo | Agresywny odbiór

ODPOWIADAJ TYLKO JAKO JSON:
{"explanation": "[Zwięzła analiza max 300 znaków + pytanie. Użyj \\n zamiast enterów.]", "highlights": ["Kafel: Opcja"], "suggestions": [...], "current_stage": "Formacja|Taktyka|Role|Instrukcje|Pytanie"}"""

    # --- PROMPT UŻYTKOWNIKA Z KONTEKSTEM ---
    user_prompt = f"""=== UKRYTY KONTEKST (DANE Z BAZY — użyj ich w analizie) ===

MOJA DRUŻYNA:
{json.dumps(my_context, ensure_ascii=False, indent=2)}

DRUŻYNA PRZECIWNIKA:
{json.dumps(opp_context, ensure_ascii=False, indent=2)}
{live_context}
=== KONIEC KONTEKSTU ===

PYTANIE MENEDŻERA: {user_query}"""

    ai_messages = [
        {"role": "system", "content": system_prompt}
    ]
    for msg in history[-6:]:
        ai_messages.append({"role": msg['role'], "content": msg['content']})
    ai_messages.append({"role": "user", "content": user_prompt})

    try:
        response = requests.post(
            "https://api.mistral.ai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "mistral-tiny",
                "messages": ai_messages,
                "response_format": {"type": "json_object"},
                "max_tokens": 4096
            },
            timeout=30
        )
        res_data = response.json()
        
        if 'choices' not in res_data:
            return {"error": f"Błąd odpowiedzi Mistral: {json.dumps(res_data)}"}
            
        raw_content = res_data['choices'][0]['message']['content'].strip()

        # Oczyszczanie z tagów markdown
        if raw_content.startswith("```"):
            lines = raw_content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            raw_content = "\n".join(lines).strip()

        # json_repair automatycznie naprawia: trailing commas, ucięte nawiasy,
        # brakujące cudzysłowy, i inne fochy modeli LLM
        try:
            result = json_repair.loads(raw_content)
            if isinstance(result, dict):
                return result
            else:
                return {"explanation": str(result), "highlights": [], "suggestions": []}
        except Exception:
            return {
                "explanation": "Wystąpił problem z wygenerowaniem taktyki. Spróbuj zadać pytanie inaczej.",
                "highlights": [],
                "suggestions": []
            }
    except Exception as e:
        return {"error": f"Błąd komunikacji z AI: {str(e)}"}

@app.put("/api/druzyny/update")
def aktualizuj_druzyne(team_data: dict):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Aktualizujemy drużynę w bazie
        cursor.execute("""
            UPDATE druzyny
            SET nazwa = %s, logo = %s, domyslna_formacja = %s,
                taktyka_druzyny = %s, formacje = %s, mentalnosc = %s,
                opcje_taktyczne = %s, role_zawodnikow = %s
            WHERE id = %s
            RETURNING *;
        """, (
            team_data.get("nazwa"),
            team_data.get("logo"),
            team_data.get("domyslna_formacja"),
            json.dumps(team_data.get("taktyka_druzyny")),
            json.dumps(team_data.get("formacje")),
            team_data.get("mentalnosc"),
            json.dumps(team_data.get("opcje_taktyczne")),
            json.dumps(team_data.get("role_zawodnikow")),
            team_data.get("id")
        ))

        updated_team = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success", "team": updated_team}

    except Exception as e:
        return {"Blad polaczenia": str(e)}


# ══════════════════════════════════════════════════════════════════
# ENDPOINTS SYMULACJI MECZU
# ══════════════════════════════════════════════════════════════════

@app.post("/api/simulate/start")
def simulate_start(data: dict):
    """
    Inicjuje nową sesję symulacji.
    Body: { session_id, homeTeam, awayTeam, restart? }
    Zwraca: initial live_stats payload
    """
    session_id  = data.get("session_id", "default")
    restart     = data.get("restart", False)

    # Jeśli sesja już istnieje i nie chcemy restartu, zwróć obecny stan
    if session_id in _SESSIONS and not restart:
        return {
            "ok": True,
            "session_id": session_id,
            "stats": _SESSIONS[session_id].get_live_stats(),
            "resumed": True
        }

    home_team   = data.get("homeTeam", {})
    away_team   = data.get("awayTeam", {})

    # Pobierz startującą jedenastkę (lub pierwsze 11)
    def get_starters(team: dict) -> list:
        zawodnicy = team.get("zawodnicy") or []
        starters  = [p for p in zawodnicy if p.get("isStarting")]
        if not starters:
            starters = zawodnicy[:11]
        return starters[:11]

    home_raw = get_starters(home_team)
    away_raw = get_starters(away_team)

    home_players = [_build_player(p, i) for i, p in enumerate(home_raw)]
    away_players = [_build_player(p, i) for i, p in enumerate(away_raw)]

    if not home_players:
        return {"error": "Brak zawodników gospodarza"}
    if not away_players:
        return {"error": "Brak zawodników gościa"}

    state = MatchState(
        home_players=home_players,
        away_players=away_players,
        home_tactics=_build_tactics(home_team),
        away_tactics=_build_tactics(away_team),
    )
    engine = MatchEngine(state)
    _SESSIONS[session_id] = engine

    return {
        "ok": True,
        "session_id": session_id,
        "stats": engine.get_live_stats(),
    }


@app.post("/api/simulate/tactics")
def simulate_update_tactics(data: dict):
    """
    Aktualizuje taktykę w locie podczas trwania meczu.
    Body: { session_id, homeTeam?, awayTeam? }
    """
    session_id = data.get("session_id", "default")
    engine = _SESSIONS.get(session_id)
    if not engine:
        return {"error": "Sesja nie istnieje"}

    if "homeTeam" in data:
        engine.state.home_tactics = _build_tactics(data["homeTeam"])
    if "awayTeam" in data:
        engine.state.away_tactics = _build_tactics(data["awayTeam"])

    return {"ok": True}


@app.post("/api/simulate/tick")
def simulate_tick(data: dict):
    """
    Przesuwa symulację o N ticków (domyślnie 10 = 1 minuta).
    Body: { session_id, ticks? }
    Zwraca: live_stats po wykonanych tickach + lista nowych zdarzeń
    """
    session_id = data.get("session_id", "default")
    ticks      = int(data.get("ticks", 10))   # 10 ticków = 1 minuta gry

    engine = _SESSIONS.get(session_id)
    if not engine:
        return {"error": "Sesja nie istnieje. Wywołaj /api/simulate/start najpierw."}

    if engine.state.is_finished:
        return {"ok": True, "finished": True, "stats": engine.get_live_stats()}

    new_events = []
    for _ in range(ticks):
        ev = engine.simulate_tick()
        if ev:
            new_events.append({
                "min":    ev.minute,
                "text":   ev.text,
                "type":   ev.event_type,
                "team":   ev.team,
                "player": ev.player_name,
                "xg":     ev.xg,
            })
        if engine.state.is_finished:
            break

    stats = engine.get_live_stats()
    return {
        "ok":         True,
        "finished":   engine.state.is_finished,
        "new_events": new_events,
        "stats":      stats,
    }


@app.post("/api/simulate/reset")
def simulate_reset(data: dict):
    """Usuwa sesję z pamięci."""
    session_id = data.get("session_id", "default")
    _SESSIONS.pop(session_id, None)
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════
# ZADANIE C: FASTAPI SSE STREAMING
# ══════════════════════════════════════════════════════════════════

async def _sse_event(data: dict) -> str:
    """
    Formatuje słownik jako Server-Sent Event.
    Każde zdarzenie to: data: <json>\n\n
    """
    payload = json.dumps(data, ensure_ascii=False)
    return f"data: {payload}\n\n"


@app.post("/api/simulate/stream")
async def simulate_stream(data: dict):
    """
    SSE Streaming endpoint – jeden tick co 0.5 sekundy czasu rzeczywistego.

    Body:
        {
          "session_id": "abc",
          "homeTeam":   { ...team_data... },
          "awayTeam":   { ...team_data... },
          "ticks_per_batch": 1        // opcjonalnie (domyślnie 1 tick / 0.5s)
        }

    Stream SSE emituje obiekty JSON:
        {
          "minute":      int,
          "tick":        int,
          "score_home":  int,
          "score_away":  int,
          "is_finished": bool,
          "stats":       { ...get_live_stats()... },
          "new_events":  [ { min, text, type, team, player, xg }, ... ],
          "commentary":  str | null   // ostatni komentarz dla UI
        }
    """
    session_id      = data.get("session_id", "default")
    ticks_per_batch = max(1, int(data.get("ticks_per_batch", 1)))

    # ── Inicjalizacja sesji (jeśli nie istnieje) ─────────────────────
    home_team = data.get("homeTeam", {})
    away_team = data.get("awayTeam", {})

    if session_id not in _SESSIONS or data.get("restart"):
        def get_starters(team: dict) -> list:
            zawodnicy = team.get("zawodnicy") or []
            starters  = [p for p in zawodnicy if p.get("isStarting")]
            if not starters:
                starters = zawodnicy[:11]
            return starters[:11]

        home_raw = get_starters(home_team)
        away_raw = get_starters(away_team)
        home_players = [_build_player(p, i) for i, p in enumerate(home_raw)]
        away_players = [_build_player(p, i) for i, p in enumerate(away_raw)]

        if not home_players or not away_players:
            async def error_stream():
                yield await _sse_event({"error": "Brak zawodników"})
            return StreamingResponse(error_stream(), media_type="text/event-stream")

        state = MatchState(
            home_players=home_players,
            away_players=away_players,
            home_tactics=_build_tactics(home_team),
            away_tactics=_build_tactics(away_team),
        )
        engine = MatchEngine(state)
        _SESSIONS[session_id] = engine
    else:
        engine = _SESSIONS[session_id]

    # ── Generator ticków (async generator → StreamingResponse) ──────
    async def event_generator():
        try:
            while not engine.state.is_finished:
                new_events: list[dict] = []

                # Przetwórz batch ticków
                for _ in range(ticks_per_batch):
                    ev = engine.simulate_tick()
                    if ev:
                        new_events.append({
                            "min":    ev.minute,
                            "text":   ev.text,
                            "type":   ev.event_type,
                            "team":   ev.team,
                            "player": ev.player_name,
                            "xg":     ev.xg,
                        })
                    if engine.state.is_finished:
                        break

                # Komentarz – ostatni wpis z new_events lub None
                commentary: Optional[str] = None
                if new_events:
                    last = new_events[-1]
                    commentary = last["text"]  # tekst już wygenerowany przez silnik

                payload = {
                    "minute":      engine.state.current_minute,
                    "tick":        engine.state.current_tick,
                    "score_home":  engine.state.score_home,
                    "score_away":  engine.state.score_away,
                    "is_finished": engine.state.is_finished,
                    "stats":       engine.get_live_stats(),
                    "new_events":  new_events,
                    "commentary":  commentary,
                }

                yield await _sse_event(payload)

                # 0.5 sekundy = 1 tick gry (6s)
                await asyncio.sleep(0.5)

            # Końcowy pakiet po zakończeniu meczu
            final_commentary = _commentary_gen.generate(
                "full_time",
                score_home=engine.state.score_home,
                score_away=engine.state.score_away,
            )
            final_payload = {
                "minute":      engine.state.current_minute,
                "tick":        engine.state.current_tick,
                "score_home":  engine.state.score_home,
                "score_away":  engine.state.score_away,
                "is_finished": True,
                "stats":       engine.get_live_stats(),
                "new_events":  [],
                "commentary":  final_commentary,
            }
            yield await _sse_event(final_payload)

        except asyncio.CancelledError:
            # Klient rozłączył się – sprzątamy sesję
            _SESSIONS.pop(session_id, None)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "Connection":        "keep-alive",
            "X-Accel-Buffering": "no",   # ważne dla nginx / reverse proxy
        },
    )


@app.get("/api/simulate/stream/{session_id}")
async def simulate_stream_get(session_id: str, request: Request):
    """
    GET-based SSE stream dla istniejącej sesji (np. EventSource z frontendu React).
    Sesja musi być wcześniej zainicjowana przez POST /api/simulate/start.

    Front-end:
        const es = new EventSource(`/api/simulate/stream/${sessionId}`);
        es.onmessage = (e) => { const d = JSON.parse(e.data); ... };
    """
    engine = _SESSIONS.get(session_id)
    if not engine:
        async def not_found():
            yield await _sse_event({"error": "Sesja nie istnieje. Wywołaj /api/simulate/start."})
        return StreamingResponse(not_found(), media_type="text/event-stream")

    async def event_generator():
        try:
            while not engine.state.is_finished:
                # Sprawdź czy klient nadal połączony
                if await request.is_disconnected():
                    break

                new_events: list[dict] = []
                ev = engine.simulate_tick()
                if ev:
                    new_events.append({
                        "min":    ev.minute,
                        "text":   ev.text,
                        "type":   ev.event_type,
                        "team":   ev.team,
                        "player": ev.player_name,
                        "xg":     ev.xg,
                    })

                commentary = new_events[-1]["text"] if new_events else None

                payload = {
                    "minute":      engine.state.current_minute,
                    "tick":        engine.state.current_tick,
                    "score_home":  engine.state.score_home,
                    "score_away":  engine.state.score_away,
                    "is_finished": engine.state.is_finished,
                    "stats":       engine.get_live_stats(),
                    "new_events":  new_events,
                    "commentary":  commentary,
                }
                yield await _sse_event(payload)
                await asyncio.sleep(0.5)

            # Zakończenie meczu
            final_commentary = _commentary_gen.generate(
                "full_time",
                score_home=engine.state.score_home,
                score_away=engine.state.score_away,
            )
            yield await _sse_event({
                "minute":      engine.state.current_minute,
                "score_home":  engine.state.score_home,
                "score_away":  engine.state.score_away,
                "is_finished": True,
                "stats":       engine.get_live_stats(),
                "new_events":  [],
                "commentary":  final_commentary,
            })
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "Connection":        "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )