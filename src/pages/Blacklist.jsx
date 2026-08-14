import { useEffect, useState } from "react";
import { api } from "../api";
import { DEMO } from "../data/demo";

function formatWhen(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Blacklist() {
  const [rows, setRows] = useState(DEMO.blacklist);

  useEffect(() => {
    api.public().then((live) => {
      if (live && Array.isArray(live.blacklist)) setRows(live.blacklist);
    });
  }, []);

  return (
    <section className="page-hero page-hero-red">
      <div className="wrap page">
        <p className="record-count">{rows.length} records found — network blacklist</p>
        <div className="card-grid">
          {rows.length === 0 ? <p className="sub">No one listed.</p> : null}
          {rows.map((row) => (
            <article className="sanction-card" key={`${row.discordId}-${row.at}`}>
              <div className="sanction-top">
                <div className="sanction-person">
                  <span className="sanction-label">Player</span>
                  <div className="sanction-user">
                    {row.avatar ? <img src={row.avatar} alt="" /> : <div className="avatar-fallback" />}
                    <div>
                      <strong>{row.displayName || row.username || row.robloxUsername || row.discordId}</strong>
                      <div className="handle-line">@{row.username || row.discordId}</div>
                      <div className="staff-line">Staff: @{row.moderatorName || row.addedBy || "staff"}</div>
                    </div>
                  </div>
                </div>
                <div className="sanction-person">
                  <span className="sanction-label">Moderator</span>
                  <div className="sanction-user">
                    {row.moderatorAvatar ? (
                      <img src={row.moderatorAvatar} alt="" />
                    ) : (
                      <div className="avatar-fallback" />
                    )}
                    <div>
                      <strong>{row.moderatorName || "Staff"}</strong>
                      <div className="handle-line">@{row.moderatorName || row.addedBy || "staff"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sanction-reason">
                <span className="sanction-label">Sanction reason</span>
                <p>{row.reason || "No reason provided"}</p>
                {row.evidence ? <p className="evidence">Proof: {row.evidence}</p> : null}
              </div>

              <div className="sanction-footer">
                <div className="scope-line">
                  <span className="shield" aria-hidden="true">
                    🛡
                  </span>
                  {row.where || "Clan League | Hub"}
                </div>
                <div className="time-line">
                  <span>{formatWhen(row.at)}</span>
                  {row.when ? <span>{row.when}</span> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
