from core_match_engine import *
import random; random.seed(123)

def make_player(idx, pos, name):
    attrs = dict(pace=13,strength=12,stamina=13,aggression=11,passing=13,dribbling=12,
                 finishing=12,crossing=12,heading=11,first_touch=12,vision=12,positioning=12,
                 decisions=12,composure=12,work_rate=12,tackling=12,marking=11,concentration=12)
    if pos == 'GK':
        attrs.update(gk_reflexes=15,gk_positioning=14,gk_handling=14,gk_aerial=13,finishing=5,composure=10)
    return Player(id=str(idx), name=name, position=pos, attributes=PlayerAttributes(**attrs))

home = [make_player(i,p,n) for i,(p,n) in enumerate([
    ('GK','Kowal'),('CB','Nowa'),('CB','Wis'),('LB','Zaj'),('RB','Kraw'),
    ('CM','Malin'),('CM','Dabr'),('AM','Wrob'),('LW','Kow2'),('RW','Wro2'),('ST','Lewan')
])]
away = [make_player(i+20,p,n) for i,(p,n) in enumerate([
    ('GK','Molik'),('CB','Witek'),('CB','Kos'),('LB','Maj'),('RB','Wac'),
    ('CM','Zub'),('CM','Kuc'),('AM','Fic'),('LW','Bak'),('RW','Kol'),('ST','Mba')
])]

state = MatchState(home_players=home, away_players=away)
engine = MatchEngine(state)

for _ in range(900):
    engine.simulate_tick()

s = engine.state
total_shots = s.home_stats.shots + s.away_stats.shots
ratings_home = [round(p.match_rating,2) for p in home]
ratings_away = [round(p.match_rating,2) for p in away]
all_r = ratings_home + ratings_away
hdir = s.home_stats.attack_directions_pct()
adir = s.away_stats.attack_directions_pct()

poss_total = s.home_stats.possession_ticks + s.away_stats.possession_ticks or 1
home_poss = round(s.home_stats.possession_ticks / poss_total * 100, 1)

print("=== WYNIKI TESTU BALANSOWEGO ===")
print(f"Wynik: {s.score_home}:{s.score_away} po 90 min")
print(f"Strzaly lacznie: {total_shots}  (cel: 10-25)")
print(f"  Home shots: {s.home_stats.shots}, Away shots: {s.away_stats.shots}")
print(f"  xG: home={round(s.home_stats.xg,2)}, away={round(s.away_stats.xg,2)}")
print(f"Posiadanie: home={home_poss}%, away={round(100-home_poss,1)}%")
print(f"Oceny (home): min={min(ratings_home)}, max={max(ratings_home)}, avg={round(sum(ratings_home)/len(ratings_home),2)}")
print(f"Oceny (away): min={min(ratings_away)}, max={max(ratings_away)}, avg={round(sum(ratings_away)/len(ratings_away),2)}")
print(f"Home kierunki: L={hdir.get('LEFT',0)}% C={hdir.get('CENTER',0)}% R={hdir.get('RIGHT',0)}%")
print(f"Away kierunki: L={adir.get('LEFT',0)}% C={adir.get('CENTER',0)}% R={adir.get('RIGHT',0)}%")
print(f"Zdarzenia: {len(s.events)}, Rozne: {s.home_stats.corners+s.away_stats.corners}")
print(f"Kartki: yellow={s.home_stats.yellow_cards+s.away_stats.yellow_cards}, red={s.home_stats.red_cards+s.away_stats.red_cards}")
print(f"Podania: home={s.home_stats.passes_completed}/{s.home_stats.passes_attempted}, away={s.away_stats.passes_completed}/{s.away_stats.passes_attempted}")
