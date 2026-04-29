from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import json
import re
import requests
import json_repair

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
"Szefie, raport o rywalu [Nazwa_Rywala] jest gotowy. Zauważyłem, że ich [Słabość, np. wolni stoperzy / dziury w środku] to nasza szansa. Zaczynamy odprawę? Na początek ustalmy Formację i Mentalność, czy masz już swój pomysł?"

=== TRYB KREATORA KROK PO KROKU ===
NIGDY nie podawaj wszystkich rad naraz. Prowadź menedżera:
ETAP 1: Formacja i Mentalność -> ETAP 2: Taktyka Zespołowa -> ETAP 3: Skład i Role -> ETAP 4: Instrukcje na rywala.

SZCZEGÓŁY ETAPÓW:
ETAP 3 — SKŁAD I ROLE: Zanim ustalisz role, sprawdź ławkę rezerwowych (pole 'rezerwa' w kontekście danych). Jeśli rezerwowy ma atrybuty drastycznie lepiej pasujące do słabości rywala niż gracz z pierwszego składu (np. rywal ma wolnych stoperów, a na ławce siedzi szybszy napastnik), zaproponuj zmianę w składzie jako pierwszą sugestię. Dopiero potem przejdź do ról.

ZASADY KONWERSACJI:
- ABSOLUTNY ZAKAZ łączenia etapów. Jeśli jesteś w Etapie 1 (Formacja/Mentalność), NIE WOLNO Ci proponować zmian zawodników ani ról. Zmiany w składzie proponuj TYLKO i WYŁĄCZNIE w Etapie 3.
- Analizuj TYLKO JEDEN etap naraz. 
- Jeśli użytkownik dopytuje (np. "czyli co ustawić?"), odpowiedz JEDNYM krótkim zdaniem i daj sugestię do tablicy suggestions. NIE POWTARZAJ wtedy całej analizy rywala.
- Na końcu każdej wiadomości zadaj pytanie o przejście do kolejnego etapu.
- REAKCJA NA AKCEPTACJĘ: Jeśli użytkownik napisze "Gotowe", "Zastosowano", "Co dalej?", "Następny etap" lub potwierdzi wdrożenie Twojej sugestii (np. "Zastosowano sugestię: X"), MUSISZ natychmiast przejść do analizy KOLEJNEGO etapu kreatora. Sprawdź historię czatu, który etap był ostatni, i zaproponuj następny (np. po Formacji/Mentalności → przejdź do Taktyki Zespołowej; po Taktyce → do Ról; po Rolach → do Instrukcji). Nie wracaj do poprzednich tematów. Wygeneruj świeżą analizę i nowe suggestions.

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

=== KAFELKI TAKTYCZNE (Używaj tych nazw w suggestions.value): ===
'Bezpośredniość podań', 'Tempo', 'Gra na czas', 'Faza przejścia w ofensywie', 'Rozpiętość ataku', 'Szukaj stałych fragmentów', 'Swoboda taktyczna', 'Strategia rozgrywania', 'Linia nacisku', 'Linia defensywna', 'Aktywacja pressingu', 'Przejście defensywne', 'Atak na piłkę'.

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
    