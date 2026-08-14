import { useEffect, useState } from "react";
import { api } from "../api";
import { DEMO } from "../data/demo";

export default function Wars() {
  const [rows, setRows] = useState(DEMO.wars);

  useEffect(() => {
    api.public().then((live) => {
      if (live && Array.isArray(live.wars)) setRows(live.wars);
    });
  }, []);

  return (
    <section className="wrap page">
      <h1>Wars</h1>
      <p className="sub">Clan war history for this bot.</p>
      {rows.length === 0 ? <p className="sub">No wars recorded yet.</p> : null}
      <div className="stack">
        {rows.map((row) => (
          <article className="list-card" key={row.id}>
            <h3>
              vs {row.opponent} · {row.result}
            </h3>
            <p>{row.score || "—"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
