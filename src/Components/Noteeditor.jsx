import { useState } from "react";
import "../styles/NoteEditor/css/NoteEditor.css";
import personIcon from "../assets/user-icon.png";

const generateId = () => Math.random().toString(36).slice(2, 8);

function DescBlock({ block, onChange, onRemove, preview }) {
  if (preview) {
    return (
      <div className="desc-display">
        {block.text || <span style={{ color: "#333" }}>Brak opisu</span>}
      </div>
    );
  }
  return (
    <div className="block-item">
      <textarea
        className="desc-input"
        value={block.text}
        placeholder="Wpisz opis notatki..."
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        rows={3}
      />
      <button className="remove-btn" onClick={onRemove} title="Usuń blok">
        ×
      </button>
    </div>
  );
}

function ListBlock({ block, onChange, onRemove, preview }) {
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

  if (preview) {
    return (
      <div className="list-block">
        {block.items.map((item) => (
          <div key={item.id} className="list-display-item">
            <span className="bullet" style={{ marginTop: 6 }} />
            <span>
              {item.text || (
                <span style={{ color: "#333" }}>Pusty element</span>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="block-item list-block" style={{ paddingRight: 20 }}>
      {block.items.map((item) => (
        <div key={item.id} className="list-item-row">
          <span className="bullet" />
          <input
            className="list-input"
            value={item.text}
            placeholder="Element listy..."
            onChange={(e) => updateItem(item.id, e.target.value)}
          />
          <button
            className="remove-list-item"
            onClick={() => removeItem(item.id)}
          >
            ×
          </button>
        </div>
      ))}
      <button className="add-list-item-btn" onClick={addItem}>
        + dodaj element
      </button>
      <button className="remove-btn" onClick={onRemove} title="Usuń blok">
        ×
      </button>
    </div>
  );
}

// ─── Player card block ───────────────────────────────────────────────────────
function PlayerCardBlock({ block, onChange, onRemove, preview }) {
  const set = (key, val) => onChange({ ...block, [key]: val });
  const fullName = [block.firstName, block.lastName].filter(Boolean).join(" ");

  if (preview) {
    return (
      <div className="player-card">
        <div className="player-card__avatar">
          <img src={personIcon} alt="ikona człowieka" className="person-ico" />
        </div>
        <div className="player-card__body">
          <div className="player-card__name-display">
            {fullName || <span style={{ color: "#333" }}>Brak imienia</span>}
          </div>
          {block.position && (
            <div className="player-card__position-display">
              {block.position}
            </div>
          )}
          {block.desc && (
            <div className="player-card__desc-display">{block.desc}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="block-item">
      <div className="player-card">
        <div className="player-card__avatar">
          <img src={personIcon} alt="ikona człowieka" className="person-ico" />
        </div>

        <div className="player-card__body">
          <div className="player-card__name-row">
            <input
              className="player-card__name-input"
              value={block.firstName}
              placeholder="Imię"
              onChange={(e) => set("firstName", e.target.value)}
            />
            <input
              className="player-card__surname-input"
              value={block.lastName}
              placeholder="Nazwisko"
              onChange={(e) => set("lastName", e.target.value)}
            />
          </div>

          <div className="player-card__position-row">
            <input
              className="player-card__position-input"
              value={block.position}
              placeholder="Pozycja (np. ST · Napastnik)"
              onChange={(e) => set("position", e.target.value)}
            />
          </div>

          <textarea
            className="player-card__desc-input"
            value={block.desc}
            placeholder="Krótki opis zawodnika..."
            rows={2}
            onChange={(e) => set("desc", e.target.value)}
          />
        </div>
      </div>
      <button className="remove-btn" onClick={onRemove} title="Usuń kartę">
        ×
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function NoteEditor() {
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);

  const addDesc = () =>
    setBlocks((b) => [...b, { id: generateId(), type: "desc", text: "" }]);
  const addList = () =>
    setBlocks((b) => [
      ...b,
      {
        id: generateId(),
        type: "list",
        items: [{ id: generateId(), text: "" }],
      },
    ]);
  const addPlayer = () =>
    setBlocks((b) => [
      ...b,
      {
        id: generateId(),
        type: "player",
        firstName: "",
        lastName: "",
        position: "",
        desc: "",
      },
    ]);

  const updateBlock = (id, data) =>
    setBlocks((b) => b.map((bl) => (bl.id === id ? data : bl)));
  const removeBlock = (id) => setBlocks((b) => b.filter((bl) => bl.id !== id));

  return (
    <div className="app">
      <div className="top-bar">
        <span className="label">Notatnik</span>
        <button
          className={`mode-btn ${preview ? "active" : ""}`}
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? "✎ edytuj" : "⊞ podgląd"}
        </button>
      </div>

      <div className="note-card">
        {preview ? (
          <div className="title-display">{title || "Bez tytułu..."}</div>
        ) : (
          <input
            className="title-input"
            value={title}
            placeholder="Dodaj tytuł notatki ..."
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        <div className="block-list">
          {blocks.map((block) => {
            if (block.type === "desc")
              return (
                <DescBlock
                  key={block.id}
                  block={block}
                  preview={preview}
                  onChange={(data) => updateBlock(block.id, data)}
                  onRemove={() => removeBlock(block.id)}
                />
              );
            if (block.type === "list")
              return (
                <ListBlock
                  key={block.id}
                  block={block}
                  preview={preview}
                  onChange={(data) => updateBlock(block.id, data)}
                  onRemove={() => removeBlock(block.id)}
                />
              );
            if (block.type === "player")
              return (
                <PlayerCardBlock
                  key={block.id}
                  block={block}
                  preview={preview}
                  onChange={(data) => updateBlock(block.id, data)}
                  onRemove={() => removeBlock(block.id)}
                />
              );
            return null;
          })}
        </div>

        {!preview && (
          <div className="add-bar">
            <button className="add-btn" onClick={addDesc}>
              + opis
            </button>
            <button className="add-btn list-btn" onClick={addList}>
              + lista
            </button>
            <button className="add-btn card-btn" onClick={addPlayer}>
              + karta zawodnika
            </button>
          </div>
        )}

        <div className="note-footer">
          {blocks.length === 0 && !title
            ? "Pusta notatka — dodaj tytuł lub bloki powyżej"
            : `${blocks.length} blok${
                blocks.length === 1 ? "" : blocks.length < 5 ? "i" : "ów"
              } · ${new Date().toLocaleDateString("pl-PL")}`}
        </div>
      </div>
    </div>
  );
}
