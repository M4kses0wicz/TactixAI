import personIcon from "../assets/user-icon.png";
import "../styles/PlayerList/css/PlayerList.css";

const STATUS_COLOR = {
  healthy: "#00FF00",
  minor: "#FFFF00",
  injured: "#FF0000",
  suspended: "#FF0000",
};

const STATUS_LABEL = {
  healthy: "W dobrej formie",
  minor: "Lekki uraz",
  injured: "Kontuzjowany",
  suspended: "Zawieszony",
};

function scoreColor(score) {
  if (score >= 8.5) return "#00FF00";
  if (score >= 7.5) return "#008000";
  if (score >= 6.5) return "#FFFF00";
  return "#FF0000";
}

// TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK

// ─── Tutaj jest skład - tutaj zbijak trzea importować rzeczy z bazy danych     // TUUUUUTAJ ZBIJAAAAAAAAK

// TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK // TUUUUUTAJ ZBIJAAAAAAAAK

const STARTING_XI = [
  {
    id: 1,
    name: "Justin Bijlow",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "GK",
    posLabel: "Bramkarz",
    status: "minor",
    score: 7.8,
  },
  {
    id: 2,
    name: "Lutsharel Geertruida",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "RB/CB",
    posLabel: "Obrońca",
    status: "healthy",
    score: 8.6,
  },
  {
    id: 3,
    name: "David Hancko",
    nat: "🇸🇰",
    natCode: "SK",
    pos: "CB",
    posLabel: "Obrońca",
    status: "healthy",
    score: 8.2,
  },
  {
    id: 4,
    name: "Gernot Trauner",
    nat: "🇦🇹",
    natCode: "AT",
    pos: "CB",
    posLabel: "Obrońca",
    status: "injured",
    score: 7.3,
  },
  {
    id: 5,
    name: "Quilindschy Hartman",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "LB",
    posLabel: "Obrońca",
    status: "healthy",
    score: 7.9,
  },
  {
    id: 6,
    name: "Mats Wieffer",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "CDM",
    posLabel: "Pomocnik",
    status: "suspended",
    score: 8.4,
  },
  {
    id: 7,
    name: "Quinten Timber",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "CM",
    posLabel: "Pomocnik",
    status: "minor",
    score: 7.7,
  },
  {
    id: 8,
    name: "Calvin Stengs",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "CAM/RW",
    posLabel: "Pomocnik",
    status: "healthy",
    score: 8.1,
  },
  {
    id: 9,
    name: "Igor Paixão",
    nat: "🇧🇷",
    natCode: "BR",
    pos: "LW",
    posLabel: "Skrzydłowy",
    status: "minor",
    score: 7.6,
  },
  {
    id: 10,
    name: "Santiago Giménez",
    nat: "🇲🇽",
    natCode: "MX",
    pos: "ST",
    posLabel: "Napastnik",
    status: "healthy",
    score: 9.1,
  },
  {
    id: 11,
    name: "Yankuba Minteh",
    nat: "🇬🇲",
    natCode: "GM",
    pos: "RW",
    posLabel: "Skrzydłowy",
    status: "minor",
    score: 7.8,
  },
];

const RESERVES = [
  {
    id: 12,
    name: "Timon Wellenreuther",
    nat: "🇩🇪",
    natCode: "DE",
    pos: "GK",
    posLabel: "Bramkarz",
    status: "healthy",
    score: 7.2,
  },
  {
    id: 13,
    name: "Thomas Beelen",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "CB",
    posLabel: "Obrońca",
    status: "minor",
    score: 6.9,
  },
  {
    id: 14,
    name: "Bart Nieuwkoop",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "RB",
    posLabel: "Obrońca",
    status: "healthy",
    score: 7.1,
  },
  {
    id: 15,
    name: "Marcos López",
    nat: "🇵🇪",
    natCode: "PE",
    pos: "LB",
    posLabel: "Obrońca",
    status: "injured",
    score: 6.4,
  },
  {
    id: 16,
    name: "Ramiz Zerrouki",
    nat: "🇩🇿",
    natCode: "DZ",
    pos: "CDM",
    posLabel: "Pomocnik",
    status: "healthy",
    score: 7.6,
  },
  {
    id: 17,
    name: "Ondřej Lingr",
    nat: "🇨🇿",
    natCode: "CZ",
    pos: "CAM",
    posLabel: "Pomocnik",
    status: "suspended",
    score: 7.0,
  },
  {
    id: 18,
    name: "Antoni Milambo",
    nat: "🇳🇱",
    natCode: "NL",
    pos: "CM",
    posLabel: "Pomocnik",
    status: "healthy",
    score: 6.6,
  },
  {
    id: 19,
    name: "Alireza Jahanbakhsh",
    nat: "🇮🇷",
    natCode: "IR",
    pos: "RW",
    posLabel: "Skrzydłowy",
    status: "minor",
    score: 7.3,
  },
  {
    id: 20,
    name: "Ayase Ueda",
    nat: "🇯🇵",
    natCode: "JP",
    pos: "ST",
    posLabel: "Napastnik",
    status: "healthy",
    score: 7.8,
  },
  {
    id: 21,
    name: "Leo Sauer",
    nat: "🇸🇰",
    natCode: "SK",
    pos: "LW",
    posLabel: "Skrzydłowy",
    status: "healthy",
    score: 6.7,
  },
];

function PlayerRow({ player }) {
  const accentColor = STATUS_COLOR[player.status];
  const sc = scoreColor(player.score);
  const isHealthy = player.status === "healthy";

  return (
    <div className="pl-row">
      {/* left accent bar */}
      <span className="pl-row__accent" style={{ background: accentColor }} />

      {/* position */}
      <div className="pl-row__pos">
        <span className="pl-row__pos-code">{player.pos}</span>
        <span className="pl-row__pos-label">{player.posLabel}</span>
      </div>

      {/* nationality */}
      <span className="pl-row__nat" title={player.natCode}>
        {player.nat}
      </span>

      {/* heart */}
      <span
        className="pl-row__heart"
        style={{ color: isHealthy ? "#00FF00" : STATUS_COLOR[player.status] }}
        title={STATUS_LABEL[player.status]}
      >
        ♥
      </span>

      {/* avatar */}
      <div className="pl-row__avatar">
        <img src={personIcon} alt="gracz" />
      </div>

      {/* name */}
      <span className="pl-row__name">{player.name}</span>

      {/* status label */}
      <span className="pl-row__status" style={{ color: accentColor }}>
        {STATUS_LABEL[player.status]}
      </span>

      {/* score */}
      <div className="pl-row__score-wrap">
        <span className="pl-row__score-label">Ocena</span>
        <span className="pl-row__score" style={{ color: sc }}>
          {player.score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlayerList() {
  return (
    <div className="pl-wrap">
      <h2 className="pl-heading">Wyjściowy skład:</h2>
      <div className="pl-list">
        {STARTING_XI.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>

      <h2 className="pl-heading pl-heading--reserve">Rezerwa:</h2>
      <div className="pl-list">
        {RESERVES.map((p) => (
          <PlayerRow key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
}
