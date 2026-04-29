import random
import math
from typing import Dict, List, Optional, Any

# ==============================================================================
# ENUMS & CONSTANTS
# ==============================================================================
class PitchZone:
    DEFENSE = "DEFENSE"
    MIDFIELD = "MIDFIELD"
    ATTACK = "ATTACK"

class PitchSubzone:
    LEFT_WING = "LEFT_WING"
    HALF_SPACE_LEFT = "HALF_SPACE_LEFT"
    CENTER = "CENTER"
    HALF_SPACE_RIGHT = "HALF_SPACE_RIGHT"
    RIGHT_WING = "RIGHT_WING"

class BallHeight:
    GROUND = "GROUND"
    AIR = "AIR"

# ==============================================================================
# PLAYER & TEAM WRAPPERS
# ==============================================================================
class Player:
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get("id", str(random.randint(1000, 9999)))
        self.name = data.get("name", "Unknown")
        self.position = data.get("position", "MID")
        
        # Raw Attributes (1-20 scale)
        attrs = data.get("attributes", {})
        
        # Technical
        self.passing = attrs.get("passing", 10)
        self.technique = attrs.get("technique", 10)
        self.finishing = attrs.get("finishing", 10)
        self.heading = attrs.get("heading", 10)
        self.tackling = attrs.get("tackling", 10)
        self.marking = attrs.get("marking", 10)
        self.first_touch = attrs.get("first_touch", 10)
        
        # Mental
        self.decisions = attrs.get("decisions", 10)
        self.anticipation = attrs.get("anticipation", 10)
        self.positioning = attrs.get("positioning", 10)
        self.concentration = attrs.get("concentration", 10)
        self.composure = attrs.get("composure", 10)
        self.vision = attrs.get("vision", 10)
        self.off_the_ball = attrs.get("off_the_ball", 10)
        
        # Physical
        self.acceleration = attrs.get("acceleration", 10)
        self.pace = attrs.get("pace", 10)
        self.agility = attrs.get("agility", 10)
        self.balance = attrs.get("balance", 10)
        self.jumping = attrs.get("jumping", 10)
        self.strength = attrs.get("strength", 10)
        self.stamina = attrs.get("stamina", 10)
        
        # GK Specific
        self.handling = attrs.get("handling", 10)
        self.reflexes = attrs.get("reflexes", 10)
        
        # State
        self.condition = 100.0
        self.match_rating = 6.5
        self.cards = []  # "yellow", "red"
        
    def get_attr(self, attr_name: str) -> float:
        """Pobiera atrybut z uwzględnieniem modyfikatora zmęczenia (debuff)."""
        val = getattr(self, attr_name, 10)
        
        # Spadek kondycji poniżej 70% aktywuje debuffy dla atrybutów fizycznych i mentalnych
        if self.condition < 70.0:
            if attr_name in ["acceleration", "pace", "agility", "jumping"]:
                penalty = (70.0 - self.condition) * 0.015  # np. 50% cond = -30% kary
                val *= (1.0 - penalty)
            elif attr_name in ["concentration", "decisions", "composure", "anticipation"]:
                penalty = (70.0 - self.condition) * 0.01  # mniejsza kara do mentalnych, ale zauważalna
                val *= (1.0 - penalty)
                
        return max(1.0, val)

class Team:
    def __init__(self, id: str, name: str, players: List[Player], tactics: Dict[str, Any]):
        self.id = id
        self.name = name
        self.players = players
        self.tactics = tactics
        
        self.formation = tactics.get("formation", "4-3-3")
        self.tempo = tactics.get("tempo", "NORMAL") # SLOW, NORMAL, FAST
        self.defensive_line = tactics.get("defensive_line", "NORMAL") # DEEP, NORMAL, HIGH, VERY_HIGH
        self.passing_style = tactics.get("passing_style", "MIXED") # SHORT, MIXED, DIRECT

    def get_player_by_position(self, pos_group: str) -> Optional[Player]:
        # Helper - w realnym systemie mapowalibyśmy strefę na gracza (Voronoi diagrams)
        candidates = [p for p in self.players if pos_group in p.position and "red" not in p.cards]
        return random.choice(candidates) if candidates else random.choice([p for p in self.players if "red" not in p.cards])


# ==============================================================================
# MATCH ENGINE
# ==============================================================================
class CoreMatchEngine:
    def __init__(self, home_team: Team, away_team: Team):
        self.home = home_team
        self.away = away_team
        
        # Initial State
        self.possession_team_id = self.home.id
        self.ball_zone = PitchZone.MIDFIELD
        self.ball_subzone = PitchSubzone.CENTER
        self.ball_height = BallHeight.GROUND
        
        self.momentum = 0.0  # -10 to 10 (ujemne = przewaga gości)
        
        # Accumulators for the JSON Output
        self.score = {"home": 0, "away": 0}
        self.stats = {
            "possession_ticks": {"home": 0, "away": 0}, # konwertowane na % przed zwrotem
            "shots": {"home": 0, "away": 0},
            "shots_on_target": {"home": 0, "away": 0},
            "passes": {"home": {"completed": 0, "attempted": 0}, "away": {"completed": 0, "attempted": 0}},
            "fouls": {"home": 0, "away": 0},
            "corners": {"home": 0, "away": 0},
            "cards": {"yellow": [], "red": []}
        }
        
    def _roll(self, mu: float, sigma: float = 4.0) -> float:
        """Silnik korzysta z rozkładu Gaussa do rozwiązywania pojedynków."""
        return random.gauss(mu, sigma)
        
    def _update_stamina(self, player: Player, effort: float):
        """
        Krzywa degeneracji staminy. Gracze z większą wytrzymałością tracą wolniej.
        Wzór nieliniowy: im mniejsza stamina, tym szybszy spadek przy dużym wysiłku.
        """
        stamina_attr = player.get_attr("stamina")
        resistance = 1.0 + (stamina_attr / 20.0) # 1.05 do 2.0
        
        drop = effort / resistance
        player.condition = max(0.0, player.condition - drop)

    # --------------------------------------------------------------------------
    # DUEL CALCULATORS
    # --------------------------------------------------------------------------
    def _resolve_pass(self, passer: Player, receiver: Player, defender: Player, is_through_ball: bool, tempo_mod: float) -> bool:
        """
        Zaawansowane równanie podania (Synergia Atrybutów).
        Wpływ mają: decyzyjność, technika, ustawianie się obrońcy, przyspieszenie obu graczy.
        """
        passer_skill = (passer.get_attr("passing") * 1.5 
                      + passer.get_attr("decisions") 
                      + passer.get_attr("anticipation") 
                      + passer.get_attr("technique"))
                      
        # Modyfikator za wysokie tempo taktyczne (zwiększa ryzyko błędów)
        passer_skill *= tempo_mod
        
        # Czy obrońca przecina podanie?
        defender_skill = (defender.get_attr("positioning") * 1.2
                        + defender.get_attr("anticipation")
                        + defender.get_attr("concentration")
                        + defender.get_attr("acceleration") * 0.8)
                        
        if is_through_ball:
            passer_skill += passer.get_attr("vision")
            defender_skill += defender.get_attr("pace") * 0.5 # Obrońca musi gonić prostopadłą piłkę

        pass_roll = self._roll(passer_skill, sigma=8.0)
        def_roll = self._roll(defender_skill, sigma=8.0)
        
        # Zmęczenie aplikowane podczas wysiłku (mikro-ticki)
        self._update_stamina(passer, 0.2 if is_through_ball else 0.05)
        self._update_stamina(defender, 0.15)
        
        return pass_roll > def_roll

    def _resolve_header(self, attacker: Player, defender: Player) -> bool:
        """Kalkulacja pojedynku w powietrzu."""
        att_skill = (attacker.get_attr("heading") * 1.5 + attacker.get_attr("jumping") + attacker.get_attr("strength"))
        def_skill = (defender.get_attr("heading") * 1.5 + defender.get_attr("jumping") + defender.get_attr("strength"))
        
        self._update_stamina(attacker, 0.2)
        self._update_stamina(defender, 0.2)
        
        return self._roll(att_skill, 5.0) > self._roll(def_skill, 5.0)

    def _resolve_shot(self, shooter: Player, gk: Player, distance_modifier: float) -> str:
        """
        Zwraca: "GOAL", "SAVED_HELD", "SAVED_CORNER", "MISS"
        Strzał zależy od strefy (distance_modifier: 1.0 z pola karnego, 0.6 z dystansu).
        """
        # Oblicz jakość strzału - mocny NERF (0.6) dla realizmu. Piłka rzadko wpada.
        shot_skill = ((shooter.get_attr("finishing") * 2.0 
                    + shooter.get_attr("composure") 
                    + shooter.get_attr("technique")) * distance_modifier) * 0.6
                    
        # GK umiejetnosci - BUFF dla realizmu
        gk_skill = (gk.get_attr("reflexes") * 1.5 
                  + gk.get_attr("agility") 
                  + gk.get_attr("positioning") 
                  + gk.get_attr("handling")) * 1.2
                  
        shot_roll = self._roll(shot_skill, sigma=7.0)
        gk_roll = self._roll(gk_skill, sigma=5.0)
        
        self._update_stamina(shooter, 0.4)
        self._update_stamina(gk, 0.3)
        
        # Znaczna szansa na pudło
        if shot_roll < (shot_skill * 0.6) or random.random() < 0.3:
            return "MISS"
            
        if shot_roll > gk_roll:
            margin = shot_roll - gk_roll
            # Nawet jeśli pokonał bramkarza, może trafić w słupek
            if margin < 3.0 and random.random() < 0.15:
                return "MISS" 
            return "GOAL"
        else:
            if gk_roll - shot_roll > 15.0:
                return "SAVED_HELD" 
            else:
                return "SAVED_CORNER"

    def _get_goal_text(self, shooter_name: str, current_minute: int, is_home: bool) -> str:
        """Świadomość Wyniku (Score Context) przed dodaniem gola."""
        diff = self.score["home"] - self.score["away"]
        if not is_home:
            diff = -diff
            
        if diff == -1:
            return f"{current_minute}' GOL! {shooter_name} wyrównuje stan meczu!"
        elif diff == 0:
            return f"{current_minute}' GOL! {shooter_name} daje prowadzenie swojej drużynie!"
        elif diff > 0:
            return f"{current_minute}' GOL! {shooter_name} podwyższa prowadzenie!"
        else:
            return f"{current_minute}' GOL! {shooter_name} trafia do siatki i drużyna łapie kontakt!"

    # --------------------------------------------------------------------------
    # MAIN SIMULATION LOOP (1 MINUTE = X TICKS)
    # --------------------------------------------------------------------------
    def simulate_minute(self, current_minute: int) -> Dict[str, Any]:
        events = []
        major_event_logged = False # Event Deduplication
        carded_this_min = set() # Cooldown na kartki
        
        att_team = self.home if self.possession_team_id == self.home.id else self.away
        def_team = self.away if self.possession_team_id == self.home.id else self.home
        
        is_home_att = (att_team.id == self.home.id)
        
        ticks = 8
        if att_team.tempo == "FAST": ticks = 11
        elif att_team.tempo == "SLOW": ticks = 6
        
        tempo_pass_mod = 1.0
        if att_team.tempo == "FAST": tempo_pass_mod = 0.92
        elif att_team.tempo == "SLOW": tempo_pass_mod = 1.05
        
        for _ in range(ticks):
            if is_home_att:
                self.stats["possession_ticks"]["home"] += 1
            else:
                self.stats["possession_ticks"]["away"] += 1

            def_line_mod = 1.0
            if def_team.defensive_line == "HIGH": def_line_mod = 1.15
            elif def_team.defensive_line == "DEEP": def_line_mod = 0.85
            
            # Prawdopodobieństwo faulu taktycznego w środku pola
            if random.random() < 0.05 and self.ball_zone == PitchZone.MIDFIELD:
                self.stats["fouls"]["home" if not is_home_att else "away"] += 1
                fouler = def_team.get_player_by_position("MID")
                if fouler and fouler.id not in carded_this_min and random.random() < 0.15:
                    self.stats["cards"]["yellow"].append({"player_id": fouler.id, "team": "home" if not is_home_att else "away"})
                    fouler.cards.append("yellow")
                    carded_this_min.add(fouler.id)
                    if not major_event_logged:
                        events.append({"type": "card", "text": f"{current_minute}' Żółta kartka dla {fouler.name} po ostrym faulu taktycznym."})
                        major_event_logged = True
            
            if self.ball_zone == PitchZone.DEFENSE:
                if att_team.passing_style == "DIRECT" and random.random() < 0.4:
                    self.ball_zone = PitchZone.ATTACK
                    self.ball_height = BallHeight.AIR
                else:
                    self.ball_zone = PitchZone.MIDFIELD
                    
                self.stats["passes"]["home" if is_home_att else "away"]["attempted"] += 1
                self.stats["passes"]["home" if is_home_att else "away"]["completed"] += 1
                
            elif self.ball_zone == PitchZone.MIDFIELD:
                passer = att_team.get_player_by_position("MID")
                receiver = att_team.get_player_by_position("FWD")
                defender = def_team.get_player_by_position("MID")
                
                is_through = random.random() < 0.1 # Zmniejszono z 30% do 10%
                
                self.stats["passes"]["home" if is_home_att else "away"]["attempted"] += 1
                
                if passer and receiver and defender and self._resolve_pass(passer, receiver, defender, is_through, tempo_pass_mod / def_line_mod):
                    self.stats["passes"]["home" if is_home_att else "away"]["completed"] += 1
                    # Duża szansa na pozostanie w środku pola zamiast wejścia do ataku
                    if random.random() < 0.3 or is_through:
                        self.ball_zone = PitchZone.ATTACK
                        if is_through and passer.get_attr("vision") > 16 and random.random() < 0.2 and not major_event_logged:
                            events.append({"type": "pass", "text": f"{current_minute}' Piękne zagranie od {passer.name} tworzy przestrzeń!"})
                            major_event_logged = True
                            self.momentum += 1.0 if is_home_att else -1.0
                else:
                    self.possession_team_id = def_team.id
                    is_home_att = not is_home_att
                    att_team, def_team = def_team, att_team
                        
            elif self.ball_zone == PitchZone.ATTACK:
                # Zmniejszono szansę na strzał z 40% do 8%
                if random.random() < 0.08: 
                    shooter = att_team.get_player_by_position("FWD")
                    gk = def_team.get_player_by_position("GK")
                    
                    if shooter and gk:
                        dist_mod = 1.0 if self.ball_subzone == PitchSubzone.CENTER else 0.7
                        self.stats["shots"]["home" if is_home_att else "away"] += 1
                        
                        result = self._resolve_shot(shooter, gk, dist_mod)
                        
                        if result == "GOAL":
                            self.stats["shots_on_target"]["home" if is_home_att else "away"] += 1
                            
                            # Logika komentarza z odpowiednim kontekstem wyniku
                            goal_text = self._get_goal_text(shooter.name, current_minute, is_home_att)
                            events.append({"type": "goal", "text": goal_text})
                            major_event_logged = True # Przebija wszystko
                            
                            if is_home_att:
                                self.score["home"] += 1
                                self.momentum += 3.0
                            else:
                                self.score["away"] += 1
                                self.momentum -= 3.0
                                
                            self.ball_zone = PitchZone.MIDFIELD
                            
                        elif "SAVED" in result:
                            self.stats["shots_on_target"]["home" if is_home_att else "away"] += 1
                            if result == "SAVED_CORNER":
                                self.stats["corners"]["home" if is_home_att else "away"] += 1
                                if not major_event_logged:
                                    events.append({"type": "shot", "text": f"{current_minute}' {shooter.name} uderza! Wspaniała parada bramkarza na rożny."})
                                    major_event_logged = True
                            else:
                                self.possession_team_id = def_team.id
                                is_home_att = not is_home_att
                                att_team, def_team = def_team, att_team
                                self.ball_zone = PitchZone.DEFENSE
                                
                        elif result == "MISS":
                            if not major_event_logged and random.random() < 0.3:
                                events.append({"type": "miss", "text": f"{current_minute}' {shooter.name} strzela obok bramki. Zmarnowana szansa."})
                                major_event_logged = True
                            self.possession_team_id = def_team.id
                            is_home_att = not is_home_att
                            att_team, def_team = def_team, att_team
                            self.ball_zone = PitchZone.DEFENSE
                else:
                    # Rozegranie ataku pozycyjnego
                    self.stats["passes"]["home" if is_home_att else "away"]["attempted"] += 1
                    if random.random() < 0.7:
                        self.stats["passes"]["home" if is_home_att else "away"]["completed"] += 1
                    else:
                        self.possession_team_id = def_team.id
                        is_home_att = not is_home_att
                        att_team, def_team = def_team, att_team
                        self.ball_zone = PitchZone.DEFENSE
                        
            self.momentum *= 0.95 

        # Przygotowanie struktury JSON na wyjście
        
        # Wyliczenie procentowego posiadania z ticków
        total_ticks = max(1, self.stats["possession_ticks"]["home"] + self.stats["possession_ticks"]["away"])
        poss_home = round((self.stats["possession_ticks"]["home"] / total_ticks) * 100)
        poss_away = 100 - poss_home
        
        player_updates = []
        for p in self.home.players + self.away.players:
            player_updates.append({
                "id": p.id,
                "condition": round(p.condition, 1),
                "match_rating": round(p.match_rating, 1)
            })

        return {
            "minute": current_minute,
            "score": self.score.copy(),
            "possession_team": self.possession_team_id,
            "stats": {
                "possession": {"home": poss_home, "away": poss_away},
                "shots": {"home": self.stats["shots"]["home"], "away": self.stats["shots"]["away"]},
                "shots_on_target": {"home": self.stats["shots_on_target"]["home"], "away": self.stats["shots_on_target"]["away"]},
                "passes": {
                    "home": {"completed": self.stats["passes"]["home"]["completed"], "attempted": self.stats["passes"]["home"]["attempted"]},
                    "away": {"completed": self.stats["passes"]["away"]["completed"], "attempted": self.stats["passes"]["away"]["attempted"]}
                },
                "fouls": {"home": self.stats["fouls"]["home"], "away": self.stats["fouls"]["away"]},
                "corners": {"home": self.stats["corners"]["home"], "away": self.stats["corners"]["away"]},
                "cards": self.stats["cards"]
            },
            "events": events,
            "momentum": round(self.momentum, 2),
            "player_updates": player_updates
        }

# ==============================================================================
# EXAMPLE USAGE (For testing purposes, to demonstrate logic)
# ==============================================================================
if __name__ == "__main__":
    # Mock data for players
    p1 = Player({"id": "1", "name": "Lewandowski", "position": "FWD", "attributes": {"finishing": 19, "composure": 18, "stamina": 14}})
    p2 = Player({"id": "2", "name": "De Bruyne", "position": "MID", "attributes": {"passing": 20, "vision": 19, "technique": 18}})
    p3 = Player({"id": "3", "name": "Szczęsny", "position": "GK", "attributes": {"reflexes": 16, "handling": 15}})
    
    t_home = Team("home", "FC Home", [p1, p2], {"tempo": "FAST", "defensive_line": "HIGH"})
    t_away = Team("away", "FC Away", [p3], {"tempo": "SLOW", "defensive_line": "DEEP"})
    
    engine = CoreMatchEngine(t_home, t_away)
    
    print("Symulacja 5 minut...")
    for min_val in range(1, 6):
        out = engine.simulate_minute(min_val)
        for ev in out["events"]:
            print(ev["text"])
    
    print("\nStatystyki po 5 minutach:")
    print(f"Wynik: {out['score']['home']} - {out['score']['away']}")
    print(f"Posiadanie: {out['stats']['possession']['home']}% - {out['stats']['possession']['away']}%")
    print(f"Strzały (Celne): {out['stats']['shots']['home']}({out['stats']['shots_on_target']['home']}) - {out['stats']['shots']['away']}({out['stats']['shots_on_target']['away']})")
    
    print("\nStan zmęczenia Kevina De Bruyne:")
    print(f"Kondycja: {p2.condition:.1f}%")
