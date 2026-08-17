import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PickerField, PickerModal } from "../components/PickerModal";

const EMPTY_PANEL = {
  key: "",
  title: "",
  description: "",
  color: "#5865F2",
  thumbnail: "",
  image: "",
  footer: "",
  buttons: [],
};

const EMPTY_BUTTON = {
  label: "New button",
  style: "PRIMARY",
  action: "role",
  roleMode: "toggle",
  emoji: "",
  roleIds: [],
  removeRoleIds: [],
  url: "",
  reply: "",
};

function normalizeButton(btn = {}) {
  const action = btn.action || "role";
  return {
    ...EMPTY_BUTTON,
    ...btn,
    action,
    style: action === "url" ? "LINK" : btn.style || "PRIMARY",
    roleMode: btn.roleMode || "toggle",
    emoji: btn.emoji || "",
    roleIds: Array.isArray(btn.roleIds) ? btn.roleIds : btn.roleId ? [btn.roleId] : [],
    removeRoleIds: Array.isArray(btn.removeRoleIds) ? btn.removeRoleIds : [],
  };
}

function cloneKey(key) {
  const base = String(key || "panel").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 32);
  return `${base}-copy`.slice(0, 40);
}

export default function PanelsTab({ guildId, roles, channels, roleNames, onError, onNotice }) {
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [editingKey, setEditingKey] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_PANEL });
  const [sendChannelId, setSendChannelId] = useState("");
  const [picker, setPicker] = useState(null);

  async function loadPanels() {
    setLoading(true);
    try {
      const data = await api.staff.panels(guildId);
      setPanels(data.panels || []);
      onError("");
    } catch (err) {
      setPanels([]);
      onError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!guildId) return;
    loadPanels();
    setEditingKey(null);
    setForm({ ...EMPTY_PANEL, buttons: [] });
    setSearch("");
    setSendChannelId("");
  }, [guildId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return panels;
    return panels.filter((p) => `${p.title || p.key} ${p.description || ""}`.toLowerCase().includes(q));
  }, [panels, search]);

  function startNew() {
    setForm({ ...EMPTY_PANEL, buttons: [] });
    setEditingKey(null);
    setSearch("");
  }

  function selectPanel(p) {
    setForm({
      ...EMPTY_PANEL,
      ...p,
      key: p.key || "",
      footer: p.footer || "",
      buttons: Array.isArray(p.buttons) ? p.buttons.map(normalizeButton) : [],
    });
    setEditingKey(p.key || null);
  }

  function updateButton(idx, patch) {
    setForm((prev) => {
      const buttons = [...(prev.buttons || [])];
      const next = { ...buttons[idx], ...patch };
      if (next.action === "url") next.style = "LINK";
      buttons[idx] = next;
      return { ...prev, buttons };
    });
  }

  async function savePanel() {
    setSaving(true);
    try {
      const payload = { ...form, buttons: (form.buttons || []).map(normalizeButton) };
      const data = editingKey
        ? await api.staff.updatePanel(guildId, editingKey, payload)
        : await api.staff.createPanel(guildId, payload);
      const saved = data.panel || {};
      const newKey = saved.key || form.key || editingKey || null;
      setForm((prev) => ({ ...prev, key: newKey }));
      setEditingKey(newKey);
      await loadPanels();
      onNotice("Panel saved.");
      onError("");
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function sendPanel() {
    if (!editingKey) return;
    if (!sendChannelId) {
      onError("Pick a channel first.");
      return;
    }
    setSending(true);
    try {
      await api.staff.sendPanel(guildId, editingKey, sendChannelId);
      const chName = channels.find((c) => c.id === sendChannelId)?.name || sendChannelId;
      onNotice(`Panel posted to #${chName}.`);
      onError("");
    } catch (err) {
      onError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function deletePanel() {
    if (!editingKey) return;
    if (!window.confirm("Delete this panel?")) return;
    try {
      await api.staff.deletePanel(guildId, editingKey);
      startNew();
      await loadPanels();
      onNotice("Panel deleted.");
      onError("");
    } catch (err) {
      onError(err.message);
    }
  }

  const roleItems = roles.map((role) => ({
    id: role.id,
    name: role.name,
    color: role.color,
    tag: role.hoisted ? "HOISTED" : "",
  }));

  const pickerBtn = picker?.idx != null ? form.buttons?.[picker.idx] : null;

  return (
    <>
      <h1>Panels</h1>
      <p className="sub">
        Build embed panels with role, reply, or link buttons. Post them here or with <code>/panel</code> in Discord.
      </p>

      <div className="panels-layout">
        <aside className="panels-sidebar">
          <div className="panels-sidebar-head">
            <strong>Your panels</strong>
            <button className="btn ghost" type="button" onClick={startNew}>
              + New
            </button>
          </div>
          <input placeholder="Search panels…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="panels-list">
            {loading ? <p className="sub">Loading…</p> : null}
            {!loading && filtered.length === 0 ? (
              <p className="sub">{panels.length ? "No panels match that search." : "No panels yet. Create one to get started."}</p>
            ) : null}
            {filtered.map((p) => (
              <button
                key={p.key}
                type="button"
                className={`panels-list-item ${editingKey === p.key ? "on" : ""}`}
                onClick={() => selectPanel(p)}
              >
                <span>{p.title || p.key || "Untitled"}</span>
                <small>
                  {(p.buttons || []).length} btn · {p.key}
                </small>
              </button>
            ))}
          </div>
        </aside>

        <div className="dash-form dash-form-col panels-editor">
          <div className="panels-editor-head">
            <div>
              <h3>{editingKey ? "Edit panel" : "Create panel"}</h3>
              <p className="sub">{editingKey ? `Editing \`${editingKey}\`` : "Fill in the embed, then add buttons below."}</p>
            </div>
            <div className="dash-form">
              {(editingKey || form.key || form.title) && (
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => {
                    setForm((pf) => ({
                      ...pf,
                      key: cloneKey(pf.key || editingKey || "panel"),
                      title: pf.title ? `${pf.title} (copy)` : "Panel copy",
                      buttons: (pf.buttons || []).map(normalizeButton),
                    }));
                    setEditingKey(null);
                    onNotice("Panel duplicated. Edit the key/title, then create.");
                  }}
                >
                  Duplicate
                </button>
              )}
              {editingKey ? (
                <button className="btn ghost" type="button" onClick={deletePanel}>
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          <label className="dash-label">Key</label>
          <input placeholder="unique-key" value={form.key} onChange={(e) => setForm((pf) => ({ ...pf, key: e.target.value }))} />
          <label className="dash-label">Color</label>
          <div className="panels-color-row">
            <input
              type="color"
              className="panels-color-swatch"
              value={form.color || "#5865F2"}
              onChange={(e) => setForm((pf) => ({ ...pf, color: e.target.value }))}
            />
            <input value={form.color || "#5865F2"} onChange={(e) => setForm((pf) => ({ ...pf, color: e.target.value }))} />
          </div>
          <label className="dash-label">Title</label>
          <input placeholder="Panel title" value={form.title} onChange={(e) => setForm((pf) => ({ ...pf, title: e.target.value }))} />
          <label className="dash-label">Description</label>
          <textarea
            rows={4}
            placeholder="Supports Discord markdown"
            value={form.description}
            onChange={(e) => setForm((pf) => ({ ...pf, description: e.target.value }))}
          />
          <label className="dash-label">Footer</label>
          <input placeholder="Optional footer" value={form.footer} onChange={(e) => setForm((pf) => ({ ...pf, footer: e.target.value }))} />
          <label className="dash-label">Thumbnail URL</label>
          <input placeholder="https://…" value={form.thumbnail} onChange={(e) => setForm((pf) => ({ ...pf, thumbnail: e.target.value }))} />
          <label className="dash-label">Image URL</label>
          <input placeholder="https://…" value={form.image} onChange={(e) => setForm((pf) => ({ ...pf, image: e.target.value }))} />

          <div className="panels-editor-head">
            <h3>Buttons</h3>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setForm((pf) => ({ ...pf, buttons: [...(pf.buttons || []), { ...EMPTY_BUTTON }] }))}
            >
              + Add button
            </button>
          </div>
          {(form.buttons || []).length === 0 ? <p className="sub">No buttons yet. Add one for roles, a reply, or a link.</p> : null}

          {(form.buttons || []).map((btn, idx) => (
            <article className="list-card" key={idx}>
              <div className="dash-row">
                <h3>Button {idx + 1}</h3>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() =>
                    setForm((pf) => {
                      const buttons = [...(pf.buttons || [])];
                      buttons.splice(idx, 1);
                      return { ...pf, buttons };
                    })
                  }
                >
                  Remove
                </button>
              </div>
              <label className="dash-label">Label</label>
              <input value={btn.label || ""} onChange={(e) => updateButton(idx, { label: e.target.value })} />
              <label className="dash-label">Emoji</label>
              <input placeholder="😀 or <:name:id>" value={btn.emoji || ""} onChange={(e) => updateButton(idx, { emoji: e.target.value })} />
              <label className="dash-label">Color</label>
              <select
                value={btn.action === "url" ? "LINK" : btn.style || "PRIMARY"}
                disabled={btn.action === "url"}
                onChange={(e) => updateButton(idx, { style: e.target.value })}
              >
                <option value="PRIMARY">Blue</option>
                <option value="SECONDARY">Gray</option>
                <option value="SUCCESS">Green</option>
                <option value="DANGER">Red</option>
                <option value="LINK">Link</option>
              </select>
              <label className="dash-label">Type</label>
              <select
                value={btn.action || "role"}
                onChange={(e) => {
                  const action = e.target.value;
                  updateButton(idx, { action, ...(action === "url" ? { style: "LINK" } : {}) });
                }}
              >
                <option value="role">Roles</option>
                <option value="reply">Reply</option>
                <option value="url">Open URL</option>
              </select>

              {btn.action === "role" ? (
                <>
                  <label className="dash-label">Role mode</label>
                  <select value={btn.roleMode || "toggle"} onChange={(e) => updateButton(idx, { roleMode: e.target.value })}>
                    <option value="toggle">Toggle — add if missing, remove if owned</option>
                    <option value="add">Add only — never remove on click</option>
                    <option value="remove">Remove only — only strip roles</option>
                    <option value="exclusive">Exclusive — pick one; clears other exclusive buttons</option>
                  </select>
                  <PickerField
                    label={(btn.roleMode || "toggle") === "remove" ? "Roles to remove" : "Roles"}
                    placeholder="Select roles"
                    value={roleNames(btn.roleIds || [])}
                    onClick={() => setPicker({ kind: "roles", idx, field: "roleIds" })}
                  />
                  {(btn.roleMode || "toggle") === "toggle" ? (
                    <PickerField
                      label="Also remove (always)"
                      placeholder="Select roles"
                      value={roleNames(btn.removeRoleIds || [])}
                      onClick={() => setPicker({ kind: "roles", idx, field: "removeRoleIds" })}
                    />
                  ) : null}
                </>
              ) : null}

              {btn.action === "url" ? (
                <>
                  <label className="dash-label">URL</label>
                  <input
                    placeholder="https://…"
                    value={btn.url || ""}
                    onChange={(e) => updateButton(idx, { url: e.target.value, style: "LINK" })}
                  />
                </>
              ) : null}

              {btn.action === "reply" ? (
                <>
                  <label className="dash-label">Reply message</label>
                  <input
                    placeholder="Message sent when clicked"
                    value={btn.reply || ""}
                    onChange={(e) => updateButton(idx, { reply: e.target.value })}
                  />
                </>
              ) : null}
            </article>
          ))}

          <div className="dash-form">
            <button className="btn" type="button" disabled={saving} onClick={savePanel}>
              {saving ? "Saving…" : editingKey ? "Save panel" : "Create panel"}
            </button>
            <button className="btn ghost" type="button" onClick={startNew}>
              Reset
            </button>
          </div>

          {editingKey ? (
            <>
              <h3>Post to Discord</h3>
              <PickerField
                label="Channel"
                placeholder="Select a channel"
                value={channels.find((c) => c.id === sendChannelId)?.name ? `#${channels.find((c) => c.id === sendChannelId).name}` : ""}
                onClick={() => setPicker({ kind: "channel" })}
              />
              <button className="btn" type="button" disabled={sending || !sendChannelId} onClick={sendPanel}>
                {sending ? "Posting…" : "Post panel"}
              </button>
              <p className="sub">
                Or run <code>/panel</code> in Discord and pick this panel from autocomplete.
              </p>
            </>
          ) : null}
        </div>
      </div>

      <PickerModal
        open={picker?.kind === "roles"}
        title="Role"
        subtitle="Select roles"
        searchPlaceholder="Search roles"
        items={roleItems}
        selectedIds={pickerBtn?.[picker?.field] || []}
        multiple
        onClose={() => setPicker(null)}
        onDone={(ids) => {
          if (picker?.idx == null || !picker.field) return;
          updateButton(picker.idx, { [picker.field]: ids });
        }}
      />
      <PickerModal
        open={picker?.kind === "channel"}
        title="Channel"
        subtitle="Select a channel"
        searchPlaceholder="Search channels"
        items={channels.map((ch) => ({ id: ch.id, name: ch.name, prefix: "#" }))}
        selectedIds={sendChannelId ? [sendChannelId] : []}
        multiple={false}
        onClose={() => setPicker(null)}
        onDone={(id) => setSendChannelId(id)}
      />
    </>
  );
}
