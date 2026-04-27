import psycopg2
import json

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def update_roles():
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

    print("Łączenie z bazą danych...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Hard Reset ról dla wszystkich zawodników...")
    cur.execute("SELECT id, pozycja_glowna FROM zawodnicy")
    players = cur.fetchall()

    for pid, pos in players:
        # Normalizacja dla dopasowania
        pos_key = pos.rstrip('0123456789')
        
        target_role = None
        if pos in roles_map:
            target_role = roles_map[pos]
        elif pos_key in roles_map:
            target_role = roles_map[pos_key]
        elif "ŚO" in pos:
            target_role = roles_map["ŚO4"]
        else:
            # Domyślnie bierzemy DP jeśli nie pasuje (mało prawdopodobne)
            target_role = roles_map["DP"]

        cur.execute("""
            UPDATE zawodnicy 
            SET przydatnosc_przy_pilce = %s, 
                przydatnosc_bez_pilki = %s 
            WHERE id = %s
        """, (json.dumps(target_role["przy"]), json.dumps(target_role["bez"]), pid))

    conn.commit()
    cur.close()
    conn.close()
    print("GOTOWE! Baza danych została całkowicie nadpisana nowymi rolami.")

if __name__ == "__main__":
    update_roles()
