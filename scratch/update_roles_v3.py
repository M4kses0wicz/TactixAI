import psycopg2
import json

DATABASE_URL = "postgresql://postgres.nlbmrhfpnvhvaonmsouc:DVqhdWeJUGv053iN@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

def update_roles():
    # 1. Defensywny Pomocnik (DP)
    dp_roles_przy = ["Rygiel defensywny", "Defensywny pomocnik", "Cofnięty rozgrywający", "Łącznik defensywny", "Odgrywający", "Wędrujący rozgrywający", "Regista", "Półskrzydłowy"]
    dp_roles_bez = ["Zabezpieczenie", "Wsparcie", "Obrona"]
    
    # 2. Środkowy Pomocnik (ŚP)
    sp_roles_przy = ["Pomocnik odbierający piłkę", "Cofnięty rozgrywający", "Środkowy pomocnik", "Wysunięty rozgrywający", "Długodystansowiec (Box-to-Box)", "Wędrujący rozgrywający", "Półskrzydłowy"]
    sp_roles_bez = ["Wsparcie", "Obrona", "Atak"]
    
    # 3. Ofensywny Pomocnik (OP)
    op_roles_przy = ["Wysunięty rozgrywający", "Ofensywny pomocnik", "Klasyczna dziesiątka", "Cień napastnika", "Enganche", "Półskrzydłowy"]
    op_roles_bez = ["Wsparcie", "Atak"]
    
    # 4. Skrzydłowi (LS i PS) - Te same role
    wing_roles_przy = ["Skrzydłowy", "Odwrócony skrzydłowy", "Schodzący napastnik", "Wysunięty rozgrywający", "Raumdeuter", "Wsparcia bocznego"]
    wing_roles_bez = ["Wsparcie", "Atak"]

    # 5. Wahadłowi (CLL / CLP) - z Twoich screenów
    wb_roles_przy = ["Cofnięty wysunięty boczny obrońca", "Wysunięty boczny obrońca", "Pressujący boczny wysunięty obrońca", "Odwrócony wysunięty boczny obrońca", "Rozgrywający wysunięty boczny obrońca", "Zaawansowany boczny wysunięty obrońca"]
    wb_roles_bez = ["Wsparcie", "Atak", "Obrona"]

    print("Łączenie z bazą danych...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("Pobieranie zawodników...")
    cur.execute("SELECT id, pozycja_glowna FROM zawodnicy")
    players = cur.fetchall()

    for pid, pos in players:
        updates = []
        params = []
        
        # We need to map positions to role lists
        # Handling DP, ŚP, OP, LS, PS, LP, PP, CLL, CLP
        
        target_przy = None
        target_bez = None
        
        if pos == "DP":
            target_przy, target_bez = dp_roles_przy, dp_roles_bez
        elif pos == "ŚP":
            target_przy, target_bez = sp_roles_przy, sp_roles_bez
        elif pos == "OP":
            target_przy, target_bez = op_roles_przy, op_roles_bez
        elif pos in ["LS", "PS", "LP", "PP"]:
            target_przy, target_bez = wing_roles_przy, wing_roles_bez
        elif pos in ["CLL", "CLP"]:
            target_przy, target_bez = wb_roles_przy, wb_roles_bez

        if target_przy and target_bez:
            updates = ["przydatnosc_przy_pilce = %s", "przydatnosc_bez_pilki = %s"]
            params = [json.dumps(target_przy), json.dumps(target_bez)]
            
            sql = f"UPDATE zawodnicy SET {', '.join(updates)} WHERE id = %s"
            cur.execute(sql, params + [pid])

    conn.commit()
    cur.close()
    conn.close()
    print("Gotowe! Role zaktualizowane.")

if __name__ == "__main__":
    update_roles()
