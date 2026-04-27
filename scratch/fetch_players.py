import psycopg2

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def fetch_players():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT id, imie_nazwisko, pozycja_glowna FROM zawodnicy;")
    players = cursor.fetchall()
    for p in players:
        print(f"ID: {p[0]}, Name: {p[1]}, Pos: {p[2]}")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    fetch_players()
