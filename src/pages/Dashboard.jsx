import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { PickerField, PickerModal, Switch } from "../components/PickerModal";

const TABS = [
  { id: "reports", label: "Reports" },
  { id: "blacklist", label: "Blacklisted" },
  { id: "trainers", label: "Trainers" },
  { id: "verify", label: "Verification" },
  { id: "messages", label: "Messages" },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("reports");
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState("");
  const [messageGuildId, setMessageGuildId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [blacklist, setBlacklist] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [reports, setReports] = useState([]);
  const [roles, setRoles] = useState([]);
  const [verifyCfg, setVerifyCfg] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [picker, setPicker] = useState(null);
  const [form, setForm] = useState({
    discordId: "",
    reason: "",
    evidence: "",
    where: "",
    when: "",
    stage: "",
    price: "",
    bio: "",
    channelId: "",
    userId: "",
    content: "",
    format: "text",
    embedTitle: "",
    embedDescription: "",
    embedColor: "2B2D31",
    embedFooter: "",
    embedImage: "",
    embedThumbnail: "",
    mode: "channel",
    memberQuery: "",
  });

  async function refreshLists(id = guildId) {
    if (!id) return;
    const isNetwork = id === "network";
    const [bl, tr, rp] = await Promise.all([
      api.staff.blacklist(id),
      api.staff.trainers(id),
      isNetwork ? api.staff.reports().catch(() => ({ reports: [] })) : Promise.resolve({ reports: [] }),
    ]);
    setBlacklist(bl.entries || []);
    setTrainers(tr.trainers || []);
    setReports(rp.reports || []);
    if (!isNetwork && !messageGuildId) {
      setMessageGuildId(id);
    }
  }

  async function loadChannelsFor(serverId) {
    if (!serverId || serverId === "network") {
      setChannels([]);
      return;
    }
    try {
      const data = await api.staff.channels(serverId);
      setChannels(data.channels || []);
      setError("");
    } catch (err) {
      setChannels([]);
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!user?.staff) return;
    api.staff
      .guilds()
      .then((data) => {
        const list = data.guilds || [];
        setGuilds(list);
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [user]);

  useEffect(() => {
    if (!guildId || !user?.staff) return;
    refreshLists(guildId).catch((err) => setError(err.message));
  }, [guildId, user]);

  useEffect(() => {
    if (!user?.staff) return;
    if (tab !== "verify") return;
    if (!guildId || guildId === "network") {
      setRoles([]);
      setVerifyCfg(null);
      return;
    }
    Promise.all([
      api.staff.roles(guildId).catch(() => ({ roles: [] })),
      api.staff.verify(guildId).catch(() => null),
    ])
      .then(([roleData, cfg]) => {
        setRoles(roleData.roles || []);
        setVerifyCfg(
          cfg || {
            approve: { addRoleIds: [], removeRoleIds: [], nickname: "", dmMessage: "", closeTicket: false },
            deny: { mode: "close", dmMessage: "" },
          }
        );
        setError("");
      });
  }, [guildId, tab, user]);

  useEffect(() => {
    if (!user?.staff) return;
    if (tab !== "messages") return;
    if (form.mode !== "channel" && form.mode !== "dm") return;
    loadChannelsFor(messageGuildId);
  }, [messageGuildId, tab, form.mode, user]);

  function enterServer(id) {
    setGuildId(id);
    setMessageGuildId(id === "network" ? "" : id);
    setTab(id === "network" ? "reports" : "blacklist");
    setNotice("");
    setError("");
    setVerifyCfg(null);
    setRoles([]);
  }

  function leaveServer() {
    setGuildId("");
    setMessageGuildId("");
    setNotice("");
    setError("");
    setVerifyCfg(null);
    setRoles([]);
  }

  function guildIcon(guild) {
    if (guild?.icon) return <img src={guild.icon} alt="" />;
    const letter = String(guild?.name || "?").trim().charAt(0).toUpperCase() || "?";
    return <span className="server-fallback">{letter}</span>;
  }

  if (loading) return <section className="wrap page">Loading…</section>;
  if (!user) return <Navigate to="/" replace />;
  if (!user.staff) return <Navigate to="/" replace />;

  const selectedGuild = guilds.find((g) => g.id === guildId) || null;
  const hasServer = Boolean(guildId && guildId !== "network");

  if (!guildId) {
    return (
      <section className="page-hero page-hero-blue">
        <div className="wrap server-picker">
          <h1>Servers</h1>
          <p className="sub">Pick a server to open its configuration.</p>
          {error ? <p className="banner banner-danger">{error}</p> : null}
          <div className="server-list">
            <div className="server-row">
              <div className="server-row-meta">
                <span className="server-fallback">All</span>
                <div>
                  <strong>Network</strong>
                  <span>Reports across every server</span>
                </div>
              </div>
              <button className="btn" type="button" onClick={() => enterServer("network")}>
                Settings
              </button>
            </div>
            {guilds.map((g) => (
              <div key={g.id} className="server-row">
                <div className="server-row-meta">
                  {guildIcon(g)}
                  <div>
                    <strong>{g.name}</strong>
                    <span>{g.memberCount ? `${g.memberCount} members` : "Admin"}</span>
                  </div>
                </div>
                <button className="btn" type="button" onClick={() => enterServer(g.id)}>
                  Settings
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function field(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function roleItems() {
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      color: role.color,
      tag: role.hoisted ? "HOISTED" : "",
    }));
  }

  function roleNames(ids) {
    const map = new Map(roles.map((role) => [role.id, role.name]));
    const names = (ids || []).map((id) => map.get(id)).filter(Boolean);
    if (!names.length) return "";
    if (names.length <= 2) return names.join(", ");
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  }

  async function searchMembers() {
    const serverId = messageGuildId || (guildId !== "network" ? guildId : "");
    if (!serverId) {
      setError("Pick a server first.");
      return;
    }
    try {
      const data = await api.staff.members(serverId, form.memberQuery);
      setMembers(data.members || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addBlacklist(e) {
    e.preventDefault();
    try {
      const data = await api.staff.addBlacklist(guildId, {
        discordId: form.discordId,
        reason: form.reason,
        evidence: form.evidence,
        where: form.where,
        when: form.when,
      });
      setBlacklist(data.entries || []);
      field("discordId", "");
      field("reason", "");
      field("evidence", "");
      setNotice("Added to blacklist.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTrainer(e) {
    e.preventDefault();
    try {
      const data = await api.staff.addTrainer(guildId, {
        discordId: form.discordId,
        stage: form.stage,
        price: form.price,
        bio: form.bio,
      });
      setTrainers(data.trainers || []);
      field("discordId", "");
      field("stage", "");
      field("price", "");
      field("bio", "");
      setNotice("Trainer saved.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    try {
      const serverId = messageGuildId || (guildId !== "network" ? guildId : "");
      if (form.mode === "channel" && !form.channelId) {
        setError("Pick a channel first.");
        return;
      }
      const isEmbed = form.format === "embed";
      await api.staff.message({
        type: form.mode,
        guildId: serverId,
        channelId: form.channelId,
        userId: form.userId,
        content: form.content,
        format: form.format,
        embed: isEmbed
          ? {
              title: form.embedTitle,
              description: form.embedDescription,
              color: form.embedColor,
              footer: form.embedFooter,
              image: form.embedImage,
              thumbnail: form.embedThumbnail,
            }
          : undefined,
      });
      field("content", "");
      if (isEmbed) {
        field("embedTitle", "");
        field("embedDescription", "");
        field("embedFooter", "");
        field("embedImage", "");
        field("embedThumbnail", "");
      }
      setNotice(form.mode === "dm" ? "DM sent." : "Server message sent.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-hero page-hero-blue">
      <div className="wrap dash">
        <aside className="dash-side">
          <h2>Dashboard</h2>
          <div className="dash-server">
            {guildId === "network" ? <span className="server-fallback">All</span> : guildIcon(selectedGuild)}
            <div>
              <strong>{guildId === "network" ? "Network" : selectedGuild?.name || "Server"}</strong>
            </div>
          </div>
          <nav className="dash-tabs">
            {TABS.filter((item) => {
              if (item.id === "reports") return guildId === "network";
              if (item.id === "verify" || item.id === "messages") return guildId !== "network";
              return true;
            }).map((item) => (
              <button key={item.id} className={tab === item.id ? "on" : ""} type="button" onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          <button className="btn ghost" type="button" onClick={leaveServer}>
            Change server
          </button>
        </aside>

        <div className="dash-main">
          {error ? <p className="banner banner-danger">{error}</p> : null}
          {notice ? <p className="banner banner-ok">{notice}</p> : null}

          {tab === "reports" && guildId === "network" ? (
            <>
              <h1>Pending reports</h1>
              <p className="sub">Approve to push a report onto the public blacklist.</p>
              <div className="stack">
                {reports.length === 0 ? <p className="sub">No pending reports.</p> : null}
                {reports.map((row) => (
                  <article className="list-card" key={row.id}>
                    <h3>
                      {row.reportedName || row.reportedId} · reported by {row.reporterName || row.reporterId}
                    </h3>
                    <p>
                      <strong>Reason:</strong> {row.reason}
                    </p>
                    <p>
                      <strong>Proof:</strong> {row.proof}
                    </p>
                    <p>
                      <strong>When:</strong> {row.when || "—"} · <strong>Where:</strong> {row.where || "—"}
                    </p>
                    <div className="dash-form" style={{ marginTop: 12 }}>
                      <button
                        className="btn"
                        type="button"
                        onClick={async () => {
                          await api.staff.approveReport(row.id, { guildId });
                          setNotice("Report approved and added to blacklist.");
                          await refreshLists();
                        }}
                      >
                        Approve → blacklist
                      </button>
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={async () => {
                          await api.staff.denyReport(row.id);
                          setNotice("Report denied.");
                          await refreshLists();
                        }}
                      >
                        Deny
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {tab === "blacklist" ? (
            <>
              <h1>Blacklisted</h1>
              <form className="dash-form dash-form-col" onSubmit={addBlacklist}>
                <input placeholder="Discord user ID" value={form.discordId} onChange={(e) => field("discordId", e.target.value)} required />
                <input placeholder="Sanction reason" value={form.reason} onChange={(e) => field("reason", e.target.value)} />
                <input placeholder="Proof / evidence links" value={form.evidence} onChange={(e) => field("evidence", e.target.value)} />
                <input placeholder="From where" value={form.where} onChange={(e) => field("where", e.target.value)} />
                <input placeholder="When it happened" value={form.when} onChange={(e) => field("when", e.target.value)} />
                <button className="btn" type="submit">
                  Add
                </button>
              </form>
              <div className="stack">
                {blacklist.map((row) => (
                  <article className="list-card dash-row" key={`${row.discordId}-${row.at}`}>
                    <div>
                      <h3>{row.displayName || row.username || row.discordId}</h3>
                      <p>{row.reason}</p>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={async () => {
                        const data = await api.staff.removeBlacklist(guildId, row.discordId);
                        setBlacklist(data.entries || []);
                      }}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {tab === "trainers" ? (
            <>
              <h1>Trainers</h1>
              <form className="dash-form dash-form-col" onSubmit={addTrainer}>
                <input placeholder="Discord user ID" value={form.discordId} onChange={(e) => field("discordId", e.target.value)} required />
                <input placeholder="Stage (e.g. 1 High Weak)" value={form.stage} onChange={(e) => field("stage", e.target.value)} required />
                <input placeholder="Price to train (e.g. $10 / 1h)" value={form.price} onChange={(e) => field("price", e.target.value)} required />
                <input placeholder="Bio (optional)" value={form.bio} onChange={(e) => field("bio", e.target.value)} />
                <button className="btn" type="submit">
                  Save trainer
                </button>
              </form>
              <div className="stack">
                {trainers.map((row) => (
                  <article className="list-card dash-row" key={row.discordId}>
                    <div>
                      <h3>
                        {row.displayName || row.username || row.discordId} · {row.stage}
                      </h3>
                      <p>{row.price}</p>
                    </div>
                    <button
                      className="btn ghost"
                      type="button"
                      onClick={async () => {
                        const data = await api.staff.removeTrainer(guildId, row.discordId);
                        setTrainers(data.trainers || []);
                      }}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {tab === "verify" ? (
            hasServer && verifyCfg ? (
              <form
                className="dash-form dash-form-col"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const saved = await api.staff.saveVerify(guildId, verifyCfg);
                    setVerifyCfg(saved);
                    setNotice("Verification actions saved.");
                    setError("");
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <h3>Approve</h3>
                <PickerField
                  label="Give these roles"
                  placeholder="Select roles"
                  value={roleNames(verifyCfg.approve.addRoleIds)}
                  onClick={() => setPicker("give")}
                />
                <PickerField
                  label="Remove these roles"
                  placeholder="Select roles"
                  value={roleNames(verifyCfg.approve.removeRoleIds)}
                  onClick={() => setPicker("remove")}
                />
                <label className="dash-label">Nickname (optional)</label>
                <input
                  placeholder="{display}  ·  {roblox}  ·  {username}"
                  value={verifyCfg.approve.nickname}
                  onChange={(e) =>
                    setVerifyCfg({ ...verifyCfg, approve: { ...verifyCfg.approve, nickname: e.target.value } })
                  }
                />
                <label className="dash-label">DM after approve (optional)</label>
                <textarea
                  rows={3}
                  placeholder="You’re verified."
                  value={verifyCfg.approve.dmMessage}
                  onChange={(e) =>
                    setVerifyCfg({ ...verifyCfg, approve: { ...verifyCfg.approve, dmMessage: e.target.value } })
                  }
                />
                <Switch
                  checked={!!verifyCfg.approve.closeTicket}
                  onChange={(on) =>
                    setVerifyCfg({ ...verifyCfg, approve: { ...verifyCfg.approve, closeTicket: on } })
                  }
                  label="Close the ticket after approve"
                />

                <h3>Deny</h3>
                <div className="tabs">
                  <button
                    className={`tab ${verifyCfg.deny.mode === "close" ? "on" : ""}`}
                    type="button"
                    onClick={() => setVerifyCfg({ ...verifyCfg, deny: { ...verifyCfg.deny, mode: "close" } })}
                  >
                    Close ticket
                  </button>
                  <button
                    className={`tab ${verifyCfg.deny.mode === "private" ? "on" : ""}`}
                    type="button"
                    onClick={() => setVerifyCfg({ ...verifyCfg, deny: { ...verifyCfg.deny, mode: "private" } })}
                  >
                    Go private
                  </button>
                </div>
                <label className="dash-label">DM after deny (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Your verification was denied."
                  value={verifyCfg.deny.dmMessage}
                  onChange={(e) =>
                    setVerifyCfg({ ...verifyCfg, deny: { ...verifyCfg.deny, dmMessage: e.target.value } })
                  }
                />
                <button className="btn" type="submit">
                  Save
                </button>
              </form>
            ) : null
          ) : null}

          {tab === "messages" ? (
            <>
              <h1>Messages</h1>
              <div className="tabs">
                <button className={`tab ${form.mode === "channel" ? "on" : ""}`} type="button" onClick={() => field("mode", "channel")}>
                  Server channel
                </button>
                <button className={`tab ${form.mode === "dm" ? "on" : ""}`} type="button" onClick={() => field("mode", "dm")}>
                  Direct message
                </button>
              </div>
              <form className="dash-form dash-form-col" onSubmit={sendMessage}>
                {form.mode === "channel" ? (
                  <PickerField
                    label="Channel"
                    placeholder="Select a channel"
                    value={channels.find((ch) => ch.id === form.channelId) ? `#${channels.find((ch) => ch.id === form.channelId).name}` : ""}
                    onClick={() => setPicker("channel")}
                  />
                ) : (
                  <>
                    <div className="dash-form">
                      <input
                        placeholder="Search members in that server"
                        value={form.memberQuery}
                        onChange={(e) => field("memberQuery", e.target.value)}
                      />
                      <button className="btn ghost" type="button" onClick={searchMembers}>
                        Search
                      </button>
                    </div>
                    <select value={form.userId} onChange={(e) => field("userId", e.target.value)} required>
                      <option value="">Select a user</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.displayName} (@{m.username})
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <div className="tabs">
                  <button className={`tab ${form.format === "text" ? "on" : ""}`} type="button" onClick={() => field("format", "text")}>
                    Plain text
                  </button>
                  <button className={`tab ${form.format === "embed" ? "on" : ""}`} type="button" onClick={() => field("format", "embed")}>
                    Embed
                  </button>
                </div>

                {form.format === "embed" ? (
                  <>
                    <input
                      placeholder="Embed title"
                      value={form.embedTitle}
                      onChange={(e) => field("embedTitle", e.target.value)}
                    />
                    <textarea
                      rows={5}
                      placeholder="Embed description"
                      value={form.embedDescription}
                      onChange={(e) => field("embedDescription", e.target.value)}
                      required
                    />
                    <input
                      placeholder="Color hex (e.g. 2B2D31)"
                      value={form.embedColor}
                      onChange={(e) => field("embedColor", e.target.value)}
                    />
                    <input
                      placeholder="Footer (optional)"
                      value={form.embedFooter}
                      onChange={(e) => field("embedFooter", e.target.value)}
                    />
                    <input
                      placeholder="Image URL (optional)"
                      value={form.embedImage}
                      onChange={(e) => field("embedImage", e.target.value)}
                    />
                    <input
                      placeholder="Thumbnail URL (optional)"
                      value={form.embedThumbnail}
                      onChange={(e) => field("embedThumbnail", e.target.value)}
                    />
                    <textarea
                      rows={2}
                      placeholder="Optional plain text above the embed"
                      value={form.content}
                      onChange={(e) => field("content", e.target.value)}
                    />
                  </>
                ) : (
                  <textarea
                    rows={5}
                    placeholder="Message from the bot"
                    value={form.content}
                    onChange={(e) => field("content", e.target.value)}
                    required
                  />
                )}
                <button className="btn" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
      <PickerModal
        open={picker === "give" || picker === "remove"}
        title="Role"
        subtitle="Select roles"
        searchPlaceholder="Search roles"
        items={roleItems()}
        selectedIds={
          picker === "remove" ? verifyCfg?.approve.removeRoleIds || [] : verifyCfg?.approve.addRoleIds || []
        }
        multiple
        onClose={() => setPicker(null)}
        onDone={(ids) => {
          if (!verifyCfg) return;
          const key = picker === "remove" ? "removeRoleIds" : "addRoleIds";
          setVerifyCfg({ ...verifyCfg, approve: { ...verifyCfg.approve, [key]: ids } });
        }}
      />
      <PickerModal
        open={picker === "channel"}
        title="Channel"
        subtitle="Select a channel"
        searchPlaceholder="Search channels"
        items={channels.map((ch) => ({ id: ch.id, name: ch.name, prefix: "#" }))}
        selectedIds={form.channelId ? [form.channelId] : []}
        multiple={false}
        onClose={() => setPicker(null)}
        onDone={(id) => field("channelId", id)}
      />
    </section>
  );
}
