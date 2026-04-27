import psycopg2
import json
import re

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def hard_reset_all_players():
    # Definicja ról - DOKŁADNIE tak jak podał użytkownik
    roles_map = {
        "BR": {
            "przy": ["Bramkarz grający piłką", "Bramkarz", "Tradycyjny bramkarz"],
            "bez": ["Bramkarz", "Bramkarz grający na linii", "Bramkarz-libero"]
        },
        "ŚO4": {
            "przy": ["Środkowy Obrońca", "Zaawansowany Środkowy Obrońca", "Grający Piłką Środkowy Obrońca", "Tradycyjny Środkowy Obrońca"],
            "bez": ["Środkowy Obrońca", "Blokujący Środkowy Obrońca", "Asekurujący Środkowy Obrońca"]
        },
        "ŚO3": {
            "przy": ["Grający Piłką Środkowy Obrońca", "Tradycyjny Środkowy Obrońca", "Boczny Środkowy Obrońca", "Obiegający Środkowy Obrońca"],
            "bez": ["Środkowy Obrońca", "Blokujący Środkowy Obrońca", "Asekurujący Środkowy Obrońca", "Boczny Środkowy Obrońca", "Blokujący Boczny Środkowy Obrońca"]
        },
        "LO": {
            "przy": ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Odwrócony boczny obrońca", "Boczny obrońca", "Wysunięty boczny obrońca"],
            "bez": ["Boczny obrońca", "Cofnięty boczny obrońca", "Pressujący boczny obrońca"]
        },
        "PO": {
            "przy": ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Odwrócony boczny obrońca", "Boczny obrońca", "Wysunięty boczny obrońca"],
            "bez": ["Boczny obrońca", "Cofnięty boczny obrońca", "Pressujący boczny obrońca"]
        },
        "CLL": {
            "przy": ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca", "Wysunięty boczny obrońca"],
            "bez": ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca"]
        },
        "CLP": {
            "przy": ["Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca", "Wysunięty boczny obrońca"],
            "bez": ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca"]
        },
        "DP": {
            "przy": ["Łącznik defensywy", "Defensywny pomocnik", "Pomocnik długodystansowiec", "Cofnięty rozgrywający", "Swobodny rozgrywający"],
            "bez": ["Cofający się defensywny pomocnik", "Defensywny pomocnik", "Pressujący defensywny pomocnik", "Kryjący defensywny pomocnik", "Szeroko kryjący defensywny pomocnik"]
        },
        "ŚP": {
            "przy": ["Rozgrywający pomocnik", "Wysunięty rozgrywający", "Boczny środkowy pomocnik", "Środkowy pomocnik", "Wychodzący pomocnik"],
            "bez": ["Rozgrywający pomocnik", "Wysunięty rozgrywający", "Boczny środkowy pomocnik", "Środkowy pomocnik", "Wychodzący pomocnik"]
        },
        "OP": {
            "przy": ["Wychodzący pomocnik", "Ofensywny pomocnik", "Wysunięty rozgrywający", "Wolna rola", "Fałszywy napastnik"],
            "bez": ["Ofensywny pomocnik", "Śledzący ofensywny pomocnik", "Podwieszony przyjmujący ofensywny pomocnik", "Centralny przyjmujący ofensywny pomocnik"]
        },
        "LP": {
            "przy": ["Odwrócony skrzydłowy", "Rozgrywający skrzydłowy", "Skrzydłowy", "Boczny pomocnik"],
            "bez": ["Boczny pomocnik", "Śledzący boczny pomocnik", "Boczny przyjmujący pomocnik"]
        },
        "PP": {
            "przy": ["Odwrócony skrzydłowy", "Rozgrywający skrzydłowy", "Skrzydłowy", "Boczny pomocnik"],
            "bez": ["Boczny pomocnik", "Śledzący boczny pomocnik", "Boczny przyjmujący pomocnik"]
        },
        "LS": {
            "przy": ["Rozgrywający skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Skrzydłowy", "Boczny napastnik"],
            "bez": ["Skrzydłowy", "Śledzący skrzydłowy", "Boczny przyjmujący skrzydłowy", "Odwrócony przyjmujący skrzydłowy"]
        },
        "PS": {
            "przy": ["Rozgrywający skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Skrzydłowy", "Boczny napastnik"],
            "bez": ["Skrzydłowy", "Śledzący skrzydłowy", "Boczny przyjmujący skrzydłowy", "Odwrócony przyjmujący skrzydłowy"]
        },
        "N": {
            "przy": ["Odgrywający", "Środkowy napastnik", "Wychodzący napastnik", "Lis pola karnego", "Cofnięty napastnik"],
            "bez": ["Środkowy napastnik", "Śledzący środkowy napastnik", "Podwieszony przyjmujący środkowy napastnik", "Centralny przyjmujący środkowy napastnik"]
        }
    }

    # Mapa znanych zawodników dla domyślnych wyborów
    FAMOUS_PLAYERS = {
        "Haaland": ("Lis pola karnego", "Środkowy napastnik"),
        "Ederson": ("Bramkarz grający piłką", "Bramkarz-libero"),
        "De Bruyne": ("Wysunięty rozgrywający", "Ofensywny pomocnik"),
        "Rodri": ("Łącznik defensywy", "Kryjący defensywny pomocnik"),
        "Vinicius": ("Skrzydłowy", "Skrzydłowy"),
        "Mbappe": ("Wychodzący napastnik", "Podwieszony przyjmujący środkowy napastnik"),
        "Kane": ("Odgrywający", "Śledzący środkowy napastnik"),
        "Lewandowski": ("Środkowy napastnik", "Środkowy napastnik"),
        "Bellingham": ("Wychodzący pomocnik", "Wychodzący pomocnik"),
        "Salah": ("Schodzący napastnik", "Skrzydłowy"),
    }

    print("Łączenie z bazą danych...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Pobieranie wszystkich zawodników...")
    cur.execute("SELECT id, imie_nazwisko, pozycja_glowna FROM zawodnicy")
    players = cur.fetchall()

    print(f"Aktualizacja {len(players)} zawodników...")
    for pid, name, pos in players:
        # 1. Znajdź zestaw ról (przydatność)
        target_roles = None
        
        # Super-odporne dopasowanie pozycji
        clean_pos = re.sub(r'[0-9]', '', pos)
        if pos in roles_map: target_roles = roles_map[pos]
        elif clean_pos in roles_map: target_roles = roles_map[clean_pos]
        elif "ŚO" in pos: target_roles = roles_map["ŚO4"]
        elif "BR" in pos: target_roles = roles_map["BR"]
        elif "P" in pos and "DP" not in pos: target_roles = roles_map["ŚP"]
        elif "N" in pos: target_roles = roles_map["N"]
        else: target_roles = roles_map["DP"] # Ostateczny fallback

        # 2. Wybierz domyślną rolę (wybrane_role)
        default_przy = target_roles["przy"][0]
        default_bez = target_roles["bez"][0]
        
        for famous_name, fav_roles in FAMOUS_PLAYERS.items():
            if famous_name.lower() in name.lower():
                # Sprawdź czy rola pasuje do pozycji
                if fav_roles[0] in target_roles["przy"]: default_przy = fav_roles[0]
                if fav_roles[1] in target_roles["bez"]: default_bez = fav_roles[1]
                break

        wybrane_role = {"przy_pilce": default_przy, "bez_pilki": default_bez}

        cur.execute("""
            UPDATE zawodnicy 
            SET przydatnosc_przy_pilce = %s, 
                przydatnosc_bez_pilki = %s,
                wybrane_role = %s
            WHERE id = %s
        """, (json.dumps(target_roles["przy"]), json.dumps(target_roles["bez"]), json.dumps(wybrane_role), pid))

    conn.commit()
    cur.close()
    conn.close()
    print("GOTOWE! Wszyscy zawodnicy w bazie mają teraz poprawnie przypisane role.")

if __name__ == "__main__":
    hard_reset_all_players()
