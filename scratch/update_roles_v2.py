import psycopg2
import json

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# Even MORE comprehensive role definitions based on screenshots
ROLE_DATA = {
    "BR": {
        "przy": "Bramkarz, Bramkarz libero (Atak), Rozgrywajacy bramkarz",
        "bez": "Bramkarz (Obrona), Bramkarz libero (Wsparcie), Blokujacy bramkarz"
    },
    "ŚO": {
        "przy": "Grajacy Pilka Srodkowy Obrona, Zaawansowany Srodkowy Obrona, Libero (Atak), Obiegajacy Srodkowy Obrona",
        "bez": "Srodkowy Obrona, Blokujacy Srodkowy Obrona, Asekurujacy Srodkowy Obrona, Tradycyjny Srodkowy Obrona, Boczny Srodkowy Obrona, Blokujacy Boczny Srodkowy Obrona"
    },
    "LO": {
        "przy": "Wysuniety boczny obronca (Atak), Odwrócony boczny obronca, Kompletny boczny obronca, Falszywy boczny obronca",
        "bez": "Boczny obronca, Wysuniety boczny obronca (Obrona), Blokujacy boczny obronca"
    },
    "PO": {
        "przy": "Wysuniety boczny obronca (Atak), Odwrócony boczny obronca, Kompletny boczny obronca, Falszywy boczny obronca",
        "bez": "Boczny obronca, Wysuniety boczny obronca (Obrona), Blokujacy boczny obronca"
    },
    "DP": {
        "przy": "Cofniety rozgrywajacy, Regista, Wedrowny rozgrywajacy, Rozgrywajacy DP, Kotwica",
        "bez": "Rygiel defensywny, Defensywny pomocnik, Sredni obronca, Niszczyciel, Defensywny pomocnik (Obrona)"
    },
    "ŚP": {
        "przy": "Rozgrywajacy pomocnik, Wysuniety rozgrywajacy, Boczny srodkowy pomocnik, Srodkowy pomocnik, Wychodzacy pomocnik, Mezzala, Carrilero, Falszywa osemka",
        "bez": "Pomocnik odbierajacy pilke, Srodkowy pomocnik (Obrona), Defensywny pomocnik (Wsparcie), Śledzący pomocnik"
    },
    "OP": {
        "przy": "Wychodzacy pomocnik, Ofensywny pomocnik, Wysuniety rozgrywajacy, Wolna rola, Falszywy napastnik, Klasyczna dziesiatka, Enganche, Trequartista",
        "bez": "Ofensywny pomocnik (Wsparcie), Śledzący ofensywny pomocnik, Podwieszony przyjmujący ofensywny, Centralny przyjmujący ofensywny, Cien napastnika (Pressing)"
    },
    "LS": {
        "przy": "Skrzydlowy, Schodzacy napastnik, Odwrócony skrzydlowy, Rozgrywajacy skrzydlowy, Boczny napastnik, Boczny przyjmujący skrzydłowy, Odwrócony przyjmujący skrzydłowy",
        "bez": "Skrzydlowy (Wsparcie), Śledzący skrzydłowy, Defensywny skrzydlowy, Powracajacy skrzydlowy"
    },
    "PS": {
        "przy": "Skrzydlowy, Schodzacy napastnik, Odwrócony skrzydlowy, Rozgrywajacy skrzydlowy, Boczny napastnik, Boczny przyjmujący skrzydłowy, Odwrócony przyjmujący skrzydłowy",
        "bez": "Skrzydlowy (Wsparcie), Śledzący skrzydłowy, Defensywny skrzydlowy, Powracajacy skrzydlowy"
    },
    "N": {
        "przy": "Falszywa dziewiatka, Kompletny napastnik, Cofniety napastnik, Trequartista, Dynamiczny napastnik",
        "bez": "Srodkowy napastnik, Odgrywajacy, Lis pola karnego, Pracowity napastnik, Pressujacy napastnik"
    }
}

def normalize_pos(pos):
    if not pos: return ""
    import re
    # Handle Polish chars in position codes if any
    res = re.sub(r'[0-9]', '', pos)
    return res

def update_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, imie_nazwisko, pozycja_glowna FROM zawodnicy;")
    players = cursor.fetchall()
    
    for pid, name, pos in players:
        norm_pos = normalize_pos(pos)
        if norm_pos in ROLE_DATA:
            roles = ROLE_DATA[norm_pos]
            cursor.execute("""
                UPDATE zawodnicy 
                SET przydatnosc_przy_pilce = %s, 
                    przydatnosc_bez_pilki = %s 
                WHERE id = %s
            """, (roles['przy'], roles['bez'], pid))
            
    conn.commit()
    print("Database updated with expanded roles!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    update_db()
