import json
import os
import requests
import sys

# Dodajemy folder backend do ścieżek wyszukiwania Pythona
sys.path.append(os.path.join(os.path.dirname(__file__)))

from database import SessionLocal, Team, init_db
# --- KONFIGURACJA ---
# Upewnij się, że masz MISTRAL_API_KEY w .env lub wpisz go tutaj tymczasowo
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

def sprawdz_i_analizuj():
    init_db()
    db = SessionLocal()
    
    # 1. Sprawdzamy czy są dane
    teams = db.query(Team).all()
    
    if not teams:
        print("Baza jest pusta. Dodaję dane testowe, żebyś mógł zobaczyć działanie...")
        t1 = Team(id=1, name="Arsenal (Test)", logo="")
        t2 = Team(id=2, name="Manchester City (Test)", logo="")
        db.add(t1)
        db.add(t2)
        db.commit()
        teams = [t1, t2]

    team_a = teams[0]
    team_b = teams[1]
    
    print(f"\n--- TEST ANALIZY: {team_a.name} vs {team_b.name} ---")

    # 2. Budujemy prompt (uproszczona wersja Twojej logiki z main.py)
    prompt = (
        f"Jesteś analitykiem FM26. Przeanalizuj mecz: {team_a.name} vs {team_b.name}.\n"
        "Zaproponuj jedną zmianę w 'Linii Nacisku' oraz 'Tempie'.\n"
        "Używaj formatu:\n⚠️ ZAGROŻENIE: ...\n💡 REKOMENDACJA: ..."
    )

    # 3. Wysyłamy do Mistrala
    print("Łączenie z Mistral AI... (to może potrwać chwilę)")
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {MISTRAL_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "open-mistral-7b",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            analiza = response.json()['choices'][0]['message']['content']
            print("\n=== WYNIK ANALIZY Z KONSOLI ===")
            print(analiza)
            print("===============================")
        else:
            print(f"Błąd Mistral API: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Błąd połączenia: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sprawdz_i_analizuj()