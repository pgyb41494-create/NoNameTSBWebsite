const NAME = import.meta.env.VITE_BOT_NAME || "ASA";
export const API = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");

export const brand = {
  name: NAME,
  invite:
    import.meta.env.VITE_DISCORD_INVITE ||
    "https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands",
  support: import.meta.env.VITE_SUPPORT_INVITE || "",
  gif: "https://developers.oneway.lat/evidencias/asa_3_1.gif",
};

export async function getJson(path, fallback) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function staffFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  stats: () => getJson("/api/public/stats", { players: 0, servers: 0, wars: 0, matches: 0 }),
  public: () => getJson("/api/public", null),
  brand: () => getJson("/api/public/brand", { name: NAME, prefix: "'", tagline: "TSB clan ops", gif: brand.gif }),
  staff: {
    guilds: () => staffFetch("/api/staff/guilds"),
    overview: (guildId) => staffFetch(`/api/staff/${guildId}/overview`),
    channels: (guildId) => staffFetch(`/api/staff/${guildId}/channels`),
    members: (guildId, q = "") => staffFetch(`/api/staff/${guildId}/members?q=${encodeURIComponent(q)}`),
    blacklist: (guildId) => staffFetch(`/api/staff/${guildId}/blacklist`),
    addBlacklist: (guildId, body) => staffFetch(`/api/staff/${guildId}/blacklist`, { method: "POST", body }),
    removeBlacklist: (guildId, userId) => staffFetch(`/api/staff/${guildId}/blacklist/${userId}`, { method: "DELETE" }),
    trainers: (guildId) => staffFetch(`/api/staff/${guildId}/trainers`),
    addTrainer: (guildId, body) => staffFetch(`/api/staff/${guildId}/trainers`, { method: "POST", body }),
    removeTrainer: (guildId, userId) => staffFetch(`/api/staff/${guildId}/trainers/${userId}`, { method: "DELETE" }),
    message: (body) => staffFetch("/api/staff/message", { method: "POST", body }),
  },
};
