const fs = require('fs');
const path = 'c:/Users/hiper/Desktop/TactixAI2/TactixAI/src/data/initialData.json';

const rawData = fs.readFileSync(path, 'utf8');
const data = JSON.parse(rawData);
const templateTeam = data.druzyny[0];

const clubNames = [
  "Manchester City", "Arsenal", "Manchester United", "Liverpool", "Chelsea",
  "Barcelona", "Real Madryt", "Atletico Madryt", "Real Betis", "Al-Nassr",
  "PSG", "Inter Mediolan", "Napoli", "AC Milan", "Juventus",
  "AS Roma", "Bayern Monachium", "Borussia Dortmund", "Feyenoord", "Ajax Amsterdam"
];

const newTeams = clubNames.map((name, index) => {
  // If it's already Feyenoord, just use the existing one if we want to keep it
  if (name === "Feyenoord") return templateTeam;
  
  return {
    ...JSON.parse(JSON.stringify(templateTeam)),
    id: index + 100, // Unique ID
    nazwa: name,
    logo: `${name.toLowerCase().replace(/ /g, '')}.png`
  };
});

data.druzyny = newTeams;

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Updated initialData.json with 20 clubs.");
