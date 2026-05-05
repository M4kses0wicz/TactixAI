import { useState } from "react";
import { useGame } from "../context/GameContext";
import "../styles/NoteEditor/css/NoteEditor.css";
import personIcon from "../assets/user-icon.png";

const generateId = () => Math.random().toString(36).slice(2, 8);

const normalizePos = (pos) => pos ? pos.replace(/[0-9]/g, '') : "";

function DescBlock({ block, onChange, onRemove }) {
  return (
    <div className="block-item ne-pop">
      <textarea
        className="player-card__desc-input"
        style={{ marginTop: '10px' }}
        value={block.text}
        placeholder="Krótki opis zawodnika..."
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={3}
      />
      <button className="remove-btn" onClick={onRemove} title="Usuń blok">×</button>
    </div>
  );
}

function ListBlock({ block, onChange, onRemove }) {
  const addItem = () =>
    onChange({
      ...block,
      items: [...block.items, { id: generateId(), text: "" }],
    });
  const updateItem = (id, text) =>
    onChange({
      ...block,
      items: block.items.map((i) => (i.id === id ? { ...i, text } : i)),
    });
  const removeItem = (id) =>
    onChange({ ...block, items: block.items.filter((i) => i.id !== id) });

  return (
    <div className="block-item list-block ne-pop" style={{ marginTop: '10px' }}>
      {block.items.map((item) => (
        <div key={item.id} className="list-item-row">
          <span className="bullet" />
          <input
            className="list-input"
            value={item.text}
            placeholder="Dodaj element listy..."
            onChange={(e) => updateItem(item.id, e.target.value)}
          />
          <button className="remove-list-item" onClick={() => removeItem(item.id)}>×</button>
        </div>
      ))}
      <button className="add-list-item-btn" onClick={addItem}>+ dodaj element</button>
      <button className="remove-btn" onClick={onRemove} title="Usuń blok">×</button>
    </div>
  );
}

function PlayerNoteEntry({ player, getPlayerPhoto, updatePlayerNote }) {
  const [localTitle, setLocalTitle] = useState("");
  const [localNotes, setLocalNotes] = useState([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const hasContent = localTitle.trim().length > 0 || localNotes.length > 0;

  const addDesc = () => {
    setLocalNotes(prev => [...prev, { id: generateId(), type: "desc", text: "" }]);
  };

  const addList = () => {
    setLocalNotes(prev => [...prev, { 
      id: generateId(), 
      type: "list", 
      items: [{ id: generateId(), text: "" }] 
    }]);
  };

  const updateBlock = (id, data) => {
    setLocalNotes(prev => prev.map(b => b.id === id ? data : b));
  };

  const removeBlock = (id) => {
    setLocalNotes(prev => prev.filter(b => b.id !== id));
  };

  const handleSave = () => {
    if (!hasContent) return;
    
    // Create a note object that includes the title
    const newNote = {
      id: generateId(),
      title: localTitle || "Bez tytułu",
      timestamp: new Date().toISOString(),
      content: [...localNotes]
    };

    // For compatibility with PlayerModal rendering, we flatten or structure it
    // Let's store it as a single 'note' entry that contains sub-blocks
    const updatedNotes = [...(player.notes || []), newNote];
    updatePlayerNote(player.id, updatedNotes);
    
    // Reset
    setLocalTitle("");
    setLocalNotes([]);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000); 
  };

  return (
    <div className="player-card" style={{ marginBottom: '30px', flexDirection: 'column', alignItems: 'stretch', padding: '24px' }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div className="player-card__avatar" style={{ width: '64px', height: '64px', border: '2px solid rgba(76, 175, 80, 0.2)' }}>
          <img src={getPlayerPhoto(player.imie_nazwisko)} alt="" className="person-ico" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        </div>
        <div className="player-card__body">
          <div className="player-card__name-display" style={{ fontSize: '20px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {player.imie_nazwisko}
          </div>
          <div className="player-card__position-display" style={{ color: '#ffffff', fontWeight: '800', opacity: 0.6 }}>
            {normalizePos(player.pozycja_glowna)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="add-btn" onClick={addDesc} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>+ OPIS</button>
            <button className="add-btn" onClick={addList} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>+ LISTA</button>
            
            {hasContent && (
              <button 
                  className="add-btn" 
                  onClick={handleSave} 
                  style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      marginLeft: '10px',
                      padding: '6px 20px',
                      animation: 'ne-slide-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}
              >
                  ZATWIERDŹ
              </button>
            )}

            {showSaveSuccess && (
              <div className="ne-pop" style={{ color: '#ffffff', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginLeft: '10px', opacity: 0.8 }}>
                ZAPISANO!
              </div>
            )}
        </div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input 
          type="text"
          className="title-input"
          style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}
          placeholder="Dodaj tytuł notatki..."
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
        />
      </div>

      <div className="block-list" style={{ padding: '0 5px' }}>
        {localNotes.map((block) => (
          block.type === "desc" 
            ? <DescBlock key={block.id} block={block} onChange={(d) => updateBlock(block.id, d)} onRemove={() => removeBlock(block.id)} />
            : <ListBlock key={block.id} block={block} onChange={(d) => updateBlock(block.id, d)} onRemove={() => removeBlock(block.id)} />
        ))}
      </div>
    </div>
  );
}

export default function NoteEditor({ team, isOpponent }) {
  const { currentTeam, getPlayerPhoto, updatePlayerNote } = useGame();
  const [searchTerm, setSearchTerm] = useState("");

  // Używamy przekazanej drużyny lub domyślnie bieżącej
  const activeTeam = team || currentTeam;

  if (!activeTeam) return null;

  const players = activeTeam.zawodnicy?.filter(p => 
    p.imie_nazwisko.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="app" style={{ position: 'relative' }}>
      {isOpponent && (
        <div className="tac-locked-msg">
          <span className="material-symbols-outlined">lock</span>
          Notatki przeciwnika są zablokowane w trybie istniejących klubów.
        </div>
      )}

      <div className="top-bar">
        <span className="label">Notatnik Taktyczny — {activeTeam.nazwa}</span>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0 10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'rgba(150,150,150,0.5)' }}>search</span>
            <input 
                type="text" 
                placeholder="Szukaj zawodnika..." 
                className="title-input" 
                style={{ fontSize: '12px', border: 'none', width: '200px', marginBottom: 0, paddingBottom: '4px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="note-card" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)', opacity: isOpponent ? 0.3 : 1, pointerEvents: isOpponent ? 'none' : 'auto' }}>
        {players.map(p => (
          <PlayerNoteEntry 
            key={p.id} 
            player={p} 
            getPlayerPhoto={getPlayerPhoto} 
            updatePlayerNote={updatePlayerNote} 
          />
        ))}
        {players.length === 0 && (
          <div className="note-footer" style={{ textAlign: 'center', border: 'none' }}>
            Nie znaleziono zawodników w kadrze.
          </div>
        )}
      </div>
    </div>
  );
}
