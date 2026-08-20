import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { BoardAvatar } from "../components/BoardAvatar";

function sortPos(a, b) {
  return (a.position ?? 0) - (b.position ?? 0) || String(a.name || "").localeCompare(String(b.name || ""));
}

function buildChannelTree(channels) {
  const list = Array.isArray(channels) ? channels : [];
  const categories = list.filter((ch) => ch.type === "category").sort(sortPos);
  const text = list.filter((ch) => ch.type === "text" || ch.type === "announcement");
  const byParent = new Map();
  for (const ch of text) {
    const key = ch.parentId || "";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(ch);
  }
  for (const rows of byParent.values()) rows.sort(sortPos);

  const top = [
    ...categories.map((cat) => ({ kind: "category", ...cat })),
    ...(byParent.get("") || []).map((ch) => ({ kind: "channel", ...ch })),
  ].sort(sortPos);

  const rows = [];
  for (const item of top) {
    if (item.kind === "category") {
      rows.push(item);
      for (const child of byParent.get(item.id) || []) {
        rows.push({ kind: "channel", ...child });
      }
    } else {
      rows.push(item);
    }
  }
  return rows;
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function renderContent(content, mentions = []) {
  if (!content) return null;
  const map = new Map(mentions.map((m) => [String(m.id), m.displayName || m.username || m.id]));
  const parts = String(content).split(/(<@!?\d+>|https?:\/\/[^\s<]+)/g);
  return parts.map((part, i) => {
    const mention = part.match(/^<@!?(\d+)>$/);
    if (mention) {
      const name = map.get(mention[1]) || mention[1];
      return (
        <span className="chat-mention" key={`${i}-${part}`}>
          @{name}
        </span>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={`${i}-${part}`} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    return <span key={`${i}-${part}`}>{part}</span>;
  });
}

function hexColor(value) {
  if (value == null) return null;
  if (typeof value === "number") return `#${value.toString(16).padStart(6, "0")}`;
  const raw = String(value).replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

export default function ChannelChatTab({ guilds, onError, onNotice }) {
  const [serverId, setServerId] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelId, setChannelId] = useState("");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [format, setFormat] = useState("text");
  const [content, setContent] = useState("");
  const [embed, setEmbed] = useState({
    title: "",
    description: "",
    color: "2B2D31",
    footer: "",
    image: "",
    thumbnail: "",
  });
  const [mentionQuery, setMentionQuery] = useState("");
  const bottomRef = useRef(null);
  const typingAt = useRef(0);
  const stickBottom = useRef(true);

  const tree = useMemo(() => buildChannelTree(channels), [channels]);
  const activeChannel = channels.find((ch) => ch.id === channelId) || null;
  const botGuilds = guilds.filter((g) => g.botPresent);

  useEffect(() => {
    if (!serverId) {
      setChannels([]);
      setChannelId("");
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingChannels(true);
    Promise.all([
      api.staff.channels(serverId),
      api.staff.members(serverId, "").catch(() => ({ members: [] })),
    ])
      .then(([chData, memberData]) => {
        if (cancelled) return;
        const list = chData.channels || [];
        setChannels(list);
        setMembers(memberData.members || []);
        setChannelId("");
        setMessages([]);
        onError?.("");
      })
      .catch((err) => {
        if (!cancelled) onError?.(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingChannels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serverId]);

  async function loadMessages(id = channelId, { silent = false } = {}) {
    if (!serverId || !id) return;
    if (!silent) setLoadingMessages(true);
    try {
      const data = await api.staff.channelMessages(serverId, id, { limit: 60 });
      setMessages(data.messages || []);
      onError?.("");
      if (stickBottom.current) {
        requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: silent ? "auto" : "smooth" }));
      }
    } catch (err) {
      if (!silent) onError?.(err.message);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      return undefined;
    }
    stickBottom.current = true;
    loadMessages(channelId);
    const timer = setInterval(() => loadMessages(channelId, { silent: true }), 4000);
    return () => clearInterval(timer);
  }, [channelId, serverId]);

  function onScroll(e) {
    const el = e.currentTarget;
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function pulseTyping() {
    if (!serverId || !channelId) return;
    const now = Date.now();
    if (now - typingAt.current < 7000) return;
    typingAt.current = now;
    api.staff.channelTyping(serverId, channelId).catch(() => {});
  }

  function insertMention(member) {
    const token = `<@${member.id}>`;
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${token} `);
    setMentionQuery("");
  }

  async function send(e) {
    e.preventDefault();
    if (!serverId || !channelId || sending) return;
    setSending(true);
    try {
      const body =
        format === "embed"
          ? {
              content: content.trim() || undefined,
              embed: {
                title: embed.title,
                description: embed.description,
                color: embed.color,
                footer: embed.footer,
                image: embed.image,
                thumbnail: embed.thumbnail,
              },
            }
          : { content };
      const data = await api.staff.sendChannelMessage(serverId, channelId, body);
      const sent = data.message || data;
      if (sent?.id) {
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      } else {
        await loadMessages(channelId, { silent: true });
      }
      setContent("");
      setEmbed({ title: "", description: "", color: "2B2D31", footer: "", image: "", thumbnail: "" });
      onNotice?.("Sent as the bot.");
      onError?.("");
      stickBottom.current = true;
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      onError?.(err.message);
    } finally {
      setSending(false);
    }
  }

  const mentionHits = mentionQuery
    ? members
        .filter((m) => {
          const q = mentionQuery.toLowerCase();
          return (
            String(m.displayName || "").toLowerCase().includes(q) ||
            String(m.username || "").toLowerCase().includes(q) ||
            String(m.id).includes(q)
          );
        })
        .slice(0, 8)
    : [];

  return (
    <div className="chat-shell">
      <div className="chat-head">
        <div>
          <h1>Channel chat</h1>
          <p className="sub">Pick a server, open a channel, and send as the bot — text, links, mentions, embeds.</p>
        </div>
        <label className="dash-label chat-server-pick">
          Server
          <select
            value={serverId}
            onChange={(e) => setServerId(e.target.value)}
          >
            <option value="">Select a server</option>
            {botGuilds.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!serverId ? (
        <p className="sub">Choose a server to load its channels.</p>
      ) : (
        <div className="chat-layout">
          <aside className="chat-channels">
            {loadingChannels ? <p className="sub">Loading channels…</p> : null}
            {!loadingChannels && tree.length === 0 ? <p className="sub">No text channels found.</p> : null}
            {tree.map((row) =>
              row.kind === "category" || row.type === "category" ? (
                <div className="chat-cat" key={`cat-${row.id}`}>
                  {row.name}
                </div>
              ) : (
                <button
                  key={row.id}
                  type="button"
                  className={`chat-channel ${channelId === row.id ? "on" : ""}`}
                  onClick={() => setChannelId(row.id)}
                >
                  <span>#</span>
                  {row.name}
                </button>
              )
            )}
          </aside>

          <section className="chat-main">
            {!channelId ? (
              <div className="chat-empty">
                <p className="sub">Select a channel to read and chat as the bot.</p>
              </div>
            ) : (
              <>
                <header className="chat-room-head">
                  <strong>#{activeChannel?.name || "channel"}</strong>
                  <button className="btn ghost" type="button" onClick={() => loadMessages(channelId)}>
                    Refresh
                  </button>
                </header>
                <div className="chat-messages" onScroll={onScroll}>
                  {loadingMessages && messages.length === 0 ? <p className="sub">Loading messages…</p> : null}
                  {!loadingMessages && messages.length === 0 ? <p className="sub">No messages yet.</p> : null}
                  {messages.map((msg) => (
                    <article className={`chat-msg ${msg.author?.bot ? "bot" : ""}`} key={msg.id}>
                      <BoardAvatar src={msg.author?.avatar} userId={msg.author?.id} className="chat-avatar" />
                      <div className="chat-msg-body">
                        <div className="chat-msg-meta">
                          <strong>{msg.author?.displayName || msg.author?.username || "Unknown"}</strong>
                          {msg.author?.bot ? <span className="chat-bot-tag">BOT</span> : null}
                          <span>{formatTime(msg.createdAt)}</span>
                        </div>
                        {msg.content ? <p className="chat-text">{renderContent(msg.content, msg.mentions)}</p> : null}
                        {(msg.embeds || []).map((emb, idx) => (
                          <div
                            className="chat-embed"
                            key={`${msg.id}-e-${idx}`}
                            style={{ borderColor: hexColor(emb.color) || "var(--line-strong)" }}
                          >
                            {emb.title ? <h4>{emb.title}</h4> : null}
                            {emb.description ? <p>{emb.description}</p> : null}
                            {emb.image?.url ? <img src={emb.image.url} alt="" /> : null}
                            {emb.thumbnail?.url && !emb.image?.url ? (
                              <img className="chat-embed-thumb" src={emb.thumbnail.url} alt="" />
                            ) : null}
                            {emb.footer?.text ? <small>{emb.footer.text}</small> : null}
                          </div>
                        ))}
                        {(msg.attachments || []).map((file) =>
                          String(file.contentType || "").startsWith("image/") ? (
                            <a key={file.id} href={file.url} target="_blank" rel="noreferrer">
                              <img className="chat-attach" src={file.url} alt={file.name || ""} />
                            </a>
                          ) : (
                            <a key={file.id} className="chat-file" href={file.url} target="_blank" rel="noreferrer">
                              {file.name || "Attachment"}
                            </a>
                          )
                        )}
                      </div>
                    </article>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form className="chat-composer" onSubmit={send}>
                  <div className="tabs">
                    <button
                      className={`tab ${format === "text" ? "on" : ""}`}
                      type="button"
                      onClick={() => setFormat("text")}
                    >
                      Text
                    </button>
                    <button
                      className={`tab ${format === "embed" ? "on" : ""}`}
                      type="button"
                      onClick={() => setFormat("embed")}
                    >
                      Embed
                    </button>
                  </div>

                  {format === "embed" ? (
                    <div className="chat-embed-fields">
                      <input
                        placeholder="Embed title"
                        value={embed.title}
                        onChange={(e) => setEmbed({ ...embed, title: e.target.value })}
                      />
                      <textarea
                        rows={3}
                        placeholder="Embed description"
                        value={embed.description}
                        onChange={(e) => setEmbed({ ...embed, description: e.target.value })}
                        required={!content.trim()}
                      />
                      <div className="dash-form">
                        <input
                          placeholder="Color hex"
                          value={embed.color}
                          onChange={(e) => setEmbed({ ...embed, color: e.target.value })}
                        />
                        <input
                          placeholder="Footer"
                          value={embed.footer}
                          onChange={(e) => setEmbed({ ...embed, footer: e.target.value })}
                        />
                      </div>
                      <div className="dash-form">
                        <input
                          placeholder="Image URL"
                          value={embed.image}
                          onChange={(e) => setEmbed({ ...embed, image: e.target.value })}
                        />
                        <input
                          placeholder="Thumbnail URL"
                          value={embed.thumbnail}
                          onChange={(e) => setEmbed({ ...embed, thumbnail: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="chat-mention-bar">
                    <input
                      placeholder="Search members to mention"
                      value={mentionQuery}
                      onChange={(e) => setMentionQuery(e.target.value)}
                    />
                    {mentionHits.length ? (
                      <div className="chat-mention-list">
                        {mentionHits.map((m) => (
                          <button key={m.id} type="button" onClick={() => insertMention(m)}>
                            <BoardAvatar src={m.avatar} userId={m.id} className="chat-mention-av" />
                            {m.displayName || m.username}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <textarea
                    rows={format === "embed" ? 2 : 4}
                    placeholder={
                      format === "embed"
                        ? "Optional text above the embed (links & <@id> mentions work)"
                        : "Message as the bot — paste links, use <@id> mentions…"
                    }
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      pulseTyping();
                    }}
                    onFocus={pulseTyping}
                    required={format === "text"}
                  />
                  <div className="chat-send-row">
                    <p className="sub">Sends as the bot in #{activeChannel?.name || "channel"}.</p>
                    <button className="btn" type="submit" disabled={sending}>
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
