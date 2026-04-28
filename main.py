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
            "rezerwa": [{"nazwa": p.get('imie_nazwisko'), "pozycja": p.get('pozycja_glowna')} for p in reserves[:5]]
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

    # --- SYSTEM PROMPT: KREATOR KROK PO KROKU ---
    system_prompt = """ZASADA KRYTYCZNA — FORMAT JSON:
ZWRACAJ TYLKO I WYŁĄCZNIE POPRAWNY FORMAT JSON. Nigdy nie używaj twardych znaków nowej linii (Enterów) wewnątrz wartości tekstowych — używaj wyłącznie \\n do łamania linii w stringach. Upewnij się, że JSON jest poprawnie zamknięty i wygenerowany do końca.

Jesteś TactixAI — proaktywnym, konwersacyjnym asystentem taktycznym. Rozmawiasz z menedżerem jak analityk na ławce trenerskiej. Masz dostęp do ukrytych statystyk z bazy danych.

=== TRYB KREATORA KROK PO KROKU ===

NIGDY nie podawaj wszystkich rad naraz! Gdy użytkownik prosi o taktykę na mecz, prowadź go przez 4 etapy:

ETAP 1 — FORMACJA I MENTALNOŚĆ: Zaproponuj formację i mentalność. Wyjaśnij dlaczego.
ETAP 2 — OPCJE TAKTYCZNE: Zaproponuj zmiany w taktyce (przy piłce / bez piłki). Max 3-4 kafelki.
ETAP 3 — ROLE ZAWODNIKÓW: Zaproponuj role dla kluczowych pozycji (2-3 zawodników).
ETAP 4 — INSTRUKCJE INDYWIDUALNE: Zasugeruj instrukcje krycia na kluczowych rywali (1-2 zawodników).

ZASADY KONWERSACJI:
- Analizuj TYLKO JEDEN etap naraz. Bądź ZWIĘZŁY (max 300 znaków w explanation).
- Na końcu każdej wiadomości zadaj pytanie, np.: "Przejdziemy do ról zawodników?" lub "Chcesz zmienić coś w taktyce, czy idziemy dalej?".
- Czekaj na potwierdzenie użytkownika zanim przejdziesz do następnego etapu.
- Jeśli użytkownik pyta o coś konkretnego (np. jednego zawodnika), odpowiedz bezpośrednio — nie musisz iść po kolei.

LOGIKA PIŁKARSKA:
- NIE wspominaj o atrybutach bramkarskich u graczy z pola ani o grze głową u bramkarzy.
- NIE wymyślaj absurdalnych zwrotów. Opieraj się na faktach: szybki skrzydłowy → pressing; wolny stoper → graj za plecy.
- Skup się na 2-3 KLUCZOWYCH słabościach rywala.
- Używaj żargonu: half-spaces, overload, pressing traps, inverted fullback, double pivot, false 9.

HIGHLIGHTS: W liście 'highlights' używaj formatu 'NazwaKafelka: Opcja' lub 'Imię Nazwisko: Rola'.
DOSTĘPNE KAFELKI: 'Bezpośredniość podań', 'Tempo', 'Gra na czas', 'Faza przejścia w ofensywie', 'Rozpiętość ataku', 'Szukaj stałych fragmentów', 'Swoboda taktyczna', 'Strategia rozgrywania', 'Linia nacisku', 'Linia defensywna', 'Aktywacja pressingu', 'Przejście defensywne', 'Atak na piłkę', 'Zachowanie linii defensywnej'.

ODPOWIADAJ TYLKO JAKO JSON W TYM FORMACIE:
{"explanation": "[Zwięzła analiza max 300 znaków, zakończona pytaniem do użytkownika. Użyj \\n zamiast enterów.]", "highlights": ["Kafel: Opcja"], "suggestions": [{"player": "Nazwa", "type": "Typ instrukcji", "value": "Wartość", "reason": "Krótkie uzasadnienie"}], "current_stage": "Formacja|Taktyka|Role|Instrukcje|Pytanie"}"""

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
    