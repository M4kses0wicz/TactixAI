"""
CoreMatchEngine – Krok 1: Architektura Danych i Stanu Meczowego
===============================================================
Wszystkie modele Pydantic definiujące struktury danych silnika.
Logika symulacji (pętle, pojedynki) – Krok 2.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


# ==============================================================================
# ENUMS – Geometria Boiska (Grid 3x3)
# ==============================================================================

class ZoneLongitudinal(str, Enum):
    """Oś pionowa boiska (od własnej bramki do bramki rywala)."""
    DEFENSE  = "DEFENSE"
    MIDFIELD = "MIDFIELD"
    ATTACK   = "ATTACK"


class ZoneLateral(str, Enum):
    """Oś pozioma boiska."""
    LEFT   = "LEFT"
    CENTER = "CENTER"
    RIGHT  = "RIGHT"


class Mentality(str, Enum):
    VERY_DEFENSIVE  = "Bardzo defensywna"
    DEFENSIVE       = "Defensywna"
    CAUTIOUS        = "Ostrożna"
    BALANCED        = "Wyważona"
    POSITIVE        = "Pozytywna"
    OFFENSIVE       = "Ofensywna"
    VERY_OFFENSIVE  = "Bardzo ofensywna"


# ==============================================================================
# MODEL: PlayerAttributes
# ==============================================================================

class PlayerAttributes(BaseModel):
    """
    Główne atrybuty zawodnika w skali 1-20.
    Używane przez silnik do obliczania szans w pojedynkach (Gauss).
    """
    # --- Fizyczne ---
    pace:        int = Field(10, ge=1, le=20, description="Szybkość i przyspieszenie")
    strength:    int = Field(10, ge=1, le=20, description="Siła fizyczna")
    stamina:     int = Field(10, ge=1, le=20, description="Wytrzymałość (wpływa na degradację kondycji)")
    aggression:  int = Field(10, ge=1, le=20, description="Agresywność / presja")

    # --- Techniczne ---
    passing:     int = Field(10, ge=1, le=20, description="Jakość i celność podań")
    dribbling:   int = Field(10, ge=1, le=20, description="Prowadzenie piłki / dribling")
    finishing:   int = Field(10, ge=1, le=20, description="Skuteczność strzałów")
    crossing:    int = Field(10, ge=1, le=20, description="Jakość dośrodkowań")
    heading:     int = Field(10, ge=1, le=20, description="Gra głową")
    first_touch: int = Field(10, ge=1, le=20, description="Przyjęcie piłki")

    # --- Mentalne ---
    vision:       int = Field(10, ge=1, le=20, description="Wizja gry / klucz. podania")
    positioning:  int = Field(10, ge=1, le=20, description="Ustawienie bez piłki")
    decisions:    int = Field(10, ge=1, le=20, description="Jakość decyzji pod presją")
    composure:    int = Field(10, ge=1, le=20, description="Opanowanie (np. sam na sam)")
    work_rate:    int = Field(10, ge=1, le=20, description="Intensywność pracy")

    # --- Obronne ---
    tackling:     int = Field(10, ge=1, le=20, description="Odbiór piłki")
    marking:      int = Field(10, ge=1, le=20, description="Krycie zawodnika")
    concentration: int = Field(10, ge=1, le=20, description="Skupienie / błędy def.")

    # --- Bramkarz (ignorowane dla zawodników z pola) ---
    gk_reflexes:   int = Field(1, ge=1, le=20, description="Refleks bramkarza")
    gk_positioning: int = Field(1, ge=1, le=20, description="Ustawienie bramkarza")
    gk_handling:   int = Field(1, ge=1, le=20, description="Chwyt bramkarza")
    gk_aerial:     int = Field(1, ge=1, le=20, description="Gra powietrzna bramkarza")


# ==============================================================================
# MODEL: PlayerMatchStats
# ==============================================================================

class PlayerMatchStats(BaseModel):
    """Statystyki zebrane przez zawodnika podczas meczu."""
    # Podania
    passes_attempted:  int = 0
    passes_completed:  int = 0
    key_passes:        int = 0

    # Strzały
    shots:             int = 0
    shots_on_target:   int = 0
    goals:             int = 0
    xg_generated:      float = 0.0   # suma xG ze strzałów zawodnika

    # Obrona
    tackles_attempted: int = 0
    tackles_won:       int = 0
    interceptions:     int = 0
    clearances:        int = 0

    # Ogólne
    dribbles_attempted: int = 0
    dribbles_succeeded: int = 0
    fouls_committed:    int = 0
    fouls_suffered:     int = 0
    minutes_played:     int = 0

    @property
    def pass_accuracy(self) -> float:
        if self.passes_attempted == 0:
            return 0.0
        return round(self.passes_completed / self.passes_attempted * 100, 1)


# ==============================================================================
# MODEL: Player (zawodnik na boisku)
# ==============================================================================

class Player(BaseModel):
    """Reprezentacja zawodnika podczas meczu."""
    id:            str
    name:          str
    position:      str                       # "GK", "CB", "CM", "ST", itp.
    attributes:    PlayerAttributes = Field(default_factory=PlayerAttributes)

    # --- Stan podczas meczu ---
    current_stamina: float = Field(
        100.0, ge=0.0, le=100.0,
        description="Aktualna kondycja 0-100%. Spada z tickiem, zależy od stamina attr."
    )
    match_rating:    float = Field(
        6.0, ge=1.0, le=10.0,
        description="Ocena meczowa. Startuje na 6.0, zmienia się dynamicznie."
    )
    is_on_pitch:     bool  = True
    cards:           List[str] = Field(default_factory=list)  # "yellow", "red"

    # --- Statystyki meczowe ---
    stats: PlayerMatchStats = Field(default_factory=PlayerMatchStats)

    # --- Pozycja na boisku (Grid) ---
    zone_longitudinal: ZoneLongitudinal = ZoneLongitudinal.MIDFIELD
    zone_lateral:      ZoneLateral      = ZoneLateral.CENTER

    def effective_attr(self, attr_name: str) -> float:
        """
        Zwraca wartość atrybutu przeskalowaną kondycją zawodnika.
        Kondycja < 40% = kara –20% do wartości atrybutu.
        Kondycja < 70% = kara –8%.
        """
        base = float(getattr(self.attributes, attr_name, 10))
        if self.current_stamina < 40:
            return base * 0.80
        if self.current_stamina < 70:
            return base * 0.92
        return base


# ==============================================================================
# MODEL: TeamTactics
# ==============================================================================

class TeamTactics(BaseModel):
    """
    Taktyka drużyny wpływająca na zachowanie silnika.
    Wartości liczbowe są normalizowane wewnętrznie do skali 0-1.
    """
    mentality:        Mentality = Mentality.BALANCED

    # Tempo gry: 1 (bardzo wolno) – 5 (bardzo szybko)
    tempo:            int = Field(3, ge=1, le=5)

    # Szerokość ataku: 1 (wąski) – 5 (bardzo szeroki)
    width:            int = Field(3, ge=1, le=5)

    # Głębokość linii obrony: 1 (niska) – 5 (bardzo wysoka)
    defensive_line:   int = Field(3, ge=1, le=5)

    # Intensywność pressingu: 1 (niski) – 5 (bardzo wysoki)
    pressing:         int = Field(3, ge=1, le=5)

    # Bezpośredniość podań: 1 (krótkie) – 5 (długie)
    directness:       int = Field(3, ge=1, le=5)

    # Formacja jako string, np. "4-3-3"
    formation:        str = "4-4-2"

    @property
    def mentality_attack_bias(self) -> float:
        """Zwraca bias ofensywny [0.3 – 0.8] wynikający z mentalności."""
        bias_map = {
            Mentality.VERY_DEFENSIVE: 0.30,
            Mentality.DEFENSIVE:      0.38,
            Mentality.CAUTIOUS:       0.44,
            Mentality.BALANCED:       0.50,
            Mentality.POSITIVE:       0.57,
            Mentality.OFFENSIVE:      0.65,
            Mentality.VERY_OFFENSIVE: 0.75,
        }
        return bias_map.get(self.mentality, 0.50)


# ==============================================================================
# MODEL: MatchStats (statystyki drużyny)
# ==============================================================================

class MatchStats(BaseModel):
    """Agregowane statystyki jednej drużyny podczas meczu."""
    goals:              int   = 0
    shots:              int   = 0
    shots_on_target:    int   = 0
    xg:                 float = 0.0   # suma xG ze wszystkich strzałów

    passes_attempted:   int   = 0
    passes_completed:   int   = 0

    tackles_won:        int   = 0
    interceptions:      int   = 0
    fouls:              int   = 0
    yellow_cards:       int   = 0
    red_cards:          int   = 0
    corners:            int   = 0
    offsides:           int   = 0

    # Posiadanie: liczba ticków, w których drużyna miała piłkę
    possession_ticks:   int   = 0

    # Strefy akcji: liczba ticków w każdej strefie podłużnej
    zone_ticks: Dict[ZoneLongitudinal, int] = Field(
        default_factory=lambda: {
            ZoneLongitudinal.DEFENSE:  0,
            ZoneLongitudinal.MIDFIELD: 0,
            ZoneLongitudinal.ATTACK:   0,
        }
    )

    # Kierunki ataku: liczba strzałów z każdej strefy bocznej
    attack_direction_shots: Dict[ZoneLateral, int] = Field(
        default_factory=lambda: {
            ZoneLateral.LEFT:   0,
            ZoneLateral.CENTER: 0,
            ZoneLateral.RIGHT:  0,
        }
    )

    @property
    def pass_accuracy(self) -> float:
        if self.passes_attempted == 0:
            return 0.0
        return round(self.passes_completed / self.passes_attempted * 100, 1)

    def action_zones_pct(self) -> Dict[str, float]:
        """Procentowy podział akcji wg strefy podłużnej."""
        total = sum(self.zone_ticks.values()) or 1
        return {z.value: round(v / total * 100, 1) for z, v in self.zone_ticks.items()}

    def attack_directions_pct(self) -> Dict[str, float]:
        """Procentowy podział strzałów wg kierunku ataku."""
        total = sum(self.attack_direction_shots.values()) or 1
        return {z.value: round(v / total * 100, 1) for z, v in self.attack_direction_shots.items()}


# ==============================================================================
# MODEL: PitchState (stan boiska – gdzie jest piłka i kto ją ma)
# ==============================================================================

class PitchState(BaseModel):
    """
    Globalny stan boiska w danym ticku.
    Wyznacza kontekst dla wszystkich obliczeń pojedynków.
    """
    # Pozycja piłki na boisku
    zone_longitudinal: ZoneLongitudinal = ZoneLongitudinal.MIDFIELD
    zone_lateral:      ZoneLateral      = ZoneLateral.CENTER

    # Posiadanie: True = drużyna domowa, False = drużyna gości
    home_possession: bool = True

    # ID zawodnika posiadającego piłkę (None = piłka w powietrzu / luźna)
    ball_carrier_id: Optional[str] = None

    # Czy piłka jest w powietrzu (np. po dośrodkowaniu / długim podaniu)?
    ball_is_aerial: bool = False

    # Czy trwa sytuacja podbramkowa (stały fragment gry)?
    set_piece: Optional[str] = None   # "corner", "free_kick", "penalty", None


# ==============================================================================
# MODEL: MatchEvent (pojedyncze zdarzenie meczowe)
# ==============================================================================

class MatchEvent(BaseModel):
    """Zdarzenie zapisywane w logach meczu i wysyłane do frontendu."""
    minute:     int
    tick:       int       # numer ticku w obrębie minuty (0-9)
    event_type: str       # "goal", "shot", "card", "foul", "substitution", "commentary"
    team:       str       # "home" | "away"
    player_id:  Optional[str] = None
    player_name: Optional[str] = None
    text:       str       = ""
    xg:         Optional[float] = None   # tylko dla strzałów


# ==============================================================================
# MODEL: MomentumSnapshot
# ==============================================================================

class MomentumSnapshot(BaseModel):
    """
    Migawka momentum co N minut (wysyłana do komponentu MomentumChart).
    home + away sumują się do ~10.
    """
    minute: int
    home:   float = Field(5.0, ge=0.0, le=10.0)
    away:   float = Field(5.0, ge=0.0, le=10.0)


# ==============================================================================
# MODEL: MatchState (pełny stan meczu – "mózg" silnika)
# ==============================================================================

class MatchState(BaseModel):
    """
    Centralny obiekt stanu meczu.
    Instancjonowany raz na początku symulacji i mutowany co tick.
    """
    # Czas
    current_minute: int   = 0
    current_tick:   int   = 0    # 0-9 w obrębie minuty
    is_finished:    bool  = False

    # Wynik
    score_home: int = 0
    score_away: int = 0

    # Drużyny
    home_players:   List[Player]   = Field(default_factory=list)
    away_players:   List[Player]   = Field(default_factory=list)
    home_tactics:   TeamTactics    = Field(default_factory=TeamTactics)
    away_tactics:   TeamTactics    = Field(default_factory=TeamTactics)

    # Stan boiska
    pitch:          PitchState     = Field(default_factory=PitchState)

    # Statystyki
    home_stats:     MatchStats     = Field(default_factory=MatchStats)
    away_stats:     MatchStats     = Field(default_factory=MatchStats)

    # Historia
    events:         List[MatchEvent]        = Field(default_factory=list)
    momentum_log:   List[MomentumSnapshot]  = Field(default_factory=list)

    # Licznik nieprzerwanego posiadania (do automatycznych zmian posiadania)
    consecutive_possession_ticks: int = 0

    class Config:
        use_enum_values = False   # zachowujemy Enum obiekty wewnętrznie

import random
import math
from dataclasses import dataclass
from typing import Tuple, Optional


# ==============================================================================
# KROK 2 – DUEL CALCULATOR
# ==============================================================================

SIGMA = 3.2          # globalne odchylenie standardowe pojedynków
TICKS_PER_MINUTE = 10
TOTAL_MINUTES    = 90
STAMINA_DRAIN_BASE = 0.08   # % kondycji tracone na tick za uczestnictwo w akcji


class DuelCalculator:
    """
    Statyczna biblioteka matematyki opartej na Gaussie.
    Każda metoda zwraca (sukces: bool, meta: dict) – meta zawiera
    dane potrzebne do aktualizacji statystyk i ocen.
    """

    # ------------------------------------------------------------------
    # 1. PODANIE
    # ------------------------------------------------------------------
    @staticmethod
    def calculate_pass(
        passer:   "Player",
        receiver: "Player",
        defender: Optional["Player"],
        tactics:  "TeamTactics",
    ) -> Tuple[bool, dict]:
        """
        Gauss-based pass resolution.

        mu_passer  = Passing*1.5 + Vision + First_touch + Decisions
        mu_defender= Marking*1.2 + Positioning + Concentration
        (brak obrońcy → mu_defender = 5.0 bazowe)

        Zwraca (success, {xg_delta, rating_delta_passer, key_pass})
        """
        p = passer

        # Długie podania zwiększają ryzyko (directness taktyki)
        directness_penalty = (tactics.directness - 1) * 0.3   # 0.0 – 1.2

        mu_passer = (
            p.effective_attr("passing")    * 0.9
            + p.effective_attr("vision")   * 0.5
            + p.effective_attr("first_touch") * 0.4
            + p.effective_attr("decisions") * 0.3
            - directness_penalty
        )

        if defender:
            mu_def = (
                defender.effective_attr("marking")        * 0.8
                + defender.effective_attr("positioning")  * 0.6
                + defender.effective_attr("concentration") * 0.4
            )
        else:
            mu_def = 4.0   # przestrzeń bez krycia

        roll_passer  = random.gauss(mu_passer, SIGMA)
        roll_def     = random.gauss(mu_def,    SIGMA)

        success = roll_passer > roll_def

        # Kluczowe podanie: sukces i piłka ląduje w strefie ataku
        key_pass = success and random.random() < 0.12

        rating_delta = 0.04 if success else -0.05
        if key_pass:
            rating_delta = 0.10

        return success, {
            "key_pass":          key_pass,
            "rating_delta":      rating_delta,
            "defender_blocked":  not success,
        }

    # ------------------------------------------------------------------
    # 2. STRZAŁ + xG
    # ------------------------------------------------------------------
    @staticmethod
    def calculate_shot(
        shooter:     "Player",
        goalkeeper:  "Player",
        zone_longitudinal: "ZoneLongitudinal",
        zone_lateral:      "ZoneLateral",
    ) -> Tuple[bool, dict]:
        """
        Strzał z Gaussem. Generuje xG i decyduje o golu.

        mu_shooter = Finishing*1.5 + Composure + Positioning
        mu_gk      = GK_Reflexes*1.5 + GK_Positioning + GK_Handling

        xG bazowe wg strefy (0.03 – 0.35).
        xG modyfikowane przez różnicę Gauss roll'i.
        """
        # ---- Bazowe xG według strefy boiska ----
        if zone_longitudinal == ZoneLongitudinal.ATTACK:
            base_xg = 0.09 if zone_lateral == ZoneLateral.CENTER else 0.04
        elif zone_longitudinal == ZoneLongitudinal.MIDFIELD:
            base_xg = 0.020
        else:
            base_xg = 0.008   # długi strzał z obrony

        s  = shooter
        gk = goalkeeper

        mu_shooter = (
            s.effective_attr("finishing")   * 1.5
            + s.effective_attr("composure")
            + s.effective_attr("positioning")
        )
        mu_gk = (
            gk.effective_attr("gk_reflexes")    * 1.5
            + gk.effective_attr("gk_positioning")
            + gk.effective_attr("gk_handling")
        )

        roll_s  = random.gauss(mu_shooter, SIGMA)
        roll_gk = random.gauss(mu_gk, SIGMA)

        # xG skalowane wynikiem Gaussa (norma: roll przewaga max ~20 pkt)
        advantage = max(-1.0, min(1.0, (roll_s - roll_gk) / 20.0))
        xg = max(0.01, min(0.95, base_xg + advantage * base_xg * 1.5))

        # Czy padnie gol? Losujemy z wyznaczonego xG
        is_goal = random.random() < xg

        # Czy strzał był celny (na bramkę)?
        on_target = is_goal or (roll_s > roll_gk * 0.8 and random.random() < 0.55)

        rating_delta_shooter  = 0.08 if is_goal else (0.02 if on_target else -0.03)
        rating_delta_gk       = -0.10 if is_goal else (0.05 if on_target else 0.0)

        return is_goal, {
            "xg":                  round(xg, 3),
            "on_target":           on_target,
            "rating_delta_shooter": rating_delta_shooter,
            "rating_delta_gk":     rating_delta_gk,
        }

    # ------------------------------------------------------------------
    # 3. POJEDYNEK 1v1 (drybling / odbiór)
    # ------------------------------------------------------------------
    @staticmethod
    def calculate_duel(
        attacker: "Player",
        defender: "Player",
        is_aerial: bool = False,
    ) -> Tuple[bool, dict]:
        """
        Ogólny pojedynek zawodnik vs zawodnik.

        Naziemny:  Dribbling + Pace vs Tackling + Pace
        Powietrzny: Heading + Strength vs Heading + Strength

        Zwraca (attacker_wins, meta)
        """
        a = attacker
        d = defender

        if is_aerial:
            mu_att = a.effective_attr("heading") * 1.2 + a.effective_attr("strength")
            mu_def = d.effective_attr("heading") * 1.2 + d.effective_attr("strength")
        else:
            mu_att = (
                a.effective_attr("dribbling") * 1.3
                + a.effective_attr("pace")    * 0.7
            )
            mu_def = (
                d.effective_attr("tackling") * 1.3
                + d.effective_attr("pace")   * 0.7
                + d.effective_attr("aggression") * 0.3
            )

        roll_att = random.gauss(mu_att, SIGMA)
        roll_def = random.gauss(mu_def, SIGMA)

        att_wins = roll_att > roll_def

        # Szansa na faul przy przegranym defensywie (agresja + margines)
        foul_chance = 0.0
        if not att_wins and not is_aerial:
            deficit = roll_att - roll_def   # ujemny → duży deficit = agresywny odbiór
            foul_chance = max(0.0, min(0.35, (-deficit / 20.0) * (d.effective_attr("aggression") / 10.0)))

        foul = (not att_wins) and (random.random() < foul_chance)

        rating_delta_att = 0.06 if att_wins else -0.04
        rating_delta_def = -0.04 if att_wins else 0.05

        return att_wins, {
            "foul":              foul,
            "rating_delta_att":  rating_delta_att,
            "rating_delta_def":  rating_delta_def,
            "is_aerial":         is_aerial,
        }

    # ------------------------------------------------------------------
    # 4. PRESSING / PRZECHWYT
    # ------------------------------------------------------------------
    @staticmethod
    def calculate_interception(
        presser:    "Player",
        ball_carrier: "Player",
        tactics_pressure: int,       # 1-5, z TeamTactics.pressing
    ) -> Tuple[bool, dict]:
        """
        Szansa na przechwyt (pressing) przy podaniu lub przeniesieniu piłki.
        """
        mu_press = (
            presser.effective_attr("positioning") * 1.1
            + presser.effective_attr("concentration")
            + (tactics_pressure - 1) * 1.5
        )
        mu_carrier = (
            ball_carrier.effective_attr("first_touch")
            + ball_carrier.effective_attr("decisions") * 0.8
            + ball_carrier.effective_attr("vision")    * 0.5
        )

        roll_p = random.gauss(mu_press,   SIGMA)
        roll_c = random.gauss(mu_carrier, SIGMA)

        intercepted = roll_p > roll_c

        return intercepted, {
            "rating_delta_presser":  0.15 if intercepted else 0.0,
            "rating_delta_carrier":  -0.12 if intercepted else 0.0,
        }


# ==============================================================================
# KROK 2 – MATCH ENGINE
# ==============================================================================

# Mapa przejść stref po udanej akcji ofensywnej
ZONE_PROGRESSION = {
    ZoneLongitudinal.DEFENSE:  ZoneLongitudinal.MIDFIELD,
    ZoneLongitudinal.MIDFIELD: ZoneLongitudinal.ATTACK,
    ZoneLongitudinal.ATTACK:   ZoneLongitudinal.ATTACK,   # w ataku - strzał lub powrót
}
ZONE_REGRESSION = {
    ZoneLongitudinal.ATTACK:   ZoneLongitudinal.MIDFIELD,
    ZoneLongitudinal.MIDFIELD: ZoneLongitudinal.DEFENSE,
    ZoneLongitudinal.DEFENSE:  ZoneLongitudinal.DEFENSE,
}
ALL_LATERAL = [ZoneLateral.LEFT, ZoneLateral.CENTER, ZoneLateral.RIGHT]
ALL_LONGITUDINAL = [ZoneLongitudinal.DEFENSE, ZoneLongitudinal.MIDFIELD, ZoneLongitudinal.ATTACK]


class MatchEngine:
    """
    Główny silnik symulacji meczu.
    Instancjonowany raz; wywołuj simulate_tick() co iterację,
    aż state.is_finished == True.
    """

    def __init__(self, state: "MatchState"):
        self.state = state
        self._calc = DuelCalculator()

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def _home_players_on_pitch(self) -> List["Player"]:
        return [p for p in self.state.home_players if p.is_on_pitch]

    def _away_players_on_pitch(self) -> List["Player"]:
        return [p for p in self.state.away_players if p.is_on_pitch]

    def _attacking_players(self) -> List["Player"]:
        """Zawodnicy drużyny posiadającej piłkę na boisku."""
        if self.state.pitch.home_possession:
            return self._home_players_on_pitch()
        return self._away_players_on_pitch()

    def _defending_players(self) -> List["Player"]:
        """Zawodnicy drużyny BRONIĄCEJ na boisku."""
        if self.state.pitch.home_possession:
            return self._away_players_on_pitch()
        return self._home_players_on_pitch()

    def _attacking_tactics(self) -> "TeamTactics":
        return self.state.home_tactics if self.state.pitch.home_possession else self.state.away_tactics

    def _defending_tactics(self) -> "TeamTactics":
        return self.state.away_tactics if self.state.pitch.home_possession else self.state.home_tactics

    def _attacking_stats(self) -> "MatchStats":
        return self.state.home_stats if self.state.pitch.home_possession else self.state.away_stats

    def _defending_stats(self) -> "MatchStats":
        return self.state.away_stats if self.state.pitch.home_possession else self.state.home_stats

    def _team_label(self) -> str:
        return "home" if self.state.pitch.home_possession else "away"

    def _pick_random(self, players: List["Player"], prefer_pos: List[str] = None) -> Optional["Player"]:
        """Losuje zawodnika, preferując podane pozycje."""
        if not players:
            return None
        if prefer_pos:
            preferred = [p for p in players if any(pos in p.position for pos in prefer_pos)]
            if preferred:
                return random.choice(preferred)
        return random.choice(players)

    def _find_goalkeeper(self, is_home: bool) -> Optional["Player"]:
        pool = self._home_players_on_pitch() if is_home else self._away_players_on_pitch()
        gk = [p for p in pool if "GK" in p.position or "BR" in p.position]
        return gk[0] if gk else (pool[0] if pool else None)

    def _update_rating(self, player: "Player", delta: float) -> None:
        player.match_rating = round(max(1.0, min(10.0, player.match_rating + delta)), 2)

    def _drain_stamina(self, player: "Player", multiplier: float = 1.0) -> None:
        drain = STAMINA_DRAIN_BASE * multiplier
        # Wysoka stamina atrybutu redukuje drenaż
        attr_factor = 1.0 - (player.attributes.stamina - 10) / 40.0   # -0.25 – +0.25
        player.current_stamina = max(0.0, player.current_stamina - drain * attr_factor)

    def _swap_possession(self) -> None:
        """Oddaje posiadanie rywalowi i resetuje licznik ciągłego posiadania."""
        self.state.pitch.home_possession = not self.state.pitch.home_possession
        self.state.pitch.ball_carrier_id = None
        self.state.consecutive_possession_ticks = 0

    def _push_event(self, event_type: str, text: str, player: Optional["Player"] = None,
                    xg: float = None) -> None:
        ev = MatchEvent(
            minute=self.state.current_minute,
            tick=self.state.current_tick,
            event_type=event_type,
            team=self._team_label(),
            player_id=player.id if player else None,
            player_name=player.name if player else None,
            text=text,
            xg=xg,
        )
        self.state.events.append(ev)

    def _advance_zone(self, success: bool, lateral_shift: bool = False) -> None:
        """Przesuwa piłkę do przodu lub do tyłu w siatce stref."""
        pitch = self.state.pitch
        if success:
            pitch.zone_longitudinal = ZONE_PROGRESSION[pitch.zone_longitudinal]
        else:
            pitch.zone_longitudinal = ZONE_REGRESSION[pitch.zone_longitudinal]

        if lateral_shift:
            pitch.zone_lateral = random.choice(ALL_LATERAL)

    # ------------------------------------------------------------------
    # DECYZJA: Co robi zawodnik z piłką?
    # ------------------------------------------------------------------

    def _decide_action(self) -> str:
        """
        Na podstawie strefy i taktyki wybiera akcję:
        'pass', 'dribble', 'shot'
        """
        zone = self.state.pitch.zone_longitudinal
        bias = self._attacking_tactics().mentality_attack_bias   # 0.30 – 0.75

        if zone == ZoneLongitudinal.DEFENSE:
            # W obronie dominują podania – zawodnik szuka wyjścia
            weights = {"pass": 0.88, "dribble": 0.10, "shot": 0.02}
        elif zone == ZoneLongitudinal.MIDFIELD:
            # W środku zależy od taktyki
            shot_w   = max(0.02, (bias - 0.4) * 0.06)
            drib_w   = 0.06 + (bias - 0.4) * 0.07
            pass_w   = 1.0 - shot_w - drib_w
            weights = {"pass": pass_w, "dribble": drib_w, "shot": shot_w}
        else:   # ATTACK
            shot_w   = 0.10 + (bias - 0.50) * 0.14
            drib_w   = 0.18
            pass_w   = max(0.35, 1.0 - shot_w - drib_w)
            weights = {"pass": pass_w, "dribble": drib_w, "shot": shot_w}

        choices = list(weights.keys())
        probs   = list(weights.values())
        return random.choices(choices, weights=probs, k=1)[0]

    # ------------------------------------------------------------------
    # AKCJE INDYWIDUALNE
    # ------------------------------------------------------------------

    def _do_pass(self, carrier: "Player") -> None:
        att_pool = [p for p in self._attacking_players() if p.id != carrier.id]
        receiver = self._pick_random(att_pool)
        if receiver is None:
            return

        def_pool = self._defending_players()
        defender = self._pick_random(def_pool, prefer_pos=["CM", "DM", "ŚP", "DP"])

        tact = self._attacking_tactics()
        success, meta = DuelCalculator.calculate_pass(carrier, receiver, defender, tact)

        # Aktualizacja statystyk podań
        att_stats = self._attacking_stats()
        att_stats.passes_attempted += 1
        carrier.stats.passes_attempted += 1

        if success:
            att_stats.passes_completed += 1
            carrier.stats.passes_completed += 1
            if meta["key_pass"]:
                carrier.stats.key_passes += 1

            self._advance_zone(success=True, lateral_shift=random.random() < 0.3)
        else:
            # Przechwyt lub wybicie
            if defender:
                self._defending_stats().interceptions += 1
                defender.stats.interceptions += 1
                self._update_rating(defender, 0.10)
            self._swap_possession()
            self._advance_zone(success=False)

        self._update_rating(carrier, meta["rating_delta"])
        self._drain_stamina(carrier, 0.5)

    def _do_dribble(self, carrier: "Player") -> None:
        def_pool = self._defending_players()
        defender = self._pick_random(def_pool, prefer_pos=["CB", "ŚO", "LO", "PO"])
        if defender is None:
            # Brak obrońcy – łatwy postęp
            self._advance_zone(success=True)
            return

        att_wins, meta = DuelCalculator.calculate_duel(
            carrier, defender,
            is_aerial=self.state.pitch.ball_is_aerial,
        )

        carrier.stats.dribbles_attempted += 1

        if att_wins:
            carrier.stats.dribbles_succeeded += 1
            self._advance_zone(success=True, lateral_shift=True)
        else:
            if meta["foul"]:
                defender.stats.fouls_committed += 1
                carrier.stats.fouls_suffered += 1
                self._attacking_stats().fouls += 1
                # Stały fragment gry – utrzymuje posiadanie atakującemu
                # (logika stałych fragmentów w Kroku 3)
            else:
                self._swap_possession()
                self._advance_zone(success=False)

        self._update_rating(carrier, meta["rating_delta_att"])
        self._update_rating(defender, meta["rating_delta_def"])
        self._drain_stamina(carrier)
        self._drain_stamina(defender, 1.2)   # obrońca mocniej haczy

    def _do_shot(self, carrier: "Player") -> None:
        zone_long = self.state.pitch.zone_longitudinal
        zone_lat  = self.state.pitch.zone_lateral

        defending_home = not self.state.pitch.home_possession
        gk = self._find_goalkeeper(is_home=defending_home)
        if gk is None:
            return

        is_goal, meta = DuelCalculator.calculate_shot(carrier, gk, zone_long, zone_lat)

        # ── Statystyki strzałów (goals <= shots_on_target ZAWSZE) ────────
        att_stats = self._attacking_stats()
        att_stats.shots += 1
        att_stats.xg   += meta["xg"]
        att_stats.attack_direction_shots[zone_lat] += 1
        carrier.stats.shots += 1
        carrier.stats.xg_generated += meta["xg"]

        if meta["on_target"]:
            # Strzał celny – trafia w przestrzeń bramkową
            att_stats.shots_on_target += 1
            carrier.stats.shots_on_target += 1

            if meta.get("saved"):
                # Bramkarz obronił → statystyki obrony
                def_stats = self._defending_stats()
                if hasattr(def_stats, "saves"):
                    def_stats.saves = getattr(def_stats, "saves", 0) + 1
                gk.stats.shots_on_target += 1   # rejestrujemy u GK jako strzały "przyjęte"

        self._update_rating(carrier, meta["rating_delta_shooter"])
        self._update_rating(gk,      meta["rating_delta_gk"])
        self._drain_stamina(carrier, 0.8)

        if is_goal:
            if self.state.pitch.home_possession:
                self.state.score_home += 1
                self.state.home_stats.goals += 1
            else:
                self.state.score_away += 1
                self.state.away_stats.goals += 1

            carrier.stats.goals += 1
            self._push_event(
                "goal",
                f"GOL! {carrier.name} trafia do siatki! ({self.state.score_home}:{self.state.score_away})",
                player=carrier,
                xg=meta["xg"],
            )
            # Po golu – wznowienie z centrum
            self.state.pitch.zone_longitudinal = ZoneLongitudinal.MIDFIELD
            self.state.pitch.zone_lateral      = ZoneLateral.CENTER
            self._swap_possession()
        else:
            self._push_event(
                "shot",
                f"Strzał {carrier.name}! {'Na bramkę' if meta['on_target'] else 'Obok'} (xG: {meta['xg']:.2f})",
                player=carrier,
                xg=meta["xg"],
            )
            if meta["on_target"]:
                # Bramkarz wybija – rzut rożny lub autem (losowo)
                if random.random() < 0.25:
                    att_stats.corners += 1
            # Piłka wraca do obrony broniących
            self.state.pitch.zone_longitudinal = ZoneLongitudinal.MIDFIELD
            self._swap_possession()

    # ------------------------------------------------------------------
    # AKTUALIZACJA POSIADANIA (statystyki)
    # ------------------------------------------------------------------

    def _update_possession_stats(self) -> None:
        """Zapisuje tick posiadania i strefę do statystyk."""
        att_stats = self._attacking_stats()
        att_stats.possession_ticks += 1
        att_stats.zone_ticks[self.state.pitch.zone_longitudinal] += 1
        self.state.consecutive_possession_ticks += 1

        # Naturalny reset posiadania po długim ciągu (realizm)
        # Szansa na utratę rośnie po 15+ tickach nieprzerwanego posiadania
        if self.state.consecutive_possession_ticks > 15:
            lose_chance = (self.state.consecutive_possession_ticks - 15) * 0.015
            if random.random() < lose_chance:
                self._swap_possession()

    # ------------------------------------------------------------------
    # MOMENTUM (aktualizacja co minutę)
    # ------------------------------------------------------------------

    def _update_momentum(self) -> None:
        """
        Wylicza momentum na koniec każdej minuty.
        Opiera się na strzałach, xG i posiadaniu w ostatnich 5 minutach.
        """
        # Prosta aproksymacja – pełna wersja w Kroku 3
        h_shots = self.state.home_stats.shots
        a_shots = self.state.away_stats.shots
        total_shots = (h_shots + a_shots) or 1

        h_raw = (h_shots / total_shots) * 8 + random.gauss(5, 0.8)
        a_raw = (a_shots / total_shots) * 8 + random.gauss(5, 0.8)

        # Normalizacja do sumy = 10
        total = h_raw + a_raw
        h_mom = round(max(0.5, min(9.5, (h_raw / total) * 10)), 1)
        a_mom = round(10.0 - h_mom, 1)

        self.state.momentum_log.append(MomentumSnapshot(
            minute=self.state.current_minute,
            home=h_mom,
            away=a_mom,
        ))

    # ------------------------------------------------------------------
    # GŁÓWNA METODA: simulate_tick()
    # ------------------------------------------------------------------

    def simulate_tick(self) -> Optional["MatchEvent"]:
        """
        Symuluje jeden tick (6 sekund gry).
        Zwraca MatchEvent jeśli doszło do kluczowej akcji, else None.

        Wywołuj w pętli:
            while not engine.state.is_finished:
                event = engine.simulate_tick()
        """
        state = self.state

        if state.is_finished:
            return None

        # --- Wybierz zawodnika z piłką ---
        att_pool = self._attacking_players()
        if not att_pool:
            self._swap_possession()
            return None

        carrier = self._pick_random(att_pool, prefer_pos=["CM", "AM", "ST", "ŚP", "N"])
        state.pitch.ball_carrier_id = carrier.id

        # --- Aktualizuj statystyki posiadania ---
        self._update_possession_stats()
        carrier.stats.minutes_played = state.current_minute

        # --- Decyzja o akcji ---
        action = self._decide_action()
        events_before = len(state.events)

        if action == "pass":
            self._do_pass(carrier)
        elif action == "dribble":
            self._do_dribble(carrier)
        elif action == "shot":
            self._do_shot(carrier)

        # --- Postęp czasu ---
        state.current_tick += 1
        if state.current_tick >= TICKS_PER_MINUTE:
            state.current_tick = 0
            state.current_minute += 1
            self._update_momentum()

        if state.current_minute >= TOTAL_MINUTES:
            state.is_finished = True

        # --- Zwróć nowe zdarzenie (jeśli powstało) ---
        if len(state.events) > events_before:
            return state.events[-1]
        return None

    # ------------------------------------------------------------------
    # GET LIVE STATS – payload dla frontendu
    # ------------------------------------------------------------------

    def get_live_stats(self) -> dict:
        """
        Zwraca słownik ze wszystkimi statystykami w formacie gotowym
        do wysłania przez FastAPI do frontendu React.

        Gwarantuje:  goals <= shots_on_target <= shots_total
        Posiadanie: ASYMETRYCZNE – liczone na tickach, nie 50/50.
        """
        s  = self.state
        h  = s.home_stats
        a  = s.away_stats

        # ── Posiadanie (na żywo, z ticków) ──────────────────────────────
        total_poss = (h.possession_ticks + a.possession_ticks) or 1
        home_poss_pct = round(h.possession_ticks / total_poss * 100, 1)
        away_poss_pct = round(100.0 - home_poss_pct, 1)

        # ── Oceny zawodników ─────────────────────────────────────────────
        def player_rating_list(players):
            return [
                {
                    "id":     p.id,
                    "name":   p.name,
                    "pos":    p.position,
                    "rating": round(p.match_rating, 1),
                    "stamina": round(p.current_stamina, 1),
                    "goals":  p.stats.goals,
                    "shots":  p.stats.shots,
                    "passes_completed": p.stats.passes_completed,
                    "passes_attempted": p.stats.passes_attempted,
                }
                for p in players if p.is_on_pitch
            ]

        # ── Kierunki Ataku (%%) ──────────────────────────────────────────
        h_dir = h.attack_directions_pct()
        a_dir = a.attack_directions_pct()

        # ── Strefy Akcji (%%) ────────────────────────────────────────────
        h_zones = h.action_zones_pct()
        a_zones = a.action_zones_pct()

        return {
            # Czas i wynik
            "minute":      s.current_minute,
            "tick":        s.current_tick,
            "score_home":  s.score_home,
            "score_away":  s.score_away,
            "is_finished": s.is_finished,

            # Statystyki drużyn
            "home": {
                "possession_pct":   home_poss_pct,
                "pass_accuracy_pct": h.pass_accuracy,
                "shots_total":      h.shots,
                "shots_on_target":  h.shots_on_target,   # <= shots_total
                "goals":            h.goals,              # <= shots_on_target
                "cumulative_xg":    round(h.xg, 2),
                "corners":          h.corners,
                "fouls":            h.fouls,
                "yellow_cards":     h.yellow_cards,
                "red_cards":        h.red_cards,
                "action_zones_pct": {
                    "defense":  h_zones.get("DEFENSE",  0.0),
                    "midfield": h_zones.get("MIDFIELD", 0.0),
                    "attack":   h_zones.get("ATTACK",   0.0),
                },
                "attack_directions_pct": {
                    "left":   h_dir.get("LEFT",   0.0),
                    "center": h_dir.get("CENTER", 0.0),
                    "right":  h_dir.get("RIGHT",  0.0),
                },
                "player_ratings": player_rating_list(s.home_players),
            },

            "away": {
                "possession_pct":   away_poss_pct,
                "pass_accuracy_pct": a.pass_accuracy,
                "shots_total":      a.shots,
                "shots_on_target":  a.shots_on_target,
                "goals":            a.goals,
                "cumulative_xg":    round(a.xg, 2),
                "corners":          a.corners,
                "fouls":            a.fouls,
                "yellow_cards":     a.yellow_cards,
                "red_cards":        a.red_cards,
                "action_zones_pct": {
                    "defense":  a_zones.get("DEFENSE",  0.0),
                    "midfield": a_zones.get("MIDFIELD", 0.0),
                    "attack":   a_zones.get("ATTACK",   0.0),
                },
                "attack_directions_pct": {
                    "left":   a_dir.get("LEFT",   0.0),
                    "center": a_dir.get("CENTER", 0.0),
                    "right":  a_dir.get("RIGHT",  0.0),
                },
                "player_ratings": player_rating_list(s.away_players),
            },

            # Momentum (ostatnie snapshoty dla wykresu)
            "momentum": [
                {"minute": m.minute, "home": m.home, "away": m.away}
                for m in s.momentum_log[-10:]   # ostatnie 10 minut
            ],

            # Zdarzenia (ostatnie 20 dla komentarza)
            "events": [
                {
                    "min":    e.minute,
                    "text":   e.text,
                    "type":   e.event_type,
                    "team":   e.team,
                    "player": e.player_name,
                    "xg":     e.xg,
                }
                for e in s.events[-20:]
            ],

            # Stan boiska (dla panelu "Kierunki Ataku" w UI)
            "pitch": {
                "zone_longitudinal": s.pitch.zone_longitudinal.value,
                "zone_lateral":      s.pitch.zone_lateral.value,
                "home_possession":   s.pitch.home_possession,
            },
        }

    # ------------------------------------------------------------------
    # SIMULATE FULL MATCH (convenience)
    # ------------------------------------------------------------------

    def simulate_full_match(self) -> "MatchState":
        """
        Symuluje cały mecz i zwraca końcowy MatchState.
        Używaj tylko po stronie backendu (blokujące).
        """
        total_ticks = TOTAL_MINUTES * TICKS_PER_MINUTE
        for _ in range(total_ticks):
            if self.state.is_finished:
                break
            self.simulate_tick()
        self.state.is_finished = True
        return self.state
