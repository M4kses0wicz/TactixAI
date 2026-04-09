from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import uvicorn
import os

app = FastAPI()

# Konfiguracja CORS dla kolegi od Reacta
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = "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"

def get_local_team_data(team_name):
    """Pobiera skład z pliku JSON, aby AI nie zmyślało."""
    try:
        path = os.path.join(os.path.dirname(__file__), 'players_db.json')
        with open(path, 'r', encoding='utf-8') as f:
            db = json.load(f)
        # Próbujemy dopasować nazwę (np. 'Real' -> 'Real Madrid')
        for key in db.keys():
            if team_name.lower() in key.lower():
                return {"name": key, "data": db[key]}
        return None
    except Exception as e:
        print(f"Błąd bazy danych: {e}")
        return None

@app.get("/")
def home():
    return {"message": "TactixAI Backend działa i korzysta z bazy JSON!"}

@app.get("/analizuj")
def analizuj(moje: str, rywale: str):
    # 1. Pobieranie faktów z lokalnej bazy
    team_a = get_local_team_data(moje)
    team_b = get_local_team_data(rywale)

    # 2. Budowanie kontekstu dla AI
# 2. Budowanie kontekstu dla AI
    context = "DANE TAKTYCZNE NA ROK 2026:\n"
    if team_a:
        context += f"Drużyna A ({team_a['name']}): Skład: {', '.join(team_a['data']['players'])}. Styl: {team_a['data'].get('style', 'Brak danych')}\n"
    
    if team_b:
        context += f"Drużyna B ({team_b['name']}): Skład: {', '.join(team_b['data']['players'])}. Styl: {team_b['data'].get('style', 'Brak danych')}\n"

# 3. Super-Prompt dla elitarnego analityka
    prompt = (
        f"KONTEKST TAKTYCZNY (DANE OPTA 2026):\n"
        f"{context}\n\n"
        f"ZADANIE: Przeprowadź profesjonalną analizę przedmeczową starcia {moje} vs {rywale}.\n"
        "STRUKTURA ODPOWIEDZI (WYMAGANA):\n"
        "1. BITWA O ŚRODEK POLA: Porównaj style obu drużyn (np. Possession vs Directness). Jak pomocnicy poradzą sobie z pressingiem rywala?\n"
        "2. KLUCZOWE STARCIU INDYWIDUALNE: Wybierz dwóch konkretnych graczy z podanych składów i opisz ich pojedynek (np. szybki skrzydłowy vs silny stoper).\n"
        "3. SCENARIUSZ TAKTYCZNY: Opisz, jak mecz będzie wyglądał (np. kto zdominuje piłkę, kto będzie szukał kontr).\n"
        "4. FINALNA RADA: Jedna konkretna wskazówka dla trenera drużyny: {moje}.\n\n"
        "ZASADY BEZWZGLĘDNE:\n"
        "- NIE wymieniaj zawodników spoza podanej listy (szczególnie tych na wypożyczeniach jak Rashford czy Onana).\n"
        "- Używaj terminologii technicznej (np. low block, transitions, half-spaces).\n"
        "- Pisz w języku polskim, w sposób konkretny i analityczny.\n"
        "- Jeśli danej drużyny nie ma w bazie, użyj swojej wiedzy o niej z sezonu 25/26."
    )

    # 4. Wysyłka do AI
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "openrouter/auto",
        "messages": [
            {"role": "system", "content": "Jesteś ekspertem taktyki piłkarskiej z najnowszą wiedzą na rok 2026."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7 # Dodaje trochę kreatywności, ale trzyma się faktów
    }

    try:
        print(f"Analizuję: {moje} vs {rywale}...")
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        data = response.json()
        analiza = data['choices'][0]['message']['content']
        return {"analiza": analiza}
            
    except Exception as e:
        print(f"Błąd: {e}")
        return {
            "analiza": "Błąd połączenia z mózgiem AI. Spróbuj ponownie za chwilę.",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)