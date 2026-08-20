import { useEffect, useState } from "react";
import { api } from "../api";
import { BoardAvatar, displayNameOf, handleOf } from "../components/BoardAvatar";

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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.public().then((live) => {
      if (!alive) return;
      if (live && Array.isArray(live.blacklist)) setRows(live.blacklist);
      else setRows([]);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="page-hero page-hero-red" key="blacklist">
      <div className="wrap page">
        <p className="record-count">
          {loading ? "Loading…" : `${rows.length} records found — network blacklist`}
        </p>
        <div className="trainer-grid">
          {!loading && rows.length === 0 ? <p className="sub">No one listed.</p> : null}
          {rows.map((row) => {
            const staffHandle = row.moderatorUsername || row.moderatorName || row.addedBy || "staff";
            return (
              <article className="trainer-card" key={`${row.discordId}-${row.at || row.id || ""}`}>
                <div className="board-avatars">
                  <div className="board-avatar-col">
                    <span className="board-label">Player</span>
                    <BoardAvatar src={row.avatar} userId={row.discordId} />
                  </div>
                  <div className="board-avatar-col">
                    <span className="board-label">Moderator</span>
                    <BoardAvatar src={row.moderatorAvatar} userId={row.addedBy} />
                  </div>
                </div>

                <div className="board-identity">
                  <strong className="board-name">{displayNameOf(row)}</strong>
                  <div className="board-handle">{handleOf(row)}</div>
                  <div className="board-staff">Staff: @{String(staffHandle).replace(/^@/, "")}</div>
                </div>

                <div className="board-section">
                  <span className="board-label">Sanction reason</span>
                  <p className="board-body">{row.reason || "No reason provided"}</p>
                  {row.evidence ? <p className="board-muted">Proof: {row.evidence}</p> : null}
                </div>

                <div className="board-footer">
                  <div className="board-scope">
                    <span className="shield" aria-hidden="true">
                      🛡
                    </span>
                    {row.where || "Clan League | Hub"}
                  </div>
                  <div className="board-time">{formatWhen(row.at)}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
