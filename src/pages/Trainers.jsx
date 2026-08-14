import { useEffect, useState } from "react";
import { api } from "../api";
import { DEMO } from "../data/demo";

export default function Trainers() {
  const [rows, setRows] = useState(DEMO.trainers);

  useEffect(() => {
    api.public().then((live) => {
      if (live && Array.isArray(live.trainers) && live.trainers.length) setRows(live.trainers);
    });
  }, []);

  return (
    <section className="page-hero page-hero-orange">
      <div className="wrap page">
        <h1 className="gradient-text-orange">Trainers</h1>
        <p className="sub">People who run vods and ranked sets. `'trainer add @user specialty`</p>
        <div className="stack">
          {rows.map((row) => (
            <article className="list-card" key={row.discordId}>
              <h3>
                {row.profile?.robloxUsername || row.discordId} · {row.role}
              </h3>
              <p>
                {row.specialty}
                {row.bio ? ` — ${row.bio}` : ""}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
