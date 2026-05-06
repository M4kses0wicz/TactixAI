"""
CommentaryGenerator – Generator Komentarza Meczowego (PL)
=========================================================
Produkuje zróżnicowane polskie komentarze na podstawie MatchEvent.
Używa systemu szablonów z losowaniem wariantu, by uniknąć powtórzeń.
"""

from __future__ import annotations

import random
from typing import Optional


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _pick(*variants: str) -> str:
    """Losuje jeden z podanych wariantów komentarza."""
    return random.choice(variants)


def _fmt(template: str, **kwargs) -> str:
    """Bezpieczne formatowanie – brakujące klucze zastępuje '???'."""
    try:
        return template.format(**kwargs)
    except KeyError:
        return template


# ---------------------------------------------------------------------------
# COMMENTARY GENERATOR
# ---------------------------------------------------------------------------

class CommentaryGenerator:
    """
    Generuje komentarz na żywo (PL) dla zdarzeń MatchEngine.

    Użycie:
        cg = CommentaryGenerator()
        text = cg.generate(event_type="goal", player="Lewandowski",
                           goalkeeper="Alisson", minute=73,
                           score_home=2, score_away=1)
    """

    # ------------------------------------------------------------------
    # PUBLICZNY INTERFEJS
    # ------------------------------------------------------------------

    def generate(
        self,
        event_type: str,
        minute: int = 0,
        player: Optional[str] = None,
        goalkeeper: Optional[str] = None,
        defender: Optional[str] = None,
        team: str = "home",
        xg: Optional[float] = None,
        score_home: int = 0,
        score_away: int = 0,
        card_type: str = "yellow",
        set_piece_type: str = "free_kick",
        **kwargs,
    ) -> str:
        """
        Główna metoda. Deleguje do właściwego generatora na podstawie event_type.

        Parametry:
            event_type      – typ zdarzenia: 'goal','shot','save','foul',
                              'card','corner','set_piece','penalty',
                              'interception','kick_off','full_time','half_time'
            minute          – minuta meczu
            player          – imię zawodnika wykonującego akcję
            goalkeeper      – imię bramkarza (przy strzałach/rzutach)
            defender        – imię obrońcy (przy duelach/faulach)
            team            – 'home' | 'away'
            xg              – wartość xG strzału
            score_home      – wynik gospodarzy
            score_away      – wynik gości
            card_type       – 'yellow' | 'red'
            set_piece_type  – 'free_kick' | 'corner' | 'penalty'
        """
        p   = player      or "zawodnik"
        gk  = goalkeeper  or "bramkarz"
        def_ = defender   or "obrońca"
        xg_str = f"{xg:.2f}" if xg is not None else "?"
        score  = f"{score_home}:{score_away}"

        dispatch = {
            "goal":          lambda: self._goal(p, gk, minute, score),
            "shot":          lambda: self._shot(p, xg_str, xg),
            "save":          lambda: self._save(gk, p, xg_str),
            "foul":          lambda: self._foul(p, def_),
            "card":          lambda: self._card(p, card_type),
            "corner":        lambda: self._corner(p, team),
            "interception":  lambda: self._interception(def_, p),
            "set_piece":     lambda: self._set_piece(p, set_piece_type, gk),
            "penalty":       lambda: self._penalty(p, gk),
            "kick_off":      lambda: self._kick_off(minute),
            "half_time":     lambda: self._half_time(score),
            "full_time":     lambda: self._full_time(score, score_home, score_away),
            "dribble_won":   lambda: self._dribble_won(p, def_),
            "dribble_lost":  lambda: self._dribble_lost(p, def_),
            "key_pass":      lambda: self._key_pass(p),
            "offside":       lambda: self._offside(p),
            "substitution":  lambda: self._substitution(p, def_),  # def_ = wchodzący
        }

        handler = dispatch.get(event_type)
        if handler:
            return handler()
        return f"{minute}' – Zdarzenie na boisku."

    # ------------------------------------------------------------------
    # SZABLONY PER TYP ZDARZENIA
    # ------------------------------------------------------------------

    def _goal(self, player: str, gk: str, minute: int, score: str) -> str:
        return _pick(
            f"GOOOL! {player} pokonuje {gk} i trafia do siatki! {score} — to jest gol na wagę złota!",
            f"BRAMKA! Piękne uderzenie {player}a i piłka ląduje w siatce! Stan meczu: {score}!",
            f"Niesamowite! {player} bez szans dla {gk}! {minute}. minuta i mamy {score}!",
            f"TAK! {player} trafia! {gk} był bezradny! Wynik: {score}!",
            f"GOL! {player} wykańcza akcję jak mistrz. Boisko eksploduje radością! {score}.",
            f"Genialne! Fenomenalne uderzenie {player}a! {gk} nawet nie drgnął. {score}!",
            f"ZDOBYTA BRAMKA! {player} jest niesamowity dzisiaj — {score} na tablicy wyników!",
        )

    def _shot(self, player: str, xg_str: str, xg: Optional[float]) -> str:
        if xg is not None and xg > 0.35:
            return _pick(
                f"Groźny strzał {player}a! Duże zagrożenie pod bramką (xG: {xg_str})!",
                f"To był GROŹNY strzał {player}a! Szczęście po stronie bramkarza (xG: {xg_str}).",
                f"Prawie! {player} strzela z doskonałej pozycji (xG: {xg_str}). Bramkarz na posterunku!",
            )
        return _pick(
            f"Strzał {player}a, ale piłka mija bramkę (xG: {xg_str}). Słaby dzień.",
            f"Próba {player}a — niecelnie. Sporo do poprawy (xG: {xg_str}).",
            f"{player} strzela obok bramki. Trener kręci głową. xG wyniosło ledwie {xg_str}.",
            f"Nic z tego! {player} marnuje okazję. Strzał minął słupek (xG: {xg_str}).",
        )

    def _save(self, gk: str, player: str, xg_str: str) -> str:
        return _pick(
            f"Genialna interwencja! {gk} zatrzymuje uderzenie {player}a!",
            f"Fenomenalna obrona {gk}a! {player} był już pewny gola — a tu niespodzianka!",
            f"Brawa dla {gk}a! Rzucił się w prawy róg i wybił strzał {player}a. xG: {xg_str}.",
            f"{gk} RATUJE! Nie do wiary, jak ten bramkarz to obronił! {player} łapie się za głowę.",
            f"Kapitalna parada {gk}a! Strzał {player}a (xG: {xg_str}) — bezpieczny w rękach bramkarza.",
            f"Bramkarz bez szans? Nie dla {gk}a! Fenomenalny refleks ratuje jego drużynę!",
        )

    def _foul(self, player: str, victim: str) -> str:
        return _pick(
            f"Faul {player}a na {victim}u! Sędzia przerywa grę.",
            f"Brzydkie wejście {player}a! Sędzia nie ma wątpliwości — faul!",
            f"{player} traci głowę i fauluje {victim}a. Gwizdek sędziego.",
            f"To był niepotrzebny faul {player}a. {victim} wstaje i protestuje.",
            f"Zatrzymany {victim} przez {player}a — ale nieczysto! Sędzia gwiżdże.",
        )

    def _card(self, player: str, card_type: str) -> str:
        if card_type == "red":
            return _pick(
                f"CZERWONA KARTKA! {player} opuszcza boisko! To zmienia wszystko!",
                f"Sędzia sięga po CZERWONĄ kartkę dla {player}a. Drużyna gra w dziesięciu!",
                f"Katastrofa! {player} dostaje czerwoną kartkę i musi opuścić murawę.",
                f"Koniec gry dla {player}a. Sędzia pokazuje czerwień — bez dyskusji!",
            )
        return _pick(
            f"Brzydki faul {player}a. Sędzia udziela mu upomnienia i sięga po żółtą kartkę.",
            f"Żółta kartka dla {player}a! Jeden krok od czerwonej — uwaga!",
            f"{player} karany żółtą kartką. Musi uważać w drugiej połowie.",
            f"Upomnienie dla {player}a. Sędzia wyciąga żółtą kartkę bez wahania.",
        )

    def _corner(self, player: str, team: str) -> str:
        side = "gospodarze" if team == "home" else "goście"
        return _pick(
            f"Rzut rożny dla drużyny! {side} mają teraz okazję na zagrożenie z dośrodkowania.",
            f"Piłka za linię — rzut rożny! {player} podchodzi do chorągiewki.",
            f"Rożny dla {side}. Wszyscy wyskakują do górki — napięcie rośnie!",
            f"{player} ustawia piłkę przy chorągiewce. Rożny — okazja dla {side}!",
        )

    def _interception(self, defender: str, attacker: str) -> str:
        return _pick(
            f"Świetny przechwyt {defender}a! {attacker} traci piłkę w środkowej strefie.",
            f"{defender} czyta grę jak otwarta książka i przechwytuje podanie {attacker}a!",
            f"Doskonały pressing! {defender} odbiera piłkę {attacker}owi. Kontrakcja możliwa!",
            f"Brawurowa interwencja {defender}a — przechwycił podanie i przejął inicjatywę!",
        )

    def _set_piece(self, player: str, sp_type: str, gk: str) -> str:
        if sp_type == "corner":
            return _pick(
                f"{player} dośrodkowuje z chorągiewki — walka w powietrzu, ogromne zamieszanie pod bramką!",
                f"Rzut rożny! {player} podaje w pole karne, wszyscy skaczą, bramkarz {gk} wybiega!",
                f"Dośrodkowanie {player}a z rogu! Piłka wisi w powietrzu — kto doskoczy?",
                f"{player} krzyżuje piłkę z rogu — gęsto w polu karnym. {gk} interweniuje!",
            )
        if sp_type == "penalty":
            return self._penalty(player, gk)
        # free_kick
        return _pick(
            f"Rzut wolny w okolicach pola karnego. {player} ustawia piłkę...",
            f"{player} mierzy zza muru. Napięcie sięga zenitu — wolny w niebezpiecznej strefie!",
            f"Rzut wolny dla drużyny! {player} jest precyzjonistą — bramkarz {gk} staje w murze.",
            f"Piłka na wolnym! {player} z zamachem — czy pokona defensywę {gk}a?",
        )

    def _penalty(self, player: str, gk: str) -> str:
        return _pick(
            f"RZUT KARNY! {player} podchodzi do jedenastki. Twarze napięte do granic możliwości.",
            f"Jedenaście metrów! {player} kontra {gk} — kto wygra pojedynek nerwów?",
            f"Karny! Cisza na stadionie. {player} stawia piłkę na kropce. {gk} w gotowości.",
            f"PENALTI! {player} podchodzi do piłki. Cały stadion wstrzymuje oddech...",
            f"Arbitr wskazuje na wapno! {player} — jak wykończy ten rzut karny?",
        )

    def _kick_off(self, minute: int) -> str:
        if minute == 0:
            return _pick(
                "Sędzia gwiżdże — mecz się rozpoczyna! Piłka w grze!",
                "Wszystko gotowe! Zawodnicy wychodzą na murawę, mecz startuje!",
                "Pierwsze gwizdnięcie sędziego. Witamy na żywo z tego starcia!",
            )
        # Druga połowa (minuta 45)
        return _pick(
            "Wznowienie! Piłka znowu w grze — zaczyna się druga połowa!",
            "Sędzia gwiżdże po przerwie. Czas na drugą odsłonę!",
            "Drużyny wychodzą z szatni. Druga połowa startuje!",
        )

    def _half_time(self, score: str) -> str:
        return _pick(
            f"Sędzia gwiżdże na przerwę! Wynik po 45 minutach: {score}. Drużyny schodzą do szatni.",
            f"Przerwa! Czas na refleksję dla obu sztabów. Stan gry: {score}.",
            f"Pierwsza połowa za nami — {score}. Co zmienią trenerzy w szatni?",
        )

    def _full_time(self, score: str, home: int, away: int) -> str:
        if home > away:
            result = "Zwycięstwo gospodarzy"
        elif away > home:
            result = "Triumf gości"
        else:
            result = "Remis"
        return _pick(
            f"KONIEC MECZU! Wynik końcowy: {score}. {result}! Niesamowite spotkanie.",
            f"Trzy gwizdki! To koniec. {score} — {result}. Niesamowita atmosfera!",
            f"Mecz dobiegł końca! {score}. {result} po 90 minutach walki.",
        )

    def _dribble_won(self, player: str, defender: str) -> str:
        return _pick(
            f"{player} mija {defender}a jak tyczki! Fantastyczny drybling!",
            f"Nieprawdopodobne! {player} zostawia {defender}a w miejscu eleganckim zwrotem.",
            f"Brawurowy drybling {player}a! {defender} nie miał szans — 1 na 1 wygrane!",
        )

    def _dribble_lost(self, player: str, defender: str) -> str:
        return _pick(
            f"{defender} odbiera piłkę {player}owi w idealnym momencie!",
            f"Koniec dryblu — {defender} blokuje {player}a i przejmuje inicjatywę.",
            f"Dobry odbiór {defender}a! {player} traci piłkę w kluczowym momencie.",
        )

    def _key_pass(self, player: str) -> str:
        return _pick(
            f"Znakomite podanie {player}a! Piłka trafia między linie — to musi prowadzić do okazji!",
            f"Kluczowe podanie {player}a rozbija defensywę! Partnerzy w znakomitej pozycji.",
            f"Genialna wizja {player}a! To podanie rozrywa blok obronny rywala.",
        )

    def _offside(self, player: str) -> str:
        return _pick(
            f"Spalony! {player} był na pozycji spalonej. Sędzia asystent podnosi chorągiewkę.",
            f"Ofsajd! {player} wyprzedził ostatniego obrońcę o krok. Gol nie uznany.",
            f"Precyzyjna linia — {player} złapany na spalonym. Akcja zostaje anulowana.",
        )

    def _substitution(self, off_player: str, on_player: str) -> str:
        return _pick(
            f"Zmiana! {off_player} schodzi z murawy, a jego miejsce zajmuje {on_player}. Nowa energia!",
            f"Trener decyduje się na ruch — {on_player} wchodzi, {off_player} opuszcza boisko.",
            f"Zmiana w składzie: witamy {on_player}a na boisku! {off_player} schodzi przy oklaskach.",
        )
