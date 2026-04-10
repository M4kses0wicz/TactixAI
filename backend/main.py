from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import uvicorn
import os

# --- MAPA MOŻLIWOŚCI TAKTYCZNYCH (FM26) ---
OPCJE_TAKTYCZNE = {
    "Przy pilce": {
        "Bezposredniosc podan": ["Znacznie krócej", "Krócej", "Standardowo", "Bardziej bezpośrednio", "Znacznie bardziej bezpośrednio"],
        "Tempo": ["Znacznie wolniej", "Wolniej", "Standardowo", "Wyżej", "Znacznie wyżej"],
        "Gra na czas": ["Rzadziej", "Standardowo", "Częściej"],
        "Faza przejscia w ofensywie": ["Utrzymanie pozycji", "Standardowo", "Kontratak"],
        "Rozpietosc ataku": ["Znacznie węziej", "Węziej", "Standardowo", "Szerzej", "Znacznie szerzej"],
        "Szukaj stalych fragmentow": ["Utrzymuj piłkę", "Szukaj stałych fragmentów gry"],
        "Swoboda taktyczna": ["Więcej dyscypliny", "Zrównoważone", "Mniej dyscypliny"],
        "Strategia rozgrywania": ["Gra pod pressingiem", "Zrównoważone", "Omijaj pressing"],
        "Rzuty od bramki": ["Krótko", "Mieszane", "Długo"],
        "Wyprowadzanie pilki przez bramkarza": ["Zrównoważone", "Środkowi obrońcy", "Boczni obrońcy", "Flanki", "rozgrywający", "odgrywający"],
        "Wejscia za pilka": ["Zrównoważone", "Lewy", "Prawy", "Oba skrzydła"],
        "Drybling": ["Odradź", "Zrównoważone", "Zachęcaj"],
        "Wejscia": ["Zrównoważone", "Środek", "Lewy", "Prawy", "Oba skrzydła"],
        "Odbior podan": ["Podania do nogi", "Podania na wolne pole"],
        "Cierpliwosc": ["Szybkie centry", "Standardowo", "Podania w pole karne"],
        "Strzaly z dystansu": ["Odradź", "Zrównoważone", "Zachęć"],
        "Styl dosrodkowan": ["Zrównoważone", "Miękkie dośrodkowania", "Kąśliwe dośrodkowania", "Niskie dośrodkowania"],
        "Wyprowadzanie pilki przez bramkarza_tempo": ["Zwolnij tempo", "Zrównoważone", "Szybkie wyprowadzanie"]
    },
    "Bez pilki": {
        "Linia nacisku": ["Niski pressing", "Średni pressing", "Wysoki pressing"],
        "Linia defensywna": ["Znacznie niżej", "Niżej", "Standardowo", "Wyżej", "Znacznie wyżej"],
        "Aktywacja pressingu": ["Znacznie rzadziej", "Rzadziej", "Standardowo", "Częściej", "Znacznie częściej"],
        "Przejscie defensywne": ["Przegrupowanie", "Standardowo", "Kontrpressing"],
        "Atak na pilke": ["Gra bez wślizgów", "Standardowo", "Agresywny odbiór"],
        "Reakcja na dosrodkowania": ["Powstrzymuj dośrodkowania", "Zrównoważone", "Zachęcaj do dośrodkowań"],
        "Kierunek pressingu": ["Szeroki pressing", "Zrównoważony pressing", "Wąski pressing"],
        "Krotkie wyprowadzanie rywala": ["Nie", "Tak"],
        "Zachowanie linii defensywnej": ["Graj wyżej", "Zrównoważone", "Graj głębiej"]
    }
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MISTRAL_API_KEY = ""

def get_local_team_data(team_name):
    try:
        path = os.path.join(os.path.dirname(__file__), 'players_db.json')
        with open(path, 'r', encoding='utf-8') as f:
            db = json.load(f)
        for key in db.keys():
            if team_name.lower() in key.lower():
                return {"name": key, "data": db[key]}
        return None
    except Exception as e:
        return None

@app.get("/")
def home():
    return {"status": "online", "mode": "TactixAI Pro"}

@app.get("/analizuj")
def analizuj(moje: str, rywale: str):
    team_a = get_local_team_data(moje)
    team_b = get_local_team_data(rywale)

    # Budowanie kontekstu z pełnymi danymi (statystykami)
    context = ""
    if team_a:
        context += f"MOJA DRUŻYNA: {json.dumps(team_a['data'], ensure_ascii=False)}\n"
    if team_b:
        context += f"RYWAL: {json.dumps(team_b['data'], ensure_ascii=False)}\n"

    prompt = (
        f"Jesteś elitarnym analitykiem TactixAI. Oto dane przedmeczowe:\n{context}\n\n"
        f"DOSTĘPNE OPCJE TAKTYCZNE (WYBIERAJ TYLKO Z TYCH LIST):\n{json.dumps(OPCJE_TAKTYCZNE, ensure_ascii=False)}\n\n"
        "TWOJE ZADANIA:\n"
        "1. Wykryj krytyczne zagrożenia (np. różnice w szybkości, pressing vs podania).\n"
        "2. Zaproponuj konkretne zmiany w ustawieniach, używając DOKŁADNYCH nazw z DOSTĘPNYCH OPCJI.\n"
        "3. Nie zmyślaj pozycji - używaj tych z bazy.\n\n"
        "FORMAT ODPOWIEDZI:\n"
        "⚠️ UWAGA: [zagrożenie]\n"
        "💡 REKOMENDACJA: [Zmień 'Klucz' na 'Wartość z listy']\n"
    )

    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "open-mistral-7b",
        "messages": [
            {"role": "system", "content": "Jesteś ekspertem FM26. Operujesz na sztywnych listach opcji taktycznych."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3, # Niższa temperatura = większa precyzja w nazwach
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code != 200:
            return {"error": "Błąd API", "details": response.text}
        
        analiza = response.json()['choices'][0]['message']['content']
        return {"analiza": analiza}
    except Exception as e:
        return {"error": str(e)}

@app.get("/test-klucza")
def test_klucza():
    url = "https://api.mistral.ai/v1/models"
    headers = {"Authorization": f"Bearer {MISTRAL_API_KEY}"}
    r = requests.get(url, headers=headers)
    return r.json()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)