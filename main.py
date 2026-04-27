from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import json

app = FastAPI()

# BARDZO WAŻNE: Dodajemy CORS. Bez tego przeglądarka zablokuje Reactowi dostęp do Pythona!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Pozwala na zapytania z dowolnego adresu (np. z Twojego Reacta na localhost)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Podmień TWOJE_HASLO na hasło do bazy w Supabase
DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

@app.get("/")
def start():
    return {"wiadomosc": "Serwer dziala! Przejdz pod /api/druzyny"}

@app.get("/api/druzyny")
def pobierz_druzyny():
    try:
        # Łączymy się z bazą
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # Pobieramy dane z Twojej tabeli
        cursor.execute("SELECT id, nazwa, logo FROM druzyny;")
        wiersze = cursor.fetchall()
        
        # Pakujemy dane do formatu, który React łatwo zrozumie (lista słowników / JSON)
        druzyny_lista = []
        for w in wiersze:
            druzyny_lista.append({
                "id": w[0],
                "nazwa": w[1],
                "logo": w[2]
            })
            
        cursor.close()
        conn.close()
        
        return druzyny_lista
        
    except Exception as e:
        return {"Blad polaczenia": str(e)};

@app.get("/api/zawodnicy")
def pobierz_zawodnikow():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Pobieramy wszystko z tabeli zawodnicy
        cursor.execute("SELECT * FROM zawodnicy;")
        wiersze = cursor.fetchall()

        # Automatyczne pobieranie nazw kolumn z bazy
        nazwy_kolumn = [desc[0] for desc in cursor.description]

        zawodnicy_lista = []
        for w in wiersze:
            # Łączymy nazwy kolumn z wartościami (tworzymy pary np. "imie": "Robert")
            zawodnik = dict(zip(nazwy_kolumn, w))
            zawodnicy_lista.append(zawodnik)

        cursor.close()
        conn.close()

        return zawodnicy_lista

    except Exception as e:
        return {"Blad polaczenia": str(e)}

@app.put("/api/druzyny/update")
def aktualizuj_druzyne(team_data: dict):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Aktualizujemy drużynę w bazie
        cursor.execute("""
            UPDATE druzyny
            SET nazwa = %s, logo = %s, domyslna_formacja = %s,
                taktyka_druzyny = %s, formacje = %s, mentalnosc = %s,
                opcje_taktyczne = %s, role_zawodnikow = %s
            WHERE id = %s
            RETURNING *;
        """, (
            team_data.get("nazwa"),
            team_data.get("logo"),
            team_data.get("domyslna_formacja"),
            json.dumps(team_data.get("taktyka_druzyny")),
            json.dumps(team_data.get("formacje")),
            team_data.get("mentalnosc"),
            json.dumps(team_data.get("opcje_taktyczne")),
            json.dumps(team_data.get("role_zawodnikow")),
            team_data.get("id")
        ))

        updated_team = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()

        return {"status": "success", "team": updated_team}

    except Exception as e:
        return {"Blad polaczenia": str(e)}
    