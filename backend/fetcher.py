import requests
import os
import json
from dotenv import load_dotenv
from database import SessionLocal, Team, Player, init_db

# Ładowanie zmiennych z pliku .env
load_dotenv()

API_KEY = os.getenv("STATORIUM_API_KEY")
BASE_URL = "https://api.statorium.com/v1"

def sync_data():
    # Inicjalizacja sesji bazy danych
    db = SessionLocal()
    
    # KROK 1: Sprawdzenie dostępnych lig i sezonów
    # Statorium wymaga klucza wewnątrz ścieżki: /v1/apikey/leagues/
    leagues_url = f"{BASE_URL}/{API_KEY}/leagues/"
    
    print(f"--- ROZPOCZYNAM SYNCHRONIZACJĘ ---")
    print(f"Łączenie z: {leagues_url}")
    
    try:
        response = requests.get(leagues_url)
        
        if response.status_code != 200:
            print(f"BŁĄD API: {response.status_code}")
            print("Sprawdź czy klucz w .env jest poprawny.")
            return

        data = response.json()
        leagues = data.get('leagues', [])

        if not leagues:
            print("Brak dostępnych lig na tym kluczu API.")
            return

        print(f"Znaleziono {len(leagues)} lig. Pobieram dane dla pierwszej dostępnej...")

        # KROK 2: Pobieranie drużyn z pierwszej ligi (sezon domyślny)
        # Wybieramy pierwszą ligę z brzegu dla testu
        league_id = leagues[0]['league_id']
        season_id = leagues[0]['seasons'][0]['season_id']
        
        teams_url = f"{BASE_URL}/{API_KEY}/teams/{season_id}/"
        print(f"Pobieram drużyny z sezonu ID: {season_id}...")
        
        t_response = requests.get(teams_url)
        if t_response.status_code == 200:
            teams_data = t_response.json().get('season', {}).get('teams', [])
            
            for t in teams_data:
                # Sprawdzamy czy drużyna już istnieje w bazie
                team_id = int(t['team_id'])
                existing_team = db.query(Team).filter(Team.id == team_id).first()
                
                if not existing_team:
                    new_team = Team(
                        id=team_id,
                        name=t['team_name'],
                        logo=t.get('logo', '')
                    )
                    db.add(new_team)
                    print(f"Zapisano klub: {t['team_name']}")
            
            db.commit()
            print("--- SYNCHRONIZACJA ZAKOŃCZONA SUKCESEM ---")
        else:
            print(f"Nie udało się pobrać drużyn. Status: {t_response.status_code}")

    except Exception as e:
        print(f"WYSTĄPIŁ BŁĄD: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Najpierw upewniamy się, że tabele w bazie istnieją
    init_db()
    # Potem pobieramy dane
    sync_data()