/** Discord-flavored message content for Channel chat. */

function inlineTokens(text, ctx) {
  if (!text) return null;
  const pattern =
    /(```[\s\S]*?```|`[^`\n]+`|\|\|[\s\S]*?\|\||\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|_[^_\n]+_|<a?:\w+:\d+>|<@!?\d+>|<@&\d+>|<#\d+>|@everyone|@here|https?:\/\/[^\s<]+)/g;
  const parts = String(text).split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;
    const key = `${i}-${part.slice(0, 24)}`;

    if (part.startsWith("```") && part.endsWith("```")) {
      const body = part.slice(3, -3).replace(/^\w*\n/, "");
      return (
        <pre className="chat-codeblock" key={key}>
          <code>{body}</code>
        </pre>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code className="chat-code" key={key}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("||") && part.endsWith("||") && part.length > 4) {
      return (
        <span className="chat-spoiler" key={key} title="Spoiler">
          {inlineTokens(part.slice(2, -2), ctx)}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{inlineTokens(part.slice(2, -2), ctx)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__")) {
      return <u key={key}>{inlineTokens(part.slice(2, -2), ctx)}</u>;
    }
    if (part.startsWith("~~") && part.endsWith("~~")) {
      return <s key={key}>{inlineTokens(part.slice(2, -2), ctx)}</s>;
    }
    if (
      ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) &&
      part.length > 2
    ) {
      return <em key={key}>{inlineTokens(part.slice(1, -1), ctx)}</em>;
    }

    const emoji = part.match(/^<(a)?:(\w+):(\d+)>$/);
    if (emoji) {
      const animated = !!emoji[1];
      const name = emoji[2];
      const id = emoji[3];
      return (
        <img
          key={key}
          className="chat-emoji"
          src={`https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?size=48&quality=lossless`}
          alt={`:${name}:`}
          title={`:${name}:`}
        />
      );
    }

    const userMention = part.match(/^<@!?(\d+)>$/);
    if (userMention) {
      const name = ctx.users.get(userMention[1]) || userMention[1];
      return (
        <span className="chat-mention" key={key}>
          @{name}
        </span>
      );
    }
    const roleMention = part.match(/^<@&(\d+)>$/);
    if (roleMention) {
      const name = ctx.roles.get(roleMention[1]) || "role";
      return (
        <span className="chat-mention chat-mention-role" key={key}>
          @{name}
        </span>
      );
    }
    const channelMention = part.match(/^<#(\d+)>$/);
    if (channelMention) {
      const name = ctx.channels.get(channelMention[1]) || channelMention[1];
      return (
        <span className="chat-mention chat-mention-channel" key={key}>
          #{name}
        </span>
      );
    }
    if (part === "@everyone" || part === "@here") {
      return (
        <span className="chat-mention" key={key}>
          {part}
        </span>
      );
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={key} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

export function DiscordContent({ content, mentions = [], mentionRoles = [], mentionChannels = [] }) {
  if (!content) return null;
  const ctx = {
    users: new Map(mentions.map((m) => [String(m.id), m.displayName || m.username || m.id])),
    roles: new Map(mentionRoles.map((m) => [String(m.id), m.name || m.id])),
    channels: new Map(mentionChannels.map((m) => [String(m.id), m.name || m.id])),
  };

  const lines = String(content).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let quoteBuf = [];

  const flushQuote = () => {
    if (!quoteBuf.length) return;
    blocks.push({ type: "quote", lines: quoteBuf });
    quoteBuf = [];
  };

  for (const line of lines) {
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      quoteBuf.push(quote[1]);
      continue;
    }
    flushQuote();
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }
    blocks.push({ type: "line", text: line });
  }
  flushQuote();

  return (
    <div className="chat-text">
      {blocks.map((block, i) => {
        if (block.type === "quote") {
          return (
            <blockquote className="chat-quote" key={`q-${i}`}>
              {block.lines.map((line, j) => (
                <p key={`q-${i}-${j}`}>{inlineTokens(line || "\u00a0", ctx) || "\u00a0"}</p>
              ))}
            </blockquote>
          );
        }
        if (block.type === "heading") {
          const Tag = block.level === 1 ? "h3" : block.level === 2 ? "h4" : "h5";
          return (
            <Tag className={`chat-heading chat-h${block.level}`} key={`h-${i}`}>
              {inlineTokens(block.text, ctx)}
            </Tag>
          );
        }
        return (
          <p key={`l-${i}`} className={block.text ? undefined : "chat-blank"}>
            {inlineTokens(block.text || "\u00a0", ctx) || "\u00a0"}
          </p>
        );
      })}
    </div>
  );
}

export function hexColor(value) {
  if (value == null) return null;
  if (typeof value === "number") return `#${value.toString(16).padStart(6, "0")}`;
  const raw = String(value).replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

function isImageAttachment(file) {
  const type = String(file.contentType || "");
  if (type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(file.name || file.url || "");
}

function isVideoAttachment(file) {
  const type = String(file.contentType || "");
  if (type.startsWith("video/")) return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(file.name || file.url || "");
}

function isAudioAttachment(file) {
  const type = String(file.contentType || "");
  if (type.startsWith("audio/")) return true;
  return /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(file.name || file.url || "");
}

export function ChatEmbed({ emb }) {
  const color = hexColor(emb.color) || "#5865f2";
  const fields = Array.isArray(emb.fields) ? emb.fields : [];
  return (
    <div className="chat-embed" style={{ borderColor: color }}>
      {emb.author?.name ? (
        <div className="chat-embed-author">
          {emb.author.icon_url || emb.author.iconURL ? (
            <img src={emb.author.icon_url || emb.author.iconURL} alt="" />
          ) : null}
          {emb.author.url ? (
            <a href={emb.author.url} target="_blank" rel="noreferrer">
              {emb.author.name}
            </a>
          ) : (
            <span>{emb.author.name}</span>
          )}
        </div>
      ) : null}
      {emb.title ? (
        emb.url ? (
          <a className="chat-embed-title" href={emb.url} target="_blank" rel="noreferrer">
            {emb.title}
          </a>
        ) : (
          <h4 className="chat-embed-title">{emb.title}</h4>
        )
      ) : null}
      {emb.description ? (
        <div className="chat-embed-desc">
          <DiscordContent content={emb.description} />
        </div>
      ) : null}
      {fields.length ? (
        <div className="chat-embed-fields-grid">
          {fields.map((field, idx) => (
            <div className={`chat-embed-field ${field.inline ? "inline" : ""}`} key={`${field.name}-${idx}`}>
              <strong>{field.name}</strong>
              <DiscordContent content={field.value} />
            </div>
          ))}
        </div>
      ) : null}
      <div className="chat-embed-media">
        {emb.thumbnail?.url ? <img className="chat-embed-thumb" src={emb.thumbnail.url} alt="" /> : null}
        {emb.image?.url ? <img className="chat-embed-image" src={emb.image.url} alt="" /> : null}
      </div>
      {emb.footer?.text ? (
        <div className="chat-embed-footer">
          {emb.footer.icon_url || emb.footer.iconURL ? (
            <img src={emb.footer.icon_url || emb.footer.iconURL} alt="" />
          ) : null}
          <small>{emb.footer.text}</small>
        </div>
      ) : null}
    </div>
  );
}

export function ChatAttachments({ attachments = [] }) {
  return attachments.map((file) => {
    const url = file.url || file.proxyUrl;
    if (!url) return null;
    if (isImageAttachment(file)) {
      return (
        <a key={file.id} href={url} target="_blank" rel="noreferrer" className="chat-attach-link">
          <img className="chat-attach" src={url} alt={file.name || ""} />
        </a>
      );
    }
    if (isVideoAttachment(file)) {
      return (
        <video key={file.id} className="chat-attach-video" controls src={url}>
          <a href={url}>{file.name || "Video"}</a>
        </video>
      );
    }
    if (isAudioAttachment(file)) {
      return <audio key={file.id} className="chat-attach-audio" controls src={url} />;
    }
    return (
      <a key={file.id} className="chat-file" href={url} target="_blank" rel="noreferrer">
        {file.name || "Attachment"}
      </a>
    );
  });
}
