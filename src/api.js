import { getAuthToken } from "./auth";

const NAME = import.meta.env.VITE_BOT_NAME || "Ascendant";
export const API = (
  import.meta.env.VITE_API_URL || "https://nonametsbapi-production.up.railway.app"
).replace(/\/$/, "");

export const brand = {
  name: NAME,
  invite:
    import.meta.env.VITE_DISCORD_INVITE ||
    "https://discord.com/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands",
  support: import.meta.env.VITE_SUPPORT_INVITE || "",
  icon: "/icon.jpg",
  gif: "https://developers.oneway.lat/evidencias/asa_3_1.gif",
};

function authHeaders(extra = {}) {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getJson(path, fallback) {
  try {
    const res = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(String(res.status));
    return await res.json();
  } catch {
    return fallback;
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...options,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
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
    roles: (guildId) => apiFetch(`/api/staff/${guildId}/roles`),
    verify: (guildId) => apiFetch(`/api/staff/${guildId}/verify`),
    saveVerify: (guildId, body) => apiFetch(`/api/staff/${guildId}/verify`, { method: "PUT", body }),
    audit: (guildId) => apiFetch(`/api/staff/${guildId}/audit`),
    saveAudit: (guildId, body) => apiFetch(`/api/staff/${guildId}/audit`, { method: "PUT", body }),
    invites: (guildId) => apiFetch(`/api/staff/${guildId}/invites`),
    saveInvites: (guildId, body) => apiFetch(`/api/staff/${guildId}/invites`, { method: "PUT", body }),
    alerts: (guildId) => apiFetch(`/api/staff/${guildId}/alerts`),
    saveAlerts: (guildId, body) => apiFetch(`/api/staff/${guildId}/alerts`, { method: "PUT", body }),
    panels: (guildId) => apiFetch(`/api/staff/${guildId}/panels`),
    createPanel: (guildId, body) => apiFetch(`/api/staff/${guildId}/panels`, { method: "POST", body }),
    updatePanel: (guildId, key, body) =>
      apiFetch(`/api/staff/${guildId}/panels/${encodeURIComponent(key)}`, { method: "PUT", body }),
    deletePanel: (guildId, key) =>
      apiFetch(`/api/staff/${guildId}/panels/${encodeURIComponent(key)}`, { method: "DELETE" }),
    sendPanel: (guildId, key, channelId) =>
      apiFetch(`/api/staff/${guildId}/panels/${encodeURIComponent(key)}/send`, {
        method: "POST",
        body: { channelId },
      }),
    createChannel: (guildId, body) => apiFetch(`/api/staff/${guildId}/channels`, { method: "POST", body }),
    channelMessages: (guildId, channelId, params = {}) => {
      const q = new URLSearchParams();
      if (params.limit) q.set("limit", String(params.limit));
      if (params.before) q.set("before", String(params.before));
      const suffix = q.toString() ? `?${q}` : "";
      return apiFetch(`/api/staff/${guildId}/channels/${channelId}/messages${suffix}`);
    },
    sendChannelMessage: (guildId, channelId, body) =>
      apiFetch(`/api/staff/${guildId}/channels/${channelId}/messages`, { method: "POST", body }),
    channelTyping: (guildId, channelId) =>
      apiFetch(`/api/staff/${guildId}/channels/${channelId}/typing`, { method: "POST", body: {} }),
    reports: () => apiFetch("/api/staff/reports"),
    activity: (params = {}) => {
      const q = new URLSearchParams();
      if (params.event) q.set("event", params.event);
      if (params.guildId) q.set("guildId", params.guildId);
      const suffix = q.toString() ? `?${q}` : "";
      return apiFetch(`/api/staff/activity${suffix}`);
    },
    duplicates: () => apiFetch("/api/staff/duplicates"),
    roster: () => apiFetch("/api/staff/roster"),
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
