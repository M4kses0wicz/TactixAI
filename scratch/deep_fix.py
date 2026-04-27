import psycopg2
import re

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def deep_fix():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, przydatnosc_przy_pilce, przydatnosc_bez_pilki FROM zawodnicy;")
    players = cursor.fetchall()
    
    print("Performing deep fix on all players...")
    for pid, przy, bez in players:
        new_przy = przy
        new_bez = bez
        
        if przy:
            # Fix Śś to Ś, śś to ś
            new_przy = new_przy.replace('Śś', 'Ś').replace('śś', 'ś').replace('ŚŚ', 'Ś')
        if bez:
            new_bez = new_bez.replace('Śś', 'Ś').replace('śś', 'ś').replace('ŚŚ', 'Ś')
            
        if new_przy != przy or new_bez != bez:
            cursor.execute("UPDATE zawodnicy SET przydatnosc_przy_pilce = %s, przydatnosc_bez_pilki = %s WHERE id = %s", (new_przy, new_bez, pid))
            
    conn.commit()
    print("Deep fix completed!")
    cursor.close()
    conn.close()

if __name__ == "__main__":
    deep_fix()
