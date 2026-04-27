import psycopg2

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def fix_typos():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Fixing typos in database...")
    # Fix Śśrodkowy to Środkowy
    cursor.execute("""
        UPDATE zawodnicy 
        SET przydatnosc_przy_pilce = REPLACE(przydatnosc_przy_pilce, 'Śśrodkowy', 'Środkowy'),
            przydatnosc_bez_pilki = REPLACE(przydatnosc_bez_pilki, 'Śśrodkowy', 'Środkowy');
    """)
    
    conn.commit()
    print("Typos fixed successfully!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    fix_typos()
