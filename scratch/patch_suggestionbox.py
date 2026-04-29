import re

path = "src/Components/AIWindow.jsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the SuggestionBox component boundaries
start_marker = "// --- KOMPONENT SUGGESTION BOX ---"
# Find end by counting braces after function declaration
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: start marker not found")
    exit(1)

# Find the closing of the function (the line with just "}" after the last return)
# We look for the pattern: \n}\n\nfunction AIWindow
end_marker = "\nfunction AIWindow()"
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("ERROR: end marker not found")
    exit(1)

old_component = content[start_idx:end_idx]
print("=== OLD COMPONENT (first 200 chars) ===")
print(repr(old_component[:200]))

new_component = """// --- KOMPONENT SUGGESTION BOX ---
function SuggestionBox({ suggestions, stageLabel, onApply }) {
  if (!suggestions || suggestions.length === 0) return null;

  const isSubstitution = (s) => s.type === "Zmiana";

  return (
    <div className="suggestion-container">
      <div className="suggestion-header">
        <span className="suggestion-fire">\U0001F525</span>
        <span className="suggestion-title">Sugerowane Akcje</span>
        {stageLabel && <span className="suggestion-stage">{stageLabel}</span>}
      </div>
      {suggestions.map((s, i) => (
        isSubstitution(s) ? (
          <div key={i} className="suggestion-box suggestion-box--sub">
            <div className="suggestion-sub-badge">\u21c4 Zmiana w sk\u0142adzie</div>
            <div className="suggestion-sub-players">
              <div className="suggestion-sub-in">
                <span className="sub-label sub-label--in">\u25b2 Wchodzi</span>
                <span className="sub-name">{s.player}</span>
              </div>
              <div className="suggestion-sub-arrow">\u21c4</div>
              <div className="suggestion-sub-out">
                <span className="sub-label sub-label--out">\u25bc Schodzi</span>
                <span className="sub-name">{s.value?.replace('Za: ', '') || s.value}</span>
              </div>
            </div>
            {s.reason && <div className="suggestion-reason">{s.reason}</div>}
            <div className="suggestion-right" style={{justifyContent: 'flex-end', marginTop: '6px'}}>
              {onApply && (
                <button
                  className="suggestion-apply-btn"
                  onClick={() => onApply(s)}
                  title="Zatwierd\u017a zmian\u0119 i przejd\u017a dalej"
                >
                  \u2713 Zatwierd\u017a zmian\u0119
                </button>
              )}
            </div>
          </div>
        ) : (
          <div key={i} className="suggestion-box">
            <div className="suggestion-main">
              <span className="suggestion-type">{s.type}</span>
              {s.value && (
                <>
                  <span className="suggestion-arrow">\u2192</span>
                  <span className="suggestion-value">{s.value}</span>
                </>
              )}
            </div>
            <div className="suggestion-right">
              {s.player && (
                <span className="suggestion-player">{s.player}</span>
              )}
              {onApply && (
                <button
                  className="suggestion-apply-btn"
                  onClick={() => onApply(s)}
                  title="Zastosuj i przejd\u017a do kolejnego etapu"
                >
                  \u2713 Zastosuj
                </button>
              )}
            </div>
            {s.reason && (
              <div className="suggestion-reason">{s.reason}</div>
            )}
          </div>
        )
      ))}
      <div className="suggestion-disclaimer">
        Kliknij \u201eZastosuj\u201d, aby wdro\u017cy\u0107 zmian\u0119 i przej\u015b\u0107 do kolejnego etapu.
      </div>
    </div>
  );
}"""

new_content = content[:start_idx] + new_component + content[end_idx:]

with open(path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("SUCCESS: SuggestionBox updated with substitution support")
