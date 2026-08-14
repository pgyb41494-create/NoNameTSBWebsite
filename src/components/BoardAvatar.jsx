import { useState } from "react";

function defaultAvatar(userId) {
  try {
    const idx = Number((BigInt(String(userId || "0")) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

/** Prefer animated GIF URLs; fall back to Discord default on error. */
export function BoardAvatar({ src, userId, alt = "" }) {
  const [failed, setFailed] = useState(false);
  const url = !failed && src ? src : defaultAvatar(userId);

  return <img className="board-avatar" src={url} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function displayNameOf(row) {
  return row?.displayName || row?.username || row?.robloxUsername || row?.discordId || "Unknown";
}

export function handleOf(row) {
  const handle = row?.username || row?.discordId;
  if (!handle) return "@unknown";
  return `@${String(handle).replace(/^@/, "")}`;
}
