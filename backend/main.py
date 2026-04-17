from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import requests
import os
import json
from dotenv import load_dotenv
from functools import lru_cache

# --- INIT ---
load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
STATORIUM_API_KEY = os.getenv("STATORIUM_API_KEY")
STATORIUM_BASE_URL = "https://api.statorium.com/api/v1"

# --- DB ---
from database import SessionLocal, Team, Player

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- STATORIUM ---

@lru_cache(maxsize=128)
def get_team_api(team_id: int):
    url = f"{STATORIUM_BASE_URL}/teams/{team_id}/?apikey={STATORIUM_API_KEY}"
    r = requests.get(url)

    if r.status_code != 200:
        print("TEAM ERROR:", r.status_code, r.text)
        return None

    data = r.json()
    # Statorium zwraca dane w formacie {"team": { ... }}
    return data.get("team")


@lru_cache(maxsize=256)
def get_players_api(team_id: int):
    url = f"{STATORIUM_BASE_URL}/teams/{team_id}/?apikey={STATORIUM_API_KEY}"
    r = requests.get(url)

    if r.status_code != 200:
        return []

    data = r.json()
    team_data = data.get("team", {})
    # W niektórych pakietach zawodnicy są wewnątrz obiektu team
    return team_data.get("players", [])


# --- SYNC DB ---

def sync_team_to_db(db: Session, team_data: dict):
    team_id = team_data.get("teamID")
    name = team_data.get("teamName")

    if not team_id or not name:
        return None

    team = db.query(Team).filter(Team.id == team_id).first()

    if not team:
        team = Team(id=team_id, name=name, logo=team_data.get("logo", ""))
        db.add(team)
    else:
        team.name = name
        team.logo = team_data.get("logo", "")

    db.commit()
    return team


def sync_players_to_db(db: Session, team_id: int, players: list):
    for p in players:
        player_id = p.get("playerID")
        name = p.get("playerName", "Unknown")

        if not player_id:
            continue

        player = db.query(Player).filter(Player.id == player_id).first()
        if not player:
            player = Player(id=player_id, name=name, team_id=team_id)
            db.add(player)

    db.commit()


# --- AI ---

def generate_analysis(context: str):
    url = "https://api.mistral.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    prompt = f"""
Wypisz mi wszystkie dane ktore dostajesz z bazy danych.

{context}

FORMAT ODPOWIEDZI:
⚠️ UWAGA: [zagrożenie taktyczne]
💡 REKOMENDACJA: [konkretna porada taktyczna]
"""

    payload = {
        "model": "open-mistral-7b",
        "messages": [
            {"role": "system", "content": "Ekspert taktyki piłkarskiej."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    try:
        r = requests.post(url, headers=headers, json=payload, timeout=20)
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Błąd AI: {str(e)}"


# --- ROUTES ---

@app.get("/")
def home():
    return {"status": "online"}


@app.get("/teams")
def teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    return [{"id": t.id, "name": t.name, "logo": t.logo} for t in teams]


@app.get("/analizuj")
def analizuj(moje_id: int, rywale_id: int, db: Session = Depends(get_db)):
    # Pobieranie z API
    team_a_data = get_team_api(moje_id)
    team_b_data = get_team_api(rywale_id)

    if not team_a_data or not team_b_data:
        return {"error": "Nie udało się pobrać danych drużyn z API."}

    # Synchronizacja z bazą SQL
    sync_team_to_db(db, team_a_data)
    sync_team_to_db(db, team_b_data)

    # Próba pobrania zawodników
    players_a = get_players_api(moje_id)
    if players_a:
        sync_players_to_db(db, moje_id, players_a)

    # Budowanie kontekstu
    context = f"MECZ: {team_a_data.get('teamName')} vs {team_b_data.get('teamName')}\n"
    context += f"MIASTO: {team_a_data.get('city')} vs {team_b_data.get('city')}\n"

    if players_a:
        names = [p.get("playerName", "") for p in players_a]
        context += "DOSTĘPNI ZAWODNICY: " + ", ".join(names[:15])
    else:
        context += "SKŁAD: Dane szczegółowe zawodników niedostępne w tej chwili."

    # Generowanie analizy przez AI
    analiza = generate_analysis(context)

    return {"analiza": analiza}


# --- RUN ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)