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
    const res = await fetch(`${API}${path}`, { credentials: "include" });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function apiFetch(path, options = {}) {
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
  submitReport: (body) => apiFetch("/api/user/reports", { method: "POST", body }),
  staff: {
    guilds: () => apiFetch("/api/staff/guilds"),
    overview: (guildId) => apiFetch(`/api/staff/${guildId}/overview`),
    channels: (guildId) => apiFetch(`/api/staff/${guildId}/channels`),
    members: (guildId, q = "") => apiFetch(`/api/staff/${guildId}/members?q=${encodeURIComponent(q)}`),
    reports: () => apiFetch("/api/staff/reports"),
    approveReport: (id, body = {}) => apiFetch(`/api/staff/reports/${id}/approve`, { method: "POST", body }),
    denyReport: (id) => apiFetch(`/api/staff/reports/${id}/deny`, { method: "POST" }),
    blacklist: (guildId) => apiFetch(`/api/staff/${guildId}/blacklist`),
    addBlacklist: (guildId, body) => apiFetch(`/api/staff/${guildId}/blacklist`, { method: "POST", body }),
    removeBlacklist: (guildId, userId) => apiFetch(`/api/staff/${guildId}/blacklist/${userId}`, { method: "DELETE" }),
    trainers: (guildId) => apiFetch(`/api/staff/${guildId}/trainers`),
    addTrainer: (guildId, body) => apiFetch(`/api/staff/${guildId}/trainers`, { method: "POST", body }),
    removeTrainer: (guildId, userId) => apiFetch(`/api/staff/${guildId}/trainers/${userId}`, { method: "DELETE" }),
    message: (body) => apiFetch("/api/staff/message", { method: "POST", body }),
  },
};
