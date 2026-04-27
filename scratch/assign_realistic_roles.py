import psycopg2
import json

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def assign_realistic_roles():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Pobieranie zawodników...")
    cur.execute("SELECT id, imie_nazwisko, pozycja_glowna FROM zawodnicy")
    players = cur.fetchall()

    # Mapa znanych zawodników i ich realistycznych ról
    # (Tylko z listy dostarczonej przez użytkownika!)
    REALISTIC_MAP = {
        # Bramkarze
        "Ederson": {"przy": "Bramkarz grający piłką", "bez": "Bramkarz-libero"},
        "Alisson": {"przy": "Bramkarz grający piłką", "bez": "Bramkarz"},
        "Manuel Neuer": {"przy": "Bramkarz grający piłką", "bez": "Bramkarz-libero"},
        "Thibaut Courtois": {"przy": "Bramkarz", "bez": "Bramkarz grający na linii"},
        "Wojciech Szczęsny": {"przy": "Bramkarz", "bez": "Bramkarz grający na linii"},
        
        # Obrońcy
        "Ruben Dias": {"przy": "Środkowy Obrońca", "bez": "Blokujący Środkowy Obrońca"},
        "John Stones": {"przy": "Grający Piłką Środkowy Obrońca", "bez": "Asekurujący Środkowy Obrońca"},
        "Kyle Walker": {"przy": "Boczny obrońca", "bez": "Pressujący boczny obrońca"},
        "Trent Alexander-Arnold": {"przy": "Rozgrywający wysunięty boczny obrońca", "bez": "Boczny obrońca"},
        "Alphonso Davies": {"przy": "Wysunięty boczny obrońca", "bez": "Pressujący boczny wysunięty obrońca"},
        "Theo Hernandez": {"przy": "Zaawansowany boczny wysunięty obrońca", "bez": "Wysunięty boczny obrońca"},
        
        # Pomocnicy
        "Rodri": {"przy": "Łącznik defensywy", "bez": "Kryjący defensywny pomocnik"},
        "Kevin De Bruyne": {"przy": "Wysunięty rozgrywający", "bez": "Ofensywny pomocnik"},
        "Luka Modric": {"przy": "Rozgrywający pomocnik", "bez": "Rozgrywający pomocnik"},
        "Jude Bellingham": {"przy": "Wychodzący pomocnik", "bez": "Wychodzący pomocnik"},
        "Pedri": {"przy": "Rozgrywający pomocnik", "bez": "Rozgrywający pomocnik"},
        "Declan Rice": {"przy": "Pomocnik długodystansowiec", "bez": "Pressujący defensywny pomocnik"},
        
        # Skrzydłowi
        "Vinicius Junior": {"przy": "Skrzydłowy", "bez": "Skrzydłowy"},
        "Mohamed Salah": {"przy": "Schodzący napastnik", "bez": "Skrzydłowy"},
        "Bukayo Saka": {"przy": "Skrzydłowy", "bez": "Śledzący skrzydłowy"},
        "Lamine Yamal": {"przy": "Rozgrywający skrzydłowy", "bez": "Skrzydłowy"},
        "Rafael Leao": {"przy": "Boczny napastnik", "bez": "Skrzydłowy"},
        
        # Napastnicy
        "Erling Haaland": {"przy": "Lis pola karnego", "bez": "Środkowy napastnik"},
        "Harry Kane": {"przy": "Odgrywający", "bez": "Śledzący środkowy napastnik"},
        "Robert Lewandowski": {"przy": "Środkowy napastnik", "bez": "Środkowy napastnik"},
        "Kylian Mbappe": {"przy": "Wychodzący napastnik", "bez": "Podwieszony przyjmujący środkowy napastnik"},
        "Lautaro Martinez": {"przy": "Cofnięty napastnik", "bez": "Śledzący środkowy napastnik"},
    }

    # Generyczna mapa dla reszty
    GENERIC_DEFAULTS = {
        "BR": {"przy": "Bramkarz", "bez": "Bramkarz"},
        "ŚO": {"przy": "Środkowy Obrońca", "bez": "Środkowy Obrońca"},
        "ŚO4": {"przy": "Środkowy Obrońca", "bez": "Środkowy Obrońca"},
        "ŚO3": {"przy": "Tradycyjny Środkowy Obrońca", "bez": "Środkowy Obrońca"},
        "LO": {"przy": "Boczny obrońca", "bez": "Boczny obrońca"},
        "PO": {"przy": "Boczny obrońca", "bez": "Boczny obrońca"},
        "CLL": {"przy": "Wysunięty boczny obrońca", "bez": "Wysunięty boczny obrońca"},
        "CLP": {"przy": "Wysunięty boczny obrońca", "bez": "Wysunięty boczny obrońca"},
        "DP": {"przy": "Defensywny pomocnik", "bez": "Defensywny pomocnik"},
        "ŚP": {"przy": "Środkowy pomocnik", "bez": "Środkowy pomocnik"},
        "OP": {"przy": "Ofensywny pomocnik", "bez": "Ofensywny pomocnik"},
        "LP": {"przy": "Skrzydłowy", "bez": "Boczny pomocnik"},
        "PP": {"przy": "Skrzydłowy", "bez": "Boczny pomocnik"},
        "LS": {"przy": "Skrzydłowy", "bez": "Skrzydłowy"},
        "PS": {"przy": "Skrzydłowy", "bez": "Skrzydłowy"},
        "N": {"przy": "Środkowy napastnik", "bez": "Środkowy napastnik"},
    }

    print("Analiza i przypisywanie ról...")
    for pid, name, pos in players:
        # 1. Szukaj w mapie znanych zawodników (po części nazwiska)
        selected = None
        for key, roles in REALISTIC_MAP.items():
            if key.lower() in name.lower():
                selected = roles
                break
        
        # 2. Jeśli nie znaleziono, bierz generyczny domyślny dla pozycji
        if not selected:
            pos_key = pos.rstrip('0123456789')
            if pos in GENERIC_DEFAULTS:
                selected = GENERIC_DEFAULTS[pos]
            elif pos_key in GENERIC_DEFAULTS:
                selected = GENERIC_DEFAULTS[pos_key]
            else:
                selected = {"przy": "Brak", "bez": "Brak"}

        # 3. Zapisz jako JSON
        wybrane_role = {
            "przy_pilce": selected["przy"],
            "bez_pilki": selected["bez"]
        }
        
        cur.execute("UPDATE zawodnicy SET wybrane_role = %s WHERE id = %s", (json.dumps(wybrane_role), pid))

    conn.commit()
    cur.close()
    conn.close()
    print("Gotowe! Przypisano realistyczne role domyślne.")

if __name__ == "__main__":
    assign_realistic_roles()
