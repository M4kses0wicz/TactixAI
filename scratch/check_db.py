import psycopg2

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def check_db():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute("SELECT id, imie_nazwisko, przydatnosc_przy_pilce FROM zawodnicy WHERE przydatnosc_przy_pilce LIKE '%%środkowy%%' OR przydatnosc_przy_pilce LIKE '%%Środkowy%%' LIMIT 5;")
    rows = cursor.fetchall()
    for r in rows:
        print(f"ID: {r[0]}, Name: {r[1]}, Roles: {r[2]}")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_db()
