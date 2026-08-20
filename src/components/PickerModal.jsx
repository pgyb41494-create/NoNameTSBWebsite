import { useEffect, useMemo, useState } from "react";

function matchesQuery(item, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  const hay = `${item.name || ""} ${item.tag || ""} ${item.id || ""}`.toLowerCase();
  return hay.includes(q);
}

export function PickerField({ label, value, placeholder = "Select", onClick }) {
  return (
    <div>
      {label ? <label className="dash-label">{label}</label> : null}
      <button type="button" className="picker-field" onClick={onClick}>
        <span className={value ? "" : "picker-placeholder"}>{value || placeholder}</span>
        <span className="picker-caret" aria-hidden="true">
          ▾
        </span>
      </button>
    </div>
  );
}

export function PickerModal({
  open,
  title,
  subtitle,
  searchPlaceholder,
  items = [],
  selectedIds = [],
  multiple = true,
  onDone,
  onClose,
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(selectedIds);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDraft(selectedIds);
  }, [open, selectedIds]);

  const shown = useMemo(() => items.filter((item) => matchesQuery(item, query)), [items, query]);

  if (!open) return null;

  function toggle(id) {
    if (multiple) {
      setDraft((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
      return;
    }
    setDraft([id]);
  }

  return (
    <div className="picker-overlay" onClick={onClose} role="presentation">
      <div
        className="picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="picker-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" className="picker-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <input
          className="picker-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          autoFocus
        />
        <div className="picker-list">
          {shown.length === 0 ? <p className="picker-empty">Nothing found.</p> : null}
          {shown.map((item) => {
            const on = draft.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`picker-row ${on ? "on" : ""}`}
                onClick={() => toggle(item.id)}
              >
                <span className={`picker-radio ${on ? "selected" : ""}`} aria-hidden="true" />
                {item.icon ? <img className="picker-avatar" src={item.icon} alt="" /> : null}
                {!item.icon && item.fallback ? (
                  <span className="picker-avatar picker-avatar-fallback">{item.fallback}</span>
                ) : null}
                <span className="picker-name">
                  {item.prefix || ""}
                  {item.name}
                </span>
                {item.tag ? <span className="picker-tag">{item.tag}</span> : null}
              </button>
            );
          })}
        </div>
        <footer className="picker-foot">
          <span>
            {draft.length} selected · {shown.length} shown
          </span>
          <button
            type="button"
            className="picker-done"
            onClick={() => {
              onDone(multiple ? draft : draft[0] || "");
              onClose();
            }}
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`switch ${checked ? "on" : ""}`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-track">
        <span className="switch-knob" />
      </span>
      <span className="switch-label">{label}</span>
    </button>
  );
}
