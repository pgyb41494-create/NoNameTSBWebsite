import { useEffect, useState } from "react";
import { api } from "../api";
import { BoardAvatar, displayNameOf, handleOf } from "../components/BoardAvatar";

export default function Trainers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.public().then((live) => {
      if (!alive) return;
      if (live && Array.isArray(live.trainers)) setRows(live.trainers);
      else setRows([]);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="page-hero page-hero-orange" key="trainers">
      <div className="wrap page">
        <p className="record-count">{loading ? "Loading…" : `${rows.length} trainers listed`}</p>
        <div className="board-grid">
          {!loading && rows.length === 0 ? <p className="sub">No trainers yet.</p> : null}
          {rows.map((row) => (
            <article className="board-card" key={row.discordId}>
              <div className="board-avatars">
                <div className="board-avatar-col">
                  <span className="board-label">Trainer</span>
                  <BoardAvatar src={row.avatar} userId={row.discordId} />
                </div>
                <div className="board-avatar-col board-avatar-col-text">
                  <span className="board-label">Rate</span>
                  <p className="board-rate">{row.price || "TBD"}</p>
                </div>
              </div>

              <div className="board-identity">
                <strong className="board-name">{displayNameOf(row)}</strong>
                <div className="board-handle">{handleOf(row)}</div>
              </div>

              <div className="board-section">
                <span className="board-label">Stage</span>
                <p className="board-body">{row.stage || row.specialty || "Unranked"}</p>
                {row.bio ? <p className="board-muted">{row.bio}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
