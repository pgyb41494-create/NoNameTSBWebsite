import { useEffect, useState } from "react";
import { API } from "../api";

function defaultAvatar(userId) {
  try {
    const idx = Number((BigInt(String(userId || "0")) >> 22n) % 6n);
    return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

/** Force Discord animated hashes to .gif (png/webp are static). */
function forceGifIfAnimated(url) {
  if (!url) return null;
  const s = String(url);
  if (/\/avatars\/\d+\/a_[a-f0-9]+\.(webp|png)(\?|$)/i.test(s)) {
    return s.replace(/\.(webp|png)(\?|$)/i, ".gif$2");
  }
  return s;
}

function avatarCandidates(src, userId) {
  const list = [];
  if (userId) list.push(`${API}/api/public/avatar/${userId}`);
  const forced = forceGifIfAnimated(src);
  if (forced) list.push(forced);
  list.push(defaultAvatar(userId));
  return [...new Set(list.filter(Boolean))];
}

export function BoardAvatar({ src, userId, alt = "", className = "board-avatar" }) {
  const candidates = avatarCandidates(src, userId);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src, userId]);

  const url = candidates[Math.min(index, candidates.length - 1)];

  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIndex((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  );
}

export function displayNameOf(row) {
  return row?.displayName || row?.username || row?.robloxUsername || row?.discordId || "Unknown";
}

export function handleOf(row) {
  const handle = row?.username || row?.discordId;
  if (!handle) return "@unknown";
  return `@${String(handle).replace(/^@/, "")}`;
}
