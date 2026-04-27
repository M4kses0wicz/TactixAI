import psycopg2

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def alter_table():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Altering columns to TEXT...")
    cursor.execute("ALTER TABLE zawodnicy ALTER COLUMN przydatnosc_przy_pilce TYPE TEXT;")
    cursor.execute("ALTER TABLE zawodnicy ALTER COLUMN przydatnosc_bez_pilki TYPE TEXT;")
    
    conn.commit()
    print("Columns altered successfully!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    alter_table()
