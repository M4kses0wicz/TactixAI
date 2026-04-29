"""
Patch AIWindow.jsx to add real suggestion application logic with toast animation.
"""
import re

path = "src/Components/AIWindow.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update the useGame import to include all needed functions
old_usegame = 'const { currentTeam, opponentTeam, setAiHighlights, setActiveTab, matchData } = useGame();'
new_usegame = 'const { currentTeam, opponentTeam, setAiHighlights, setActiveTab, matchData, updateMentality, updateFormation, substitutePlayer, updatePlayerRole, updateTactics } = useGame();'

if old_usegame in content:
    content = content.replace(old_usegame, new_usegame)
    print("OK: useGame import updated")
else:
    print("ERROR: useGame line not found")
    print("Looking for:", repr(old_usegame[:80]))

# 2. Add toast state after existing useState declarations
old_states = 'const [messages, setMessages] = useState([]);'
new_states = '''const [messages, setMessages] = useState([]);
  const [appliedToast, setAppliedToast] = useState(null); // { text, type }'''

if old_states in content:
    content = content.replace(old_states, new_states)
    print("OK: toast state added")
else:
    print("ERROR: states line not found")

# 3. Add applyAISuggestion function before handleApplySuggestion
old_handle = '  const handleApplySuggestion = (suggestion) => {'

new_apply_fn = '''  // Pokazuje animowany toast potwierdzenia
  const showToast = (text, type = "success") => {
    setAppliedToast({ text, type });
    setTimeout(() => setAppliedToast(null), 2800);
  };

  // Rzeczywiste zastosowanie sugestii AI w stanie gry
  const applyAISuggestion = (suggestion) => {
    const { type, value, player } = suggestion;

    try {
      switch (type) {
        case "Mentalność": {
          if (value) {
            updateMentality(value);
            showToast(`Mentalność → ${value}`);
          }
          break;
        }
        case "Formacja": {
          if (value) {
            updateFormation(value);
            showToast(`Formacja → ${value}`);
          }
          break;
        }
        case "Zmiana": {
          // value = "Za: Imię Startowego"
          const outName = value?.replace("Za: ", "").trim();
          const starters = currentTeam?.zawodnicy?.filter(p => p.isStarting) || [];
          const reserves = currentTeam?.zawodnicy?.filter(p => !p.isStarting) || [];
          const outPlayer = starters.find(p => p.imie_nazwisko === outName || p.imie_nazwisko?.includes(outName?.split(" ").pop() || ""));
          const inPlayer = reserves.find(p => p.imie_nazwisko === player || p.imie_nazwisko?.includes((player || "").split(" ").pop() || ""));
          if (outPlayer && inPlayer) {
            substitutePlayer(outPlayer.id, inPlayer.id);
            showToast(`${inPlayer.imie_nazwisko} ↔ ${outPlayer.imie_nazwisko}`, "sub");
          } else {
            showToast("Nie znaleziono zawodnika — zmień ręcznie", "warning");
          }
          break;
        }
        case "Rola": {
          // player = imię, value = "Rola przy piłce / bez piłki" lub samo role
          const allPlayers = currentTeam?.zawodnicy || [];
          const target = allPlayers.find(p => p.imie_nazwisko === player || p.imie_nazwisko?.includes((player || "").split(" ").pop() || ""));
          if (target && value) {
            updatePlayerRole(target.id, "przy_pilce", value);
            showToast(`${target.imie_nazwisko} → rola: ${value}`);
          } else {
            showToast("Ustaw rolę ręcznie w panelu gracza", "warning");
          }
          break;
        }
        case "Taktyka":
        case "Instrukcja": {
          // type=Taktyka, player="Cały zespół", value="Opcja taktyczna"
          // Próbujemy dopasować do taktyki przy_pilce lub bez_pilki
          if (currentTeam?.taktyka_druzyny && value) {
            const tacticsPrzy = currentTeam.taktyka_druzyny.przy_pilce || {};
            const tacticsBez = currentTeam.taktyka_druzyny.bez_pilki || {};
            let applied = false;
            // Szukamy klucza, którego wartość ma być zmieniona
            for (const key of Object.keys(tacticsPrzy)) {
              if (key.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(key.toLowerCase())) {
                updateTactics("przy_pilce", key, value);
                applied = true;
                break;
              }
            }
            if (!applied) {
              for (const key of Object.keys(tacticsBez)) {
                if (key.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(key.toLowerCase())) {
                  updateTactics("bez_pilki", key, value);
                  applied = true;
                  break;
                }
              }
            }
            if (applied) {
              showToast(`Taktyka → ${value}`);
            } else {
              showToast(`Zastosuj ręcznie: ${value}`, "warning");
            }
          }
          break;
        }
        default:
          showToast(`Zastosuj ręcznie: ${value || type}`, "warning");
      }
    } catch (err) {
      console.error("applyAISuggestion error:", err);
      showToast("Błąd — zastosuj ręcznie", "error");
    }
  };

  const handleApplySuggestion = (suggestion) => {'''

if old_handle in content:
    content = content.replace(old_handle, new_apply_fn)
    print("OK: applyAISuggestion function added")
else:
    print("ERROR: handleApplySuggestion line not found")

# 4. Inside handleApplySuggestion, call applyAISuggestion at the start
old_auto_msg = '''    const autoMessage = `Gotowe, zastosowałem: ${changeDesc}. Przejdźmy do kolejnego etapu.`;'''
new_auto_msg = '''    // Rzeczywiście zastosuj zmianę w stanie gry
    applyAISuggestion(suggestion);

    const autoMessage = `Gotowe, zastosowałem: ${changeDesc}. Przejdźmy do kolejnego etapu.`;'''

if old_auto_msg in content:
    content = content.replace(old_auto_msg, new_auto_msg)
    print("OK: applyAISuggestion call added in handleApplySuggestion")
else:
    print("ERROR: autoMessage line not found")
    # Try to find it
    idx = content.find("Gotowe, zastosowa")
    print("Found at idx:", idx)
    print("Context:", repr(content[idx-50:idx+100]))

# 5. Add Toast UI component and its CSS inline into the return
# Find the live indicator section and add toast before it
old_live = '          {matchData && ('
new_live = '''          {/* === TOAST POWIADOMIENIE === */}
          {appliedToast && (
            <div className={`ai-toast ai-toast--${appliedToast.type}`}>
              {appliedToast.type === "sub" ? "⇄" : appliedToast.type === "warning" ? "⚠️" : "✓"} {appliedToast.text}
            </div>
          )}

          {matchData && ('''

if old_live in content:
    content = content.replace(old_live, new_live, 1)
    print("OK: toast UI added")
else:
    print("ERROR: live indicator not found")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("DONE: AIWindow.jsx patched successfully")
