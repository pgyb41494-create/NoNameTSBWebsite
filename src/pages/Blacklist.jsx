import { useEffect, useState } from "react";
import { api } from "../api";
import { DEMO } from "../data/demo";

export default function Blacklist() {
  const [rows, setRows] = useState(DEMO.blacklist);

  useEffect(() => {
    api.public().then((live) => {
      if (live && Array.isArray(live.blacklist)) setRows(live.blacklist);
    });
  }, []);

  return (
    <section className="wrap page">
      <h1>Blacklisted</h1>
      <p className="sub">Staff-added bans and warnings. `'blacklist add @user reason`</p>
      <div className="stack">
        {rows.length === 0 ? <p className="sub">No one listed.</p> : null}
        {rows.map((row) => (
          <article className="list-card" key={`${row.discordId}-${row.at}`}>
            <h3>{row.robloxUsername || row.discordId}</h3>
            <p>{row.reason}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
