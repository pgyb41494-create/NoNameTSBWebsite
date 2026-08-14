import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

const TABS = [
  { id: "blacklist", label: "Blacklisted" },
  { id: "trainers", label: "Trainers" },
  { id: "messages", label: "Messages" },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("blacklist");
  const [guilds, setGuilds] = useState([]);
  const [guildId, setGuildId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [blacklist, setBlacklist] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({
    discordId: "",
    reason: "",
    specialty: "",
    role: "Trainer",
    bio: "",
    channelId: "",
    userId: "",
    content: "",
    mode: "channel",
    memberQuery: "",
  });

  useEffect(() => {
    if (!user) return;
    api.staff
      .guilds()
      .then((data) => {
        setGuilds(data.guilds || []);
        setGuildId((current) => current || data.guilds?.[0]?.id || "");
        setError("");
      })
      .catch((err) => setError(err.message));
  }, [user]);

  useEffect(() => {
    if (!guildId) return;
    Promise.all([
      api.staff.blacklist(guildId),
      api.staff.trainers(guildId),
      api.staff.channels(guildId).catch(() => ({ channels: [] })),
    ])
      .then(([bl, tr, ch]) => {
        setBlacklist(bl.entries || []);
        setTrainers(tr.trainers || []);
        setChannels(ch.channels || []);
      })
      .catch((err) => setError(err.message));
  }, [guildId]);

  if (loading) return <section className="wrap page">Loading…</section>;
  if (!user) return <Navigate to="/" replace />;

  function field(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function searchMembers() {
    if (!guildId) return;
    try {
      const data = await api.staff.members(guildId, form.memberQuery);
      setMembers(data.members || []);
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
      });
      setBlacklist(data.entries || []);
      field("discordId", "");
      field("reason", "");
      setNotice("Added to blacklist.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function addTrainer(e) {
    e.preventDefault();
    try {
      const data = await api.staff.addTrainer(guildId, {
        discordId: form.discordId,
        specialty: form.specialty,
        role: form.role,
        bio: form.bio,
      });
      setTrainers(data.trainers || []);
      field("discordId", "");
      field("specialty", "");
      field("bio", "");
      setNotice("Trainer saved.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    try {
      await api.staff.message({
        type: form.mode,
        guildId,
        channelId: form.channelId,
        userId: form.userId,
        content: form.content,
      });
      field("content", "");
      setNotice(form.mode === "dm" ? "DM sent." : "Server message sent.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-hero page-hero-blue">
      <div className="wrap dash">
        <aside className="dash-side">
          <h2>Dashboard</h2>
          <p className="sub">Staff only · {user.username}</p>
          <label className="dash-label">Server</label>
          <select value={guildId} onChange={(e) => setGuildId(e.target.value)}>
            {!guilds.length ? <option value="">No servers yet</option> : null}
            {guilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <nav className="dash-tabs">
            {TABS.map((item) => (
              <button key={item.id} className={tab === item.id ? "on" : ""} type="button" onClick={() => setTab(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          <button className="btn ghost" type="button" onClick={() => navigate("/")}>
            Back to site
          </button>
        </aside>

        <div className="dash-main">
          {error ? <p className="banner banner-danger">{error}</p> : null}
          {notice ? <p className="banner banner-ok">{notice}</p> : null}

          {tab === "blacklist" ? (
            <>
              <h1 className="gradient-text-red">Blacklisted</h1>
              <form className="dash-form" onSubmit={addBlacklist}>
                <input placeholder="Discord user ID" value={form.discordId} onChange={(e) => field("discordId", e.target.value)} required />
                <input placeholder="Reason" value={form.reason} onChange={(e) => field("reason", e.target.value)} />
                <button className="btn" type="submit">Add</button>
              </form>
              <div className="stack">
                {blacklist.map((row) => (
                  <article className="list-card dash-row" key={`${row.discordId}-${row.at}`}>
                    <div>
                      <h3>{row.robloxUsername || row.discordId}</h3>
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
              <h1 className="gradient-text-orange">Trainers</h1>
              <form className="dash-form" onSubmit={addTrainer}>
                <input placeholder="Discord user ID" value={form.discordId} onChange={(e) => field("discordId", e.target.value)} required />
                <input placeholder="Specialty" value={form.specialty} onChange={(e) => field("specialty", e.target.value)} />
                <input placeholder="Role" value={form.role} onChange={(e) => field("role", e.target.value)} />
                <input placeholder="Bio" value={form.bio} onChange={(e) => field("bio", e.target.value)} />
                <button className="btn" type="submit">Save</button>
              </form>
              <div className="stack">
                {trainers.map((row) => (
                  <article className="list-card dash-row" key={row.discordId}>
                    <div>
                      <h3>
                        {row.discordId} · {row.role}
                      </h3>
                      <p>{row.specialty}</p>
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

          {tab === "messages" ? (
            <>
              <h1>Messages</h1>
              <p className="sub">Send as the bot in a server channel, or DM a user.</p>
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
                  <select value={form.channelId} onChange={(e) => field("channelId", e.target.value)} required>
                    <option value="">Select a channel</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <div className="dash-form">
                      <input
                        placeholder="Search members"
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
                    <input placeholder="Or paste a Discord user ID" value={form.userId} onChange={(e) => field("userId", e.target.value)} />
                  </>
                )}
                <textarea
                  rows={5}
                  placeholder="Message from the bot"
                  value={form.content}
                  onChange={(e) => field("content", e.target.value)}
                  required
                />
                <button className="btn" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
