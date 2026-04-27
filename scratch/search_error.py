import psycopg2

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def search_error():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT id, imie_nazwisko, przydatnosc_przy_pilce FROM zawodnicy WHERE przydatnosc_przy_pilce LIKE '%Śś%' OR przydatnosc_bez_pilki LIKE '%Śś%';")
    rows = cursor.fetchall()
    if not rows:
        print("No players found with 'Śś' typo in DB.")
    else:
        for r in rows:
            print(f"Error found in: {r[1]} (ID: {r[0]})")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    search_error()
