import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { BoardAvatar } from "../components/BoardAvatar";
import { PickerField, PickerModal } from "../components/PickerModal";

function sortPos(a, b) {
  return (a.position ?? 0) - (b.position ?? 0) || String(a.name || "").localeCompare(String(b.name || ""));
}

function buildChannelTree(channels) {
  const list = Array.isArray(channels) ? channels : [];
  const categories = list.filter((ch) => ch.type === "category").sort(sortPos);
  const text = list.filter(
    (ch) => ch.type === "text" || ch.type === "announcement" || ch.type === "forum" || ch.type === "media"
  );
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

function channelGlyph(type) {
  if (type === "forum" || type === "media") return "◫";
  if (type === "announcement") return "📢";
  return "#";
}

function isForumChannel(ch) {
  return ch?.type === "forum" || ch?.type === "media";
}

function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
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
  const [threadId, setThreadId] = useState("");
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
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
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);
  const [typers, setTypers] = useState([]);
  const [serverPickerOpen, setServerPickerOpen] = useState(false);
  const messagesRef = useRef(null);
  const typingAt = useRef(0);
  const stickBottom = useRef(true);

  const tree = useMemo(() => buildChannelTree(channels), [channels]);
  const activeChannel = channels.find((ch) => ch.id === channelId) || null;
  const activePost = posts.find((p) => p.id === threadId) || null;
  const forumMode = isForumChannel(activeChannel);
  const chatTargetId = forumMode ? threadId : channelId;
  const botGuilds = guilds.filter((g) => g.botPresent);

  function scrollMessagesToBottom() {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

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
        setThreadId("");
        setPosts([]);
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

  async function loadMessages(id = chatTargetId, { silent = false } = {}) {
    if (!serverId || !id) return;
    if (!silent) setLoadingMessages(true);
    try {
      const data = await api.staff.channelMessages(serverId, id, { limit: 60 });
      setMessages(data.messages || []);
      onError?.("");
      if (stickBottom.current) {
        requestAnimationFrame(scrollMessagesToBottom);
      }
    } catch (err) {
      if (!silent) onError?.(err.message);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  async function loadPosts(id = channelId, { silent = false } = {}) {
    if (!serverId || !id) return;
    if (!silent) setLoadingPosts(true);
    try {
      const data = await api.staff.forumPosts(serverId, id);
      setPosts(data.posts || []);
      onError?.("");
    } catch (err) {
      if (!silent) onError?.(err.message);
    } finally {
      if (!silent) setLoadingPosts(false);
    }
  }

  function selectChannel(id) {
    const next = channels.find((ch) => ch.id === id) || null;
    setChannelId(id);
    setThreadId("");
    setMessages([]);
    setPosts([]);
    setShowNewPost(false);
    setPostTitle("");
    setTypers([]);
    stickBottom.current = true;
    if (isForumChannel(next)) {
      loadPosts(id);
    }
  }

  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setTypers([]);
      setPosts([]);
      setThreadId("");
      return undefined;
    }
    if (forumMode && !threadId) {
      setMessages([]);
      setTypers([]);
      return undefined;
    }
    const target = forumMode ? threadId : channelId;
    if (!target) return undefined;
    stickBottom.current = true;
    loadMessages(target);
    const msgTimer = setInterval(() => loadMessages(target, { silent: true }), 4000);
    const typingTimer = setInterval(() => {
      api.staff
        .channelTypingStatus(serverId, target)
        .then((data) => setTypers(data.typing || []))
        .catch(() => {});
    }, 2000);
    api.staff
      .channelTypingStatus(serverId, target)
      .then((data) => setTypers(data.typing || []))
      .catch(() => {});
    return () => {
      clearInterval(msgTimer);
      clearInterval(typingTimer);
    };
  }, [channelId, threadId, serverId, forumMode]);

  useEffect(() => {
    if (!forumMode || !channelId || threadId) return undefined;
    const timer = setInterval(() => loadPosts(channelId, { silent: true }), 12000);
    return () => clearInterval(timer);
  }, [forumMode, channelId, threadId, serverId]);

  function onScroll(e) {
    const el = e.currentTarget;
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  async function pulseTyping() {
    if (!serverId || !chatTargetId) return;
    const now = Date.now();
    if (now - typingAt.current < 7000) return;
    typingAt.current = now;
    api.staff.channelTyping(serverId, chatTargetId).catch(() => {});
  }

  async function openMentionPicker() {
    setMentionPickerOpen(true);
    if (!serverId) return;
    try {
      const data = await api.staff.members(serverId, "");
      setMembers(data.members || []);
    } catch {
      // keep existing members
    }
  }

  function insertMentionById(id) {
    if (!id) return;
    const token = `<@${id}>`;
    setContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${token} `);
    setMentionPickerOpen(false);
  }

  function typingLabel() {
    if (!typers.length) return "";
    const names = typers.map((t) => t.displayName || t.username || "Someone");
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]} are typing…`;
    return `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
  }

  async function send(e) {
    e.preventDefault();
    if (!serverId || !chatTargetId || sending) return;
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
      const data = await api.staff.sendChannelMessage(serverId, chatTargetId, body);
      const sent = data.message || data;
      if (sent?.id) {
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      } else {
        await loadMessages(chatTargetId, { silent: true });
      }
      setContent("");
      setEmbed({ title: "", description: "", color: "2B2D31", footer: "", image: "", thumbnail: "" });
      onNotice?.("Sent as the bot.");
      onError?.("");
      stickBottom.current = true;
      requestAnimationFrame(scrollMessagesToBottom);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setSending(false);
    }
  }

  async function createPost(e) {
    e.preventDefault();
    if (!serverId || !channelId || creatingPost) return;
    if (!postTitle.trim() || !content.trim()) {
      onError?.("Forum posts need a title and message.");
      return;
    }
    setCreatingPost(true);
    try {
      const created = await api.staff.createForumPost(serverId, channelId, {
        name: postTitle.trim(),
        content: content.trim(),
      });
      setPostTitle("");
      setContent("");
      setShowNewPost(false);
      await loadPosts(channelId);
      if (created?.id) {
        setThreadId(created.id);
        stickBottom.current = true;
      }
      onNotice?.("Forum post created.");
      onError?.("");
    } catch (err) {
      onError?.(err.message);
    } finally {
      setCreatingPost(false);
    }
  }

  const typingText = typingLabel();

  return (
    <div className="chat-shell">
      <div className="chat-head">
        <div>
          <h1>Channel chat</h1>
          <p className="sub">Pick a server, open a channel, and send as the bot — text, links, mentions, embeds.</p>
        </div>
        <div className="chat-server-pick">
          <PickerField
            label="Server"
            placeholder="Select a server"
            value={botGuilds.find((g) => g.id === serverId)?.name || ""}
            onClick={() => setServerPickerOpen(true)}
          />
        </div>
      </div>

      <PickerModal
        open={serverPickerOpen}
        title="Server"
        subtitle="Select a server"
        searchPlaceholder="Search servers"
        items={botGuilds.map((g) => ({
          id: g.id,
          name: g.name,
          icon: g.icon || undefined,
          fallback: String(g.name || "?").trim().charAt(0).toUpperCase() || "?",
        }))}
        selectedIds={serverId ? [serverId] : []}
        multiple={false}
        onClose={() => setServerPickerOpen(false)}
        onDone={(id) => setServerId(id || "")}
      />

      <PickerModal
        open={mentionPickerOpen}
        title="Member"
        subtitle="Select someone to mention"
        searchPlaceholder="Search members"
        items={members.map((m) => ({
          id: m.id,
          name: m.displayName || m.username,
          icon: m.avatar || undefined,
          fallback: String(m.displayName || m.username || "?").trim().charAt(0).toUpperCase() || "?",
          tag: m.username ? `@${m.username}` : undefined,
        }))}
        selectedIds={[]}
        multiple={false}
        onClose={() => setMentionPickerOpen(false)}
        onDone={insertMentionById}
      />

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
                  onClick={() => selectChannel(row.id)}
                >
                  <span>{channelGlyph(row.type)}</span>
                  {row.name}
                </button>
              )
            )}
          </aside>

          <section className="chat-main">
            {!channelId ? (
              <div className="chat-empty">
                <p className="sub">Select a channel or forum to continue.</p>
              </div>
            ) : forumMode && !threadId ? (
              <>
                <header className="chat-room-head">
                  <div>
                    <strong>
                      <span className="chat-forum-mark">◫</span> {activeChannel?.name || "forum"}
                    </strong>
                    {activeChannel?.topic ? <p className="sub chat-forum-topic">{activeChannel.topic}</p> : null}
                  </div>
                  <div className="chat-head-actions">
                    <button className="btn ghost" type="button" onClick={() => loadPosts(channelId)}>
                      Refresh
                    </button>
                    <button className="btn" type="button" onClick={() => setShowNewPost((v) => !v)}>
                      {showNewPost ? "Cancel" : "New Post"}
                    </button>
                  </div>
                </header>

                {showNewPost ? (
                  <form className="forum-new-post" onSubmit={createPost}>
                    <input
                      placeholder="Post title"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      required
                    />
                    <textarea
                      rows={4}
                      placeholder="Write the first message…"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    />
                    <div className="chat-send-row">
                      <p className="sub">Creates a forum post as the bot.</p>
                      <button className="btn" type="submit" disabled={creatingPost}>
                        {creatingPost ? "Posting…" : "Post"}
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="forum-posts">
                  {loadingPosts && posts.length === 0 ? <p className="sub">Loading posts…</p> : null}
                  {!loadingPosts && posts.length === 0 ? <p className="sub">No posts yet.</p> : null}
                  {posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      className={`forum-card ${post.archived ? "archived" : ""}`}
                      onClick={() => {
                        setThreadId(post.id);
                        stickBottom.current = true;
                      }}
                    >
                      <div className="forum-card-top">
                        <BoardAvatar
                          src={post.owner?.avatar || post.starter?.author?.avatar}
                          userId={post.owner?.id || post.starter?.author?.id}
                          className="forum-card-av"
                        />
                        <div className="forum-card-meta">
                          <strong>{post.name}</strong>
                          <span>
                            {post.owner?.displayName || post.starter?.author?.displayName || "Unknown"}
                            {" · "}
                            {relativeTime(post.lastMessageAt || post.createdAt)}
                            {post.archived ? " · Archived" : ""}
                          </span>
                        </div>
                        <div className="forum-card-stats">
                          <span>{Math.max(0, Number(post.messageCount || 0))} replies</span>
                        </div>
                      </div>
                      {post.starter?.content ? (
                        <p className="forum-card-preview">{post.starter.content}</p>
                      ) : (
                        <p className="forum-card-preview dim">No preview</p>
                      )}
                      {post.tags?.length ? (
                        <div className="forum-tags">
                          {post.tags.map((tag) => (
                            <span key={tag.id} className="forum-tag">
                              {tag.emoji ? `${tag.emoji} ` : ""}
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <header className="chat-room-head">
                  <div className="chat-room-title">
                    {forumMode ? (
                      <button className="btn ghost chat-back" type="button" onClick={() => setThreadId("")}>
                        ← Posts
                      </button>
                    ) : null}
                    <strong>
                      {forumMode ? activePost?.name || "Post" : `#${activeChannel?.name || "channel"}`}
                    </strong>
                  </div>
                  <button
                    className="btn ghost"
                    type="button"
                    onClick={() => loadMessages(chatTargetId)}
                  >
                    Refresh
                  </button>
                </header>
                <div className="chat-messages" ref={messagesRef} onScroll={onScroll}>
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

                  <PickerField
                    label="Mention"
                    placeholder="Select a member to mention"
                    value=""
                    onClick={openMentionPicker}
                  />

                  {typingText ? (
                    <div className="chat-typing">
                      <div className="chat-typing-avatars">
                        {typers.slice(0, 3).map((t) => (
                          <BoardAvatar key={t.id} src={t.avatar} userId={t.id} className="chat-typing-av" />
                        ))}
                      </div>
                      <span>{typingText}</span>
                    </div>
                  ) : null}

                  <textarea
                    rows={format === "embed" ? 2 : 4}
                    placeholder={
                      format === "embed"
                        ? "Optional text above the embed (links & mentions work)"
                        : "Message as the bot — paste links, mention people…"
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
                    <p className="sub">
                      Sends as the bot in {forumMode ? activePost?.name || "this post" : `#${activeChannel?.name || "channel"}`}.
                    </p>
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
