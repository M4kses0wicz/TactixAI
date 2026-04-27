import psycopg2
import requests
import urllib.parse
from bs4 import BeautifulSoup
import os
import time
from tqdm import tqdm

DB_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
OUTPUT_DIR = "src/assets/players"

def get_face_url(player_name):
    # Wyszukiwarka Transfermarkt
    url = f'https://www.transfermarkt.pl/schnellsuche/ergebnis/schnellsuche?query={urllib.parse.quote(player_name)}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            # Transfermarkt zazwyczaj w wynikach wyszukiwania ma zdjęcia z klasą "bilderrahmen-fixed"
            for img in soup.select('img.bilderrahmen-fixed'):
                src = img.get('src')
                # Ignorujemy domyślne puste awatary (tzw. default)
                if src and 'default' not in src.lower():
                    # Zmieniamy rozmiar zdjęcia z "small" (małe) na "header" (duże/wysoka jakość)
                    high_res_url = src.replace('/small/', '/header/').replace('/tiny/', '/header/')
                    return high_res_url
    except Exception as e:
        pass
        
    return None

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    print("Łączenie z bazą danych...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT imie_nazwisko FROM zawodnicy")
    players = [row[0] for row in cur.fetchall() if row[0]]
    conn.close()

    print(f"Znaleziono {len(players)} zawodników. Rozpoczynam pobieranie z Transfermarkt...")
    
    success = 0
    
    for player in tqdm(players, desc="Pobieranie", unit="zawodnik"):
        # Oczekiwana nazwa pliku (GameContext szuka plików o takich samych nazwach)
        file_path_jpg = os.path.join(OUTPUT_DIR, f"{player}.jpg")
        file_path_png = os.path.join(OUTPUT_DIR, f"{player}.png")
        
        # Omijamy jeśli już mamy pobrane
        if os.path.exists(file_path_jpg) or os.path.exists(file_path_png):
            success += 1
            continue
            
        img_url = get_face_url(player)
        if img_url:
            try:
                img_data = requests.get(img_url, headers={'User-Agent': 'Mozilla/5.0'}).content
                # Zapisujemy jako JPG bo to natywny format Transfermarkt
                with open(file_path_jpg, 'wb') as handler:
                    handler.write(img_data)
                success += 1
            except Exception as e:
                pass
                
        # Krótki postój, by Transfermarkt nas nie zablokował za spamowanie zapytań
        time.sleep(1)

    print(f"\nUkończono! Pomyślnie pobrano lub znaleziono zdjęcia dla {success}/{len(players)} zawodników.")

if __name__ == '__main__':
    main()
