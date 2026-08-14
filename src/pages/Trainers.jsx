import { useEffect, useState } from "react";
import { api } from "../api";
import { DEMO } from "../data/demo";

export default function Trainers() {
  const [rows, setRows] = useState(DEMO.trainers);

  useEffect(() => {
    api.public().then((live) => {
      if (live && Array.isArray(live.trainers)) setRows(live.trainers);
    });
  }, []);

  return (
    <section className="page-hero page-hero-orange">
      <div className="wrap page">
        <p className="record-count">{rows.length} trainers listed</p>
        <div className="card-grid">
          {rows.length === 0 ? <p className="sub">No trainers yet.</p> : null}
          {rows.map((row) => (
            <article className="sanction-card trainer-card" key={row.discordId}>
              <div className="sanction-top">
                <div className="sanction-person">
                  <span className="sanction-label">Trainer</span>
                  <div className="sanction-user">
                    {row.avatar ? <img src={row.avatar} alt="" /> : <div className="avatar-fallback" />}
                    <div>
                      <strong>{row.displayName || row.username || row.discordId}</strong>
                      <div className="handle-line">@{row.username || row.discordId}</div>
                    </div>
                  </div>
                </div>
                <div className="sanction-person">
                  <span className="sanction-label">Rate</span>
                  <p className="price-line">{row.price || "TBD"}</p>
                </div>
              </div>

              <div className="sanction-reason">
                <span className="sanction-label">Stage</span>
                <p>{row.stage || row.specialty || "Unranked"}</p>
                {row.bio ? <p className="evidence">{row.bio}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
