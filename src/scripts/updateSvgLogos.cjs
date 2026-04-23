const fs = require('fs');
const path = require('path');

const initialDataPath = path.join(__dirname, '../data/initialData.json');
const data = JSON.parse(fs.readFileSync(initialDataPath, 'utf8'));

const logoMapping = {
  "Manchester City": "england_manchester-city.football-logos.cc.svg",
  "Arsenal": "england_arsenal.football-logos.cc.svg",
  "Manchester United": "england_manchester-united.football-logos.cc.svg",
  "Liverpool": "england_liverpool.football-logos.cc.svg",
  "Chelsea": "england_chelsea.football-logos.cc.svg",
  "Barcelona": "spain_barcelona.football-logos.cc.svg",
  "Real Madryt": "spain_real-madrid.football-logos.cc.svg",
  "Atletico Madryt": "spain_atletico-madrid.football-logos.cc.svg",
  "Real Betis": "spain_real-betis.football-logos.cc.svg",
  "Al-Nassr": "saudi-arabia_al-nassr.football-logos.cc.svg",
  "PSG": "france_paris-saint-germain.football-logos.cc.svg",
  "Inter Mediolan": "italy_inter.football-logos.cc.svg",
  "Napoli": "italy_napoli.football-logos.cc.svg",
  "AC Milan": "italy_milan.football-logos.cc.svg",
  "Juventus": "italy_juventus.football-logos.cc.svg",
  "AS Roma": "italy_roma.football-logos.cc.svg",
  "Bayern Monachium": "germany_bayern-munchen.football-logos.cc.svg",
  "Borussia Dortmund": "germany_borussia-dortmund.football-logos.cc.svg",
  "Feyenoord": "netherlands_feyenoord.football-logos.cc.svg",
  "Ajax Amsterdam": "netherlands_ajax.football-logos.cc.svg"
};

data.druzyny.forEach(team => {
  if (logoMapping[team.nazwa]) {
    team.logo = logoMapping[team.nazwa];
  }
});

fs.writeFileSync(initialDataPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated 20 club logos in initialData.json');
