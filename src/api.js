const NAME = import.meta.env.VITE_BOT_NAME || "ASA";
const API = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");

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

export const api = {
  stats: () => getJson("/api/public/stats", { players: 0, servers: 0, wars: 0, matches: 0 }),
  public: () => getJson("/api/public", null),
  brand: () => getJson("/api/public/brand", { name: NAME, prefix: "'", tagline: "TSB clan ops", gif: brand.gif }),
};
