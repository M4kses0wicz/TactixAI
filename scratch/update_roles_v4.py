import psycopg2
import json

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def update_roles():
    # Definicje ról dla wszystkich pozycji
    roles_map = {
        "BR": {
            "przy": ["Bramkarz", "Bramkarz-libero"],
            "bez": ["Obrona", "Wsparcie"]
        },
        "ŚO": {
            "przy": ["Środkowy obrońca", "Grający piłką obrońca", "Libero", "Czysty obrońca"],
            "bez": ["Obrona", "Zabezpieczenie", "Stoper"]
        },
        "PO": {
            "przy": ["Boczny obrońca", "Wysunięty boczny obrońca", "Kompletny boczny obrońca", "Odwrócony boczny obrońca", "Ograniczony boczny obrońca"],
            "bez": ["Obrona", "Wsparcie", "Atak"]
        },
        "LO": {
            "przy": ["Boczny obrońca", "Wysunięty boczny obrońca", "Kompletny boczny obrońca", "Odwrócony boczny obrońca", "Ograniczony boczny obrońca"],
            "bez": ["Obrona", "Wsparcie", "Atak"]
        },
        "DP": {
            "przy": ["Rygiel defensywny", "Defensywny pomocnik", "Cofnięty rozgrywający", "Łącznik defensywny", "Odgrywający", "Wędrujący rozgrywający", "Regista", "Półskrzydłowy"],
            "bez": ["Zabezpieczenie", "Wsparcie", "Obrona"]
        },
        "ŚP": {
            "przy": ["Pomocnik odbierający piłkę", "Cofnięty rozgrywający", "Środkowy pomocnik", "Wysunięty rozgrywający", "Długodystansowiec (Box-to-Box)", "Wędrujący rozgrywający", "Półskrzydłowy"],
            "bez": ["Wsparcie", "Obrona", "Atak"]
        },
        "OP": {
            "przy": ["Wysunięty rozgrywający", "Ofensywny pomocnik", "Klasyczna dziesiątka", "Cień napastnika", "Enganche", "Półskrzydłowy"],
            "bez": ["Wsparcie", "Atak"]
        },
        "N": {
            "przy": ["Wysunięty napastnik", "Lis pola karnego", "Kompletny napastnik", "Odgrywający", "Cofnięty napastnik", "Fałszywa dziewiątka", "Pressujący napastnik"],
            "bez": ["Atak", "Wsparcie"]
        },
        "CLL": {
            "przy": ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca", "Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca"],
            "bez": ["Wsparcie", "Atak", "Obrona"]
        },
        "CLP": {
            "przy": ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca", "Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca"],
            "bez": ["Wsparcie", "Atak", "Obrona"]
        },
        "WING": {
            "przy": ["Skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Wysunięty rozgrywający", "Raumdeuter", "Wsparcia bocznego"],
            "bez": ["Wsparcie", "Atak"]
        }
    }

    print("Łączenie z bazą danych...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Pobieranie wszystkich zawodników...")
    cur.execute("SELECT id, pozycja_glowna FROM zawodnicy")
    players = cur.fetchall()

    for pid, pos in players:
        # Normalize pos
        pos_key = pos.rstrip('0123456789')
        if pos_key in ["LS", "PS", "LP", "PP"]:
            role_data = roles_map["WING"]
        elif pos_key in roles_map:
            role_data = roles_map[pos_key]
        else:
            continue

        params = [json.dumps(role_data["przy"]), json.dumps(role_data["bez"]), pid]
        cur.execute("UPDATE zawodnicy SET przydatnosc_przy_pilce = %s, przydatnosc_bez_pilki = %s WHERE id = %s", params)

    conn.commit()
    cur.close()
    conn.close()
    print("Gotowe! Wszystkie role dla wszystkich pozycji zostały zaktualizowane do formatu JSON.")

if __name__ == "__main__":
    update_roles()
