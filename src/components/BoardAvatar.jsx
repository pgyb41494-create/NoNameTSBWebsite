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
  return String(url).replace(
    /(\/avatars\/\d+\/a_[^/?#.]+)\.(webp|png|jpg|jpeg)(\?|$)/i,
    "$1.gif$3"
  );
}

function avatarCandidates(src, userId) {
  const list = [];
  const forced = forceGifIfAnimated(src);
  if (forced) list.push(forced);
  if (src && src !== forced) list.push(src);
  if (userId) list.push(`${API}/api/public/avatar/${userId}`);
  list.push(defaultAvatar(userId));
  return [...new Set(list.filter(Boolean))];
}

export function BoardAvatar({ src, userId, alt = "", className = "board-avatar" }) {
  const [candidates, setCandidates] = useState(() => (src ? avatarCandidates(src, userId) : []));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIndex(0);
    setCandidates(src ? avatarCandidates(src, userId) : []);
    if (!userId) return undefined;
    (async () => {
      try {
        const res = await fetch(`${API}/api/public/user/${userId}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        const cdn = forceGifIfAnimated(data.avatar) || data.avatar;
        setCandidates(avatarCandidates(cdn || src, userId));
        setIndex(0);
      } catch {
        if (!cancelled) {
          setCandidates(avatarCandidates(src, userId));
          setIndex(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, userId]);

  const url = candidates.length ? candidates[Math.min(index, candidates.length - 1)] : "";

  if (!url) {
    return <span className={className} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      src={url}
      alt={alt}
      loading="eager"
      decoding="async"
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
